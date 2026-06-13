// RecordsScreen.js
import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useCurrency } from '../../context/CurrencyContext';
import { Card, Row, Badge } from '../../components/UI';
import { Colors, Spacing, Radius } from '../../utils/theme';
import api from '../../utils/api';

const TX_ICONS = {
  task_earning:   '✅', referral_bonus: '🤝', withdrawal: '↑', adjustment: '⚙️',
};
const TX_COLORS = {
  task_earning: Colors.primaryLight, referral_bonus: '#F5F3FF', withdrawal: Colors.blueLight, adjustment: '#F1EFE8',
};

export default function RecordsScreen() {
  const { fmt } = useCurrency();
  const [tab, setTab]   = useState('transactions');
  const [txs, setTxs]   = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [typeFilter, setTypeFilter]   = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  const loadTxs = useCallback(async () => {
    try {
      const r = await api.get('/wallet/transactions', { params: { page, limit: 20, type: typeFilter } });
      setTxs(r.data.transactions);
      setTotal(r.data.total);
    } catch (e) { console.error(e); }
    finally { setRefreshing(false); }
  }, [page, typeFilter]);

  const loadTasks = useCallback(async () => {
    try {
      const r = await api.get('/tasks/my');
      setAssignments(r.data.assignments);
    } catch (e) { console.error(e); }
    finally { setRefreshing(false); }
  }, []);

  useEffect(() => { if (tab === 'transactions') loadTxs(); else loadTasks(); }, [tab, loadTxs, loadTasks]);

  const STATUS_COLORS = { accepted: 'gray', in_progress: 'amber', submitted: 'blue', completed: 'green', rejected: 'red' };

  const renderTx = ({ item: tx }) => (
    <Row style={styles.txRow}>
      <View style={[styles.txIcon, { backgroundColor: TX_COLORS[tx.type] || '#F1EFE8' }]}>
        <Text style={{ fontSize: 16 }}>{TX_ICONS[tx.type] || '⚙️'}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.txDesc} numberOfLines={1}>{tx.description}</Text>
        <Text style={styles.txDate}>{new Date(tx.createdAt).toLocaleDateString('en-ET', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</Text>
      </View>
      <Text style={[styles.txAmount, { color: tx.amountETB > 0 ? Colors.primary : Colors.red }]}>
        {tx.amountETB > 0 ? '+' : ''}{fmt(tx.amountETB)}
      </Text>
    </Row>
  );

  const renderAssignment = ({ item: a }) => (
    <Card style={{ marginBottom: 8 }}>
      <Row style={{ justifyContent: 'space-between', marginBottom: 8 }}>
        <Text style={styles.taskTitle} numberOfLines={1}>{a.task?.title}</Text>
        <Text style={{ fontSize: 14, fontWeight: '700', color: Colors.primary }}>{fmt(a.task?.earningETB || 0)}</Text>
      </Row>
      <View style={styles.progressBg}><View style={[styles.progressFill, { width: `${a.progress}%` }]} /></View>
      <Row style={{ justifyContent: 'space-between', marginTop: 8 }}>
        <Text style={{ fontSize: 12, color: Colors.text3 }}>{new Date(a.createdAt).toLocaleDateString()}</Text>
        <Badge label={a.status.replace('_', ' ')} color={STATUS_COLORS[a.status] || 'gray'} />
      </Row>
      {a.reviewNote && <Text style={{ fontSize: 12, color: a.status === 'rejected' ? Colors.red : Colors.primary, marginTop: 6 }}>{a.reviewNote}</Text>}
    </Card>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.bg }} edges={['bottom']}>
      <View style={styles.tabRow}>
        {[{ key:'transactions', label:'💳 Transactions' }, { key:'tasks', label:'📋 Task log' }].map(t => (
          <TouchableOpacity key={t.key} style={[styles.tabBtn, tab === t.key && styles.tabActive]} onPress={() => setTab(t.key)}>
            <Text style={[styles.tabText, tab === t.key && styles.tabTextActive]}>{t.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {tab === 'transactions' && (
        <>
          <View style={styles.filterRow}>
            {[{ v:'', l:'All' },{ v:'task_earning', l:'Earnings' },{ v:'referral_bonus', l:'Referral' },{ v:'withdrawal', l:'Withdrawal' }].map(f => (
              <TouchableOpacity key={f.v} style={[styles.chip, typeFilter === f.v && styles.chipActive]} onPress={() => { setTypeFilter(f.v); setPage(1); }}>
                <Text style={[styles.chipText, typeFilter === f.v && styles.chipTextActive]}>{f.l}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <FlatList
            data={txs} keyExtractor={t => t._id} renderItem={renderTx}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadTxs(); }} tintColor={Colors.primary} />}
            contentContainerStyle={{ paddingHorizontal: Spacing.lg, paddingBottom: 32 }}
            ListEmptyComponent={<Text style={styles.empty}>No transactions found</Text>}
            showsVerticalScrollIndicator={false}
          />
        </>
      )}

      {tab === 'tasks' && (
        <FlatList
          data={assignments} keyExtractor={a => a._id} renderItem={renderAssignment}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadTasks(); }} tintColor={Colors.primary} />}
          contentContainerStyle={{ padding: Spacing.lg, paddingBottom: 32 }}
          ListEmptyComponent={<Text style={styles.empty}>No task records yet</Text>}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  tabRow:      { flexDirection: 'row', padding: Spacing.md, gap: 8, backgroundColor: Colors.surface, borderBottomWidth: 0.5, borderBottomColor: Colors.border },
  tabBtn:      { flex: 1, paddingVertical: 9, borderRadius: Radius.md, backgroundColor: Colors.bg, alignItems: 'center', borderWidth: 1, borderColor: Colors.border },
  tabActive:   { backgroundColor: Colors.primary, borderColor: Colors.primary },
  tabText:     { fontSize: 13, fontWeight: '600', color: Colors.text2 },
  tabTextActive:{ color: '#fff' },
  filterRow:   { flexDirection: 'row', paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm, gap: 8 },
  chip:        { paddingHorizontal: 12, paddingVertical: 6, borderRadius: Radius.full, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border },
  chipActive:  { backgroundColor: Colors.primary, borderColor: Colors.primary },
  chipText:    { fontSize: 12, color: Colors.text2 },
  chipTextActive:{ color: '#fff' },
  txRow:       { paddingVertical: 13, borderBottomWidth: 0.5, borderBottomColor: Colors.border, gap: 12 },
  txIcon:      { width: 40, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  txDesc:      { fontSize: 13, fontWeight: '500', color: Colors.text },
  txDate:      { fontSize: 11, color: Colors.text3, marginTop: 2 },
  txAmount:    { fontSize: 14, fontWeight: '700', flexShrink: 0 },
  taskTitle:   { fontSize: 14, fontWeight: '600', color: Colors.text, flex: 1, marginRight: 8 },
  progressBg:  { height: 5, backgroundColor: Colors.primaryLight, borderRadius: 3 },
  progressFill:{ height: 5, backgroundColor: Colors.primary, borderRadius: 3 },
  empty:       { textAlign: 'center', color: Colors.text3, padding: 40, fontSize: 14 },
});
