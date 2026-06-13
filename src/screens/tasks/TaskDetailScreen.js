import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Linking, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useCurrency } from '../../context/CurrencyContext';
import { useAuth } from '../../context/AuthContext';
import { Card, Button, Badge, Row } from '../../components/UI';
import { Colors, Spacing, Radius } from '../../utils/theme';
import api from '../../utils/api';

function TrailerSection({ url, platform }) {
  if (!url) return null;

  const platformConfig = {
    youtube:   { label: '▶ YouTube — Tap to watch',   color: '#FF0000' },
    tiktok:    { label: '🎵 TikTok — Tap to watch',   color: '#000000' },
    instagram: { label: '📸 Instagram — Tap to watch', color: '#E1306C' },
  };

  const config = platformConfig[platform] ?? { label: '🎬 Watch video', color: Colors.primary };

  return (
    <Card style={{ marginBottom: Spacing.md }}>
      <Text style={styles.trailerLabel}>🎬 Task trailer</Text>
      <TouchableOpacity
        style={[styles.externalBtn, { backgroundColor: config.color }]}
        onPress={() => Linking.openURL(url)}
      >
        <Text style={styles.externalBtnText}>{config.label}</Text>
      </TouchableOpacity>
      <Text style={styles.trailerHint}>Watch this before starting the task</Text>
    </Card>
  );
}

