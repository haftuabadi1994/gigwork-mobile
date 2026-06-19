import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import { useCurrency } from '../../context/CurrencyContext';
import { useLanguage } from '../../context/LanguageContext';
import { Card, Badge, Avatar, EmptyState, Row } from '../../components/UI';
import { Colors, Spacing, Radius } from '../../utils/theme';
import api from '../../utils/api';

const CATEGORIES = ['All','Video Rating','Writing','Data Entry','Survey','Delivery','Translation','Social Engagement'];
const BADGE_COLORS = { 'Video Rating':'green','Writing':'blue','Data Entry':'gray','Survey':'amber','Delivery':'green','Translation':'blue','Social Engagement':'amber','Content Creation':'blue' };
const LEVEL_COLORS = Colors.levels;

function TaskCard({ task, onPress, fmt, t }) {
  const badgeColor = BADGE_COLORS[task.category] || 'gray';
  return (
    <Card onPress={onPress} style={{ marginHorizontal: Spacing.lg, marginBottom: Spacing.sm }}>
      {task.trailerVideoUrl && (
        <View style={styles.videoTag}>
          <Text style={styles.videoTagText}>🎬 {task.trailerPlatform?.toUpperCase() || 'VIDEO'}</Text>
        </View>
      )}
      <Row style={{ justifyContent: 'space-between', marginBottom: 8 }}>
        <Badge label={task.category} color={badgeColor} />
        <Text style={styles.earn}>{fmt(task.earningETB)}</Text>
      </Row>
      <Text style={styles.taskTitle}>{task.title}</Text>
      <Text style={styles.taskDesc} numberOfLines={2}>{task.description}</Text>
      {task.workDepositETB > 0 && (
        <Text style={styles.deposit}>🔒 {t('workDeposit')}: {fmt(task.workDepositETB)} ({t('refundable')})</Text>
      )}
      <Row style={{ justifyContent: 'space-between', marginTop: 10 }}>
        <Text style={styles.taskMeta}>⏱ ~{task.estimatedMinutes} {t('estTime')}</Text>
        <Badge
          label={task.myAssignment ? task.myAssignment.status.replace('_', ' ') : 'Available'}
          color={task.myAssignment ? 'green' : 'gray'}
        />
      </Row>
    </Card>
  );
}

