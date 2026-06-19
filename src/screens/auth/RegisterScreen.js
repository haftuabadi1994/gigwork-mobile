import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import { Input, Button } from '../../components/UI';
import { Colors, Spacing, Radius, Shadow } from '../../utils/theme';
import api from '../../utils/api';

export default function RegisterScreen({ navigation, route }) {
  const { register } = useAuth();
  const [form, setForm] = useState({
    name: '', email: '', password: '', phone: '',
    referralCode: route?.params?.ref || ''
  });
  const [refValid, setRefValid] = useState(null);
  const [loading, setLoading]   = useState(false);

  useEffect(() => {
    if (form.referralCode.length >= 6) {
      api.get(`/referral/validate/${form.referralCode}`)
        .then(r => setRefValid(r.data))
        .catch(() => setRefValid({ valid: false }));
    } else {
      setRefValid(null);
    }
  }, [form.referralCode]);

  const handle = async () => {
    if (!form.name || !form.email || !form.password) {
      Alert.alert('Error', 'Name, email and password are required.');
      return;
    }
    if (form.password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters.');
      return;
    }
    setLoading(true);
    try {
      await register({ ...form, email: form.email.trim().toLowerCase() });
    } catch (err) {
      Alert.alert('Registration failed', err.response?.data?.error || err.response?.data?.errors?.[0]?.msg || 'Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const set = (key) => (val) => setForm(f => ({ ...f, [key]: val }));

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">

          {/* ── Hero Header ── */}
          <View style={styles.hero}>
            <View style={styles.blob1} />
            <View style={styles.blob2} />

            <View style={styles.badge}>
              <Text style={styles.badgeText}>🇪🇹  Made for Ethiopia</Text>
            </View>

            <View style={styles.wordmarkRow}>
              <View style={styles.wordmarkBox}>
                <Text style={styles.wordmarkLetter}>ስ</Text>
              </View>
              <View>
                <Text style={styles.wordmarkTitle}>ስራ-Sira</Text>
                <Text style={styles.wordmarkSub}>Work · Earn · Grow</Text>
              </View>
            </View>
          </View>

          {/* ── Card ── */}
          <View style={[styles.card, Shadow.md]}>
            <Text style={styles.cardTitle}>Create account </Text>
            <Text style={styles.cardSub}>Start earning today</Text>

            <View style={{ gap: 4, marginTop: Spacing.md }}>
              <Input label="Full name" placeholder="Abebe Kebede" value={form.name} onChangeText={set('name')} autoCapitalize="words" />
              <Input label="Email address" placeholder="you@example.com" value={form.email} onChangeText={set('email')} keyboardType="email-address" autoCapitalize="none" />
              <Input label="Phone (optional)" placeholder="09XXXXXXXX" value={form.phone} onChangeText={set('phone')} keyboardType="phone-pad" />
              <Input label="Password" placeholder="At least 6 characters" value={form.password} onChangeText={set('password')} secureTextEntry />
            </View>

            {/* Referral code */}
            <View style={{ marginTop: Spacing.sm }}>
              <Input
                label="Referral code (optional)"
                placeholder="e.g. GW-A1B2C3"
                value={form.referralCode}
                onChangeText={set('referralCode')}
                autoCapitalize="characters"
                style={refValid ? { borderColor: refValid.valid ? Colors.primary : Colors.red } : {}}
              />
              {refValid?.valid && (
                <Text style={{ fontSize: 12, color: Colors.primary, marginTop: -8, marginBottom: 8 }}>
                  ✅ Valid — referred by {refValid.referrerName}
                </Text>
              )}
              {refValid && !refValid.valid && (
                <Text style={{ fontSize: 12, color: Colors.red, marginTop: -8, marginBottom: 8 }}>
                  ❌ Invalid referral code
                </Text>
              )}
            </View>

            <Button title="Create account" onPress={handle} loading={loading} size="lg" style={{ marginTop: Spacing.md }} />

            <TouchableOpacity style={styles.linkRow} onPress={() => navigation.navigate('Login')}>
              <Text style={styles.linkText}>
                Already have an account?{'  '}
                <Text style={styles.link}>Sign in →</Text>
              </Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.footer}>
            By creating an account you agree to our Terms & Privacy Policy
          </Text>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:      { flex: 1, backgroundColor: Colors.bg },
  container: { flexGrow: 1, padding: Spacing.lg, paddingBottom: Spacing.xl },

  hero:      { backgroundColor: Colors.primary, borderRadius: Radius.xl, padding: Spacing.xl, marginBottom: Spacing.lg, overflow: 'hidden', position: 'relative', minHeight: 140, justifyContent: 'flex-end' },
  blob1:     { position: 'absolute', width: 220, height: 220, borderRadius: 110, backgroundColor: 'rgba(255,255,255,0.07)', top: -80, right: -60 },
  blob2:     { position: 'absolute', width: 140, height: 140, borderRadius: 70,  backgroundColor: 'rgba(255,255,255,0.05)', top: 20,  left: -40 },

  badge:          { alignSelf: 'flex-start', backgroundColor: 'rgba(255,255,255,0.18)', borderRadius: Radius.full, paddingHorizontal: 12, paddingVertical: 5, marginBottom: Spacing.md },
  badgeText:      { fontSize: 11, color: '#fff', fontWeight: '700', letterSpacing: 0.3 },

  wordmarkRow:    { flexDirection: 'row', alignItems: 'center', gap: 12 },
  wordmarkBox:    { width: 52, height: 52, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  wordmarkLetter: { fontSize: 26, color: '#fff', fontWeight: '800' },
  wordmarkTitle:  { fontSize: 26, fontWeight: '800', color: '#fff', letterSpacing: -0.5 },
  wordmarkSub:    { fontSize: 11, color: 'rgba(255,255,255,0.7)', fontWeight: '600', marginTop: 2 },

  card:      { backgroundColor: Colors.surface, borderRadius: Radius.xl, padding: Spacing.xl, borderWidth: 0.5, borderColor: Colors.border },
  cardTitle: { fontSize: 22, fontWeight: '800', color: Colors.text, marginBottom: 4 },
  cardSub:   { fontSize: 14, color: Colors.text3, marginBottom: 4 },

  linkRow:  { marginTop: Spacing.lg, alignItems: 'center' },
  linkText: { fontSize: 14, color: Colors.text2 },
  link:     { color: Colors.primary, fontWeight: '700' },

  footer: { textAlign: 'center', fontSize: 11, color: Colors.text4, marginTop: Spacing.lg, lineHeight: 16 },
});
