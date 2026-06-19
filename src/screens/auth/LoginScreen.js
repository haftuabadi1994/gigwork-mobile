import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  KeyboardAvoidingView, Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import { Input, Button, Divider } from '../../components/UI';
import { Colors, Spacing, Radius, Shadow } from '../../utils/theme';

export default function LoginScreen({ navigation }) {
  const { login } = useAuth();
  const [form, setForm]         = useState({ email: '', password: '' });
  const [loading, setLoading]   = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [errors, setErrors]     = useState({});

  const validate = () => {
    const e = {};
    if (!form.email.trim())             e.email    = 'Email is required';
    else if (!form.email.includes('@')) e.email    = 'Enter a valid email';
    if (!form.password.trim())          e.password = 'Password is required';
    else if (form.password.length < 6)  e.password = 'Password must be at least 6 characters';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handle = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      await login(form.email.trim().toLowerCase(), form.password);
    } catch (err) {
      const msg = err.response?.data?.error || 'Check your credentials and try again.';
      setErrors({ general: msg });
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >

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
            <Text style={styles.cardTitle}>Welcome back </Text>
            <Text style={styles.cardSub}>Sign in to continue earning</Text>

            {errors.general && (
              <View style={styles.errorBanner}>
                <Text style={styles.errorBannerText}>❌ {errors.general}</Text>
              </View>
            )}

            <View style={{ gap: 4, marginTop: Spacing.md }}>
              <Input
                label="Email address"
                placeholder="you@example.com"
                value={form.email}
                onChangeText={v => { setForm(f => ({ ...f, email: v })); setErrors(e => ({ ...e, email: null })); }}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                leftIcon="✉️"
                error={errors.email}
              />
              <Input
                label="Password"
                placeholder="••••••••"
                value={form.password}
                onChangeText={v => { setForm(f => ({ ...f, password: v })); setErrors(e => ({ ...e, password: null })); }}
                secureTextEntry={!showPass}
                leftIcon="🔒"
                rightIcon={showPass ? '🙈' : '👁️'}
                onRightIconPress={() => setShowPass(p => !p)}
                error={errors.password}
              />
            </View>

            <TouchableOpacity style={styles.forgotRow}>
              <Text style={styles.forgotText}>Forgot password?</Text>
            </TouchableOpacity>

            <Button
              title="Sign in"
              onPress={handle}
              loading={loading}
              size="lg"
              icon="🚀"
              style={{ marginTop: Spacing.md }}
            />

            <Divider label="or" style={{ marginVertical: Spacing.lg }} />

            <TouchableOpacity
              style={styles.registerBtn}
              onPress={() => navigation.navigate('Register')}
              activeOpacity={0.8}
            >
              <Text style={styles.registerText}>
                Don't have an account?{'  '}
                <Text style={styles.registerLink}>Create one free →</Text>
              </Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.footer}>
            By signing in you agree to our Terms & Privacy Policy
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

  errorBanner:     { backgroundColor: Colors.redLight, borderRadius: Radius.md, padding: Spacing.md, marginTop: Spacing.sm, borderLeftWidth: 3, borderLeftColor: Colors.red },
  errorBannerText: { fontSize: 13, color: Colors.red, fontWeight: '500' },

  forgotRow:  { alignItems: 'flex-end', marginTop: 4 },
  forgotText: { fontSize: 13, color: Colors.primary, fontWeight: '600' },

  registerBtn:  { alignItems: 'center', paddingVertical: Spacing.sm },
  registerText: { fontSize: 14, color: Colors.text2 },
  registerLink: { color: Colors.primary, fontWeight: '700' },

  footer: { textAlign: 'center', fontSize: 11, color: Colors.text4, marginTop: Spacing.lg, lineHeight: 16 },
});
