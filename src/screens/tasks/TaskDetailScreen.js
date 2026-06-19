import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Alert, Linking, TextInput, Animated, Image
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useCurrency } from '../../context/CurrencyContext';
import { useAuth } from '../../context/AuthContext';
import { Card, Button, Badge, Row } from '../../components/UI';
import { Colors, Spacing, Radius, Shadow } from '../../utils/theme';
import api from '../../utils/api';

// ── Trailer Section ───────────────────────────────────────────────────────────
function TrailerSection({ url, platform }) {
  if (!url) return null;

  const [thumbReady, setThumbReady] = useState(false);
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const onPressIn  = () => Animated.spring(scaleAnim, { toValue: 0.96, useNativeDriver: true }).start();
  const onPressOut = () => Animated.spring(scaleAnim, { toValue: 1,    useNativeDriver: true }).start();

  const getYouTubeId = (u) => {
    const match = u.match(/(?:v=|youtu\.be\/|embed\/)([^&\s?]+)/);
    return match ? match[1] : null;
  };

  const platformConfig = {
    youtube:   { label: 'YouTube',   icon: '▶',  color: '#FF0000', bg: '#1A0000' },
    tiktok:    { label: 'TikTok',    icon: '🎵', color: '#69C9D0', bg: '#010101' },
    instagram: { label: 'Instagram', icon: '📸', color: '#F77737', bg: '#1A0A12' },
  };

  const cfg      = platformConfig[platform] ?? { label: 'Video', icon: '🎬', color: Colors.primary, bg: '#111' };
  const ytId     = platform === 'youtube' ? getYouTubeId(url) : null;
  const thumbUrl = ytId ? `https://img.youtube.com/vi/${ytId}/hqdefault.jpg` : null;

  return (
    <View style={styles.trailerWrap}>
      <Row style={{ justifyContent: 'space-between', marginBottom: Spacing.sm }}>
        <Text style={styles.trailerLabel}>🎬 Task Trailer</Text>
        <View style={[styles.platformBadge, { backgroundColor: cfg.color + '20' }]}>
          <Text style={[styles.platformBadgeText, { color: cfg.color }]}>{cfg.icon} {cfg.label}</Text>
        </View>
      </Row>

      <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
        <TouchableOpacity
          activeOpacity={1}
          onPress={() => Linking.openURL(url)}
          onPressIn={onPressIn}
          onPressOut={onPressOut}
          style={[styles.trailerCard, { backgroundColor: cfg.bg }, Shadow.md]}
        >
          {/* Thumbnail */}
          {thumbUrl ? (
            <View style={styles.thumbWrap}>
              <Image
                source={{ uri: thumbUrl }}
                style={[styles.thumb, thumbReady ? {} : { opacity: 0 }]}
                onLoad={() => setThumbReady(true)}
                resizeMode="cover"
              />
              {!thumbReady && (
                <View style={styles.thumbPlaceholder}>
                  <Text style={{ fontSize: 32 }}>🎬</Text>
                </View>
              )}
              <View style={styles.thumbOverlay} />
            </View>
          ) : (
            <View style={[styles.thumbWrap, styles.thumbPlaceholder]}>
              <Text style={{ fontSize: 48 }}>{cfg.icon}</Text>
            </View>
          )}

          {/* Play button */}
          <View style={styles.playBtnWrap}>
            <View style={[styles.playBtn, { backgroundColor: cfg.color }]}>
              <Text style={styles.playBtnIcon}>▶</Text>
            </View>
            <Text style={styles.playLabel}>Tap to watch on {cfg.label}</Text>
          </View>

          {/* Bottom bar */}
          <View style={styles.trailerBottom}>
            <View style={styles.trailerDot} />
            <Text style={styles.trailerBottomText}>Watch before starting • Opens {cfg.label}</Text>
            <Text style={styles.trailerArrow}>↗</Text>
          </View>
        </TouchableOpacity>
      </Animated.View>

      <Text style={styles.trailerHint}>⚠ Complete the task requirements after watching</Text>
    </View>
  );
}

