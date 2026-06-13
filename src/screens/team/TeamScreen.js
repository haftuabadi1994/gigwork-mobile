import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useCurrency } from '../../context/CurrencyContext';
import { Card, Avatar, Row, EmptyState, StatCard } from '../../components/UI';
import { Colors, Spacing, Radius } from '../../utils/theme';
import api from '../../utils/api';

const LEVEL_COLORS = Colors.levels;
const TIER_COLORS  = { A: '#10B981', B: '#3B82F6', C: '#8B5CF6' };

function MemberCard({ u, tier, referredByName }) {
  const levelColor = LEVEL_COLORS[u.level] || Colors.text3;
  const sevenDaysAgo = new Date(Date.now() - 7 * 864e5);
  const isActive = u.lastActiveAt && new Date(u.lastActiveAt) > sevenDaysAgo;
  return (
    <Card style={{ marginBottom: 8 }}>
      <Row style={{ gap: 12 }}>
        <View style={{ position: 'relative' }}>
          <Avatar name={u.name} size={40} color={levelColor} />
          <View style={[styles.activeDot, { backgroundColor: isActive ? '#10B981' : Colors.border }]} />
        </View>
        <View style={{ flex: 1 }}>
          <Row style={{ gap: 8 }}>
            <Text style={styles.memberName}>{u.name}</Text>
            <View style={[styles.tierPill, { backgroundColor: TIER_COLORS[tier] + '22' }]}>
              <Text style={[styles.tierText, { color: TIER_COLORS[tier] }]}>T{tier}</Text>
            </View>
          </Row>
          <Text style={styles.memberMeta}>
            {u.tasksCompleted} tasks · <Text style={{ color: levelColor, fontWeight: '600', textTransform: 'uppercase' }}>{u.level}</Text>
            {referredByName ? ` · via ${referredByName}` : ''}
          </Text>
        </View>
        <Text style={styles.memberEarn}>{(u.totalEarnedETB || 0).toLocaleString()} ETB</Text>
      </Row>
    </Card>
  );
}

