import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useCurrency } from '../../context/CurrencyContext';
import { Card, Badge, Row, EmptyState } from '../../components/UI';
import { Colors, Spacing, Radius } from '../../utils/theme';
import api from '../../utils/api';

const STATUS_BADGE = {
  accepted:    'gray',
  in_progress: 'amber',
  submitted:   'blue',
  completed:   'green',
  rejected:    'red',
};

const FILTERS = ['all', 'in_progress', 'submitted', 'completed'];

export default function MyTasksScreen({ navigation }) {
  const { fmt } = useCurrency();
  const [assignments, setAssignments] = useState([]);
  const [filter, setFilter]           = useState('all');
  const [loading, setLoading]         = useState(true);
  const [refreshing, setRefreshing]   = useState(false);

  const load = useCallback(async () => {
    try {
      const params = filter !== 'all' ? { status: filter } : {};
      const r = await api.get('/tasks/my', { params });
      setAssignments(r.data.assignments);
    } catch (e) { console.error(e); }
    finally { setLoading(false); setRefreshing(false); }
  }, [filter]);

  useEffect(() => { load(); }, [filter]);

  const completed = assignments.filter(a => a.status === 'completed');
  const totalEarned = completed.reduce((s, a) => s + (a.earnedETB || 0), 0);

  const renderItem = ({ item: a }) => (
    <Card
      style={{ marginHorizontal: Spacing.lg, marginBottom: Spacing.sm }}
      onPress={() => navigation.navigate('TaskDetail', { taskId: a.task?._id })}
    >
      <Row style={{ justifyContent: 'space-between', marginBottom: 8 }}>
        <Text style={styles.taskTitle} numberOfLines={1}>{a.task?.title}</Text>
        <Text style={styles.earn}>{fmt(a.task?.earningETB || 0)}</Text>
      </Row>
      <View style={styles.progressBg}>
        <View style={[styles.progressFill, { width: `${a.progress}%` }]} />
      </View>
      <Row style={{ justifyContent: 'space-between', marginTop: 8 }}>
        <Text style={styles.meta}>{a.progress}% complete</Text>
        <Badge label={a.status.replace('_', ' ')} color={STATUS_BADGE[a.status] || 'gray'} />
      </Row>
      {a.reviewNote && (
        <Text style={[styles.note, { color: a.status === 'rejected' ? Colors.red : Colors.primary }]} numberOfLines={2}>
          📝 {a.reviewNote}
        </Text>
      )}
    </Card>
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.heading}>My tasks</Text>
        <Text style={styles.sub}>Track your work progress</Text>
      </View>

      {/* Stats */}
      <View style={styles.statsRow}>
        <View style={styles.statBox}>
          <Text style={styles.statVal}>{completed.length}</Text>
          <Text style={styles.statLbl}>Completed</Text>
        </View>
        <View style={[styles.statBox, { backgroundColor: Colors.primaryLight }]}>
          <Text style={[styles.statVal, { color: Colors.primaryDark }]}>{fmt(totalEarned)}</Text>
          <Text style={[styles.statLbl, { color: Colors.primaryDark }]}>Earned</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statVal}>{assignments.filter(a => a.status !== 'completed').length}</Text>
          <Text style={styles.statLbl}>Pending</Text>
        </View>
      </View>

      {/* Filter chips */}
      <View style={styles.chipRow}>
        {FILTERS.map(f => (
          <TouchableOpacity key={f} style={[styles.chip, filter === f && styles.chipActive]} onPress={() => setFilter(f)}>
            <Text style={[styles.chipText, filter === f && styles.chipTextActive]}>
              {f === 'all' ? 'All' : f.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={assignments}
        keyExtractor={a => a._id}
        renderItem={renderItem}
        ListEmptyComponent={
          !loading && (
            <EmptyState
              icon="📋"
              title={filter === 'all' ? "No tasks yet" : `No ${filter.replace('_', ' ')} tasks`}
              subtitle={filter === 'all' ? "Accept tasks from the Home screen" : undefined}
              action={filter === 'all' ? "Browse tasks" : undefined}
              onAction={() => navigation.navigate('Home')}
            />
          )
        }
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={Colors.primary} />}
        contentContainerStyle={{ paddingBottom: 24, paddingTop: Spacing.sm }}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:       { flex: 1, backgroundColor: Colors.bg },
  header:     { paddingHorizontal: Spacing.lg, paddingTop: Spacing.md, paddingBottom: Spacing.sm, backgroundColor: Colors.surface, borderBottomWidth: 0.5, borderBottomColor: Colors.border },
  heading:    { fontSize: 20, fontWeight: '700', color: Colors.text },
  sub:        { fontSize: 12, color: Colors.text3, marginTop: 2 },
  statsRow:   { flexDirection: 'row', gap: 8, padding: Spacing.lg },
  statBox:    { flex: 1, backgroundColor: Colors.bg, borderRadius: Radius.md, padding: Spacing.md, alignItems: 'center', borderWidth: 0.5, borderColor: Colors.border },
  statVal:    { fontSize: 20, fontWeight: '700', color: Colors.text },
  statLbl:    { fontSize: 11, color: Colors.text3, marginTop: 2 },
  chipRow:    { flexDirection: 'row', paddingHorizontal: Spacing.lg, gap: 8, marginBottom: Spacing.md },
  chip:       { paddingHorizontal: 12, paddingVertical: 6, borderRadius: Radius.full, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border },
  chipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  chipText:   { fontSize: 12, fontWeight: '500', color: Colors.text2 },
  chipTextActive: { color: '#fff' },
  taskTitle:  { fontSize: 14, fontWeight: '600', color: Colors.text, flex: 1, marginRight: 8 },
  earn:       { fontSize: 15, fontWeight: '700', color: Colors.primary },
  progressBg: { height: 5, backgroundColor: Colors.primaryLight, borderRadius: 3 },
  progressFill:{ height: 5, backgroundColor: Colors.primary, borderRadius: 3 },
  meta:       { fontSize: 12, color: Colors.text3 },
  note:       { fontSize: 12, marginTop: 6, lineHeight: 18 },
});
