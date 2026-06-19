import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Alert, Switch, Share, Modal
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import QRCode from 'react-native-qrcode-svg';
import { useAuth } from '../../context/AuthContext';
import { useCurrency } from '../../context/CurrencyContext';
import { useLanguage } from '../../context/LanguageContext';
import { Card, Input, Button, Avatar, Row, Divider } from '../../components/UI';
import { Colors, Spacing, Radius, Shadow } from '../../utils/theme';
import api from '../../utils/api';

const LEVEL_COLORS = Colors.levels;

export default function ProfileScreen({ navigation }) {
  const { user, logout, refreshUser } = useAuth();
  const { fmt } = useCurrency();
  const { t, language, toggle } = useLanguage();

  const [tab, setTab]         = useState('profile');
  const [form, setForm]       = useState({ name: user?.name || '', phone: user?.phone || '' });
  const [pwForm, setPwForm]   = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [notifPrefs, setNotifPrefs] = useState(
    user?.notifPrefs || { tasks: true, income: true, referrals: true, wallet: true, team: true }
  );
  const [loading, setLoading]   = useState(false);
  const [showCurr, setShowCurr] = useState(false);
  const [showNew,  setShowNew]  = useState(false);
  const [pwError,  setPwError]  = useState('');
  const [showQR,   setShowQR]   = useState(false);

  const levelColor = typeof LEVEL_COLORS[user?.level || 'intern'] === 'object'
    ? LEVEL_COLORS[user?.level || 'intern'].color
    : LEVEL_COLORS[user?.level || 'intern'] || Colors.primary;

  const NOTIF_LABELS = [
    { key: 'tasks',     icon: '📋', label: t('notifTasks'),     sub: t('notifTasksSub') },
    { key: 'income',    icon: '💰', label: t('notifIncome'),    sub: t('notifIncomeSub') },
    { key: 'referrals', icon: '👥', label: t('notifReferrals'), sub: t('notifReferralsSub') },
    { key: 'wallet',    icon: '💳', label: t('notifWallet'),    sub: t('notifWalletSub') },
    { key: 'team',      icon: '🤝', label: t('notifTeam'),      sub: t('notifTeamSub') },
  ];

  const QUICK_LINKS = [
    { icon: '💳', label: language === 'am' ? 'የፋይናንስ መዝገቦች' : 'Financial records', screen: 'Records',  color: Colors.blueLight,    textColor: Colors.blue },
    { icon: '📖', label: language === 'am' ? 'መምሪያ'           : 'Handbook',          screen: 'Handbook', color: Colors.amberLight,   textColor: Colors.amber },
    { icon: '📤', label: language === 'am' ? 'ጓደኞችን ጋብዝ'    : 'Invite friends',    screen: 'Invite',   color: Colors.primaryLight, textColor: Colors.primary },
    { icon: '💰', label: language === 'am' ? 'ገቢ'             : 'Income',            screen: 'Income',   color: Colors.purpleLight,  textColor: Colors.purple },
  ];

  const TABS = [
    { key: 'profile',  label: t('profile'),       icon: '👤' },
    { key: 'security', label: t('changePassword'), icon: '🔒' },
    { key: 'notifs',   label: t('notifications'),  icon: '🔔' },
  ];

  const saveProfile = async () => {
    if (!form.name.trim()) { Alert.alert(t('error'), t('fullName') + ' ' + t('required')); return; }
    setLoading(true);
    try {
      await api.patch('/auth/update-profile', form);
      await refreshUser();
      Alert.alert('✅', t('saveChanges') + '!');
    } catch { Alert.alert(t('error'), 'Failed to update profile.'); }
    finally { setLoading(false); }
  };

  const changePw = async () => {
    setPwError('');
    if (pwForm.newPassword.length < 6) { setPwError(language === 'am' ? 'አዲስ ፓስወርድ ቢያንስ 6 ቁምፊዎች መሆን አለበት።' : 'New password must be at least 6 characters.'); return; }
    if (pwForm.newPassword !== pwForm.confirmPassword) { setPwError(language === 'am' ? 'ፓስወርዶች አይዛመዱም።' : 'Passwords do not match.'); return; }
    setLoading(true);
    try {
      await api.patch('/auth/change-password', { currentPassword: pwForm.currentPassword, newPassword: pwForm.newPassword });
      Alert.alert('✅', language === 'am' ? 'ፓስወርድ ተቀይሯል!' : 'Your password has been changed.');
      setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (e) { setPwError(e.response?.data?.error || 'Failed to change password.'); }
    finally { setLoading(false); }
  };

  const saveNotifs = async () => {
    setLoading(true);
    try {
      await api.patch('/auth/update-profile', { notifPrefs });
      Alert.alert('✅', language === 'am' ? 'ምርጫዎች ተቀምጠዋል!' : 'Notification preferences updated.');
    } catch { Alert.alert(t('error'), 'Failed.'); }
    finally { setLoading(false); }
  };

  const handleLogout = () => {
    Alert.alert(t('signOut'), t('signOutConfirm'), [
      { text: t('cancel'), style: 'cancel' },
      { text: t('signOut'), style: 'destructive', onPress: logout },
    ]);
  };

  const shareReferral = async () => {
    try {
      await Share.share({
        message: language === 'am'
          ? `ስራ-Sira ይቀላቀሉ እና ተግባሮችን በማጠናቀቅ ገንዘብ ያግኙ! የሪፈራል ኮዴን ይጠቀሙ: ${user?.referralCode} 🇪🇹`
          : `Join ስራ-Sira and earn money completing tasks! Use my referral code: ${user?.referralCode}\nDownload the app now 🇪🇹`,
      });
    } catch {}
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 48 }}>

        {/* ── Hero ── */}
        <View style={[styles.heroCard, { backgroundColor: levelColor }]}>
          <Row style={{ gap: 12 }}>
            <Avatar name={user?.name} size={52} color="rgba(6, 130, 74, 0.3)" />
            <View style={{ flex: 1 }}>
              <Text style={styles.userName}>{user?.name}</Text>
              <Text style={styles.userEmail}>{user?.email}</Text>
            </View>
            <Row style={{ gap: 8 }}>
              {/* Language toggle */}
              <TouchableOpacity onPress={toggle} style={styles.langBtn}>
                <Text style={styles.langBtnText}>{language === 'en' ? 'አማ' : 'ENG'}</Text>
              </TouchableOpacity>
              <View style={styles.levelPill}>
                <Text style={styles.levelPillText}>{(user?.level || 'intern').toUpperCase()}</Text>
              </View>
            </Row>
          </Row>
        </View>

        {/* ── Quick Links ── */}
        <View style={styles.quickGrid}>
          {QUICK_LINKS.map(q => (
            <TouchableOpacity
              key={q.screen}
              style={[styles.quickBtn, { backgroundColor: q.color }]}
              onPress={() => navigation.navigate(q.screen)}
              activeOpacity={0.8}
            >
              <Text style={styles.quickIcon}>{q.icon}</Text>
              <Text style={[styles.quickLabel, { color: q.textColor }]}>{q.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* ── Tabs ── */}
        <View style={styles.tabRow}>
          {TABS.map(tb => (
            <TouchableOpacity
              key={tb.key}
              style={[styles.tabBtn, tab === tb.key && styles.tabActive]}
              onPress={() => setTab(tb.key)}
              activeOpacity={0.75}
            >
              <Text style={styles.tabIcon}>{tb.icon}</Text>
              <Text style={[styles.tabText, tab === tb.key && styles.tabTextActive]}>{tb.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* ── Tab Content ── */}
        <View style={{ paddingHorizontal: Spacing.lg }}>

          {/* Profile tab */}
          {tab === 'profile' && (
            <Card>
              <Text style={styles.cardTitle}>{t('personalInfo')}</Text>
              <Input
                label={t('fullName')}
                value={form.name}
                onChangeText={v => setForm(f => ({ ...f, name: v }))}
                leftIcon="👤"
                placeholder={t('fullName')}
              />
              <Input
                label={t('emailAddress')}
                value={user?.email}
                editable={false}
                leftIcon="✉️"
                style={{ opacity: 0.6 }}
                hint={t('emailHint')}
              />
              <Input
                label={t('phoneNumber')}
                value={form.phone}
                onChangeText={v => setForm(f => ({ ...f, phone: v }))}
                keyboardType="phone-pad"
                leftIcon="📱"
                placeholder="09XXXXXXXX"
              />

              <Divider style={{ marginVertical: Spacing.md }} />

              <Text style={styles.cardTitle}>{t('referralCode')}</Text>
              <View style={styles.refBox}>
                <View>
                  <Text style={styles.refCode}>{user?.referralCode}</Text>
                  <Text style={styles.refSub}>{t('shareEarn')}</Text>
                </View>
                <Row style={{ gap: 8 }}>
                  <TouchableOpacity style={styles.refBtn} onPress={() => setShowQR(true)}>
                    <Text style={styles.refBtnText}>📷</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.refBtn, { backgroundColor: Colors.primary }]} onPress={shareReferral}>
                    <Text style={styles.refBtnText}>📤</Text>
                  </TouchableOpacity>
                </Row>
              </View>

              <Button
                title={t('saveChanges')}
                onPress={saveProfile}
                loading={loading}
                icon="💾"
                style={{ marginTop: Spacing.sm }}
              />
            </Card>
          )}

          {/* Security tab */}
          {tab === 'security' && (
            <Card>
              <Text style={styles.cardTitle}>{t('changePassword')}</Text>
              <Text style={styles.cardSub}>
                {language === 'am' ? 'ቢያንስ 6 ቁምፊዎች ያለው ጠንካራ ፓስወርድ ይምረጡ።' : 'Choose a strong password with at least 6 characters.'}
              </Text>

              {!!pwError && (
                <View style={styles.pwErrorBox}>
                  <Text style={styles.pwErrorText}>⚠ {pwError}</Text>
                </View>
              )}

              <Input
                label={t('currentPassword')}
                value={pwForm.currentPassword}
                onChangeText={v => { setPwForm(f => ({ ...f, currentPassword: v })); setPwError(''); }}
                secureTextEntry={!showCurr}
                leftIcon="🔒"
                rightIcon={showCurr ? '🙈' : '👁️'}
                onRightIconPress={() => setShowCurr(p => !p)}
                placeholder={t('currentPassword')}
              />
              <Input
                label={t('newPassword')}
                value={pwForm.newPassword}
                onChangeText={v => { setPwForm(f => ({ ...f, newPassword: v })); setPwError(''); }}
                secureTextEntry={!showNew}
                leftIcon="🔑"
                rightIcon={showNew ? '🙈' : '👁️'}
                onRightIconPress={() => setShowNew(p => !p)}
                placeholder={language === 'am' ? 'ቢያንስ 6 ቁምፊዎች' : 'Min 6 characters'}
              />
              <Input
                label={t('confirmPassword')}
                value={pwForm.confirmPassword}
                onChangeText={v => { setPwForm(f => ({ ...f, confirmPassword: v })); setPwError(''); }}
                secureTextEntry
                leftIcon="✅"
                placeholder={language === 'am' ? 'አዲስ ፓስወርድ ድገሙ' : 'Repeat new password'}
              />

              {pwForm.newPassword.length > 0 && (
                <View style={{ marginBottom: Spacing.md }}>
                  <Text style={styles.strengthLabel}>
                    {t('strength')}: {pwForm.newPassword.length < 6 ? `🔴 ${t('weak')}` : pwForm.newPassword.length < 10 ? `🟡 ${t('fair')}` : `🟢 ${t('strong')}`}
                  </Text>
                  <View style={styles.strengthBg}>
                    <View style={[styles.strengthFill, {
                      width: pwForm.newPassword.length < 6 ? '25%' : pwForm.newPassword.length < 10 ? '60%' : '100%',
                      backgroundColor: pwForm.newPassword.length < 6 ? Colors.red : pwForm.newPassword.length < 10 ? Colors.amber : Colors.primary,
                    }]} />
                  </View>
                </View>
              )}

              <Button
                title={t('updatePassword')}
                onPress={changePw}
                loading={loading}
                icon="🔐"
                disabled={!pwForm.currentPassword || !pwForm.newPassword || !pwForm.confirmPassword}
              />
            </Card>
          )}

          {/* Notifications tab */}
          {tab === 'notifs' && (
            <Card>
              <Text style={styles.cardTitle}>{t('notifPrefs')}</Text>
              <Text style={styles.cardSub}>{t('notifSub')}</Text>

              {NOTIF_LABELS.map((n, i) => (
                <View key={n.key}>
                  <Row style={{ justifyContent: 'space-between', paddingVertical: 14 }}>
                    <Row style={{ gap: 12, flex: 1, marginRight: 12 }}>
                      <View style={[styles.notifIconBox, { backgroundColor: notifPrefs[n.key] ? Colors.primaryLight : Colors.bg }]}>
                        <Text style={{ fontSize: 18 }}>{n.icon}</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.notifLabel}>{n.label}</Text>
                        <Text style={styles.notifSub}>{n.sub}</Text>
                      </View>
                    </Row>
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

              <Button
                title={t('savePrefs')}
                onPress={saveNotifs}
                loading={loading}
                icon="💾"
                style={{ marginTop: Spacing.md }}
              />
            </Card>
          )}

          {/* Sign out */}
          <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.8}>
            <Text style={styles.logoutText}>🚪 {t('signOut')}</Text>
          </TouchableOpacity>

          <Text style={styles.version}>ስራ-Sira v1.0.0 · Made in Ethiopia 🇪🇹</Text>

        </View>
      </ScrollView>

      {/* ── QR Code Modal ── */}
      <Modal visible={showQR} transparent animationType="fade" onRequestClose={() => setShowQR(false)}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowQR(false)}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>
              {language === 'am' ? 'የሪፈራል QR ኮዴ' : 'My Referral QR Code'}
            </Text>
            <Text style={styles.modalSub}>
              {language === 'am' ? 'ጓደኞች ኮዴን ለመስጠት ይቃኙ' : 'Let friends scan this to sign up with your code'}
            </Text>
            <View style={styles.qrWrapper}>
              <QRCode
                value={user?.referralCode || 'SIRA'}
                size={200}
                color={Colors.text}
                backgroundColor="#ffffff"
              />
            </View>
            <Text style={styles.qrCode}>{user?.referralCode}</Text>
            <TouchableOpacity style={styles.modalShareBtn} onPress={() => { setShowQR(false); shareReferral(); }}>
              <Text style={styles.modalShareText}>📤  {t('shareEarn')}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setShowQR(false)}>
              <Text style={styles.modalClose}>{t('cancel')}</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:          { flex: 1, backgroundColor: Colors.bg },

  // Hero
  heroCard:      { padding: Spacing.lg, paddingVertical: Spacing.xl, borderBottomWidth: 0 },
  userName:      { fontSize: 16, fontWeight: '700', color: '#fff' },
  userEmail:     { fontSize: 13, color: 'rgba(255,255,255,0.75)', marginTop: 2 },
  levelPill:     { borderRadius: Radius.full, paddingHorizontal: 10, paddingVertical: 4, backgroundColor: 'rgba(255,255,255,0.25)' },
  levelPillText: { fontSize: 10, color: '#fff', fontWeight: '700' },
  langBtn:       { paddingHorizontal: 8, paddingVertical: 4, borderRadius: Radius.full, borderWidth: 1, borderColor: 'rgba(255,255,255,0.4)', backgroundColor: 'rgba(255,255,255,0.15)' },
  langBtnText:   { fontSize: 12, fontWeight: '700', color: '#fff' },

  // Quick links
  quickGrid:     { flexDirection: 'row', flexWrap: 'wrap', padding: Spacing.lg, gap: 10 },
  quickBtn:      { width: '47%', borderRadius: Radius.lg, padding: Spacing.md, flexDirection: 'row', alignItems: 'center', gap: 10 },
  quickIcon:     { fontSize: 22 },
  quickLabel:    { fontSize: 13, fontWeight: '700', flex: 1 },

  // Tabs
  tabRow:        { flexDirection: 'row', marginHorizontal: Spacing.lg, marginBottom: Spacing.md, backgroundColor: Colors.border + '60', borderRadius: Radius.lg, padding: 3 },
  tabBtn:        { flex: 1, paddingVertical: 9, alignItems: 'center', borderRadius: Radius.md, gap: 2 },
  tabActive:     { backgroundColor: Colors.surface, ...Shadow.sm },
  tabIcon:       { fontSize: 14 },
  tabText:       { fontSize: 11, fontWeight: '500', color: Colors.text3 },
  tabTextActive: { color: Colors.text, fontWeight: '700' },

  // Card
  cardTitle:     { fontSize: 15, fontWeight: '700', color: Colors.text, marginBottom: 4 },
  cardSub:       { fontSize: 13, color: Colors.text3, marginBottom: Spacing.md, lineHeight: 18 },

  // Referral
  refBox:        { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: Colors.bg, borderRadius: Radius.md, padding: Spacing.md, marginBottom: Spacing.md, borderWidth: 1, borderColor: Colors.border },
  refCode:       { fontSize: 22, fontWeight: '800', color: Colors.text, letterSpacing: 3 },
  refSub:        { fontSize: 11, color: Colors.text3, marginTop: 2 },
  refBtn:        { width: 36, height: 36, borderRadius: 10, backgroundColor: Colors.bg, borderWidth: 1, borderColor: Colors.border, alignItems: 'center', justifyContent: 'center' },
  refBtnText:    { fontSize: 16 },

  // Password
  pwErrorBox:    { backgroundColor: Colors.redLight, borderRadius: Radius.md, padding: Spacing.md, marginBottom: Spacing.md, borderLeftWidth: 3, borderLeftColor: Colors.red },
  pwErrorText:   { fontSize: 13, color: Colors.red, fontWeight: '500' },
  strengthLabel: { fontSize: 12, color: Colors.text3, marginBottom: 6 },
  strengthBg:    { height: 4, backgroundColor: Colors.border, borderRadius: 2, overflow: 'hidden' },
  strengthFill:  { height: 4, borderRadius: 2 },

  // Notifications
  notifIconBox:  { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  notifLabel:    { fontSize: 14, fontWeight: '600', color: Colors.text },
  notifSub:      { fontSize: 12, color: Colors.text3, marginTop: 1 },

  // Logout
  logoutBtn:     { marginTop: Spacing.md, padding: Spacing.md, borderRadius: Radius.lg, backgroundColor: Colors.redLight, alignItems: 'center', borderWidth: 1, borderColor: Colors.red + '40' },
  logoutText:    { fontSize: 15, fontWeight: '700', color: Colors.red },

  // Footer
  version:       { textAlign: 'center', fontSize: 11, color: Colors.text4, marginTop: Spacing.lg },

  // QR Modal
  modalOverlay:  { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'center', alignItems: 'center', padding: Spacing.lg },
  modalCard:     { backgroundColor: Colors.surface, borderRadius: Radius.xl, padding: Spacing.xl, alignItems: 'center', width: '100%', maxWidth: 340, ...Shadow.lg },
  modalTitle:    { fontSize: 17, fontWeight: '800', color: Colors.text, marginBottom: 4 },
  modalSub:      { fontSize: 13, color: Colors.text3, textAlign: 'center', marginBottom: Spacing.lg },
  qrWrapper:     { padding: 16, backgroundColor: '#ffffff', borderRadius: Radius.lg, marginBottom: Spacing.md, ...Shadow.sm },
  qrCode:        { fontSize: 20, fontWeight: '800', color: Colors.text, letterSpacing: 4, marginBottom: Spacing.lg },
  modalShareBtn: { backgroundColor: Colors.primary, borderRadius: Radius.lg, paddingHorizontal: Spacing.xl, paddingVertical: 12, marginBottom: Spacing.md, width: '100%', alignItems: 'center' },
  modalShareText:{ fontSize: 14, fontWeight: '700', color: '#fff' },
  modalClose:    { fontSize: 14, color: Colors.text3, paddingVertical: 8 },
});