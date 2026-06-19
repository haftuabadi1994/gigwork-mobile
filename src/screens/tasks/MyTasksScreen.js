import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  RefreshControl, ScrollView
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useCurrency } from '../../context/CurrencyContext';
import { useLanguage } from '../../context/LanguageContext';
import { Card, Row, EmptyState } from '../../components/UI';
import { Colors, Spacing, Radius, Shadow } from '../../utils/theme';
import api from '../../utils/api';

const STATUS_CONFIG = {
  accepted:    { color: Colors.text3,   bg: '#F1F2F4',           label: 'Accepted'    },
  in_progress: { color: Colors.amber,   bg: Colors.amberLight,   label: 'In Progress' },
  submitted:   { color: Colors.blue,    bg: Colors.blueLight,    label: 'In Review'   },
  completed:   { color: Colors.primary, bg: Colors.primaryLight, label: 'Completed'   },
  rejected:    { color: Colors.red,     bg: Colors.redLight,     label: 'Rejected'    },
};

function TaskCard({ item: a, fmt, onPress, t }) {
  const cfg    = STATUS_CONFIG[a.status] || STATUS_CONFIG.accepted;
  const isRej  = a.status === 'rejected';
  const isDone = a.status === 'completed';

  return (
    <Card style={styles.taskCard} onPress={onPress}>
      <View style={{ alignSelf: 'flex-start', marginBottom: 10 }}>
        <View style={[styles.statusPill, { backgroundColor: cfg.bg }]}>
          <Text style={[styles.statusPillText, { color: cfg.color }]}>{cfg.label}</Text>
        </View>
      </View>

      <Text style={styles.taskTitle} numberOfLines={2}>{a.task?.title}</Text>
      <Row style={{ justifyContent: 'space-between', marginTop: 6, marginBottom: 8 }}>
        <Text style={styles.taskCat}>{a.task?.category || 'Task'}</Text>
        <Text style={[styles.earn, isDone && { color: Colors.primary }]}>
          {isDone ? '💰 ' : ''}{fmt(a.task?.earningETB || 0)}
        </Text>
      </Row>

      <Row style={{ justifyContent: 'space-between' }}>
        <Text style={styles.meta}>⏱ ~{a.task?.estimatedMinutes || '?'} {t('estTime')}</Text>
        {a.task?.workDepositETB > 0 && (
          <Text style={styles.deposit}>🔒 {t('deposit')}: {fmt(a.task.workDepositETB)}</Text>
        )}
      </Row>

      {a.reviewNote && (
        <View style={[styles.noteBox, {
          backgroundColor: isRej ? Colors.redLight : Colors.primaryLight,
          borderLeftColor: isRej ? Colors.red : Colors.primary,
        }]}>
          <Text style={[styles.noteText, { color: isRej ? Colors.red : Colors.primaryDark }]}>
            {isRej ? '❌' : '💬'} {a.reviewNote}
          </Text>
        </View>
      )}

      {isRej && (
        <View style={styles.resubmitHint}>
          <Text style={styles.resubmitText}>{t('tapResubmit')}</Text>
        </View>
      )}
    </Card>
  );
}

