import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import { useCurrency } from '../../context/CurrencyContext';
import { Card, Input, Button, Avatar, Row, Divider } from '../../components/UI';
import { Colors, Spacing, Radius } from '../../utils/theme';
import api from '../../utils/api';

const LEVEL_COLORS = Colors.levels;

const NOTIF_LABELS = [
  { key: 'tasks',     label: 'Task updates',       sub: 'Assignments, reviews, deadlines' },
  { key: 'income',    label: 'Income alerts',       sub: 'Earnings & bonuses' },
  { key: 'referrals', label: 'Referral events',     sub: 'New signups & commissions' },
  { key: 'wallet',    label: 'Wallet transactions', sub: 'Deposits, withdrawals' },
  { key: 'team',      label: 'Team activity',       sub: 'Member progress & team bonuses' },
];

const QUICK_LINKS = [
  { icon: '💳', label: 'Financial records',  screen: 'Records' },
  { icon: '📖', label: 'Employee handbook',  screen: 'Handbook' },
  { icon: '📤', label: 'Invite friends',     screen: 'Invite' },
  { icon: '💰', label: 'Income dashboard',   screen: 'Income' },
];

export default function ProfileScreen({ navigation }) {
  const { user, logout, refreshUser } = useAuth();
  const { fmt } = useCurrency();
  const [tab, setTab]   = useState('profile');
  const [form, setForm] = useState({ name: user?.name || '', phone: user?.phone || '' });
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '' });
  const [notifPrefs, setNotifPrefs] = useState(user?.notifPrefs || { tasks: true, income: true, referrals: true, wallet: true, team: true });
  const [loading, setLoading] = useState(false);

  const levelColor = LEVEL_COLORS[user?.level || 'intern'] || Colors.primary;

  const saveProfile = async () => {
    setLoading(true);
    try {
      await api.patch('/auth/update-profile', form);
      await refreshUser();
      Alert.alert('✅', 'Profile updated!');
    } catch { Alert.alert('Error', 'Failed to update profile.'); }
    finally { setLoading(false); }
  };

  const changePw = async () => {
    if (pwForm.newPassword.length < 6) { Alert.alert('Error', 'New password must be at least 6 characters.'); return; }
    setLoading(true);
    try {
      await api.patch('/auth/change-password', pwForm);
      Alert.alert('✅', 'Password changed!');
      setPwForm({ currentPassword: '', newPassword: '' });
    } catch (e) { Alert.alert('Error', e.response?.data?.error || 'Failed.'); }
    finally { setLoading(false); }
  };

  const saveNotifs = async () => {
    setLoading(true);
    try {
      await api.patch('/auth/update-profile', { notifPrefs });
      Alert.alert('✅', 'Notification preferences saved!');
    } catch { Alert.alert('Error', 'Failed.'); }
    finally { setLoading(false); }
  };

  const handleLogout = () => {
    Alert.alert('Sign out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign out', style: 'destructive', onPress: logout }
    ]);
  };

  const TABS = [
    { key: 'profile',  label: 'Profile' },
    { key: 'security', label: 'Security' },
    { key: 'notifs',   label: 'Notifications' },
  ];

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>

        {/* Avatar + level card */}
        <View style={[styles.levelCard, { backgroundColor: levelColor }]}>
          <Row style={{ gap: 14 }}>
            <Avatar name={user?.name} size={56} color={levelColor} />
            <View style={{ flex: 1 }}>
              <Text style={styles.userName}>{user?.name}</Text>
              <Text style={styles.userEmail}>{user?.email}</Text>
              <Row style={{ gap: 8, marginTop: 5 }}>
                <View style={styles.levelPill}>
                  <Text style={styles.levelPillText}>{(user?.level || 'INTERN').toUpperCase()}</Text>
                </View>
                <Text style={styles.qualityText}>Quality: {user?.qualityScore || 100}%</Text>
              </Row>
            </View>
          </Row>
        </View>

        {/* Wallet summary */}
        <View style={styles.walletRow}>
          <View style={[styles.walletBox, { backgroundColor: Colors.primaryLight }]}>
            <Text style={styles.walletVal}>{fmt(user?.incomeWalletETB || 0)}</Text>
            <Text style={styles.walletLbl}>Income wallet</Text>
          </View>
          <View style={[styles.walletBox, { backgroundColor: Colors.blueLight }]}>
            <Text style={[styles.walletVal, { color: Colors.blue }]}>{fmt(user?.personalWalletETB || 0)}</Text>
            <Text style={[styles.walletLbl, { color: Colors.blue }]}>Personal wallet</Text>
          </View>
        </View>

        {/* Quick links */}
        <View style={styles.quickGrid}>
          {QUICK_LINKS.map(q => (
            <TouchableOpacity key={q.screen} style={styles.quickBtn} onPress={() => navigation.navigate(q.screen)} activeOpacity={0.8}>
              <Text style={styles.quickIcon}>{q.icon}</Text>
              <Text style={styles.quickLabel}>{q.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Tabs */}
        <View style={styles.tabRow}>
          {TABS.map(t => (
            <TouchableOpacity key={t.key} style={[styles.tabBtn, tab === t.key && styles.tabActive]} onPress={() => setTab(t.key)}>
              <Text style={[styles.tabText, tab === t.key && styles.tabTextActive]}>{t.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={{ paddingHorizontal: Spacing.lg }}>

          {/* Profile tab */}
          {tab === 'profile' && (
            <Card>
              <Input label="Full name" value={form.name} onChangeText={v => setForm(f => ({ ...f, name: v }))} />
              <Input label="Email" value={user?.email} editable={false} style={{ backgroundColor: Colors.bg, color: Colors.text3 }} />
              <Input label="Phone" value={form.phone} onChangeText={v => setForm(f => ({ ...f, phone: v }))} keyboardType="phone-pad" placeholder="09XXXXXXXX" />
              <View style={styles.refBox}>
                <Text style={styles.refLabel}>Referral code</Text>
                <Text style={styles.refCode}>{user?.referralCode}</Text>
              </View>
              <Button title="Save changes" onPress={saveProfile} loading={loading} />
            </Card>
          )}

          {/* Security tab */}
          {tab === 'security' && (
            <Card>
              <Input label="Current password" value={pwForm.currentPassword} onChangeText={v => setPwForm(f => ({ ...f, currentPassword: v }))} secureTextEntry placeholder="Current password" />
              <Input label="New password (min 6 chars)" value={pwForm.newPassword} onChangeText={v => setPwForm(f => ({ ...f, newPassword: v }))} secureTextEntry placeholder="New password" />
              <Button title="Update password" onPress={changePw} loading={loading} disabled={!pwForm.currentPassword || !pwForm.newPassword} />
            </Card>
          )}

          {/* Notifications tab */}
          {tab === 'notifs' && (
            <Card>
              <Text style={styles.notifTitle}>Notification preferences</Text>
              {NOTIF_LABELS.map((n, i) => (
                <View key={n.key}>
                  <Row style={{ justifyContent: 'space-between', paddingVertical: 14 }}>
                    <View style={{ flex: 1, marginRight: 12 }}>
                      <Text style={styles.notifLabel}>{n.label}</Text>
                      <Text style={styles.notifSub}>{n.sub}</Text>
                    </View>
                    <Switch
                      value={notifPrefs[n.key]}
                      onValueChange={v => setNotifPrefs(p => ({ ...p, [n.key]: v }))}
                      trackColor={{ false: Colors.border, true: Colors.primaryMid }}
                      thumbColor={notifPrefs[n.key] ? Colors.primary : '#f4f3f4'}
                    />
                  </Row>
                  {i < NOTIF_LABELS.length - 1 && <Divider />}
                </View>
              ))}
              <Button title="Save preferences" onPress={saveNotifs} loading={loading} style={{ marginTop: Spacing.md }} />
            </Card>
          )}

          {/* Sign out */}
          <Button title="Sign out" onPress={handleLogout} variant="outline" style={{ marginTop: Spacing.md, borderColor: Colors.red }} />
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:        { flex: 1, backgroundColor: Colors.bg },
  levelCard:   { padding: Spacing.xl, marginBottom: 0 },
  userName:    { fontSize: 18, fontWeight: '700', color: '#fff' },
  userEmail:   { fontSize: 13, color: 'rgba(255,255,255,0.8)', marginTop: 2 },
  levelPill:   { backgroundColor: 'rgba(255,255,255,0.25)', borderRadius: Radius.full, paddingHorizontal: 10, paddingVertical: 3 },
  levelPillText:{ fontSize: 11, color: '#fff', fontWeight: '700' },
  qualityText: { fontSize: 12, color: 'rgba(255,255,255,0.8)' },
  walletRow:   { flexDirection: 'row', padding: Spacing.lg, gap: 10 },
  walletBox:   { flex: 1, borderRadius: Radius.md, padding: Spacing.md, alignItems: 'center' },
  walletVal:   { fontSize: 16, fontWeight: '700', color: Colors.primaryDark },
  walletLbl:   { fontSize: 11, color: Colors.primaryDark, marginTop: 2 },
  quickGrid:   { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: Spacing.lg, gap: 10, marginBottom: Spacing.md },
  quickBtn:    { width: '47%', backgroundColor: Colors.surface, borderRadius: Radius.md, padding: Spacing.md, flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 0.5, borderColor: Colors.border },
  quickIcon:   { fontSize: 20 },
  quickLabel:  { fontSize: 12, fontWeight: '500', color: Colors.text, flex: 1 },
  tabRow:      { flexDirection: 'row', marginHorizontal: Spacing.lg, marginBottom: Spacing.md, backgroundColor: Colors.bg, borderRadius: Radius.md, padding: 3 },
  tabBtn:      { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: Radius.sm },
  tabActive:   { backgroundColor: Colors.surface, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 },
  tabText:     { fontSize: 13, fontWeight: '500', color: Colors.text3 },
  tabTextActive:{ color: Colors.text, fontWeight: '600' },
  refBox:      { backgroundColor: Colors.bg, borderRadius: Radius.sm, padding: Spacing.md, marginBottom: Spacing.md },
  refLabel:    { fontSize: 12, color: Colors.text3, marginBottom: 4 },
  refCode:     { fontSize: 18, fontWeight: '700', color: Colors.text, letterSpacing: 2 },
  notifTitle:  { fontSize: 15, fontWeight: '600', color: Colors.text, marginBottom: Spacing.sm },
  notifLabel:  { fontSize: 14, fontWeight: '500', color: Colors.text },
  notifSub:    { fontSize: 12, color: Colors.text3, marginTop: 2 },
});
