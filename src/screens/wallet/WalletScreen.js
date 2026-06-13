import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useCurrency } from '../../context/CurrencyContext';
import { Card, Input, Button, Row, SectionHeader } from '../../components/UI';
import { Colors, Spacing, Radius, Shadow } from '../../utils/theme';
import api from '../../utils/api';

const TX_ICONS = {
  task_earning:   { icon: '✅', bg: Colors.primaryLight, color: Colors.primaryDark },
  referral_bonus: { icon: '🤝', bg: '#F5F3FF',          color: '#5B21B6' },
  withdrawal:     { icon: '↑',  bg: Colors.blueLight,   color: '#185FA5' },
  adjustment:     { icon: '⚙️', bg: '#F1EFE8',          color: '#5F5E5A' },
};

export default function WalletScreen({ navigation }) {
  const { fmt, currency, setCurrency, rate } = useCurrency();
  const [wallet, setWallet]         = useState(null);
  const [txs, setTxs]               = useState([]);
  const [showWithdraw, setShowWithdraw] = useState(false);
  const [form, setForm] = useState({ amountETB: '', method: 'telebirr', accountNumber: '', accountName: '' });
  const [loading, setLoading]       = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const [w, t] = await Promise.all([api.get('/wallet'), api.get('/wallet/transactions')]);
      setWallet(w.data);
      setTxs(t.data.transactions);
    } catch (e) { console.error(e); }
    finally { setRefreshing(false); }
  }, []);

  useEffect(() => { load(); }, []);

  const withdraw = async () => {
    if (!form.amountETB || Number(form.amountETB) < 200) { Alert.alert('Error', 'Minimum withdrawal is 200 ETB'); return; }
    if (!form.accountNumber || !form.accountName) { Alert.alert('Error', 'Account details are required'); return; }
    setLoading(true);
    try {
      await api.post('/wallet/withdraw', { ...form, amountETB: Number(form.amountETB) });
      Alert.alert('✅ Submitted', 'Withdrawal request submitted. Processing within 24 hours.');
      setShowWithdraw(false);
      setForm({ amountETB: '', method: 'telebirr', accountNumber: '', accountName: '' });
      load();
    } catch (e) { Alert.alert('Error', e.response?.data?.error || 'Withdrawal failed.'); }
    finally { setLoading(false); }
  };

  const METHODS = [
    { key: 'telebirr', label: '📱 Telebirr' },
    { key: 'mpesa',    label: '💚 M-Pesa' },
    { key: 'cbe_birr', label: '💙 CBE Birr' },
    { key: 'bank_transfer', label: '🏦 Bank Transfer' },
  ];

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={Colors.primary} />}
        contentContainerStyle={{ paddingBottom: 32 }}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.heading}>Wallet</Text>
          <TouchableOpacity onPress={() => setCurrency(currency === 'ETB' ? 'USD' : 'ETB')} style={styles.curBtn}>
            <Text style={styles.curBtnText}>{currency} ⇄</Text>
          </TouchableOpacity>
        </View>

        {/* Dual wallet cards */}
        <View style={styles.walletRow}>
          {/* Income wallet */}
          <View style={[styles.walletCard, { backgroundColor: Colors.primary }]}>
            <Text style={styles.walletLabel}>Income wallet</Text>
            <Text style={styles.walletAmount}>{fmt(wallet?.incomeWalletETB || 0)}</Text>
            <Text style={styles.walletSub}>Tasks + referrals</Text>
            <Row style={{ gap: 6, marginTop: 12 }}>
              <TouchableOpacity style={styles.walletBtn} onPress={() => navigation.navigate('Deposit')}>
                <Text style={styles.walletBtnText}>↓ Add</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.walletBtn} onPress={() => setShowWithdraw(v => !v)}>
                <Text style={styles.walletBtnText}>↑ Withdraw</Text>
              </TouchableOpacity>
            </Row>
          </View>

          {/* Personal wallet */}
          <View style={[styles.walletCard, { backgroundColor: Colors.blue }]}>
            <Text style={styles.walletLabel}>Personal wallet</Text>
            <Text style={styles.walletAmount}>{fmt(wallet?.personalWalletETB || 0)}</Text>
            <Text style={styles.walletSub}>Deposits & recharges</Text>
            <TouchableOpacity style={[styles.walletBtn, { marginTop: 12 }]} onPress={() => navigation.navigate('Deposit')}>
              <Text style={styles.walletBtnText}>+ Recharge</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Work deposit */}
        {wallet?.workDepositETB > 0 && (
          <View style={styles.depositTag}>
            <Text style={styles.depositText}>🔒 Work deposit held: {fmt(wallet.workDepositETB)} — refunded on task completion</Text>
          </View>
        )}

        {/* Withdrawal form */}
        {showWithdraw && (
          <View style={{ paddingHorizontal: Spacing.lg }}>
            <Card style={{ marginBottom: Spacing.md }}>
              <Text style={styles.sectionTitle}>Request withdrawal</Text>
              <Input label="Amount (ETB) — min 200" value={form.amountETB} onChangeText={v => setForm(f => ({ ...f, amountETB: v }))} keyboardType="numeric" placeholder="e.g. 500" />
              <Text style={styles.label}>Payment method</Text>
              <View style={styles.methodRow}>
                {METHODS.map(m => (
                  <TouchableOpacity key={m.key} style={[styles.methodBtn, form.method === m.key && styles.methodBtnActive]} onPress={() => setForm(f => ({ ...f, method: m.key }))}>
                    <Text style={[styles.methodText, form.method === m.key && { color: '#fff' }]}>{m.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <Input label="Account / phone number" value={form.accountNumber} onChangeText={v => setForm(f => ({ ...f, accountNumber: v }))} placeholder="09XXXXXXXX" keyboardType="phone-pad" />
              <Input label="Account name" value={form.accountName} onChangeText={v => setForm(f => ({ ...f, accountName: v }))} placeholder="Full name on account" />
              <Button title="Confirm withdrawal" onPress={withdraw} loading={loading} />
            </Card>
          </View>
        )}

        {/* Stats row */}
        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statVal}>{fmt(wallet?.totalEarnedETB || 0)}</Text>
            <Text style={styles.statLbl}>Total earned</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statVal}>{fmt(wallet?.totalReferralBonusETB || 0)}</Text>
            <Text style={styles.statLbl}>Referral bonus</Text>
          </View>
        </View>

        <Text style={styles.rateText}>Exchange rate: 1 USD = {rate} ETB</Text>

        {/* Quick actions */}
        <View style={{ paddingHorizontal: Spacing.lg, flexDirection: 'row', gap: 10, marginBottom: Spacing.lg }}>
          <Button title="📥 Deposit" onPress={() => navigation.navigate('Deposit')} variant="outline" style={{ flex: 1 }} size="sm" />
          <Button title="📋 Records" onPress={() => navigation.navigate('Records')} variant="outline" style={{ flex: 1 }} size="sm" />
        </View>

        {/* Transaction history */}
        <View style={{ paddingHorizontal: Spacing.lg }}>
          <SectionHeader title="Recent transactions" action="View all" onAction={() => navigation.navigate('Records')} />
          {txs.length === 0 ? (
            <Text style={styles.empty}>No transactions yet</Text>
          ) : (
            txs.slice(0, 8).map(tx => {
              const cfg = TX_ICONS[tx.type] || TX_ICONS.adjustment;
              return (
                <Row key={tx._id} style={styles.txRow}>
                  <View style={[styles.txIcon, { backgroundColor: cfg.bg }]}>
                    <Text style={{ fontSize: 16 }}>{cfg.icon}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.txDesc} numberOfLines={1}>{tx.description}</Text>
                    <Text style={styles.txDate}>
                      {new Date(tx.createdAt).toLocaleDateString('en-ET', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </Text>
                  </View>
                  <Text style={[styles.txAmount, { color: tx.amountETB > 0 ? Colors.primary : Colors.red }]}>
                    {tx.amountETB > 0 ? '+' : ''}{fmt(tx.amountETB)}
                  </Text>
                </Row>
              );
            })
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:        { flex: 1, backgroundColor: Colors.bg },
  header:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md, backgroundColor: Colors.surface, borderBottomWidth: 0.5, borderBottomColor: Colors.border },
  heading:     { fontSize: 20, fontWeight: '700', color: Colors.text },
  curBtn:      { backgroundColor: Colors.primaryLight, borderRadius: Radius.full, paddingHorizontal: 12, paddingVertical: 5 },
  curBtnText:  { fontSize: 13, fontWeight: '600', color: Colors.primaryDark },
  walletRow:   { flexDirection: 'row', padding: Spacing.lg, gap: 10 },
  walletCard:  { flex: 1, borderRadius: Radius.xl, padding: Spacing.lg },
  walletLabel: { fontSize: 11, color: 'rgba(255,255,255,0.75)', marginBottom: 4 },
  walletAmount:{ fontSize: 20, fontWeight: '700', color: '#fff' },
  walletSub:   { fontSize: 10, color: 'rgba(255,255,255,0.6)', marginTop: 2 },
  walletBtn:   { flex: 1, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: Radius.sm, paddingVertical: 6, alignItems: 'center' },
  walletBtnText:{ fontSize: 11, color: '#fff', fontWeight: '600' },
  depositTag:  { marginHorizontal: Spacing.lg, backgroundColor: Colors.amberLight, borderRadius: Radius.md, padding: Spacing.md, marginBottom: Spacing.md },
  depositText: { fontSize: 12, color: '#854F0B', fontWeight: '500' },
  sectionTitle:{ fontSize: 15, fontWeight: '600', color: Colors.text, marginBottom: Spacing.sm },
  label:       { fontSize: 13, fontWeight: '500', color: Colors.text2, marginBottom: 6 },
  methodRow:   { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: Spacing.md },
  methodBtn:   { paddingHorizontal: 10, paddingVertical: 6, borderRadius: Radius.sm, borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.surface },
  methodBtnActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  methodText:  { fontSize: 12, color: Colors.text2 },
  statsRow:    { flexDirection: 'row', gap: 10, paddingHorizontal: Spacing.lg, marginBottom: Spacing.sm },
  statBox:     { flex: 1, backgroundColor: Colors.primaryLight, borderRadius: Radius.md, padding: Spacing.md, alignItems: 'center' },
  statVal:     { fontSize: 16, fontWeight: '700', color: Colors.primaryDark },
  statLbl:     { fontSize: 11, color: Colors.primaryDark, marginTop: 2 },
  rateText:    { textAlign: 'center', fontSize: 11, color: Colors.text3, marginBottom: Spacing.lg },
  empty:       { textAlign: 'center', color: Colors.text3, fontSize: 14, padding: Spacing.xl },
  txRow:       { paddingVertical: Spacing.md, borderBottomWidth: 0.5, borderBottomColor: Colors.border, gap: 12 },
  txIcon:      { width: 40, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  txDesc:      { fontSize: 13, fontWeight: '500', color: Colors.text },
  txDate:      { fontSize: 11, color: Colors.text3, marginTop: 2 },
  txAmount:    { fontSize: 14, fontWeight: '700', flexShrink: 0 },
});
