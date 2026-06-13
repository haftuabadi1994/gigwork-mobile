import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Spacing, Radius } from '../../utils/theme';
import { Row } from '../../components/UI';
import api from '../../utils/api';

const TYPE_CONFIG = {
  task_assigned:      { icon: '📋', bg: '#EFF6FF', color: '#1E40AF' },
  task_completed:     { icon: '✅', bg: Colors.primaryLight, color: Colors.primaryDark },
  task_rejected:      { icon: '❌', bg: Colors.redLight, color: '#A32D2D' },
  task_deadline:      { icon: '⏰', bg: Colors.amberLight, color: '#854F0B' },
  income_update:      { icon: '💰', bg: Colors.primaryLight, color: Colors.primaryDark },
  withdrawal_processed:{ icon: '↑', bg: Colors.blueLight, color: '#185FA5' },
  deposit_approved:   { icon: '↓', bg: Colors.primaryLight, color: Colors.primaryDark },
  deposit_rejected:   { icon: '⚠️', bg: Colors.redLight, color: '#A32D2D' },
  referral_joined:    { icon: '🤝', bg: '#F5F3FF', color: '#5B21B6' },
  referral_earned:    { icon: '🎁', bg: Colors.amberLight, color: '#854F0B' },
  team_activity:      { icon: '👥', bg: '#F0F9FF', color: '#0369A1' },
  level_upgrade:      { icon: '⬆️', bg: Colors.primaryLight, color: Colors.primaryDark },
  recharge_confirmed: { icon: '🔋', bg: '#EEF2FF', color: '#4338CA' },
  system:             { icon: '🔔', bg: '#F9FAFB', color: Colors.text2 },
};

const relTime = (d) => {
  const diff = Date.now() - new Date(d).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'Just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
};

export default function NotificationsScreen() {
  const [notifs, setNotifs]     = useState([]);
  const [unread, setUnread]     = useState(0);
  const [filter, setFilter]     = useState('all');
  const [loading, setLoading]   = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const r = await api.get('/notifications', { params: { limit: 50 } });
      setNotifs(r.data.notifications);
      setUnread(r.data.unreadCount);
    } catch (e) { console.error(e); }
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { load(); }, []);

  const markAllRead = async () => {
    await api.patch('/notifications/read-all');
    setNotifs(prev => prev.map(n => ({ ...n, isRead: true })));
    setUnread(0);
  };

  const markRead = async (id) => {
    await api.patch(`/notifications/${id}/read`);
    setNotifs(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
    setUnread(prev => Math.max(0, prev - 1));
  };

  const clearAll = () => {
    Alert.alert('Clear notifications', 'Delete all notifications?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Clear all', style: 'destructive', onPress: async () => {
          await api.delete('/notifications');
          setNotifs([]); setUnread(0);
        }
      }
    ]);
  };

  const filtered = filter === 'unread' ? notifs.filter(n => !n.isRead) : notifs;

  const renderItem = ({ item: n }) => {
    const cfg = TYPE_CONFIG[n.type] || TYPE_CONFIG.system;
    return (
      <TouchableOpacity
        activeOpacity={n.isRead ? 1 : 0.7}
        onPress={() => !n.isRead && markRead(n._id)}
        style={[styles.item, !n.isRead && styles.itemUnread]}
      >
        <View style={[styles.iconBox, { backgroundColor: cfg.bg }]}>
          <Text style={{ fontSize: 20 }}>{cfg.icon}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Row style={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <Text style={[styles.title, !n.isRead && { fontWeight: '700' }]} numberOfLines={1}>{n.title}</Text>
            {!n.isRead && <View style={styles.dot} />}
          </Row>
          <Text style={styles.body} numberOfLines={2}>{n.body}</Text>
          <Text style={styles.time}>{relTime(n.createdAt)}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.heading}>
            Notifications {unread > 0 && <Text style={styles.unreadCount}>({unread})</Text>}
          </Text>
        </View>
        <Row style={{ gap: 12 }}>
          {unread > 0 && (
            <TouchableOpacity onPress={markAllRead}>
              <Text style={styles.action}>Read all</Text>
            </TouchableOpacity>
          )}
          {notifs.length > 0 && (
            <TouchableOpacity onPress={clearAll}>
              <Text style={[styles.action, { color: Colors.red }]}>Clear</Text>
            </TouchableOpacity>
          )}
        </Row>
      </View>

      {/* Filter */}
      <View style={styles.filterRow}>
        {['all', 'unread'].map(f => (
          <TouchableOpacity key={f} style={[styles.chip, filter === f && styles.chipActive]} onPress={() => setFilter(f)}>
            <Text style={[styles.chipText, filter === f && styles.chipTextActive]}>
              {f === 'all' ? 'All' : `Unread (${unread})`}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={filtered}
        keyExtractor={n => n._id}
        renderItem={renderItem}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={Colors.primary} />}
        ListEmptyComponent={
          !loading && (
            <View style={styles.empty}>
              <Text style={styles.emptyIcon}>🔔</Text>
              <Text style={styles.emptyText}>No {filter === 'unread' ? 'unread ' : ''}notifications</Text>
            </View>
          )
        }
        contentContainerStyle={{ paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:       { flex: 1, backgroundColor: Colors.bg },
  header:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md, backgroundColor: Colors.surface, borderBottomWidth: 0.5, borderBottomColor: Colors.border },
  heading:    { fontSize: 20, fontWeight: '700', color: Colors.text },
  unreadCount:{ color: Colors.primary },
  action:     { fontSize: 14, color: Colors.primary, fontWeight: '600' },
  filterRow:  { flexDirection: 'row', padding: Spacing.md, paddingHorizontal: Spacing.lg, gap: 8 },
  chip:       { paddingHorizontal: 14, paddingVertical: 7, borderRadius: Radius.full, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border },
  chipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  chipText:   { fontSize: 13, fontWeight: '500', color: Colors.text2 },
  chipTextActive: { color: '#fff' },
  item:       { flexDirection: 'row', gap: 12, paddingHorizontal: Spacing.lg, paddingVertical: 14, borderBottomWidth: 0.5, borderBottomColor: Colors.border },
  itemUnread: { backgroundColor: Colors.primaryLight + '60' },
  iconBox:    { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  title:      { fontSize: 14, fontWeight: '500', color: Colors.text, flex: 1 },
  body:       { fontSize: 13, color: Colors.text2, marginTop: 3, lineHeight: 19 },
  time:       { fontSize: 11, color: Colors.text3, marginTop: 4 },
  dot:        { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.primary, marginTop: 3, flexShrink: 0 },
  empty:      { alignItems: 'center', padding: 60 },
  emptyIcon:  { fontSize: 48, marginBottom: 12 },
  emptyText:  { fontSize: 16, color: Colors.text3 },
});
