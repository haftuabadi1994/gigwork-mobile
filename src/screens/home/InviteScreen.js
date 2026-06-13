import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Share, Linking, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Clipboard from 'expo-clipboard';
import { useAuth } from '../../context/AuthContext';
import { Card, Row, Button } from '../../components/UI';
import { Colors, Spacing, Radius } from '../../utils/theme';
import api from '../../utils/api';

const API_IP = '10.10.3.209';

export default function InviteScreen() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [copied, setCopied] = useState(false);
  const [tab, setTab] = useState('share');

  const code = user?.referralCode || '';
  const link = `http://${API_IP}:3000/register?ref=${code}`;

  useEffect(() => {
    api.get('/referral/stats').then(r => setStats(r.data)).catch(console.error);
  }, []);

  const copy = async () => {
    await Clipboard.setStringAsync(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shareNative = async () => {
    try {
      await Share.share({ message: `Join GigWork and earn money completing tasks! Use my referral code ${code}:\n${link}`, title: 'Join GigWork' });
    } catch (e) { console.error(e); }
  };

  const CHANNELS = [
    { icon: '💬', label: 'WhatsApp',  color: '#25D366', bg: '#DCFCE7', url: `whatsapp://send?text=${encodeURIComponent(`Join GigWork! Use code ${code}: ${link}`)}` },
    { icon: '✈️', label: 'Telegram',  color: '#229ED9', bg: '#E0F2FE', url: `tg://msg?text=${encodeURIComponent(`Join GigWork! Code ${code}: ${link}`)}` },
    { icon: '📱', label: 'SMS',       color: '#6B7280', bg: '#F3F4F6', url: `sms:?body=${encodeURIComponent(`Join GigWork with my code ${code}: ${link}`)}` },
    { icon: '📧', label: 'Email',     color: '#EF4444', bg: '#FEF2F2', url: `mailto:?subject=Join GigWork&body=${encodeURIComponent(`Hey!\n\nJoin GigWork and earn money. Use my code ${code}:\n${link}`)}` },
  ];

  const openChannel = async (url) => {
    try {
      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) await Linking.openURL(url);
      else { await shareNative(); }
    } catch { await shareNative(); }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: Spacing.lg, paddingBottom: 40 }}>

        {/* Stats */}
        <View style={styles.statsRow}>
          {[
            { label: 'Referred',  value: stats?.referralCount || 0 },
            { label: 'Active',    value: stats?.referrals?.filter(r => r.tasksCompleted > 0).length || 0 },
            { label: 'Bonus ETB', value: (stats?.totalBonusETB || 0).toLocaleString() },
          ].map(s => (
            <View key={s.label} style={styles.statBox}>
              <Text style={styles.statVal}>{s.value}</Text>
              <Text style={styles.statLbl}>{s.label}</Text>
            </View>
          ))}
        </View>

        {/* Code card */}
        <View style={styles.codeCard}>
          <Text style={styles.codeLabel}>Your referral code</Text>
          <Text style={styles.code}>{code}</Text>
          <View style={styles.codeActions}>
            <TouchableOpacity style={styles.codeBtn} onPress={copy}>
              <Text style={styles.codeBtnText}>{copied ? '✓ Copied!' : '📋 Copy code'}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.codeBtn} onPress={shareNative}>
              <Text style={styles.codeBtnText}>📤 Share</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Tabs */}
        <View style={styles.tabRow}>
          {['share','analytics'].map(t => (
            <TouchableOpacity key={t} style={[styles.tabBtn, tab === t && styles.tabActive]} onPress={() => setTab(t)}>
              <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>
                {t === 'share' ? '📤 Share channels' : '📊 Analytics'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Share channels */}
        {tab === 'share' && (
          <>
            <View style={styles.channelGrid}>
              {CHANNELS.map(ch => (
                <TouchableOpacity key={ch.label} style={[styles.channelBtn, { backgroundColor: ch.bg, borderColor: ch.color + '33' }]}
                  activeOpacity={0.8} onPress={() => openChannel(ch.url)}>
                  <Text style={styles.channelIcon}>{ch.icon}</Text>
                  <Text style={[styles.channelLabel, { color: ch.color }]}>{ch.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Link box */}
            <Card>
              <Text style={styles.sectionTitle}>Referral link</Text>
              <Text style={styles.linkText} numberOfLines={2}>{link}</Text>
            </Card>

            {/* How it works */}
            <Card style={{ marginTop: Spacing.md }}>
              <Text style={styles.sectionTitle}>How it works</Text>
              {[
                { n: '1', t: 'Share your code', d: 'Send your link or code to friends' },
                { n: '2', t: 'Friend registers', d: 'They sign up with your referral code' },
                { n: '3', t: 'Earn commission',  d: 'You get 10% when they complete first task' },
                { n: '4', t: 'Team bonus',       d: 'Earn % of all their future income too' },
              ].map(s => (
                <Row key={s.n} style={{ gap: 12, paddingVertical: 10, borderBottomWidth: 0.5, borderBottomColor: Colors.border }}>
                  <View style={styles.stepNum}><Text style={styles.stepNumText}>{s.n}</Text></View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.stepTitle}>{s.t}</Text>
                    <Text style={styles.stepDesc}>{s.d}</Text>
                  </View>
                </Row>
              ))}
            </Card>
          </>
        )}

        {/* Analytics */}
        {tab === 'analytics' && (
          <>
            <Card>
              <Text style={styles.sectionTitle}>Referral performance</Text>
              {[
                { label: 'Total invited',         value: stats?.referralCount || 0 },
                { label: 'Completed first task',  value: stats?.referrals?.filter(r => r.tasksCompleted > 0).length || 0 },
                { label: 'Total bonus earned',    value: `${(stats?.totalBonusETB || 0).toLocaleString()} ETB` },
                { label: 'Tier B members',        value: stats?.levelBCount || 0 },
              ].map(s => (
                <Row key={s.label} style={{ justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 0.5, borderBottomColor: Colors.border }}>
                  <Text style={{ fontSize: 13, color: Colors.text2 }}>{s.label}</Text>
                  <Text style={{ fontSize: 14, fontWeight: '700', color: Colors.primary }}>{s.value}</Text>
                </Row>
              ))}
            </Card>

            {stats?.referrals?.length > 0 && (
              <View style={{ marginTop: Spacing.md }}>
                <Text style={styles.sectionTitle}>Your referrals</Text>
                {stats.referrals.map(r => (
                  <Card key={r._id} style={{ marginBottom: 8 }}>
                    <Row style={{ justifyContent: 'space-between' }}>
                      <View>
                        <Text style={{ fontSize: 14, fontWeight: '600', color: Colors.text }}>{r.name}</Text>
                        <Text style={{ fontSize: 12, color: Colors.text3 }}>{r.tasksCompleted} tasks · {new Date(r.createdAt).toLocaleDateString()}</Text>
                      </View>
                      <View style={[styles.statusPill, { backgroundColor: r.tasksCompleted > 0 ? Colors.primaryLight : Colors.bg }]}>
                        <Text style={{ fontSize: 11, fontWeight: '600', color: r.tasksCompleted > 0 ? Colors.primaryDark : Colors.text3 }}>
                          {r.tasksCompleted > 0 ? '✓ Active' : 'Pending'}
                        </Text>
                      </View>
                    </Row>
                  </Card>
                ))}
              </View>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:        { flex: 1, backgroundColor: Colors.bg },
  statsRow:    { flexDirection: 'row', gap: 10, marginBottom: Spacing.md },
  statBox:     { flex: 1, backgroundColor: Colors.primaryLight, borderRadius: Radius.md, padding: Spacing.md, alignItems: 'center' },
  statVal:     { fontSize: 20, fontWeight: '700', color: Colors.primaryDark },
  statLbl:     { fontSize: 11, color: Colors.primaryDark, marginTop: 2 },
  codeCard:    { backgroundColor: Colors.primary, borderRadius: Radius.xl, padding: Spacing.xl, alignItems: 'center', marginBottom: Spacing.md },
  codeLabel:   { fontSize: 12, color: 'rgba(255,255,255,0.75)', marginBottom: 6 },
  code:        { fontSize: 30, fontWeight: '700', color: '#fff', letterSpacing: 4, marginBottom: Spacing.md },
  codeActions: { flexDirection: 'row', gap: 10 },
  codeBtn:     { backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: Radius.md, paddingHorizontal: 16, paddingVertical: 9 },
  codeBtnText: { fontSize: 13, color: '#fff', fontWeight: '600' },
  tabRow:      { flexDirection: 'row', gap: 8, marginBottom: Spacing.md },
  tabBtn:      { flex: 1, paddingVertical: 10, borderRadius: Radius.md, backgroundColor: Colors.surface, alignItems: 'center', borderWidth: 1, borderColor: Colors.border },
  tabActive:   { backgroundColor: Colors.primary, borderColor: Colors.primary },
  tabText:     { fontSize: 13, fontWeight: '600', color: Colors.text2 },
  tabTextActive:{ color: '#fff' },
  channelGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: Spacing.md },
  channelBtn:  { width: '47%', borderRadius: Radius.lg, borderWidth: 1.5, padding: Spacing.lg, alignItems: 'center', gap: 8 },
  channelIcon: { fontSize: 28 },
  channelLabel:{ fontSize: 14, fontWeight: '700' },
  sectionTitle:{ fontSize: 15, fontWeight: '600', color: Colors.text, marginBottom: Spacing.sm },
  linkText:    { fontSize: 12, color: Colors.text3, fontFamily: 'monospace' },
  stepNum:     { width: 28, height: 28, borderRadius: 14, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  stepNumText: { fontSize: 13, fontWeight: '700', color: '#fff' },
  stepTitle:   { fontSize: 14, fontWeight: '600', color: Colors.text },
  stepDesc:    { fontSize: 12, color: Colors.text2, marginTop: 2 },
  statusPill:  { borderRadius: Radius.full, paddingHorizontal: 10, paddingVertical: 4 },
});
