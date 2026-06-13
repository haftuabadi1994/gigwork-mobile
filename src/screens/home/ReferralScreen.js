import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Clipboard from 'expo-clipboard';
import { useAuth } from '../../context/AuthContext';
import { useCurrency } from '../../context/CurrencyContext';
import { Card, Row } from '../../components/UI';
import { Colors, Spacing, Radius } from '../../utils/theme';
import api from '../../utils/api';

export default function ReferralScreen({ navigation }) {
  const { user } = useAuth();
  const { fmt }  = useCurrency();
  const [stats, setStats]     = useState(null);
  const [copied, setCopied]   = useState('');
  const [tab, setTab]         = useState('stats');
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    try { const r = await api.get('/referral/stats'); setStats(r.data); }
    catch (e) { console.error(e); }
    finally { setRefreshing(false); }
  };

  useEffect(() => { load(); }, []);

  const copy = async (text, key) => {
    await Clipboard.setStringAsync(text);
    setCopied(key);
    setTimeout(() => setCopied(''), 2000);
  };

  const code = user?.referralCode || '';

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.bg }} edges={['bottom']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={Colors.primary} />}
        contentContainerStyle={{ padding: Spacing.lg, paddingBottom: 40 }}
      >
        {/* Code card */}
        <View style={styles.codeCard}>
          <Text style={styles.codeLabel}>Your referral code</Text>
          <Text style={styles.code}>{code}</Text>
          <Row style={{ gap: 10, justifyContent: 'center' }}>
            <TouchableOpacity style={styles.codeBtn} onPress={() => copy(code, 'code')}>
              <Text style={styles.codeBtnText}>{copied === 'code' ? '✓ Copied' : '📋 Copy code'}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.codeBtn} onPress={() => navigation.navigate('Invite')}>
              <Text style={styles.codeBtnText}>📤 More options</Text>
            </TouchableOpacity>
          </Row>
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          {[
            { label: 'Referred',  value: stats?.referralCount || 0 },
            { label: 'Active',    value: stats?.referrals?.filter(r => r.tasksCompleted > 0).length || 0 },
            { label: 'Bonus ETB', value: (stats?.totalBonusETB || 0).toLocaleString() },
          ].map(s => (
            <View key={s.label} style={styles.statBox}>
              <Text style={styles.statVal}>{s.value}</Text>
              <Text style={styles.statLbl}>{s.label}</Text>
            </View>
          ))}
        </View>

        {/* Tabs */}
        <View style={styles.tabRow}>
          {['stats','history','how'].map(t => (
            <TouchableOpacity key={t} style={[styles.tabBtn, tab === t && styles.tabActive]} onPress={() => setTab(t)}>
              <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>
                {t === 'stats' ? '👥 Referrals' : t === 'history' ? '💰 Bonuses' : 'ℹ️ How'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Referrals list */}
        {tab === 'stats' && (
          stats?.referrals?.length === 0 ? (
            <View style={{ alignItems: 'center', padding: 40 }}>
              <Text style={{ fontSize: 48, marginBottom: 12 }}>👥</Text>
              <Text style={{ fontSize: 16, color: Colors.text2, marginBottom: 12 }}>No referrals yet</Text>
              <TouchableOpacity onPress={() => navigation.navigate('Invite')} style={{ backgroundColor: Colors.primary, borderRadius: Radius.md, paddingHorizontal: 20, paddingVertical: 10 }}>
                <Text style={{ color: '#fff', fontWeight: '600' }}>Start inviting</Text>
              </TouchableOpacity>
            </View>
          ) : (
            stats?.referrals?.map(r => (
              <Card key={r._id} style={{ marginBottom: 8 }}>
                <Row style={{ justifyContent: 'space-between' }}>
                  <View>
                    <Text style={{ fontSize: 14, fontWeight: '600', color: Colors.text }}>{r.name}</Text>
                    <Text style={{ fontSize: 12, color: Colors.text3 }}>{r.tasksCompleted} tasks · {new Date(r.createdAt).toLocaleDateString()}</Text>
                  </View>
                  <View style={[styles.statusPill, { backgroundColor: r.tasksCompleted > 0 ? Colors.primaryLight : Colors.bg }]}>
                    <Text style={{ fontSize: 11, fontWeight: '600', color: r.tasksCompleted > 0 ? Colors.primaryDark : Colors.text3 }}>
                      {r.tasksCompleted > 0 ? '✓ Active' : 'Pending'}
                    </Text>
                  </View>
                </Row>
              </Card>
            ))
          )
        )}

        {/* Bonus history */}
        {tab === 'history' && (
          stats?.bonusTransactions?.length === 0 ? (
            <Text style={{ textAlign: 'center', color: Colors.text3, padding: 40 }}>No bonus transactions yet</Text>
          ) : (
            stats?.bonusTransactions?.map(tx => (
              <Row key={tx._id} style={styles.txRow}>
                <View style={[styles.txIcon]}><Text style={{ fontSize: 18 }}>🤝</Text></View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 13, fontWeight: '500', color: Colors.text }}>{tx.description}</Text>
                  <Text style={{ fontSize: 11, color: Colors.text3, marginTop: 2 }}>{new Date(tx.createdAt).toLocaleDateString()}</Text>
                </View>
                <Text style={{ fontWeight: '700', color: Colors.primary }}>+{fmt(tx.amountETB)}</Text>
              </Row>
            ))
          )
        )}

        {/* How it works */}
        {tab === 'how' && (
          <Card>
            <Text style={{ fontSize: 15, fontWeight: '600', color: Colors.text, marginBottom: Spacing.md }}>Multi-tier referral system</Text>
            {[
              { t: 'Tier A (Direct)', p: '10%', d: 'Friends you invite earn you 10% of their first task' },
              { t: 'Tier B (Level 2)', p: 'Team %', d: 'Their referrals earn you your team bonus %' },
              { t: 'Tier C (Level 3)', p: 'Indirect', d: 'Further network contributes to team score' },
            ].map((row, i) => (
              <Row key={i} style={{ gap: 12, paddingVertical: 12, borderBottomWidth: 0.5, borderBottomColor: Colors.border }}>
                <View style={{ width: 52, height: 36, backgroundColor: Colors.primaryLight, borderRadius: 8, alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Text style={{ fontSize: 12, fontWeight: '700', color: Colors.primaryDark }}>{row.p}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 13, fontWeight: '600', color: Colors.text }}>{row.t}</Text>
                  <Text style={{ fontSize: 12, color: Colors.text2, marginTop: 2 }}>{row.d}</Text>
                </View>
              </Row>
            ))}
          </Card>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  codeCard:    { backgroundColor: Colors.primary, borderRadius: Radius.xl, padding: Spacing.xl, alignItems: 'center', marginBottom: Spacing.md },
  codeLabel:   { fontSize: 12, color: 'rgba(255,255,255,0.75)', marginBottom: 6 },
  code:        { fontSize: 28, fontWeight: '700', color: '#fff', letterSpacing: 4, marginBottom: Spacing.md },
  codeBtn:     { backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: Radius.md, paddingHorizontal: 14, paddingVertical: 8 },
  codeBtnText: { fontSize: 12, color: '#fff', fontWeight: '600' },
  statsRow:    { flexDirection: 'row', gap: 10, marginBottom: Spacing.md },
  statBox:     { flex: 1, backgroundColor: Colors.primaryLight, borderRadius: Radius.md, padding: Spacing.md, alignItems: 'center' },
  statVal:     { fontSize: 20, fontWeight: '700', color: Colors.primaryDark },
  statLbl:     { fontSize: 11, color: Colors.primaryDark, marginTop: 2 },
  tabRow:      { flexDirection: 'row', gap: 6, marginBottom: Spacing.md },
  tabBtn:      { flex: 1, paddingVertical: 9, borderRadius: Radius.md, backgroundColor: Colors.surface, alignItems: 'center', borderWidth: 1, borderColor: Colors.border },
  tabActive:   { backgroundColor: Colors.primary, borderColor: Colors.primary },
  tabText:     { fontSize: 11, fontWeight: '600', color: Colors.text2 },
  tabTextActive:{ color: '#fff' },
  statusPill:  { borderRadius: Radius.full, paddingHorizontal: 10, paddingVertical: 4 },
  txRow:       { paddingVertical: 12, borderBottomWidth: 0.5, borderBottomColor: Colors.border, flexDirection: 'row', alignItems: 'center', gap: 12 },
  txIcon:      { width: 40, height: 40, borderRadius: 10, backgroundColor: Colors.amberLight, alignItems: 'center', justifyContent: 'center' },
});
