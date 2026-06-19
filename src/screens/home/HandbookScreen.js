import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, RefreshControl, Animated
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card, Row } from '../../components/UI';
import { Colors, Spacing, Radius } from '../../utils/theme';
import api from '../../utils/api';

const LEVEL_COLORS = Colors.levels;

// ── Accordion Level Card ──────────────────────────────────────────────────────
function LevelAccordion({ r, isOpen, onToggle }) {
  const anim    = useRef(new Animated.Value(isOpen ? 1 : 0)).current;
  const cfg     = LEVEL_COLORS[r.level] || { color: Colors.primary, light: Colors.primaryLight, label: r.level };
  const color   = typeof cfg === 'object' ? cfg.color : cfg;
  const light   = typeof cfg === 'object' ? cfg.light : Colors.primaryLight;
  const label   = typeof cfg === 'object' ? cfg.label : r.level;

  useEffect(() => {
    Animated.timing(anim, {
      toValue: isOpen ? 1 : 0,
      duration: 250,
      useNativeDriver: false,
    }).start();
  }, [isOpen]);

  const ROWS = [
    { icon: '🔒', label: 'Deposit required', value: r.depositRequiredETB > 0 ? `${r.depositRequiredETB.toLocaleString()} ETB` : 'Free' },
    { icon: '📋', label: 'Tasks per day',    value: `${r.taskCountPerDay} tasks` },
    { icon: '💰', label: 'Daily maximum',    value: `${(r.taskCountPerDay * r.rewardPerTaskETB).toLocaleString()} ETB` },
    { icon: '🤝', label: 'Referral bonus',   value: `${r.referralCommission}%` },
    { icon: '👥', label: 'Team bonus',       value: `${r.teamBonusPercent}%` },
    { icon: '🎯', label: 'Tasks to advance', value: `${r.minTasksToAdvance} tasks` },
  ];

  return (
    <View style={[styles.accordionCard, { borderColor: color + '30' }]}>

      {/* Header row — always visible */}
      <TouchableOpacity
        onPress={onToggle}
        activeOpacity={0.8}
        style={styles.accordionHeader}
      >
        {/* Color dot + level name */}
        <View style={[styles.levelDot, { backgroundColor: color }]} />
        <View style={{ flex: 1 }}>
          <Text style={styles.accordionLevel}>{label}</Text>
          <Text style={styles.accordionSub}>{r.rewardPerTaskETB} ETB per task</Text>
        </View>

        {/* Right side summary */}
        <View style={{ alignItems: 'flex-end', marginRight: Spacing.sm }}>
          <Text style={[styles.accordionEarn, { color }]}>{r.taskCountPerDay} tasks/day</Text>
          <Text style={styles.accordionDeposit}>
            {r.depositRequiredETB > 0 ? `${r.depositRequiredETB.toLocaleString()} ETB` : 'Free'}
          </Text>
        </View>

        {/* Chevron */}
        <Animated.Text style={[styles.chevron, {
          transform: [{ rotate: anim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '180deg'] }) }]
        }]}>
          ↓
        </Animated.Text>
      </TouchableOpacity>

      {/* Expanded content */}
      {isOpen && (
        <View style={[styles.accordionBody, { borderTopColor: color + '20' }]}>
          {/* Earn highlight */}
          <View style={[styles.earnHighlight, { backgroundColor: light }]}>
            <Text style={[styles.earnHighlightLabel, { color }]}>Per task earning</Text>
            <Text style={[styles.earnHighlightVal, { color }]}>{r.rewardPerTaskETB} ETB</Text>
          </View>

          {/* Detail rows */}
          {ROWS.map(({ icon, label: lbl, value }, i) => (
            <View key={lbl} style={[styles.detailRow, i < ROWS.length - 1 && { borderBottomWidth: 0.5, borderBottomColor: Colors.border }]}>
              <Text style={styles.detailIcon}>{icon}</Text>
              <Text style={styles.detailLabel}>{lbl}</Text>
              <Text style={[styles.detailValue, { color }]}>{value}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

// ── Main Screen ───────────────────────────────────────────────────────────────
export default function HandbookScreen() {
  const [sections, setSections]   = useState([]);
  const [rules, setRules]         = useState([]);
  const [tab, setTab]             = useState('guide');
  const [activeSection, setActiveSection] = useState(null);
  const [activeLevel, setActiveLevel]     = useState(null);
  const [refreshing, setRefreshing]       = useState(false);

  const load = async () => {
    try {
      const r = await api.get('/handbook');
      setSections(r.data.sections);
      setRules(r.data.levelRules);
      if (r.data.sections.length > 0) setActiveSection(r.data.sections[0]._id);
    } catch (e) { console.error(e); }
    finally { setRefreshing(false); }
  };

  useEffect(() => { load(); }, []);

  const currentSection = sections.find(s => s._id === activeSection);

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>

      {/* ── Tabs ── */}
      <View style={styles.tabRow}>
        {[
          { key: 'guide',  label: '📖 Guide' },
          { key: 'levels', label: '📊 Level rules' },
        ].map(t => (
          <TouchableOpacity
            key={t.key}
            style={[styles.tabBtn, tab === t.key && styles.tabActive]}
            onPress={() => setTab(t.key)}
            activeOpacity={0.8}
          >
            <Text style={[styles.tabText, tab === t.key && styles.tabTextActive]}>{t.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => { setRefreshing(true); load(); }}
            tintColor={Colors.primary}
          />
        }
        contentContainerStyle={{ padding: Spacing.lg, paddingBottom: 48 }}
      >

        {/* ── Guide Tab ── */}
        {tab === 'guide' && (
          <>
            {sections.map(s => (
              <TouchableOpacity
                key={s._id}
                activeOpacity={0.8}
                style={[styles.sectionBtn, activeSection === s._id && styles.sectionBtnActive]}
                onPress={() => setActiveSection(activeSection === s._id ? null : s._id)}
              >
                <Text style={[styles.sectionBtnText, activeSection === s._id && styles.sectionBtnTextActive]}>
                  {s.title}
                </Text>
                <Text style={{ color: activeSection === s._id ? Colors.primary : Colors.text3, fontSize: 16 }}>
                  {activeSection === s._id ? '↑' : '↓'}
                </Text>
              </TouchableOpacity>
            ))}

            {currentSection && (
              <Card style={{ marginTop: Spacing.sm }}>
                <Text style={styles.sectionTitle}>{currentSection.title}</Text>
                <Text style={styles.sectionContent}>{currentSection.content}</Text>
              </Card>
            )}
          </>
        )}

        {/* ── Level Rules Tab ── */}
        {tab === 'levels' && (
          <>
            {/* Info banner */}
            <View style={styles.infoBanner}>
              <Text style={styles.infoBannerText}>
                Higher levels unlock more tasks and better rewards. 
              </Text>
            </View>

            {/* Accordion list */}
            {rules.map(r => (
              <LevelAccordion
                key={r.level}
                r={r}
                isOpen={activeLevel === r.level}
                onToggle={() => setActiveLevel(activeLevel === r.level ? null : r.level)}
              />
            ))}
          </>
        )}

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:       { flex: 1, backgroundColor: Colors.bg },

  // Tabs
  tabRow:     { flexDirection: 'row', padding: Spacing.md, gap: 8, backgroundColor: Colors.surface, borderBottomWidth: 0.5, borderBottomColor: Colors.border },
  tabBtn:     { flex: 1, paddingVertical: 9, borderRadius: Radius.md, backgroundColor: Colors.bg, alignItems: 'center', borderWidth: 1, borderColor: Colors.border },
  tabActive:  { backgroundColor: Colors.primary, borderColor: Colors.primary },
  tabText:    { fontSize: 13, fontWeight: '600', color: Colors.text2 },
  tabTextActive: { color: '#fff' },

  // Guide
  sectionBtn:         { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: Colors.surface, borderRadius: Radius.md, padding: Spacing.md, marginBottom: 8, borderWidth: 1, borderColor: Colors.border },
  sectionBtnActive:   { borderColor: Colors.primary, backgroundColor: Colors.primaryLight },
  sectionBtnText:     { fontSize: 14, fontWeight: '500', color: Colors.text, flex: 1 },
  sectionBtnTextActive:{ color: Colors.primaryDark, fontWeight: '600' },
  sectionTitle:       { fontSize: 16, fontWeight: '700', color: Colors.text, marginBottom: Spacing.sm },
  sectionContent:     { fontSize: 14, color: Colors.text2, lineHeight: 24 },

  // Info banner
  infoBanner:     { backgroundColor: Colors.primaryLight, borderRadius: Radius.md, padding: Spacing.md, marginBottom: Spacing.md },
  infoBannerText: { fontSize: 13, color: Colors.primaryDark, lineHeight: 20 },

  // Accordion
  accordionCard:   { backgroundColor: Colors.surface, borderRadius: Radius.lg, borderWidth: 1, marginBottom: Spacing.sm, overflow: 'hidden' },
  accordionHeader: { flexDirection: 'row', alignItems: 'center', padding: Spacing.md, gap: 10 },
  levelDot:        { width: 12, height: 12, borderRadius: 6, flexShrink: 0 },
  accordionLevel:  { fontSize: 14, fontWeight: '700', color: Colors.text },
  accordionSub:    { fontSize: 12, color: Colors.text3, marginTop: 1 },
  accordionEarn:   { fontSize: 13, fontWeight: '700' },
  accordionDeposit:{ fontSize: 11, color: Colors.text3, marginTop: 2 },
  chevron:         { fontSize: 16, color: Colors.text3 },

  // Accordion body
  accordionBody:    { borderTopWidth: 1, padding: Spacing.md, gap: 0 },
  earnHighlight:    { borderRadius: Radius.md, padding: Spacing.md, marginBottom: Spacing.md, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  earnHighlightLabel:{ fontSize: 13, fontWeight: '500' },
  earnHighlightVal: { fontSize: 20, fontWeight: '800' },
  detailRow:        { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, gap: 10 },
  detailIcon:       { fontSize: 15, width: 22 },
  detailLabel:      { flex: 1, fontSize: 13, color: Colors.text2 },
  detailValue:      { fontSize: 13, fontWeight: '700' },
});