import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useCurrency } from '../../context/CurrencyContext';
import { Card, Row } from '../../components/UI';
import { Colors, Spacing, Radius } from '../../utils/theme';
import api from '../../utils/api';

const LEVEL_COLORS = Colors.levels;
const PERIODS = [
  { key: 'todayIncome',     label: "Today",      icon: '☀️' },
  { key: 'yesterdayIncome', label: "Yesterday",  icon: '🌙' },
  { key: 'weekIncome',      label: "This week",  icon: '📅' },
  { key: 'monthIncome',     label: "This month", icon: '📆' },
];

export default function IncomeDashboardScreen() {
  const { fmt, currency, setCurrency } = useCurrency();
  const [data, setData]       = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    try {
      const r = await api.get('/income/summary');
      setData(r.data);
    } catch (e) { console.error(e); }
    finally { setRefreshing(false); }
  };

  useEffect(() => { load(); }, []);

  if (!data) return <View style={{ flex:1, alignItems:'center', justifyContent:'center' }}><Text style={{ color: Colors.text3 }}>Loading…</Text></View>;

  const rule = data.rule;
  const levelColor = LEVEL_COLORS[data.level] || Colors.primary;

  return (
    <SafeAreaView style={{ flex:1, backgroundColor: Colors.bg }} edges={['bottom']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={Colors.primary} />}
        contentContainerStyle={{ padding: Spacing.lg, paddingBottom: 40 }}
      >
        {/* Level banner */}
        <View style={[styles.levelBanner, { backgroundColor: levelColor }]}>
          <View>
            <Text style={styles.levelLabel}>Level</Text>
            <Text style={styles.levelValue}>{data.level?.toUpperCase()}</Text>
            <Text style={styles.levelSub}>{rule?.label}</Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={styles.levelLabel}>Per task</Text>
            <Text style={styles.levelEarn}>{fmt(rule?.rewardPerTaskETB || 0)}</Text>
            <Text style={styles.levelSub}>{rule?.taskCountPerDay} tasks/day</Text>
          </View>
        </View>

        {/* Currency toggle */}
        <TouchableOpacity style={styles.curToggle} onPress={() => setCurrency(currency === 'ETB' ? 'USD' : 'ETB')}>
          <Text style={styles.curToggleText}>Showing {currency} — tap to switch</Text>
        </TouchableOpacity>

        {/* Period cards */}
        <View style={styles.periodGrid}>
          {PERIODS.map(p => (
            <View key={p.key} style={styles.periodCard}>
              <Text style={styles.periodIcon}>{p.icon}</Text>
              <Text style={styles.periodLabel}>{p.label}</Text>
              <Text style={styles.periodValue}>{fmt(data[p.key] || 0)}</Text>
            </View>
          ))}
        </View>

        {/* Recommended & Team */}
        <View style={styles.twoCol}>
          <View style={[styles.metaCard, { backgroundColor: Colors.primaryLight }]}>
            <Text style={[styles.metaLabel, { color: Colors.primaryDark }]}>Recommended daily</Text>
            <Text style={[styles.metaValue, { color: Colors.primaryDark }]}>{fmt(data.recommendedDailyIncome || 0)}</Text>
            <Text style={[styles.metaSub, { color: Colors.primaryDark }]}>Based on your level</Text>
          </View>
          <View style={[styles.metaCard, { backgroundColor: Colors.blueLight }]}>
            <Text style={[styles.metaLabel, { color: Colors.blue }]}>Team today</Text>
            <Text style={[styles.metaValue, { color: Colors.blue }]}>{fmt(data.teamTodayIncome || 0)}</Text>
            <Text style={[styles.metaSub, { color: Colors.blue }]}>Your referrals</Text>
          </View>
        </View>

        {/* Wallet breakdown */}
        <Card>
          <Text style={styles.sectionTitle}>Wallet breakdown</Text>
          {[
            { label: 'Income wallet',    value: data.incomeWalletETB,  color: Colors.primary },
            { label: 'Personal wallet',  value: data.personalWalletETB,color: Colors.blue },
            { label: 'All-time earned',  value: data.totalEarned,      color: Colors.amber },
          ].map(w => (
            <Row key={w.label} style={{ justifyContent:'space-between', paddingVertical: 10, borderBottomWidth: 0.5, borderBottomColor: Colors.border }}>
              <Text style={{ fontSize: 13, color: Colors.text2 }}>{w.label}</Text>
              <Text style={{ fontSize: 15, fontWeight: '700', color: w.color }}>{fmt(w.value || 0)}</Text>
            </Row>
          ))}
        </Card>

        {/* Level rules */}
        {rule && (
          <Card style={{ marginTop: Spacing.md }}>
            <Text style={styles.sectionTitle}>Your level details</Text>
            {[
              { label: 'Referral commission', value: `${rule.referralCommission}%` },
              { label: 'Team bonus',          value: `${rule.teamBonusPercent}% of team income` },
              { label: 'Tasks to advance',    value: `${rule.minTasksToAdvance} completed` },
              { label: 'Min quality score',   value: `${rule.minQualityScore || 80}%` },
            ].map(r => (
              <Row key={r.label} style={{ justifyContent:'space-between', paddingVertical: 10, borderBottomWidth: 0.5, borderBottomColor: Colors.border }}>
                <Text style={{ fontSize: 13, color: Colors.text2 }}>{r.label}</Text>
                <Text style={{ fontSize: 13, fontWeight: '600', color: Colors.primary }}>{r.value}</Text>
              </Row>
            ))}
          </Card>
        )}

        {/* 30-day chart (simple bars) */}
        {data.dailyChart?.length > 0 && (
          <Card style={{ marginTop: Spacing.md }}>
            <Text style={styles.sectionTitle}>30-day earnings</Text>
            <View style={styles.chartWrap}>
              {(() => {
                const maxVal = Math.max(...data.dailyChart.map(d => d.total || 0), 1);
                return data.dailyChart.slice(-20).map((d, i) => (
                  <View key={i} style={styles.barWrap}>
                    <View style={[styles.bar, { height: Math.max(3, (d.total / maxVal) * 60) }]} />
                  </View>
                ));
              })()}
            </View>
          </Card>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  levelBanner:  { borderRadius: Radius.xl, padding: Spacing.xl, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.sm },
  levelLabel:   { fontSize: 11, color: 'rgba(255,255,255,0.75)', marginBottom: 3 },
  levelValue:   { fontSize: 22, fontWeight: '700', color: '#fff' },
  levelEarn:    { fontSize: 22, fontWeight: '700', color: '#fff' },
  levelSub:     { fontSize: 11, color: 'rgba(255,255,255,0.65)', marginTop: 2 },
  curToggle:    { alignSelf: 'center', backgroundColor: Colors.primaryLight, borderRadius: Radius.full, paddingHorizontal: 16, paddingVertical: 6, marginBottom: Spacing.md },
  curToggleText:{ fontSize: 12, color: Colors.primaryDark, fontWeight: '600' },
  periodGrid:   { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: Spacing.md },
  periodCard:   { width: '47%', backgroundColor: Colors.surface, borderRadius: Radius.lg, padding: Spacing.lg, borderWidth: 0.5, borderColor: Colors.border, alignItems: 'center' },
  periodIcon:   { fontSize: 24, marginBottom: 6 },
  periodLabel:  { fontSize: 12, color: Colors.text3, marginBottom: 4 },
  periodValue:  { fontSize: 18, fontWeight: '700', color: Colors.primary },
  twoCol:       { flexDirection: 'row', gap: 10, marginBottom: Spacing.md },
  metaCard:     { flex: 1, borderRadius: Radius.lg, padding: Spacing.lg },
  metaLabel:    { fontSize: 11, fontWeight: '600', marginBottom: 4 },
  metaValue:    { fontSize: 18, fontWeight: '700' },
  metaSub:      { fontSize: 11, marginTop: 2, opacity: 0.75 },
  sectionTitle: { fontSize: 15, fontWeight: '600', color: Colors.text, marginBottom: Spacing.sm },
  chartWrap:    { flexDirection: 'row', alignItems: 'flex-end', height: 64, gap: 2, marginTop: 8 },
  barWrap:      { flex: 1, justifyContent: 'flex-end' },
  bar:          { backgroundColor: Colors.primary, borderRadius: 2, opacity: 0.8 },
});