export default function HomeScreen({ navigation }) {
  const { user } = useAuth();
  const { fmt, currency, setCurrency } = useCurrency();
  const { t, language, toggle } = useLanguage();

  const [tasks, setTasks]           = useState([]);
  const [income, setIncome]         = useState(null);
  const [unread, setUnread]         = useState(0);
  const [category, setCategory]     = useState('All');
  const [loading, setLoading]       = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [announcement, setAnnouncement] = useState('');

  const load = useCallback(async (cat = category) => {
    try {
      const params = cat !== 'All' ? { category: cat } : {};
      const [t2, inc, notif] = await Promise.all([
        api.get('/tasks', { params }),
        api.get('/income/summary').catch(() => ({ data: null })),
        api.get('/notifications', { params: { limit: 1 } }).catch(() => ({ data: { unreadCount: 0 } })),
      ]);
      setTasks(t2.data.tasks);
      if (inc.data) setIncome(inc.data);
      setUnread(notif.data.unreadCount || 0);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [category]);

  useEffect(() => { load(); }, [category]);

  const onRefresh = () => { setRefreshing(true); load(); };

  const levelColor = typeof LEVEL_COLORS[user?.level || 'intern'] === 'object'
    ? LEVEL_COLORS[user?.level || 'intern'].color
    : LEVEL_COLORS[user?.level || 'intern'] || Colors.primary;

  const todayIncome = income?.todayIncome || 0;

  const QUICK_LINKS = [
    { icon: '💰', label: language === 'am' ? 'ገቢ'    : 'Income',   screen: 'Income' },
    { icon: '👥', label: language === 'am' ? 'ቡድን'   : 'Team',     screen: 'Team' },
    { icon: '📖', label: language === 'am' ? 'መምሪያ'  : 'Handbook', screen: 'Handbook' },
    { icon: '📥', label: language === 'am' ? 'ተቀማጭ' : 'Deposit',  screen: 'Deposit' },
  ];

  const ListHeader = () => (
    <View>
      {!!announcement && (
        <View style={styles.announceBanner}>
          <Text style={styles.announceText}>📢 {announcement}</Text>
        </View>
      )}

      {/* Income card */}
      <TouchableOpacity
        style={[styles.incomeCard, { backgroundColor: Colors.primary }]}
        onPress={() => navigation.navigate('Income')}
        activeOpacity={0.9}
      >
        <View>
          <Text style={styles.incomeLabel}>{t('todayIncome')}</Text>
          <Text style={styles.incomeValue}>{fmt(todayIncome)}</Text>
          <Text style={styles.incomeHint}>
            {t('recommended')}: {fmt(income?.recommendedDailyIncome || 0)}/day →
          </Text>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={styles.incomeLabel}>{t('balance')}</Text>
          <Text style={styles.incomeBalance}>{fmt(user?.incomeWalletETB || 0)}</Text>
          <TouchableOpacity
            onPress={() => setCurrency(currency === 'ETB' ? 'USD' : 'ETB')}
            style={styles.curToggle}
          >
            <Text style={styles.curToggleText}>
              {currency === 'ETB' ? t('showUSD') : t('showETB')}
            </Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>

      {/* Quick links */}
      <View style={styles.quickLinks}>
        {QUICK_LINKS.map(q => (
          <TouchableOpacity
            key={q.screen}
            style={styles.quickBtn}
            onPress={() => navigation.navigate(q.screen)}
            activeOpacity={0.8}
          >
            <Text style={styles.quickIcon}>{q.icon}</Text>
            <Text style={styles.quickLabel}>{q.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Category chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.chipScroll}
        contentContainerStyle={{ paddingHorizontal: Spacing.lg, gap: 8 }}
      >
        {CATEGORIES.map(c => (
          <TouchableOpacity
            key={c}
            style={[styles.chip, category === c && styles.chipActive]}
            onPress={() => setCategory(c)}
          >
            <Text style={[styles.chipText, category === c && styles.chipTextActive]}>{c}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <View style={styles.taskHeader}>
        <Text style={styles.taskHeaderText}>{t('availableTasks')}</Text>
        <Text style={styles.taskCount}>{tasks.length} {t('found')}</Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Top bar */}
      <View style={styles.topBar}>
        <View>
          <Text style={styles.greeting}>
            {t('greeting')}, {user?.name?.split(' ')[0]} 👋
          </Text>
          <Text style={styles.levelText}>
            <Text style={{ color: levelColor, fontWeight: '700' }}>
              {(user?.level || 'intern').toUpperCase()}
            </Text>
            {income?.rule ? `  ·  ${income.rule.taskCountPerDay} ${t('tasksPerDay')}` : ''}
          </Text>
        </View>
        <Row style={{ gap: 12 }}>

          {/* Language toggle */}
          <TouchableOpacity onPress={toggle} style={styles.langBtn}>
            <Text style={styles.langBtnText}>
              {language === 'en' ? 'አማ' : 'ENG'}
            </Text>
          </TouchableOpacity>

          {/* Notifications */}
          <TouchableOpacity onPress={() => navigation.navigate('Notifications')} style={styles.bellWrap}>
            <Text style={{ fontSize: 22 }}>🔔</Text>
            {unread > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{unread > 9 ? '9+' : unread}</Text>
              </View>
            )}
          </TouchableOpacity>

          {/* Avatar */}
          <TouchableOpacity onPress={() => navigation.navigate('Profile')}>
            <Avatar name={user?.name} size={36} color={Colors.primary} />
          </TouchableOpacity>
        </Row>
      </View>

      <FlatList
        data={tasks}
        keyExtractor={item => item._id}
        renderItem={({ item }) => (
          <TaskCard
            task={item}
            fmt={fmt}
            t={t}
            onPress={() => navigation.navigate('TaskDetail', { taskId: item._id })}
          />
        )}
        ListHeaderComponent={ListHeader}
        ListEmptyComponent={
          !loading && (
            <EmptyState
              icon="📋"
              title={t('noTasks')}
              subtitle={t('noTasksSub')}
            />
          )
        }
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />
        }
        contentContainerStyle={{ paddingBottom: 24 }}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:            { flex: 1, backgroundColor: Colors.bg },
  topBar:          { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md, backgroundColor: Colors.surface, borderBottomWidth: 0.5, borderBottomColor: Colors.border },
  greeting:        { fontSize: 17, fontWeight: '600', color: Colors.text },
  levelText:       { fontSize: 12, color: Colors.text3, marginTop: 2 },
  langBtn:         { paddingHorizontal: 8, paddingVertical: 4, borderRadius: Radius.full, borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.surface },
  langBtnText:     { fontSize: 12, fontWeight: '700', color: Colors.text },
  bellWrap:        { position: 'relative' },
  badge:           { position: 'absolute', top: -4, right: -4, backgroundColor: Colors.red, borderRadius: 10, minWidth: 16, height: 16, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4 },
  badgeText:       { fontSize: 9, color: '#fff', fontWeight: '700' },
  announceBanner:  { margin: Spacing.lg, marginBottom: 0, backgroundColor: Colors.amberLight, borderRadius: Radius.md, padding: Spacing.md },
  announceText:    { fontSize: 13, color: '#854F0B' },
  incomeCard:      { margin: Spacing.lg, borderRadius: Radius.xl, padding: Spacing.lg, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  incomeLabel:     { fontSize: 11, color: 'rgba(255,255,255,0.75)', marginBottom: 4 },
  incomeValue:     { fontSize: 28, fontWeight: '700', color: '#fff' },
  incomeHint:      { fontSize: 11, color: 'rgba(255,255,255,0.65)', marginTop: 3 },
  incomeBalance:   { fontSize: 18, fontWeight: '700', color: '#fff' },
  curToggle:       { marginTop: 4, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  curToggleText:   { fontSize: 10, color: '#fff', fontWeight: '600' },
  quickLinks:      { flexDirection: 'row', paddingHorizontal: Spacing.lg, gap: 8, marginBottom: Spacing.md },
  quickBtn:        { flex: 1, backgroundColor: Colors.surface, borderRadius: Radius.md, padding: Spacing.md, alignItems: 'center', borderWidth: 0.5, borderColor: Colors.border },
  quickIcon:       { fontSize: 22, marginBottom: 4 },
  quickLabel:      { fontSize: 11, fontWeight: '600', color: Colors.text2 },
  chipScroll:      { marginBottom: Spacing.md },
  chip:            { paddingHorizontal: 14, paddingVertical: 7, borderRadius: Radius.full, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border },
  chipActive:      { backgroundColor: Colors.primary, borderColor: Colors.primary },
  chipText:        { fontSize: 13, fontWeight: '500', color: Colors.text2 },
  chipTextActive:  { color: '#fff' },
  taskHeader:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: Spacing.lg, marginBottom: Spacing.sm },
  taskHeaderText:  { fontSize: 15, fontWeight: '600', color: Colors.text },
  taskCount:       { fontSize: 13, color: Colors.text3 },
  videoTag:        { backgroundColor: '#000', alignSelf: 'flex-start', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 2, marginBottom: 8 },
  videoTagText:    { fontSize: 10, color: '#fff', fontWeight: '600' },
  earn:            { fontSize: 17, fontWeight: '700', color: Colors.primary },
  taskTitle:       { fontSize: 15, fontWeight: '600', color: Colors.text, marginBottom: 5 },
  taskDesc:        { fontSize: 13, color: Colors.text2, lineHeight: 20 },
  deposit:         { fontSize: 11, color: Colors.amber, marginTop: 6, fontWeight: '500' },
  taskMeta:        { fontSize: 12, color: Colors.text3 },
});