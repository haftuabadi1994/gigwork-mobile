import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  RefreshControl, ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card, Row } from '../../components/UI';
import { Colors, Spacing, Radius } from '../../utils/theme';
import { useCurrency } from '../../context/CurrencyContext';
import { useLanguage } from '../../context/LanguageContext';
import api from '../../utils/api';

const TIER_COLORS = { A: '#10B981', B: '#3B82F6' };

function tierFromDesc(desc = '') {
  if (/tier a/i.test(desc)) return 'A';
  if (/tier b/i.test(desc)) return 'B';
  return '?';
}

export default function CommissionsScreen() {
  const { fmt }                       = useCurrency();
  const { language, toggle }          = useLanguage();
  const [stats, setStats]             = useState(null);
  const [tab, setTab]                 = useState('transactions');
  const [tierFilter, setTier]         = useState('');
  const [refreshing, setRefreshing]   = useState(false);
  const [loading, setLoading]         = useState(true);

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true); else setLoading(true);
    try {
      const r = await api.get('/referral/stats');
      setStats(r.data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { load(); }, []);

  if (loading) return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.heading}>Commissions</Text>
        <Text style={styles.sub}>Your referral bonus history</Text>
      </View>
      <View style={styles.center}><ActivityIndicator color={Colors.primary} size="large" /></View>
    </SafeAreaView>
  );

  const allTx     = stats?.bonusTransactions || [];
  const filtered  = tierFilter ? allTx.filter(tx => tierFromDesc(tx.description) === tierFilter) : allTx;
  const tierATotal = allTx.filter(tx => tierFromDesc(tx.description) === 'A').reduce((s, tx) => s + tx.amountETB, 0);
  const tierBTotal = allTx.filter(tx => tierFromDesc(tx.description) === 'B').reduce((s, tx) => s + tx.amountETB, 0);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Row style={{ justifyContent: 'space-between', alignItems: 'center' }}>
          <View>
            <Text style={styles.heading}>Commissions</Text>
            <Text style={styles.sub}>Your referral bonus history</Text>
          </View>
          <TouchableOpacity onPress={toggle} style={styles.langBtn}>
            <Text style={styles.langBtnText}>{language === 'en' ? 'አማ' : 'ENG'}</Text>
          </TouchableOpacity>
        </Row>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor={Colors.primary} />}
        contentContainerStyle={{ padding: Spacing.lg, paddingBottom: 40 }}
      >
        {/* Hero card */}
        <View style={[styles.heroCard, { backgroundColor: Colors.primary }]}>
          <Text style={styles.heroLabel}>Total commissions earned</Text>
          <Text style={styles.heroValue}>{fmt(stats?.totalBonusETB || 0)}</Text>
          <Text style={styles.heroSub}>{allTx.length} bonus transactions</Text>
        </View>

        {/* Stat grid */}
        <View style={styles.statsGrid}>
          {[
            { label: 'Tier A earned',  value: fmt(tierATotal),          sub: 'First task bonuses' },
            { label: 'Tier B earned',  value: fmt(tierBTotal),          sub: 'Team bonuses' },
            { label: 'Referred users', value: stats?.referralCount || 0, sub: 'Direct referrals' },
            { label: 'Level 2 network',value: stats?.levelBCount || 0,  sub: 'Indirect referrals' },
          ].map(c => (
            <View key={c.label} style={styles.statBox}>
              <Text style={styles.statVal}>{c.value}</Text>
              <Text style={styles.statLbl}>{c.label}</Text>
              <Text style={styles.statSub}>{c.sub}</Text>
            </View>
          ))}
        </View>

        {/* Tabs */}
        <View style={styles.tabRow}>
          {[{ k: 'transactions', l: 'Bonus history' }, { k: 'referrals', l: 'My referrals' }].map(tb => (
            <TouchableOpacity key={tb.k} style={[styles.tabBtn, tab === tb.k && styles.tabActive]} onPress={() => setTab(tb.k)}>
              <Text style={[styles.tabText, tab === tb.k && styles.tabTextActive]}>{tb.l}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* BONUS HISTORY */}
        {tab === 'transactions' && (
          <>
            {/* Tier filter */}
            <View style={styles.filterRow}>
              {[{ v: '', l: 'All' }, { v: 'A', l: 'Tier A' }, { v: 'B', l: 'Tier B' }].map(f => (
                <TouchableOpacity key={f.v} style={[styles.filterBtn, tierFilter === f.v && styles.filterActive]}
                  onPress={() => setTier(f.v)}>
                  <Text style={[styles.filterText, tierFilter === f.v && styles.filterTextActive]}>{f.l}</Text>
                </TouchableOpacity>
              ))}
              <Text style={styles.totalCount}>{filtered.length} total</Text>
            </View>

            {filtered.length === 0 ? (
              <View style={styles.emptyBox}>
                <Text style={styles.emptyIcon}>💸</Text>
                <Text style={styles.emptyText}>No bonus transactions yet</Text>
                <Text style={styles.emptySub}>Invite friends and earn when they complete tasks</Text>
              </View>
            ) : (
              filtered.map(tx => {
                const tier = tierFromDesc(tx.description);
                const color = TIER_COLORS[tier] || Colors.primary;
                return (
                  <Row key={tx._id} style={styles.txRow}>
                    <View style={[styles.txIcon, { backgroundColor: color + '18' }]}>
                      <Text style={{ fontSize: 11, fontWeight: '800', color }}>T{tier}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.txDesc} numberOfLines={2}>{tx.description}</Text>
                      <Text style={styles.txDate}>
                        {new Date(tx.createdAt).toLocaleDateString('en-ET', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </Text>
                    </View>
                    <Text style={styles.txAmt}>+{fmt(tx.amountETB)}</Text>
                  </Row>
                );
              })
            )}
          </>
        )}

        {/* MY REFERRALS */}
        {tab === 'referrals' && (
          <>
            {!stats?.referrals?.length ? (
              <View style={styles.emptyBox}>
                <Text style={styles.emptyIcon}>👥</Text>
                <Text style={styles.emptyText}>No referrals yet</Text>
                <Text style={styles.emptySub}>Share your code and earn when friends join</Text>
              </View>
            ) : (
              stats.referrals.map(r => (
                <Card key={r._id} style={{ marginBottom: 8 }}>
                  <Row style={{ justifyContent: 'space-between', alignItems: 'center' }}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.memberName}>{r.name}</Text>
                      <Text style={styles.memberMeta}>
                        {r.tasksCompleted} tasks · Joined {new Date(r.createdAt).toLocaleDateString()}
                      </Text>
                    </View>
                    <View style={[styles.statusPill, {
                      backgroundColor: r.tasksCompleted > 0 ? Colors.primaryLight : Colors.bg
                    }]}>
                      <Text style={{ fontSize: 11, fontWeight: '600', color: r.tasksCompleted > 0 ? Colors.primaryDark : Colors.text3 }}>
                        {r.tasksCompleted > 0 ? '✓ Active' : 'Pending'}
                      </Text>
                    </View>
                  </Row>
                </Card>
              ))
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:            { flex: 1, backgroundColor: Colors.bg },
  center:          { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header:          { paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md, backgroundColor: Colors.surface, borderBottomWidth: 0.5, borderBottomColor: Colors.border },
  heading:         { fontSize: 20, fontWeight: '700', color: Colors.text },
  sub:             { fontSize: 12, color: Colors.text3, marginTop: 2 },
  langBtn:         { paddingHorizontal: 10, paddingVertical: 5, borderRadius: Radius.full, borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.bg },
  langBtnText:     { fontSize: 12, fontWeight: '700', color: Colors.text2 },
  heroCard:        { borderRadius: Radius.xl, padding: Spacing.xl, alignItems: 'center', marginBottom: Spacing.md },
  heroLabel:       { fontSize: 12, color: 'rgba(255,255,255,0.75)', marginBottom: 4 },
  heroValue:       { fontSize: 30, fontWeight: '700', color: '#fff' },
  heroSub:         { fontSize: 12, color: 'rgba(255,255,255,0.65)', marginTop: 4 },
  statsGrid:       { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: Spacing.md },
  statBox:         { flex: 1, minWidth: '45%', backgroundColor: Colors.surface, borderRadius: Radius.md, padding: Spacing.md, borderWidth: 0.5, borderColor: Colors.border },
  statVal:         { fontSize: 16, fontWeight: '700', color: Colors.primary },
  statLbl:         { fontSize: 12, color: Colors.text, fontWeight: '600', marginTop: 2 },
  statSub:         { fontSize: 11, color: Colors.text3, marginTop: 2 },
  tabRow:          { flexDirection: 'row', gap: 8, marginBottom: Spacing.md },
  tabBtn:          { flex: 1, paddingVertical: 10, borderRadius: Radius.md, backgroundColor: Colors.surface, alignItems: 'center', borderWidth: 1, borderColor: Colors.border },
  tabActive:       { backgroundColor: Colors.primary, borderColor: Colors.primary },
  tabText:         { fontSize: 13, fontWeight: '500', color: Colors.text2 },
  tabTextActive:   { color: '#fff', fontWeight: '700' },
  filterRow:       { flexDirection: 'row', gap: 8, marginBottom: Spacing.md, alignItems: 'center' },
  filterBtn:       { paddingHorizontal: 14, paddingVertical: 7, borderRadius: Radius.full, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border },
  filterActive:    { backgroundColor: Colors.primary, borderColor: Colors.primary },
  filterText:      { fontSize: 12, fontWeight: '600', color: Colors.text2 },
  filterTextActive:{ color: '#fff' },
  totalCount:      { fontSize: 12, color: Colors.text3, marginLeft: 'auto' },
  txRow:           { paddingVertical: 12, borderBottomWidth: 0.5, borderBottomColor: Colors.border, flexDirection: 'row', alignItems: 'center', gap: 12 },
  txIcon:          { width: 40, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  txDesc:          { fontSize: 13, fontWeight: '500', color: Colors.text },
  txDate:          { fontSize: 11, color: Colors.text3, marginTop: 2 },
  txAmt:           { fontSize: 14, fontWeight: '700', color: Colors.primary, flexShrink: 0 },
  emptyBox:        { alignItems: 'center', paddingVertical: 48 },
  emptyIcon:       { fontSize: 44, marginBottom: 12 },
  emptyText:       { fontSize: 15, fontWeight: '600', color: Colors.text2, marginBottom: 6 },
  emptySub:        { fontSize: 13, color: Colors.text3, textAlign: 'center' },
  memberName:      { fontSize: 14, fontWeight: '600', color: Colors.text },
  memberMeta:      { fontSize: 12, color: Colors.text3, marginTop: 2 },
  statusPill:      { borderRadius: Radius.full, paddingHorizontal: 10, paddingVertical: 4 },
});