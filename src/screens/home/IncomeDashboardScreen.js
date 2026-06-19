import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, RefreshControl, Animated
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useCurrency } from '../../context/CurrencyContext';
import { Card, Row } from '../../components/UI';
import { Colors, Spacing, Radius, Shadow, getLevelColor, getLevelLight, getLevelLabel } from '../../utils/theme';
import api from '../../utils/api';

const PERIODS = [
  { key: 'todayIncome',     label: 'Today',      color: Colors.primary,  bg: Colors.primaryLight },
  { key: 'yesterdayIncome', label: 'Yesterday',  color: Colors.blue,     bg: Colors.blueLight },
  { key: 'weekIncome',      label: 'This week',  color: Colors.purple,   bg: Colors.purpleLight },
  { key: 'monthIncome',     label: 'This month', color: Colors.amber,    bg: Colors.amberLight },
];

const CHART_TABS = [
  { label: '7D',  days: 7  },
  { label: '14D', days: 14 },
  { label: '30D', days: 30 },
  { label: 'All', days: null },
];

// ── Animated Bar Chart ────────────────────────────────────────────────────────
function BarChart({ data, fmt }) {
  const [selected, setSelected] = useState(null);
  const anims = useRef(data.map(() => new Animated.Value(0))).current;

  useEffect(() => {
    // Reset all to 0 first
    anims.forEach(a => a.setValue(0));
    const maxVal = Math.max(...data.map(d => d.total || 0), 1);
    Animated.stagger(20,
      anims.map((anim, i) =>
        Animated.spring(anim, {
          toValue: Math.max(4, ((data[i].total || 0) / maxVal) * 110),
          useNativeDriver: false,
          speed: 14,
          bounciness: 4,
        })
      )
    ).start();
    setSelected(null);
  }, [data]);

  const maxVal = Math.max(...data.map(d => d.total || 0), 1);
  const total   = data.reduce((s, d) => s + (d.total || 0), 0);
  const avg     = total / (data.length || 1);
  const best    = Math.max(...data.map(d => d.total || 0));
  const bestDay = data.find(d => d.total === best);

  return (
    <View>
      {/* Stats row */}
      <Row style={styles.chartStatsRow}>
        <View style={styles.chartStat}>
          <Text style={styles.chartStatVal}>{fmt(total)}</Text>
          <Text style={styles.chartStatLabel}>Total</Text>
        </View>
        <View style={[styles.chartStat, styles.chartStatMid]}>
          <Text style={styles.chartStatVal}>{fmt(Math.round(avg))}</Text>
          <Text style={styles.chartStatLabel}>Daily avg</Text>
        </View>
        <View style={styles.chartStat}>
          <Text style={[styles.chartStatVal, { color: Colors.primary }]}>{fmt(best)}</Text>
          <Text style={styles.chartStatLabel}>Best day</Text>
        </View>
      </Row>

      {/* Tooltip */}
      <View style={styles.chartTooltipWrap}>
        {selected !== null ? (
          <View style={styles.chartTooltip}>
            <Text style={styles.chartTooltipDate}>{data[selected]?.date || ''}</Text>
            <Text style={styles.chartTooltipVal}>{fmt(data[selected]?.total || 0)}</Text>
          </View>
        ) : (
          <Text style={styles.chartTapHint}>Tap a bar for details</Text>
        )}
      </View>

      {/* Bars */}
      <View style={styles.chartWrap}>
        {data.map((d, i) => {
          const isSelected = selected === i;
          const isBest = d.total === best && best > 0;
          return (
            <TouchableOpacity
              key={i}
              style={styles.barWrap}
              onPress={() => setSelected(isSelected ? null : i)}
              activeOpacity={0.8}
            >
              <Animated.View style={[
                styles.bar,
                {
                  height: anims[i],
                  backgroundColor: isSelected
                    ? Colors.primaryDark
                    : isBest
                    ? Colors.amber
                    : Colors.primary,
                  opacity: selected !== null && !isSelected ? 0.3 : 1,
                  borderTopLeftRadius: 4,
                  borderTopRightRadius: 4,
                }
              ]} />
            </TouchableOpacity>
          );
        })}
      </View>

      {/* X axis labels */}
      <Row style={{ justifyContent: 'space-between', marginTop: 6 }}>
        <Text style={styles.chartAxisLabel}>{data[0]?.date || ''}</Text>
        <Text style={styles.chartAxisLabel}>{data[Math.floor(data.length / 2)]?.date || ''}</Text>
        <Text style={styles.chartAxisLabel}>{data[data.length - 1]?.date || ''}</Text>
      </Row>

      {/* Legend */}
      <Row style={{ gap: 16, marginTop: 10, justifyContent: 'center' }}>
        <Row style={{ gap: 5, alignItems: 'center' }}>
          <View style={{ width: 10, height: 10, borderRadius: 2, backgroundColor: Colors.primary }} />
          <Text style={styles.chartAxisLabel}>Earnings</Text>
        </Row>
        <Row style={{ gap: 5, alignItems: 'center' }}>
          <View style={{ width: 10, height: 10, borderRadius: 2, backgroundColor: Colors.amber }} />
          <Text style={styles.chartAxisLabel}>Best day</Text>
        </Row>
      </Row>
    </View>
  );
}