export default function TaskDetailScreen({ route, navigation }) {
  const { taskId } = route.params;
  const { fmt } = useCurrency();
  const { refreshUser } = useAuth();

  const [task, setTask]             = useState(null);
  const [assignment, setAssignment] = useState(null);
  const [note, setNote]             = useState('');
  const [loading, setLoading]       = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    api.get(`/tasks/${taskId}`)
      .then(r => {
        setTask(r.data.task);
        setAssignment(r.data.task.myAssignment);
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
    if (!note.trim()) { Alert.alert('Required', 'Please describe your completed work.'); return; }
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

  if (loading || !task) {
    return (
      <View style={styles.center}>
        <Text style={{ color: Colors.text3 }}>Loading…</Text>
      </View>
    );
  }

  const status = assignment?.status;
  const BADGE_COLORS = {
    'Video Rating': 'green',
    'Writing':      'blue',
    'Data Entry':   'gray',
    'Survey':       'amber',
    'Delivery':     'green',
    'Translation':  'blue',
  };

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>

        {/* Header */}
        <Card style={{ marginBottom: Spacing.md }}>
          <Row style={{ justifyContent: 'space-between', marginBottom: 10 }}>
            <Badge label={task.category} color={BADGE_COLORS[task.category] || 'gray'} />
            <Text style={styles.earn}>{fmt(task.earningETB)}</Text>
          </Row>
          <Text style={styles.title}>{task.title}</Text>
          <Text style={styles.desc}>{task.description}</Text>
          <Row style={{ gap: 16, marginTop: 12 }}>
            <Text style={styles.meta}>⏱ ~{task.estimatedMinutes} min</Text>
            <Text style={styles.meta}>
              👤 {task.spotsLeft ?? (task.totalSlots - task.filledSlots)} spots left
            </Text>
          </Row>
          {task.workDepositETB > 0 && (
            <View style={styles.depositTag}>
              <Text style={styles.depositText}>
                🔒 Work deposit required: {fmt(task.workDepositETB)} (refundable)
              </Text>
            </View>
          )}
        </Card>

        {/* Trailer */}
        <TrailerSection url={task.trailerVideoUrl} platform={task.trailerPlatform} />

        {/* Requirements */}
        <Card style={{ marginBottom: Spacing.md }}>
          <Text style={styles.sectionTitle}>Requirements</Text>
          {task.requirements?.map((r, i) => (
            <Row key={i} style={{ gap: 10, marginTop: 8, alignItems: 'flex-start' }}>
              <Text style={{ color: Colors.primary, fontSize: 16, marginTop: 1 }}>✓</Text>
              <Text style={styles.reqText}>{r}</Text>
            </Row>
          ))}
        </Card>

        {/* Progress */}
        {assignment && (
          <Card style={{ marginBottom: Spacing.md }}>
            <Row style={{ justifyContent: 'space-between', marginBottom: 8 }}>
              <Text style={styles.sectionTitle}>Progress</Text>
              <Text style={{ fontSize: 13, color: Colors.primary, fontWeight: '600' }}>
                {assignment.progress}%
              </Text>
            </Row>
            <View style={styles.progressBg}>
              <View style={[styles.progressFill, { width: `${assignment.progress}%` }]} />
            </View>
            <Text style={styles.statusText}>
              Status: <Text style={{ fontWeight: '600' }}>{status?.replace('_', ' ')}</Text>
            </Text>
          </Card>
        )}

        {/* Submission form */}
        {assignment && ['in_progress', 'accepted'].includes(status) && (
          <Card style={{ marginBottom: Spacing.md }}>
            <Text style={styles.sectionTitle}>Submit your work</Text>
            <TextInput
              style={styles.textarea}
              placeholder="Describe what you completed in detail…"
              placeholderTextColor={Colors.text3}
              multiline
              numberOfLines={4}
              value={note}
              onChangeText={setNote}
              textAlignVertical="top"
            />
            <Button
              title="Submit for review"
              onPress={submit}
              loading={submitting}
              disabled={!note.trim()}
              style={{ marginTop: Spacing.sm }}
            />
          </Card>
        )}

        {/* Completed banner */}
        {status === 'completed' && (
          <View style={styles.successBanner}>
            <Text style={styles.successText}>
              ✅ Completed — {fmt(task.earningETB)} paid to your wallet
            </Text>
          </View>
        )}

        {/* Rejected banner */}
        {status === 'rejected' && assignment?.reviewNote && (
          <View style={styles.errorBanner}>
            <Text style={styles.errorText}>❌ Rejected: {assignment.reviewNote}</Text>
          </View>
        )}

      </ScrollView>

      {/* Accept action bar */}
      {!assignment && (
        <View style={styles.actionBar}>
          <Button
            title={`Accept task — ${fmt(task.earningETB)}`}
            onPress={accept}
            loading={submitting}
            size="lg"
            style={{ flex: 1 }}
          />
        </View>
      )}

      {/* Complete action bar */}
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
  safe:            { flex: 1, backgroundColor: Colors.bg },
  center:          { flex: 1, alignItems: 'center', justifyContent: 'center' },
  container:       { padding: Spacing.lg, paddingBottom: 100 },
  earn:            { fontSize: 20, fontWeight: '700', color: Colors.primary },
  title:           { fontSize: 18, fontWeight: '700', color: Colors.text, marginBottom: 8 },
  desc:            { fontSize: 14, color: Colors.text2, lineHeight: 22 },
  meta:            { fontSize: 13, color: Colors.text3 },
  depositTag:      { backgroundColor: Colors.amberLight, borderRadius: Radius.sm, padding: Spacing.sm, marginTop: 12 },
  depositText:     { fontSize: 12, color: '#854F0B', fontWeight: '500' },
  trailerLabel:    { fontSize: 15, fontWeight: '600', color: Colors.text, marginBottom: 10 },
  trailerHint:     { fontSize: 12, color: Colors.text3, marginTop: 6 },
  externalBtn:     { borderRadius: Radius.md, padding: Spacing.md, alignItems: 'center', marginBottom: 4 },
  externalBtnText: { fontSize: 14, color: '#fff', fontWeight: '700' },
  sectionTitle:    { fontSize: 15, fontWeight: '600', color: Colors.text, marginBottom: 4 },
  reqText:         { fontSize: 14, color: Colors.text2, flex: 1, lineHeight: 20 },
  progressBg:      { height: 6, backgroundColor: Colors.primaryLight, borderRadius: 3, marginBottom: 8 },
  progressFill:    { height: 6, backgroundColor: Colors.primary, borderRadius: 3 },
  statusText:      { fontSize: 12, color: Colors.text3, marginTop: 4 },
  textarea:        { borderWidth: 1.5, borderColor: Colors.border, borderRadius: Radius.md, padding: 12, fontSize: 14, color: Colors.text, minHeight: 100, marginTop: Spacing.sm },
  successBanner:   { backgroundColor: Colors.primaryLight, borderRadius: Radius.md, padding: Spacing.md, marginBottom: Spacing.md },
  successText:     { fontSize: 14, color: Colors.primaryDark, fontWeight: '600', textAlign: 'center' },
  errorBanner:     { backgroundColor: Colors.redLight, borderRadius: Radius.md, padding: Spacing.md, marginBottom: Spacing.md },
  errorText:       { fontSize: 14, color: '#A32D2D', textAlign: 'center' },
  actionBar:       { position: 'absolute', bottom: 0, left: 0, right: 0, padding: Spacing.lg, backgroundColor: Colors.surface, borderTopWidth: 0.5, borderTopColor: Colors.border },
});