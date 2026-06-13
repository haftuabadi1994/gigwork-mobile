import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card, Row } from '../../components/UI';
import { Colors, Spacing, Radius } from '../../utils/theme';
import api from '../../utils/api';

const LEVEL_COLORS = Colors.levels;

export default function HandbookScreen() {
  const [sections, setSections] = useState([]);
  const [rules, setRules]       = useState([]);
  const [tab, setTab]           = useState('guide');
  const [active, setActive]     = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    try {
      const r = await api.get('/handbook');
      setSections(r.data.sections);
      setRules(r.data.levelRules);
      if (r.data.sections.length > 0) setActive(r.data.sections[0]._id);
    } catch (e) { console.error(e); }
    finally { setRefreshing(false); }
  };

  useEffect(() => { load(); }, []);

  const activeSection = sections.find(s => s._id === active);

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      {/* Tabs */}
      <View style={styles.tabRow}>
        {[{ key:'guide', label:'📖 Guide' }, { key:'levels', label:'📊 Level rules' }].map(t => (
          <TouchableOpacity key={t.key} style={[styles.tabBtn, tab === t.key && styles.tabActive]} onPress={() => setTab(t.key)}>
            <Text style={[styles.tabText, tab === t.key && styles.tabTextActive]}>{t.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={Colors.primary} />}
        contentContainerStyle={{ padding: Spacing.lg, paddingBottom: 40 }}
      >
        {/* Guide */}
        {tab === 'guide' && (
          <>
            {sections.map(s => (
              <TouchableOpacity key={s._id} activeOpacity={0.8}
                style={[styles.sectionBtn, active === s._id && styles.sectionBtnActive]}
                onPress={() => setActive(active === s._id ? null : s._id)}>
                <Text style={[styles.sectionBtnText, active === s._id && styles.sectionBtnTextActive]}>{s.title}</Text>
                <Text style={{ color: active === s._id ? Colors.primary : Colors.text3, fontSize: 18 }}>
                  {active === s._id ? '↑' : '↓'}
                </Text>
              </TouchableOpacity>
            ))}
            {activeSection && (
              <Card style={{ marginTop: Spacing.sm }}>
                <Text style={styles.sectionTitle}>{activeSection.title}</Text>
                <Text style={styles.sectionContent}>{activeSection.content}</Text>
              </Card>
            )}
          </>
        )}

        {/* Level rules */}
        {tab === 'levels' && (
          <>
            <Card style={{ backgroundColor: Colors.primaryLight, borderWidth: 0, marginBottom: Spacing.md }}>
              <Text style={{ fontSize: 13, color: Colors.primaryDark, lineHeight: 20 }}>
                📈 Higher levels unlock more tasks per day and better rewards. Deposit the required amount to upgrade your level.
              </Text>
            </Card>
            {rules.map(r => (
              <View key={r.level} style={[styles.ruleCard, { borderColor: (LEVEL_COLORS[r.level] || Colors.primary) + '40' }]}>
                <View style={[styles.ruleHeader, { backgroundColor: LEVEL_COLORS[r.level] || Colors.primary }]}>
                  <View>
                    <Text style={styles.ruleLevel}>{r.level.toUpperCase()}</Text>
                    <Text style={styles.ruleLabel}>{r.label}</Text>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={styles.ruleEarnVal}>{r.rewardPerTaskETB} ETB</Text>
                    <Text style={styles.ruleEarnSub}>per task</Text>
                  </View>
                </View>
                <View style={styles.ruleBody}>
                  {[
                    ['Deposit required', r.depositRequiredETB > 0 ? `${r.depositRequiredETB.toLocaleString()} ETB` : 'Free'],
                    ['Tasks per day',    r.taskCountPerDay],
                    ['Daily max',        `${(r.taskCountPerDay * r.rewardPerTaskETB).toLocaleString()} ETB`],
                    ['Referral %',       `${r.referralCommission}%`],
                    ['Team bonus',       `${r.teamBonusPercent}%`],
                    ['Tasks to advance', r.minTasksToAdvance],
                  ].map(([lbl, val]) => (
                    <View key={lbl} style={styles.ruleRow}>
                      <Text style={styles.ruleRowLabel}>{lbl}</Text>
                      <Text style={styles.ruleRowValue}>{val}</Text>
                    </View>
                  ))}
                </View>
              </View>
            ))}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:       { flex: 1, backgroundColor: Colors.bg },
  tabRow:     { flexDirection: 'row', padding: Spacing.md, gap: 8, backgroundColor: Colors.surface, borderBottomWidth: 0.5, borderBottomColor: Colors.border },
  tabBtn:     { flex: 1, paddingVertical: 9, borderRadius: Radius.md, backgroundColor: Colors.bg, alignItems: 'center', borderWidth: 1, borderColor: Colors.border },
  tabActive:  { backgroundColor: Colors.primary, borderColor: Colors.primary },
  tabText:    { fontSize: 13, fontWeight: '600', color: Colors.text2 },
  tabTextActive: { color: '#fff' },
  sectionBtn: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: Colors.surface, borderRadius: Radius.md, padding: Spacing.md, marginBottom: 8, borderWidth: 1, borderColor: Colors.border },
  sectionBtnActive: { borderColor: Colors.primary, backgroundColor: Colors.primaryLight },
  sectionBtnText:   { fontSize: 14, fontWeight: '500', color: Colors.text, flex: 1 },
  sectionBtnTextActive: { color: Colors.primaryDark, fontWeight: '600' },
  sectionTitle:  { fontSize: 16, fontWeight: '700', color: Colors.text, marginBottom: Spacing.sm },
  sectionContent:{ fontSize: 14, color: Colors.text2, lineHeight: 24, whiteSpace: 'pre-line' },
  ruleCard:   { borderRadius: Radius.xl, borderWidth: 1.5, overflow: 'hidden', marginBottom: Spacing.md },
  ruleHeader: { padding: Spacing.lg, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  ruleLevel:  { fontSize: 16, fontWeight: '700', color: '#fff', textTransform: 'uppercase' },
  ruleLabel:  { fontSize: 12, color: 'rgba(255,255,255,0.8)', marginTop: 2 },
  ruleEarnVal:{ fontSize: 20, fontWeight: '700', color: '#fff' },
  ruleEarnSub:{ fontSize: 11, color: 'rgba(255,255,255,0.75)' },
  ruleBody:   { padding: Spacing.md, backgroundColor: Colors.surface },
  ruleRow:    { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 0.5, borderBottomColor: Colors.border },
  ruleRowLabel:{ fontSize: 13, color: Colors.text2 },
  ruleRowValue:{ fontSize: 13, fontWeight: '700', color: Colors.text },
});
