import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useCurrency } from '../../context/CurrencyContext';
import { useLanguage } from '../../context/LanguageContext';
import { Card, Avatar, Row, EmptyState, StatCard } from '../../components/UI';
import { Colors, Spacing, Radius } from '../../utils/theme';
import api from '../../utils/api';

const LEVEL_COLORS = Colors.levels;
const TIER_COLORS  = { A: '#10B981', B: '#3B82F6', C: '#8B5CF6' };

function MemberCard({ u, tier, referredByName, t }) {
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
            {u.tasksCompleted} {t('tasks')} · <Text style={{ color: levelColor, fontWeight: '600', textTransform: 'uppercase' }}>{u.level}</Text>
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
  const { t, language, toggle } = useLanguage();
  const [data, setData]       = useState(null);
  const [leaders, setLeaders] = useState([]);
  const [tab, setTab]         = useState('tree');
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    try {
      const [statsRes, leadersRes] = await Promise.all([api.get('/team/stats'), api.get('/team/leaderboard')]);
      setData(statsRes.data);
      setLeaders(leadersRes.data.leaderboard);
    } catch (e) { console.error(e); }
    finally { setRefreshing(false); }
  };

  useEffect(() => { load(); }, []);

  if (!data) return <View style={styles.center}><Text style={{ color: Colors.text3 }}>{t('loading')}</Text></View>;

  const { summary, levelA, levelB, levelC } = data;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Row style={{ justifyContent: 'space-between', alignItems: 'center' }}>
          <View>
            <Text style={styles.heading}>{t('team')}</Text>
            <Text style={styles.sub}>{t('yourNetwork')}</Text>
          </View>
          <TouchableOpacity onPress={toggle} style={styles.langBtn}>
            <Text style={styles.langBtnText}>{language === 'en' ? 'አማ' : 'ENG'}</Text>
          </TouchableOpacity>
        </Row>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={Colors.primary} />}
        contentContainerStyle={{ padding: Spacing.lg, paddingBottom: 40 }}
      >
        {/* Team income card */}
        <View style={[styles.incomeCard, { backgroundColor: Colors.primary }]}>
          <Text style={styles.incomeLabel}>{t('teamIncomeToday')}</Text>
          <Text style={styles.incomeValue}>{fmt(summary.teamEarningsToday)}</Text>
          <Text style={styles.incomeSub}>{t('fromMembers').replace('{n}', summary.totalMembers)}</Text>
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          <StatCard label={t('totalMembers')} value={summary.totalMembers} />
          <StatCard label={t('active7d')} value={summary.activeMembers} />
          <StatCard label={t('direct')} value={summary.directReferrals} />
        </View>

        {/* Tier breakdown */}
        <View style={styles.tierRow}>
          {[
            { label: t('tierA'), count: summary.directReferrals, color: TIER_COLORS.A },
            { label: t('tierB'), count: summary.levelBCount,     color: TIER_COLORS.B },
            { label: t('tierC'), count: summary.levelCCount,     color: TIER_COLORS.C },
          ].map(tier => (
            <View key={tier.label} style={[styles.tierBox, { backgroundColor: tier.color + '18', borderColor: tier.color + '40' }]}>
              <Text style={[styles.tierCount, { color: tier.color }]}>{tier.count}</Text>
              <Text style={[styles.tierLabel, { color: tier.color }]}>{tier.label}</Text>
            </View>
          ))}
        </View>

        {/* Tabs */}
        <View style={styles.tabRow}>
          {[
            { key: 'tree',        label: t('teamTree') },
            { key: 'leaderboard', label: t('leaderboard') },
          ].map(tb => (
            <TouchableOpacity key={tb.key} style={[styles.tabBtn, tab === tb.key && styles.tabActive]} onPress={() => setTab(tb.key)}>
              <Text style={[styles.tabText, tab === tb.key && styles.tabTextActive]}>{tb.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Team tree */}
        {tab === 'tree' && (
          <>
            {levelA.length === 0 ? (
              <EmptyState icon="👥" title={t('noTeamYet')} subtitle={t('noTeamYetSub')}
                action={t('inviteFriends')} onAction={() => navigation.navigate('Invite')} />
            ) : (
              <>
                {levelA.length > 0 && (
                  <View>
                    <Text style={styles.tierHeader}>{t('tierADirect')} ({levelA.length})</Text>
                    {levelA.map(u => <MemberCard key={u._id} u={u} tier="A" t={t} />)}
                  </View>
                )}
                {levelB.length > 0 && (
                  <View>
                    <Text style={styles.tierHeader}>{t('tierBLevel2')} ({levelB.length})</Text>
                    {levelB.map(u => <MemberCard key={u._id} u={u} tier="B" referredByName={u.referredByName} t={t} />)}
                  </View>
                )}
                {levelC.length > 0 && (
                  <View>
                    <Text style={styles.tierHeader}>{t('tierCLevel3')} ({levelC.length})</Text>
                    {levelC.map(u => <MemberCard key={u._id} u={u} tier="C" referredByName={u.referredByName} t={t} />)}
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
              <EmptyState icon="🏆" title={t('noLeaderboard')} />
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
                        <Text style={styles.memberMeta}>{u.referralCount} {t('referrals')} · {u.tasksCompleted} {t('tasks')}</Text>
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
  langBtn:    { paddingHorizontal: 10, paddingVertical: 5, borderRadius: Radius.full, borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.bg },
  langBtnText:{ fontSize: 12, fontWeight: '700', color: Colors.text2 },
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