export default function MyTasksScreen({ navigation }) {
  const { fmt } = useCurrency();
  const { t, language, toggle } = useLanguage();

  const [assignments, setAssignments] = useState([]);
  const [filter, setFilter]           = useState('all');
  const [loading, setLoading]         = useState(true);
  const [refreshing, setRefreshing]   = useState(false);

  const FILTERS = [
    { key: 'all',         label: t('total'),      icon: '📋' },
    { key: 'in_progress', label: t('inProgress'), icon: '⚡' },
    { key: 'submitted',   label: t('inReview'),   icon: '🔍' },
    { key: 'completed',   label: t('done'),        icon: '✅' },
    { key: 'rejected',    label: t('rejected'),   icon: '❌' },
  ];

  const load = useCallback(async () => {
    try {
      const params = filter !== 'all' ? { status: filter } : {};
      const r = await api.get('/tasks/my', { params });
      setAssignments(r.data.assignments);
    } catch (e) { console.error(e); }
    finally { setLoading(false); setRefreshing(false); }
  }, [filter]);

  useEffect(() => { load(); }, [filter]);

  const completed   = assignments.filter(a => a.status === 'completed');
  const inProgress  = assignments.filter(a => ['in_progress', 'accepted'].includes(a.status));
  const inReview    = assignments.filter(a => a.status === 'submitted');
  const totalEarned = completed.reduce((s, a) => s + (a.earnedETB || a.task?.earningETB || 0), 0);

  const STATS = [
    { value: assignments.length, label: t('total'),      color: Colors.text,    bg: Colors.bg },
    { value: inProgress.length,  label: t('inProgress'), color: Colors.amber,   bg: Colors.amberLight },
    { value: inReview.length,    label: t('inReview'),   color: Colors.blue,    bg: Colors.blueLight },
    { value: completed.length,   label: t('done'),        color: Colors.primary, bg: Colors.primaryLight },
  ];

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>

      {/* ── Header ── */}
      <View style={styles.header}>
        <View>
          <Text style={styles.heading}>{t('myTasksTitle')}</Text>
          <Text style={styles.sub}>{t('myTasksSub')}</Text>
        </View>
        <Row style={{ gap: 10 }}>
          {/* Language toggle */}
          <TouchableOpacity onPress={toggle} style={styles.langBtn}>
            <Text style={styles.langBtnText}>{language === 'en' ? 'አማ' : 'ENG'}</Text>
          </TouchableOpacity>
          {/* Total earned */}
          <View style={[styles.earnBadge, Shadow.sm]}>
            <Text style={styles.earnBadgeLabel}>{t('totalEarned')}</Text>
            <Text style={styles.earnBadgeVal}>{fmt(totalEarned)}</Text>
          </View>
        </Row>
      </View>

      {/* ── Stats Row ── */}
      <View style={styles.statsRow}>
        {STATS.map((s, i) => (
          <View key={i} style={[styles.statBox, { backgroundColor: s.bg }]}>
            <Text style={[styles.statVal, { color: s.color }]}>{s.value}</Text>
            <Text style={[styles.statLbl, { color: s.color + 'BB' }]}>{s.label}</Text>
          </View>
        ))}
      </View>

      {/* ── Filter Chips ── */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.chipScroll}
        contentContainerStyle={{ paddingHorizontal: Spacing.lg, gap: 8, paddingVertical: 4 }}
      >
        {FILTERS.map(f => (
          <TouchableOpacity
            key={f.key}
            style={[styles.chip, filter === f.key && styles.chipActive]}
            onPress={() => setFilter(f.key)}
            activeOpacity={0.75}
          >
            <Text style={styles.chipIcon}>{f.icon}</Text>
            <Text style={[styles.chipText, filter === f.key && styles.chipTextActive]}>{f.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* ── List ── */}
      <FlatList
        data={assignments}
        keyExtractor={a => a._id}
        renderItem={({ item }) => (
          <TaskCard
            item={item}
            fmt={fmt}
            t={t}
            onPress={() => navigation.navigate('TaskDetail', { taskId: item.task?._id })}
          />
        )}
        ListEmptyComponent={
          !loading && (
            <EmptyState
              icon={FILTERS.find(f => f.key === filter)?.icon || '📋'}
              title={filter === 'all' ? t('noTasksYet') : `${t('no')} ${FILTERS.find(f => f.key === filter)?.label}`}
              subtitle={filter === 'all' ? t('acceptFromHome') : t('tryAgain')}
              action={filter === 'all' ? t('browseTasks') : undefined}
              onAction={() => navigation.navigate('Home')}
            />
          )
        }
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => { setRefreshing(true); load(); }}
            tintColor={Colors.primary}
            colors={[Colors.primary]}
          />
        }
        contentContainerStyle={{ paddingBottom: 32, paddingTop: Spacing.sm }}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:           { flex: 1, backgroundColor: Colors.bg },

  // Header
  header:         { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: Spacing.lg, paddingTop: Spacing.md, paddingBottom: Spacing.md, backgroundColor: Colors.surface, borderBottomWidth: 0.5, borderBottomColor: Colors.border },
  heading:        { fontSize: 22, fontWeight: '800', color: Colors.text },
  sub:            { fontSize: 12, color: Colors.text3, marginTop: 2 },
  langBtn:        { paddingHorizontal: 8, paddingVertical: 4, borderRadius: Radius.full, borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.surface },
  langBtnText:    { fontSize: 12, fontWeight: '700', color: Colors.text },
  earnBadge:      { backgroundColor: Colors.primaryLight, borderRadius: Radius.lg, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, alignItems: 'flex-end' },
  earnBadgeLabel: { fontSize: 10, color: Colors.primary, fontWeight: '500' },
  earnBadgeVal:   { fontSize: 16, fontWeight: '800', color: Colors.primaryDark },

  // Stats
  statsRow:       { flexDirection: 'row', gap: 8, paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md },
  statBox:        { flex: 1, borderRadius: Radius.md, padding: Spacing.sm, alignItems: 'center' },
  statVal:        { fontSize: 18, fontWeight: '800' },
  statLbl:        { fontSize: 10, fontWeight: '500', marginTop: 2 },

  // Filters
  chipScroll:     { maxHeight: 48, marginBottom: Spacing.sm },
  chip:           { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 12, paddingVertical: 6, borderRadius: Radius.full, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border },
  chipActive:     { backgroundColor: Colors.primary, borderColor: Colors.primary },
  chipIcon:       { fontSize: 12 },
  chipText:       { fontSize: 12, fontWeight: '600', color: Colors.text2 },
  chipTextActive: { color: '#fff' },

  // Task card
  taskCard:       { marginHorizontal: Spacing.lg, marginBottom: Spacing.sm },
  statusPill:     { borderRadius: Radius.full, paddingHorizontal: 10, paddingVertical: 3 },
  statusPillText: { fontSize: 11, fontWeight: '700' },
  taskTitle:      { fontSize: 15, fontWeight: '700', color: Colors.text, lineHeight: 22 },
  taskCat:        { fontSize: 12, color: Colors.text3, fontWeight: '500' },
  earn:           { fontSize: 15, fontWeight: '800', color: Colors.text2 },
  meta:           { fontSize: 12, color: Colors.text3 },
  deposit:        { fontSize: 11, color: Colors.amber, fontWeight: '500' },
  noteBox:        { marginTop: Spacing.sm, borderRadius: Radius.sm, padding: Spacing.sm, borderLeftWidth: 3 },
  noteText:       { fontSize: 12, lineHeight: 18, fontWeight: '500' },
  resubmitHint:   { marginTop: 8, alignItems: 'flex-end' },
  resubmitText:   { fontSize: 12, color: Colors.primary, fontWeight: '600' },
});