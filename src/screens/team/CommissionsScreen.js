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

const LEVEL_COLORS = Colors.levels || {};
const TIER_COLORS  = { A: '#10B981', B: '#3B82F6' };

export default function CommissionsScreen() {
  const { fmt }          = useCurrency();
  const { t, language, toggle } = useLanguage();

  const [summary, setSummary]     = useState(null);
  const [txs, setTxs]             = useState([]);
  const [total, setTotal]         = useState(0);
  const [page, setPage]           = useState(1);
  const [tierFilter, setTier]     = useState('');
  const [tab, setTab]             = useState('overview');
  const [txLoading, setTxLoad]    = useState(false);
  const [refreshing, setRefresh]  = useState(false);
  const [loadingMore, setLoadMore]= useState(false);

  const loadSummary = async () => {
    try {
      const r = await api.get('/admin/commissions/summary');
      setSummary(r.data);
    } catch (e) { console.error(e); }
  };

  const loadTxs = useCallback(async (reset = false) => {
    const nextPage = reset ? 1 : page;
    if (reset) { setTxLoad(true); setPage(1); }
    else setLoadMore(true);
    try {
      const r = await api.get('/admin/commissions', {
        params: { page: nextPage, limit: 15, tier: tierFilter || undefined }
      });
      setTxs(reset ? r.data.data : prev => [...prev, ...r.data.data]);
      setTotal(r.data.total);
      if (!reset) setPage(p => p + 1);
    } catch (e) { console.error(e); }
    finally { setTxLoad(false); setLoadMore(false); setRefresh(false); }
  }, [page, tierFilter]);

  useEffect(() => { loadSummary(); }, []);
  useEffect(() => { if (tab === 'transactions') loadTxs(true); }, [tab, tierFilter]);

  const onRefresh = () => { setRefresh(true); loadSummary(); if (tab === 'transactions') loadTxs(true); };

  const summaryCards = summary ? [
    { label: 'Total paid out',    value: fmt(summary.overall?.totalPaid),  sub: `${summary.overall?.count || 0} transactions` },
    { label: 'This month',        value: fmt(summary.monthly?.total),       sub: `${summary.monthly?.count || 0} payouts` },
    { label: 'Tier A (referral)', value: fmt(summary.overall?.tierA),       sub: 'First task commissions' },
    { label: 'Tier B (team)',     value: fmt(summary.overall?.tierB),       sub: 'Ongoing team bonuses' },
  ] : [];

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Row style={{ justifyContent: 'space-between', alignItems: 'center' }}>
          <View>
            <Text style={styles.heading}>Commissions</Text>
            <Text style={styles.sub}>Referral bonus overview</Text>
          </View>
          <TouchableOpacity onPress={toggle} style={styles.langBtn}>
            <Text style={styles.langBtnText}>{language === 'en' ? 'አማ' : 'ENG'}</Text>
          </TouchableOpacity>
        </Row>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
        contentContainerStyle={{ padding: Spacing.lg, paddingBottom: 40 }}
      >
        {/* Summary cards */}
        {summary ? (
          <>
            <View style={[styles.heroCard, { backgroundColor: Colors.primary }]}>
              <Text style={styles.heroLabel}>Total commissions paid</Text>
              <Text style={styles.heroValue}>{fmt(summary.overall?.totalPaid)}</Text>
              <Text style={styles.heroSub}>{summary.overall?.count || 0} total transactions</Text>
            </View>

            <View style={styles.statsGrid}>
              {summaryCards.slice(1).map(c => (
                <View key={c.label} style={styles.statBox}>
                  <Text style={styles.statVal}>{c.value}</Text>
                  <Text style={styles.statLbl}>{c.label}</Text>
                  <Text style={styles.statSub}>{c.sub}</Text>
                </View>
              ))}
            </View>
          </>
        ) : (
          <View style={styles.center}><ActivityIndicator color={Colors.primary} /></View>
        )}

        {/* Tabs */}
        <View style={styles.tabRow}>
          {[
            { k: 'overview',     l: 'Top earners' },
            { k: 'transactions', l: 'Transactions' },
          ].map(tb => (
            <TouchableOpacity key={tb.k} style={[styles.tabBtn, tab === tb.k && styles.tabActive]} onPress={() => setTab(tb.k)}>
              <Text style={[styles.tabText, tab === tb.k && styles.tabTextActive]}>{tb.l}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* TOP EARNERS */}
        {tab === 'overview' && (
          <>
            <Text style={styles.sectionTitle}>Top commission earners</Text>
            {!summary?.topEarners?.length ? (
              <View style={styles.emptyBox}>
                <Text style={styles.emptyIcon}>🏆</Text>
                <Text style={styles.emptyText}>No commission data yet</Text>
              </View>
            ) : (
              summary.topEarners.map((e, i) => (
                <Card key={e._id} style={{ marginBottom: 8 }}>
                  <Row style={{ gap: 12, alignItems: 'center' }}>
                    <Text style={[styles.rank, { color: i < 3 ? '#D97706' : Colors.text3 }]}>#{i + 1}</Text>
                    <View style={[styles.avatar, { backgroundColor: Colors.primaryLight }]}>
                      <Text style={{ fontSize: 14, fontWeight: '700', color: Colors.primaryDark }}>
                        {e.user?.name?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
                      </Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.memberName}>{e.user?.name}</Text>
                      <Text style={styles.memberMeta}>{e.user?.referralCode}</Text>
                    </View>
                    <Text style={styles.earnAmt}>{fmt(e.earned)}</Text>
                  </Row>
                </Card>
              ))
            )}
          </>
        )}

        {/* TRANSACTIONS */}
        {tab === 'transactions' && (
          <>
            {/* Tier filter */}
            <View style={styles.filterRow}>
              {[{ v: '', l: 'All' }, { v: 'A', l: 'Tier A' }, { v: 'B', l: 'Tier B' }].map(f => (
                <TouchableOpacity key={f.v} style={[styles.filterBtn, tierFilter === f.v && styles.filterActive]}
                  onPress={() => { setTier(f.v); }}>
                  <Text style={[styles.filterText, tierFilter === f.v && styles.filterTextActive]}>{f.l}</Text>
                </TouchableOpacity>
              ))}
              <Text style={styles.totalCount}>{total} total</Text>
            </View>

            {txLoading ? (
              <View style={styles.center}><ActivityIndicator color={Colors.primary} /></View>
            ) : txs.length === 0 ? (
              <View style={styles.emptyBox}>
                <Text style={styles.emptyIcon}>💸</Text>
                <Text style={styles.emptyText}>No commission transactions</Text>
              </View>
            ) : (
              <>
                {txs.map(tx => (
                  <Row key={tx._id} style={styles.txRow}>
                    <View style={[styles.txIcon, { backgroundColor: (TIER_COLORS[tx.tier] || Colors.primary) + '18' }]}>
                      <Text style={{ fontSize: 11, fontWeight: '800', color: TIER_COLORS[tx.tier] || Colors.primary }}>T{tx.tier}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.txDesc} numberOfLines={1}>{tx.description}</Text>
                      <Text style={styles.txMeta}>
                        {tx.referrer?.name || '—'} → {tx.worker?.name || '—'}
                      </Text>
                      <Text style={styles.txDate}>{new Date(tx.createdAt).toLocaleDateString('en-ET', { month: 'short', day: 'numeric', year: 'numeric' })}</Text>
                    </View>
                    <Text style={styles.txAmt}>+{fmt(tx.amountETB)}</Text>
                  </Row>
                ))}

                {/* Load more */}
                {txs.length < total && (
                  <TouchableOpacity style={styles.loadMoreBtn} onPress={() => loadTxs(false)} disabled={loadingMore}>
                    {loadingMore
                      ? <ActivityIndicator color={Colors.primary} size="small" />
                      : <Text style={styles.loadMoreText}>Load more</Text>}
                  </TouchableOpacity>
                )}
              </>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:           { flex: 1, backgroundColor: Colors.bg },
  center:         { padding: 40, alignItems: 'center' },
  header:         { paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md, backgroundColor: Colors.surface, borderBottomWidth: 0.5, borderBottomColor: Colors.border },
  heading:        { fontSize: 20, fontWeight: '700', color: Colors.text },
  sub:            { fontSize: 12, color: Colors.text3, marginTop: 2 },
  langBtn:        { paddingHorizontal: 10, paddingVertical: 5, borderRadius: Radius.full, borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.bg },
  langBtnText:    { fontSize: 12, fontWeight: '700', color: Colors.text2 },
  heroCard:       { borderRadius: Radius.xl, padding: Spacing.xl, alignItems: 'center', marginBottom: Spacing.md },
  heroLabel:      { fontSize: 12, color: 'rgba(255,255,255,0.75)', marginBottom: 4 },
  heroValue:      { fontSize: 30, fontWeight: '700', color: '#fff' },
  heroSub:        { fontSize: 12, color: 'rgba(255,255,255,0.65)', marginTop: 4 },
  statsGrid:      { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: Spacing.md },
  statBox:        { flex: 1, minWidth: '45%', backgroundColor: Colors.surface, borderRadius: Radius.md, padding: Spacing.md, borderWidth: 0.5, borderColor: Colors.border },
  statVal:        { fontSize: 16, fontWeight: '700', color: Colors.primary },
  statLbl:        { fontSize: 12, color: Colors.text, fontWeight: '600', marginTop: 2 },
  statSub:        { fontSize: 11, color: Colors.text3, marginTop: 2 },
  tabRow:         { flexDirection: 'row', gap: 8, marginBottom: Spacing.md },
  tabBtn:         { flex: 1, paddingVertical: 10, borderRadius: Radius.md, backgroundColor: Colors.surface, alignItems: 'center', borderWidth: 1, borderColor: Colors.border },
  tabActive:      { backgroundColor: Colors.primary, borderColor: Colors.primary },
  tabText:        { fontSize: 13, fontWeight: '500', color: Colors.text2 },
  tabTextActive:  { color: '#fff', fontWeight: '700' },
  sectionTitle:   { fontSize: 13, fontWeight: '600', color: Colors.text2, marginBottom: 10 },
  rank:           { fontSize: 16, fontWeight: '700', width: 28, textAlign: 'center' },
  avatar:         { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  memberName:     { fontSize: 14, fontWeight: '600', color: Colors.text },
  memberMeta:     { fontSize: 11, color: Colors.text3, marginTop: 2 },
  earnAmt:        { fontSize: 13, fontWeight: '700', color: Colors.primary },
  filterRow:      { flexDirection: 'row', gap: 8, marginBottom: Spacing.md, alignItems: 'center' },
  filterBtn:      { paddingHorizontal: 14, paddingVertical: 7, borderRadius: Radius.full, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border },
  filterActive:   { backgroundColor: Colors.primary, borderColor: Colors.primary },
  filterText:     { fontSize: 12, fontWeight: '600', color: Colors.text2 },
  filterTextActive:{ color: '#fff' },
  totalCount:     { fontSize: 12, color: Colors.text3, marginLeft: 'auto' },
  txRow:          { paddingVertical: 12, borderBottomWidth: 0.5, borderBottomColor: Colors.border, flexDirection: 'row', alignItems: 'center', gap: 12 },
  txIcon:         { width: 40, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  txDesc:         { fontSize: 13, fontWeight: '500', color: Colors.text },
  txMeta:         { fontSize: 11, color: Colors.text3, marginTop: 2 },
  txDate:         { fontSize: 11, color: Colors.text3, marginTop: 1 },
  txAmt:          { fontSize: 14, fontWeight: '700', color: Colors.primary, flexShrink: 0 },
  emptyBox:       { alignItems: 'center', padding: 40 },
  emptyIcon:      { fontSize: 40, marginBottom: 12 },
  emptyText:      { fontSize: 14, color: Colors.text3 },
  loadMoreBtn:    { marginTop: 16, paddingVertical: 12, borderRadius: Radius.md, backgroundColor: Colors.surface, alignItems: 'center', borderWidth: 1, borderColor: Colors.border },
  loadMoreText:   { fontSize: 13, fontWeight: '600', color: Colors.primary },
});