// ── Loading Skeleton ──────────────────────────────────────────────────────────
function LoadingSkeleton() {
  const anim = useRef(new Animated.Value(0.5)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 1,   duration: 800, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0.5, duration: 800, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  return (
    <View style={{ padding: Spacing.lg, gap: Spacing.md }}>
      {[180, 120, 160].map((h, i) => (
        <Animated.View key={i} style={{ height: h, borderRadius: Radius.lg, backgroundColor: Colors.border, opacity: anim }} />
      ))}
    </View>
  );
}

// ── Main Screen ───────────────────────────────────────────────────────────────
export default function TaskDetailScreen({ route, navigation }) {
  const { taskId } = route.params;
  const { fmt } = useCurrency();
  const { refreshUser } = useAuth();

  const [task, setTask]             = useState(null);
  const [assignment, setAssignment] = useState(null);
  const [note, setNote]             = useState('');
  const [loading, setLoading]       = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [noteError, setNoteError]   = useState('');

  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    api.get(`/tasks/${taskId}`)
      .then(r => {
        setTask(r.data.task);
        setAssignment(r.data.task.myAssignment);
        Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start();
      })
      .catch(() => navigation.goBack())
      .finally(() => setLoading(false));
  }, [taskId]);

  const accept = async () => {
    setSubmitting(true);
    try {
      const r = await api.post(`/tasks/${taskId}/accept`);
      setAssignment(r.data.assignment);
      Alert.alert('✅ Task accepted!', 'Complete the task and submit your work to get paid.');
    } catch (e) {
      Alert.alert('Error', e.response?.data?.error || 'Could not accept task.');
    } finally { setSubmitting(false); }
  };

  const submit = async () => {
    if (!note.trim()) { setNoteError('Please describe your completed work.'); return; }
    setNoteError('');
    setSubmitting(true);
    try {
      const r = await api.patch(`/tasks/${taskId}/submit`, { submissionNote: note });
      setAssignment(r.data.assignment);
      Alert.alert('📤 Submitted!', 'Your work is under review. Payment will be credited once approved.');
    } catch (e) {
      Alert.alert('Error', e.response?.data?.error || 'Submission failed.');
    } finally { setSubmitting(false); }
  };

  const complete = async () => {
    setSubmitting(true);
    try {
      await api.post(`/tasks/${taskId}/complete`);
      await refreshUser();
      setAssignment(a => ({ ...a, status: 'completed', progress: 100 }));
      Alert.alert('💰 Completed!', `${fmt(task.earningETB)} has been credited to your income wallet.`);
    } catch (e) {
      Alert.alert('Error', e.response?.data?.error || 'Error completing task.');
    } finally { setSubmitting(false); }
  };

  if (loading) return <LoadingSkeleton />;
  if (!task)   return null;

  const status = assignment?.status;

  const BADGE_COLORS = {
    'Video Rating': 'green', 'Writing': 'blue',  'Data Entry':  'gray',
    'Survey': 'amber',       'Delivery': 'green', 'Translation': 'blue',
  };

  const STATUS_CONFIG = {
    accepted:    { color: Colors.primary, bg: Colors.primaryLight, label: 'In Progress' },
    in_progress: { color: Colors.primary, bg: Colors.primaryLight, label: 'In Progress' },
    submitted:   { color: Colors.amber,   bg: Colors.amberLight,   label: 'Under Review' },
    completed:   { color: Colors.primary, bg: Colors.primaryLight, label: 'Completed ✓' },
    rejected:    { color: Colors.red,     bg: Colors.redLight,     label: 'Rejected' },
  };

  const statusCfg = status ? STATUS_CONFIG[status] : null;

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <Animated.ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
        style={{ opacity: fadeAnim }}
      >

        {/* ── Header Card ── */}
        <Card style={{ marginBottom: Spacing.md }}>
          <Row style={{ justifyContent: 'space-between', marginBottom: 10 }}>
            <Badge label={task.category} color={BADGE_COLORS[task.category] || 'gray'} />
            {statusCfg && (
              <View style={[styles.statusPill, { backgroundColor: statusCfg.bg }]}>
                <Text style={[styles.statusPillText, { color: statusCfg.color }]}>{statusCfg.label}</Text>
              </View>
            )}
          </Row>

          <Text style={styles.title}>{task.title}</Text>
          <Text style={styles.desc}>{task.description}</Text>

          {/* Meta chips */}
          <Row style={{ gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
            <View style={styles.metaChip}>
              <Text style={styles.metaChipText}>⏱ ~{task.estimatedMinutes} min</Text>
            </View>
            <View style={styles.metaChip}>
              <Text style={styles.metaChipText}>
                👤 {task.spotsLeft ?? (task.totalSlots - task.filledSlots)} spots left
              </Text>
            </View>
            <View style={[styles.metaChip, { backgroundColor: Colors.primaryLight }]}>
              <Text style={[styles.metaChipText, { color: Colors.primaryDark, fontWeight: '700' }]}>
                💰 {fmt(task.earningETB)}
              </Text>
            </View>
          </Row>

          {task.workDepositETB > 0 && (
            <View style={styles.depositTag}>
              <Text style={styles.depositText}>
                🔒 Work deposit: {fmt(task.workDepositETB)} (fully refundable)
              </Text>
            </View>
          )}
        </Card>

        {/* ── Trailer ── */}
        <TrailerSection url={task.trailerVideoUrl} platform={task.trailerPlatform} />

        {/* ── Requirements ── */}
        <Card style={{ marginBottom: Spacing.md }}>
          <Text style={styles.sectionTitle}>📋 Requirements</Text>
          {task.requirements?.map((r, i) => (
            <View key={i} style={styles.reqRow}>
              <View style={styles.reqDot}>
                <Text style={styles.reqDotText}>{i + 1}</Text>
              </View>
              <Text style={styles.reqText}>{r}</Text>
            </View>
          ))}
        </Card>

        {/* ── Progress ── */}
        {assignment && (
          <Card style={{ marginBottom: Spacing.md }}>
            <Row style={{ justifyContent: 'space-between', marginBottom: Spacing.md }}>
              <Text style={styles.sectionTitle}>📊 Progress</Text>
              <View style={[styles.statusPill, { backgroundColor: statusCfg?.bg || Colors.bg }]}>
                <Text style={[styles.statusPillText, { color: statusCfg?.color || Colors.text3 }]}>
                  {statusCfg?.label || status}
                </Text>
              </View>
            </Row>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
              <Text style={{ fontSize: 12, color: Colors.text3 }}>Progress</Text>
              <Text style={{ fontSize: 12, color: statusCfg?.color || Colors.primary, fontWeight: '600' }}>
                {assignment.progress}%
              </Text>
            </View>
            <View style={styles.progressBg}>
              <View style={[styles.progressFill, {
                width: `${assignment.progress}%`,
                backgroundColor: statusCfg?.color || Colors.primary,
              }]} />
            </View>
          </Card>
        )}

        {/* ── Submission Form ── */}
        {assignment && ['in_progress', 'accepted'].includes(status) && (
          <Card style={{ marginBottom: Spacing.md }}>
            <Text style={styles.sectionTitle}>📤 Submit your work</Text>
            <Text style={styles.submitHint}>
              Be specific — describe exactly what you did to complete this task.
            </Text>
            <TextInput
              style={[styles.textarea, noteError && { borderColor: Colors.red }]}
              placeholder="Describe what you completed in detail…"
              placeholderTextColor={Colors.text3}
              multiline
              numberOfLines={5}
              value={note}
              onChangeText={v => { setNote(v); setNoteError(''); }}
              textAlignVertical="top"
            />
            {!!noteError && <Text style={styles.noteError}>⚠ {noteError}</Text>}
            <Row style={{ gap: Spacing.sm, marginTop: Spacing.md, alignItems: 'center' }}>
              <Text style={styles.charCount}>{note.length} chars</Text>
              <Button
                title="Submit for review"
                onPress={submit}
                loading={submitting}
                disabled={!note.trim()}
                style={{ flex: 1 }}
              />
            </Row>
          </Card>
        )}

        {/* ── Completed Banner ── */}
        {status === 'completed' && (
          <View style={styles.successBanner}>
            <Text style={styles.successEmoji}>🎉</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.successTitle}>Task Completed!</Text>
              <Text style={styles.successSub}>{fmt(task.earningETB)} has been paid to your wallet</Text>
            </View>
          </View>
        )}

        {/* ── Rejected Banner ── */}
        {status === 'rejected' && assignment?.reviewNote && (
          <View style={styles.errorBanner}>
            <Text style={styles.errorTitle}>❌ Submission Rejected</Text>
            <Text style={styles.errorReason}>{assignment.reviewNote}</Text>
            <Text style={styles.errorHint}>You can edit your submission and resubmit.</Text>
          </View>
        )}

      </Animated.ScrollView>

      {/* ── Accept Action Bar ── */}
      {!assignment && (
        <View style={styles.actionBar}>
          <View style={styles.actionBarInner}>
            <View>
              <Text style={styles.actionBarLabel}>Earn</Text>
              <Text style={styles.actionBarEarn}>{fmt(task.earningETB)}</Text>
            </View>
            <Button
              title="Accept task"
              onPress={accept}
              loading={submitting}
              size="lg"
              style={{ flex: 1 }}
            />
          </View>
        </View>
      )}

      {/* ── Complete Action Bar ── */}
      {status === 'submitted' && (
        <View style={styles.actionBar}>
          <Button
            title="Mark as completed"
            onPress={complete}
            loading={submitting}
            size="lg"
            style={{ flex: 1 }}
          />
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:              { flex: 1, backgroundColor: Colors.bg },
  container:         { padding: Spacing.lg, paddingBottom: 120 },

  // Header
  title:             { fontSize: 19, fontWeight: '800', color: Colors.text, marginBottom: 8, lineHeight: 26 },
  desc:              { fontSize: 14, color: Colors.text2, lineHeight: 22 },
  metaChip:          { backgroundColor: '#F0F2F5', borderRadius: Radius.full, paddingHorizontal: 10, paddingVertical: 5 },
  metaChipText:      { fontSize: 12, color: Colors.text2, fontWeight: '500' },
  depositTag:        { backgroundColor: Colors.amberLight, borderRadius: Radius.md, padding: Spacing.sm, marginTop: 12 },
  depositText:       { fontSize: 12, color: '#854F0B', fontWeight: '500' },
  statusPill:        { borderRadius: Radius.full, paddingHorizontal: 10, paddingVertical: 4 },
  statusPillText:    { fontSize: 12, fontWeight: '700' },

  // Trailer
  trailerWrap:       { marginBottom: Spacing.md },
  trailerLabel:      { fontSize: 15, fontWeight: '700', color: Colors.text },
  platformBadge:     { borderRadius: Radius.full, paddingHorizontal: 10, paddingVertical: 4 },
  platformBadgeText: { fontSize: 12, fontWeight: '700' },
  trailerCard:       { borderRadius: Radius.xl, overflow: 'hidden', height: 200 },
  thumbWrap:         { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  thumb:             { width: '100%', height: '100%' },
  thumbPlaceholder:  { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center', backgroundColor: '#1A1A2E' },
  thumbOverlay:      { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.45)' },
  playBtnWrap:       { position: 'absolute', top: 0, left: 0, right: 0, bottom: 40, alignItems: 'center', justifyContent: 'center', gap: 10 },
  playBtn:           { width: 60, height: 60, borderRadius: 30, alignItems: 'center', justifyContent: 'center' },
  playBtnIcon:       { fontSize: 22, color: '#fff', marginLeft: 4 },
  playLabel:         { fontSize: 13, color: 'rgba(255,255,255,0.9)', fontWeight: '600' },
  trailerBottom:     { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(0,0,0,0.6)', padding: Spacing.sm, flexDirection: 'row', alignItems: 'center', gap: 6 },
  trailerDot:        { width: 6, height: 6, borderRadius: 3, backgroundColor: '#22C55E' },
  trailerBottomText: { fontSize: 11, color: 'rgba(255,255,255,0.8)', flex: 1 },
  trailerArrow:      { fontSize: 14, color: '#fff', fontWeight: '700' },
  trailerHint:       { fontSize: 12, color: Colors.text3, marginTop: Spacing.sm },

  // Requirements
  sectionTitle:      { fontSize: 15, fontWeight: '700', color: Colors.text, marginBottom: 10 },
  reqRow:            { flexDirection: 'row', gap: 10, marginTop: 8, alignItems: 'flex-start' },
  reqDot:            { width: 22, height: 22, borderRadius: 11, backgroundColor: Colors.primaryLight, alignItems: 'center', justifyContent: 'center', marginTop: 1 },
  reqDotText:        { fontSize: 11, fontWeight: '700', color: Colors.primary },
  reqText:           { fontSize: 14, color: Colors.text2, flex: 1, lineHeight: 21 },

  // Progress
  progressBg:        { height: 6, backgroundColor: Colors.primaryLight, borderRadius: 3, overflow: 'hidden' },
  progressFill:      { height: 6, borderRadius: 3 },

  // Submission
  submitHint:        { fontSize: 13, color: Colors.text3, marginBottom: Spacing.sm, lineHeight: 18 },
  textarea:          { borderWidth: 1.5, borderColor: Colors.border, borderRadius: Radius.md, padding: 12, fontSize: 14, color: Colors.text, minHeight: 110, marginTop: Spacing.sm },
  noteError:         { fontSize: 12, color: Colors.red, marginTop: 4, fontWeight: '500' },
  charCount:         { fontSize: 11, color: Colors.text4, minWidth: 55 },

  // Banners
  successBanner:     { backgroundColor: Colors.primaryLight, borderRadius: Radius.lg, padding: Spacing.lg, marginBottom: Spacing.md, flexDirection: 'row', alignItems: 'center', gap: 12, borderLeftWidth: 4, borderLeftColor: Colors.primary },
  successEmoji:      { fontSize: 32 },
  successTitle:      { fontSize: 15, fontWeight: '800', color: Colors.primaryDark },
  successSub:        { fontSize: 13, color: Colors.primary, marginTop: 2 },
  errorBanner:       { backgroundColor: Colors.redLight, borderRadius: Radius.lg, padding: Spacing.lg, marginBottom: Spacing.md, borderLeftWidth: 4, borderLeftColor: Colors.red },
  errorTitle:        { fontSize: 14, fontWeight: '700', color: Colors.red, marginBottom: 4 },
  errorReason:       { fontSize: 13, color: '#A32D2D', lineHeight: 20 },
  errorHint:         { fontSize: 12, color: Colors.text3, marginTop: 6 },

  // Action bar
  actionBar:         { position: 'absolute', bottom: 0, left: 0, right: 0, padding: Spacing.lg, backgroundColor: Colors.surface, borderTopWidth: 0.5, borderTopColor: Colors.border },
  actionBarInner:    { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  actionBarLabel:    { fontSize: 11, color: Colors.text3, fontWeight: '500' },
  actionBarEarn:     { fontSize: 20, fontWeight: '800', color: Colors.primary },
});