// ── Loading Skeleton ──────────────────────────────────────────────────────────
function Skeleton() {
  const anim = useRef(new Animated.Value(0.5)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 1,   duration: 700, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0.5, duration: 700, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  return (
    <View style={{ padding: Spacing.lg, gap: Spacing.md }}>
      {[140, 100, 180, 120].map((h, i) => (
        <Animated.View key={i} style={{ height: h, borderRadius: Radius.lg, backgroundColor: Colors.border, opacity: anim }} />
      ))}
    </View>
  );
}

// ── Main Screen ───────────────────────────────────────────────────────────────
export default function IncomeDashboardScreen() {
  const { fmt, currency, setCurrency } = useCurrency();
  const [data, setData]             = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [chartTab, setChartTab]     = useState(0);

  const fadeAnim = useRef(new Animated.Value(0)).current;

  const load = async () => {
    try {
      const r = await api.get('/income/summary');
      setData(r.data);
      Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }).start();
    } catch (e) { console.error(e); }
    finally { setRefreshing(false); }
  };

  useEffect(() => { load(); }, []);

  if (!data) return <Skeleton />;

  const rule       = data.rule;
  const levelColor = getLevelColor(data.level);
  const levelLight = getLevelLight(data.level);
  const levelLabel = getLevelLabel(data.level);

  const tasksLeft  = Math.max(0, (rule?.minTasksToAdvance || 0) - (data.completedTasks || 0));
  const advancePct = rule?.minTasksToAdvance
    ? Math.min(100, Math.round(((data.completedTasks || 0) / rule.minTasksToAdvance) * 100))
    : 100;

  const allChart   = data.dailyChart || [];
  const days       = CHART_TABS[chartTab].days;
  const chartData  = days ? allChart.slice(-days) : allChart;

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <Animated.ScrollView
        style={{ opacity: fadeAnim }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => { setRefreshing(true); load(); }}
            tintColor={Colors.primary}
            colors={[Colors.primary]}
          />
        }
        contentContainerStyle={{ padding: Spacing.lg, paddingBottom: 48 }}
      >

        {/* ── Level Banner ── */}
        <View style={[styles.levelBanner, { backgroundColor: levelColor }, Shadow.primary]}>
          <View style={styles.bgCircle1} />
          <View style={styles.bgCircle2} />

          <View style={{ flex: 1 }}>
            <View style={styles.levelPill}>
              <Text style={styles.levelPillText}>{(data.level || 'intern').toUpperCase()}</Text>
            </View>
            <Text style={styles.levelTitle}>{levelLabel}</Text>
            <Text style={styles.levelSub}>Quality score: {data.qualityScore || 100}%</Text>
          </View>

          <View style={{ alignItems: 'flex-end' }}>
            <Text style={styles.bannerSmallLabel}>Per task</Text>
            <Text style={styles.bannerBigVal}>{fmt(rule?.rewardPerTaskETB || 0)}</Text>
            <Text style={styles.bannerSmallLabel}>{rule?.taskCountPerDay} tasks/day</Text>
          </View>
        </View>

        {/* ── Advance Progress ── */}
        {rule?.minTasksToAdvance > 0 && (
          <Card style={{ marginBottom: Spacing.md }}>
            <Row style={{ justifyContent: 'space-between', marginBottom: 8 }}>
              <Text style={styles.sectionTitle}>Level progress</Text>
              <Text style={{ fontSize: 12, color: Colors.primary, fontWeight: '700' }}>{advancePct}%</Text>
            </Row>
            <View style={styles.progressBg}>
              <View style={[styles.progressFill, { width: `${advancePct}%`, backgroundColor: levelColor }]} />
            </View>
            <Text style={styles.progressHint}>
              {tasksLeft > 0
                ? `${tasksLeft} more tasks to advance to the next level`
                : '🎉 Ready to advance to next level!'}
            </Text>
          </Card>
        )}

        {/* ── Currency Toggle ── */}
        <TouchableOpacity
          style={styles.curToggle}
          onPress={() => setCurrency(currency === 'ETB' ? 'USD' : 'ETB')}
          activeOpacity={0.8}
        >
          <Text style={styles.curToggleText}>
            {currency === 'ETB' ? '🇪🇹 ETB' : '🇺🇸 USD'} — Tap to switch
          </Text>
        </TouchableOpacity>

        {/* ── Period Cards ── */}
        <View style={styles.periodGrid}>
          {PERIODS.map((p) => (
            <View key={p.key} style={[styles.periodCard, { backgroundColor: p.bg }, Shadow.sm]}>
              <Text style={[styles.periodValue, { color: p.color }]}>{fmt(data[p.key] || 0)}</Text>
              <Text style={[styles.periodLabel, { color: p.color + 'AA' }]}>{p.label}</Text>
            </View>
          ))}
        </View>

        {/* ── Today Summary ── */}
        <Card style={{ marginBottom: Spacing.md }}>
          <Text style={styles.sectionTitle}>Today's summary</Text>
          <Row style={{ gap: Spacing.md, marginTop: 4 }}>
            <View style={[styles.summaryBox, { backgroundColor: Colors.primaryLight }]}>
              <Text style={[styles.summaryVal, { color: Colors.primaryDark }]}>{data.todayTasks || 0}</Text>
              <Text style={[styles.summaryLabel, { color: Colors.primary }]}>Tasks done</Text>
            </View>
            <View style={[styles.summaryBox, { backgroundColor: Colors.amberLight }]}>
              <Text style={[styles.summaryVal, { color: Colors.amber }]}>
                {rule?.taskCountPerDay ? `${data.todayTasks || 0}/${rule.taskCountPerDay}` : '—'}
              </Text>
              <Text style={[styles.summaryLabel, { color: Colors.amber }]}>Daily limit</Text>
            </View>
            <View style={[styles.summaryBox, { backgroundColor: Colors.blueLight }]}>
              <Text style={[styles.summaryVal, { color: Colors.blue }]}>{fmt(data.teamTodayIncome || 0)}</Text>
              <Text style={[styles.summaryLabel, { color: Colors.blue }]}>Team today</Text>
            </View>
          </Row>
        </Card>

        {/* ── Recommended Banner ── */}
        <View style={[styles.recBanner, Shadow.sm]}>
          <View>
            <Text style={styles.recLabel}>Recommended daily income</Text>
            <Text style={styles.recVal}>{fmt(data.recommendedDailyIncome || 0)}</Text>
          </View>
          <View style={styles.recRight}>
            <Text style={styles.recPercent}>
              {data.recommendedDailyIncome
                ? `${Math.min(100, Math.round(((data.todayIncome || 0) / data.recommendedDailyIncome) * 100))}%`
                : '—'}
            </Text>
            <Text style={styles.recPercentLabel}>achieved</Text>
          </View>
        </View>

        {/* ── Wallet Breakdown ── */}
        <Card style={{ marginBottom: Spacing.md }}>
          <Text style={styles.sectionTitle}>💼 Wallet breakdown</Text>
          {[
            { label: 'Income wallet',   value: data.incomeWalletETB,   color: Colors.primary, icon: '💰' },
            { label: 'Personal wallet', value: data.personalWalletETB, color: Colors.blue,    icon: '👤' },
            { label: 'All-time earned', value: data.totalEarned,       color: Colors.amber,   icon: '🏆' },
          ].map((w, i, arr) => (
            <Row key={w.label} style={[
              styles.walletRow,
              i < arr.length - 1 && { borderBottomWidth: 0.5, borderBottomColor: Colors.border }
            ]}>
              <View style={[styles.walletIcon, { backgroundColor: w.color + '18' }]}>
                <Text style={{ fontSize: 16 }}>{w.icon}</Text>
              </View>
              <Text style={styles.walletLabel}>{w.label}</Text>
              <Text style={[styles.walletVal, { color: w.color }]}>{fmt(w.value || 0)}</Text>
            </Row>
          ))}
        </Card>

        {/* ── Earnings Chart ── */}
        {allChart.length > 0 && (
          <Card style={{ marginBottom: Spacing.md }}>
            <Row style={{ justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.md }}>
              <Text style={styles.sectionTitle}>📈 Earnings history</Text>
              <Row style={styles.tabRow}>
                {CHART_TABS.map((t, i) => (
                  <TouchableOpacity
                    key={t.label}
                    style={[styles.tab, chartTab === i && styles.tabActive]}
                    onPress={() => setChartTab(i)}
                  >
                    <Text style={[styles.tabText, chartTab === i && styles.tabTextActive]}>{t.label}</Text>
                  </TouchableOpacity>
                ))}
              </Row>
            </Row>
            {chartData.length > 0
              ? <BarChart data={chartData} fmt={fmt} />
              : <Text style={{ color: Colors.text3, fontSize: 13, textAlign: 'center', paddingVertical: 24 }}>No data for this period</Text>
            }
          </Card>
        )}

      </Animated.ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:             { flex: 1, backgroundColor: Colors.bg },

  levelBanner:      { borderRadius: Radius.xl, padding: Spacing.xl, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.md, overflow: 'hidden', position: 'relative' },
  bgCircle1:        { position: 'absolute', width: 180, height: 180, borderRadius: 90, backgroundColor: 'rgba(10, 144, 90, 0.07)', top: -60, right: -30 },
  bgCircle2:        { position: 'absolute', width: 120, height: 120, borderRadius: 60, backgroundColor: 'rgba(4, 92, 56, 0.05)', bottom: -40, left: 10 },
  levelPill:        { backgroundColor: 'rgba(10, 92, 54, 0.25)', alignSelf: 'flex-start', borderRadius: Radius.full, paddingHorizontal: 10, paddingVertical: 3, marginBottom: 8 },
  levelPillText:    { fontSize: 10, color: '#fff', fontWeight: '800', letterSpacing: 1 },
  levelTitle:       { fontSize: 22, fontWeight: '800', color: '#fff' },
  levelSub:         { fontSize: 12, color: 'rgba(255,255,255,0.75)', marginTop: 4 },
  bannerSmallLabel: { fontSize: 11, color: 'rgba(255,255,255,0.75)', marginBottom: 2 },
  bannerBigVal:     { fontSize: 24, fontWeight: '800', color: '#fff' },

  progressBg:       { height: 8, backgroundColor: Colors.border, borderRadius: 4, overflow: 'hidden', marginBottom: 8 },
  progressFill:     { height: 8, borderRadius: 4 },
  progressHint:     { fontSize: 12, color: Colors.text3, lineHeight: 18 },

  curToggle:        { alignSelf: 'center', backgroundColor: Colors.primaryLight, borderRadius: Radius.full, paddingHorizontal: 20, paddingVertical: 8, marginBottom: Spacing.md },
  curToggleText:    { fontSize: 13, color: Colors.primaryDark, fontWeight: '700' },

  periodGrid:       { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: Spacing.md },
  periodCard:       { width: '47%', borderRadius: Radius.lg, padding: Spacing.lg, alignItems: 'center' },
  periodValue:      { fontSize: 19, fontWeight: '800', marginBottom: 4 },
  periodLabel:      { fontSize: 11, fontWeight: '600' },

  summaryBox:       { flex: 1, borderRadius: Radius.md, padding: Spacing.md, alignItems: 'center' },
  summaryVal:       { fontSize: 16, fontWeight: '800', marginBottom: 3 },
  summaryLabel:     { fontSize: 10, fontWeight: '600' },

  recBanner:        { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: Colors.surface, borderRadius: Radius.lg, padding: Spacing.lg, marginBottom: Spacing.md, borderWidth: 0.5, borderColor: Colors.border },
  recLabel:         { fontSize: 12, color: Colors.text3, marginBottom: 4 },
  recVal:           { fontSize: 20, fontWeight: '800', color: Colors.primary },
  recRight:         { alignItems: 'center', backgroundColor: Colors.primaryLight, borderRadius: Radius.lg, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm },
  recPercent:       { fontSize: 20, fontWeight: '800', color: Colors.primaryDark },
  recPercentLabel:  { fontSize: 10, color: Colors.primary, fontWeight: '600' },

  walletRow:        { paddingVertical: 12, flexDirection: 'row', alignItems: 'center' },
  walletIcon:       { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  walletLabel:      { flex: 1, fontSize: 14, color: Colors.text2 },
  walletVal:        { fontSize: 15, fontWeight: '700' },

  sectionTitle:     { fontSize: 15, fontWeight: '700', color: Colors.text, marginBottom: Spacing.sm },

  // Chart tabs
  tabRow:           { flexDirection: 'row', gap: 4 },
  tab:              { paddingHorizontal: 10, paddingVertical: 4, borderRadius: Radius.full, backgroundColor: Colors.border },
  tabActive:        { backgroundColor: Colors.primary },
  tabText:          { fontSize: 11, fontWeight: '700', color: Colors.text3 },
  tabTextActive:    { color: '#fff' },

  // Chart
  chartStatsRow:    { flexDirection: 'row', marginBottom: Spacing.md },
  chartStat:        { flex: 1, alignItems: 'center' },
  chartStatMid:     { borderLeftWidth: 0.5, borderRightWidth: 0.5, borderColor: Colors.border },
  chartStatVal:     { fontSize: 14, fontWeight: '800', color: Colors.text, marginBottom: 2 },
  chartStatLabel:   { fontSize: 10, color: Colors.text3, fontWeight: '600' },
  chartTooltipWrap: { height: 40, justifyContent: 'center', alignItems: 'center', marginBottom: 4 },
  chartTooltip:     { backgroundColor: Colors.text, borderRadius: Radius.md, paddingHorizontal: 12, paddingVertical: 6, flexDirection: 'row', gap: 8, alignItems: 'center' },
  chartTooltipDate: { fontSize: 11, color: 'rgba(255,255,255,0.7)' },
  chartTooltipVal:  { fontSize: 13, fontWeight: '800', color: '#fff' },
  chartTapHint:     { fontSize: 11, color: Colors.text4 },
  chartWrap:        { flexDirection: 'row', alignItems: 'flex-end', height: 120, gap: 3 },
  barWrap:          { flex: 1, justifyContent: 'flex-end', height: 120 },
  bar:              { borderRadius: 3 },
  chartAxisLabel:   { fontSize: 10, color: Colors.text4 },
});