export default function TeamScreen({ navigation }) {
  const { fmt } = useCurrency();
  const [data, setData]       = useState(null);
  const [leaders, setLeaders] = useState([]);
  const [tab, setTab]         = useState('tree');
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    try {
      const [t, l] = await Promise.all([api.get('/team/stats'), api.get('/team/leaderboard')]);
      setData(t.data);
      setLeaders(l.data.leaderboard);
    } catch (e) { console.error(e); }
    finally { setRefreshing(false); }
  };

  useEffect(() => { load(); }, []);

  if (!data) return <View style={styles.center}><Text style={{ color: Colors.text3 }}>Loading…</Text></View>;

  const { summary, levelA, levelB, levelC } = data;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.heading}>My team</Text>
        <Text style={styles.sub}>Your network overview</Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={Colors.primary} />}
        contentContainerStyle={{ padding: Spacing.lg, paddingBottom: 40 }}
      >
        {/* Team income card */}
        <View style={[styles.incomeCard, { backgroundColor: Colors.primary }]}>
          <Text style={styles.incomeLabel}>Team income today</Text>
          <Text style={styles.incomeValue}>{fmt(summary.teamEarningsToday)}</Text>
          <Text style={styles.incomeSub}>From {summary.totalMembers} members</Text>
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          <StatCard label="Total" value={summary.totalMembers} />
          <StatCard label="Active (7d)" value={summary.activeMembers} />
          <StatCard label="Direct" value={summary.directReferrals} />
        </View>

        {/* Tier breakdown */}
        <View style={styles.tierRow}>
          {[
            { label: 'Tier A', count: summary.directReferrals, color: TIER_COLORS.A },
            { label: 'Tier B', count: summary.levelBCount,     color: TIER_COLORS.B },
            { label: 'Tier C', count: summary.levelCCount,     color: TIER_COLORS.C },
          ].map(t => (
            <View key={t.label} style={[styles.tierBox, { backgroundColor: t.color + '18', borderColor: t.color + '40' }]}>
              <Text style={[styles.tierCount, { color: t.color }]}>{t.count}</Text>
              <Text style={[styles.tierLabel, { color: t.color }]}>{t.label}</Text>
            </View>
          ))}
        </View>

        {/* Tabs */}
        <View style={styles.tabRow}>
          {[
            { key: 'tree',        label: '🌳 Team tree' },
            { key: 'leaderboard', label: '🏆 Leaderboard' },
          ].map(t => (
            <TouchableOpacity key={t.key} style={[styles.tabBtn, tab === t.key && styles.tabActive]} onPress={() => setTab(t.key)}>
              <Text style={[styles.tabText, tab === t.key && styles.tabTextActive]}>{t.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Team tree */}
        {tab === 'tree' && (
          <>
            {levelA.length === 0 ? (
              <EmptyState icon="👥" title="No team members yet" subtitle="Share your referral code to grow your team"
                action="Invite friends" onAction={() => navigation.navigate('Invite')} />
            ) : (
              <>
                {levelA.length > 0 && (
                  <View>
                    <Text style={styles.tierHeader}>Tier A — Direct ({levelA.length})</Text>
                    {levelA.map(u => <MemberCard key={u._id} u={u} tier="A" />)}
                  </View>
                )}
                {levelB.length > 0 && (
                  <View>
                    <Text style={styles.tierHeader}>Tier B — Level 2 ({levelB.length})</Text>
                    {levelB.map(u => <MemberCard key={u._id} u={u} tier="B" referredByName={u.referredByName} />)}
                  </View>
                )}
                {levelC.length > 0 && (
                  <View>
                    <Text style={styles.tierHeader}>Tier C — Level 3 ({levelC.length})</Text>
                    {levelC.map(u => <MemberCard key={u._id} u={u} tier="C" referredByName={u.referredByName} />)}
                  </View>
                )}
              </>
            )}
          </>
        )}

        {/* Leaderboard */}
        {tab === 'leaderboard' && (
          <>
            {leaders.length === 0 ? (
              <EmptyState icon="🏆" title="No leaderboard data yet" />
            ) : (
              leaders.map((u, i) => {
                const levelColor = LEVEL_COLORS[u.level] || Colors.text3;
                return (
                  <Card key={u._id} style={{ marginBottom: 8 }}>
                    <Row style={{ gap: 12 }}>
                      <Text style={[styles.rank, { color: i < 3 ? '#D97706' : Colors.text3 }]}>#{i + 1}</Text>
                      <Avatar name={u.name} size={38} color={levelColor} />
                      <View style={{ flex: 1 }}>
                        <Text style={styles.memberName}>{u.name}</Text>
                        <Text style={styles.memberMeta}>{u.referralCount} referrals · {u.tasksCompleted} tasks</Text>
                      </View>
                      <Text style={styles.memberEarn}>{fmt(u.totalEarnedETB)}</Text>
                    </Row>
                  </Card>
                );
              })
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:       { flex: 1, backgroundColor: Colors.bg },
  center:     { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header:     { paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md, backgroundColor: Colors.surface, borderBottomWidth: 0.5, borderBottomColor: Colors.border },
  heading:    { fontSize: 20, fontWeight: '700', color: Colors.text },
  sub:        { fontSize: 12, color: Colors.text3, marginTop: 2 },
  incomeCard: { borderRadius: Radius.xl, padding: Spacing.xl, alignItems: 'center', marginBottom: Spacing.md },
  incomeLabel:{ fontSize: 12, color: 'rgba(255,255,255,0.75)', marginBottom: 4 },
  incomeValue:{ fontSize: 30, fontWeight: '700', color: '#fff' },
  incomeSub:  { fontSize: 12, color: 'rgba(255,255,255,0.65)', marginTop: 4 },
  statsRow:   { flexDirection: 'row', gap: 10, marginBottom: Spacing.md },
  tierRow:    { flexDirection: 'row', gap: 10, marginBottom: Spacing.md },
  tierBox:    { flex: 1, borderWidth: 1.5, borderRadius: Radius.md, padding: Spacing.md, alignItems: 'center' },
  tierCount:  { fontSize: 22, fontWeight: '700' },
  tierLabel:  { fontSize: 11, fontWeight: '600', marginTop: 2 },
  tabRow:     { flexDirection: 'row', gap: 8, marginBottom: Spacing.md },
  tabBtn:     { flex: 1, paddingVertical: 10, borderRadius: Radius.md, backgroundColor: Colors.surface, alignItems: 'center', borderWidth: 1, borderColor: Colors.border },
  tabActive:  { backgroundColor: Colors.primary, borderColor: Colors.primary },
  tabText:    { fontSize: 13, fontWeight: '500', color: Colors.text2 },
  tabTextActive: { color: '#fff' },
  tierHeader: { fontSize: 13, fontWeight: '600', color: Colors.text2, marginBottom: 10, marginTop: 8 },
  activeDot:  { position: 'absolute', bottom: 1, right: 1, width: 10, height: 10, borderRadius: 5, borderWidth: 1.5, borderColor: Colors.surface },
  memberName: { fontSize: 14, fontWeight: '600', color: Colors.text },
  memberMeta: { fontSize: 12, color: Colors.text3, marginTop: 2 },
  memberEarn: { fontSize: 13, fontWeight: '700', color: Colors.primary },
  tierPill:   { borderRadius: Radius.full, paddingHorizontal: 7, paddingVertical: 2 },
  tierText:   { fontSize: 10, fontWeight: '700' },
  rank:       { fontSize: 16, fontWeight: '700', width: 28, textAlign: 'center' },
});
