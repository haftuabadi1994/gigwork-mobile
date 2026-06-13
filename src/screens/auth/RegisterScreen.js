import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import { Input, Button } from '../../components/UI';
import { Colors, Spacing } from '../../utils/theme';
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

          <View style={styles.header}>
            <Text style={styles.title}>Create account</Text>
            <Text style={styles.sub}>Start earning today</Text>
          </View>

          <Input label="Full name" placeholder="Abebe Kebede" value={form.name} onChangeText={set('name')} autoCapitalize="words" />
          <Input label="Email address" placeholder="you@example.com" value={form.email} onChangeText={set('email')} keyboardType="email-address" autoCapitalize="none" />
          <Input label="Phone (optional)" placeholder="09XXXXXXXX" value={form.phone} onChangeText={set('phone')} keyboardType="phone-pad" />
          <Input label="Password" placeholder="At least 6 characters" value={form.password} onChangeText={set('password')} secureTextEntry />

          {/* Referral code */}
          <View style={{ marginBottom: Spacing.md }}>
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

          <Button title="Create account" onPress={handle} loading={loading} size="lg" />

          <TouchableOpacity style={styles.linkRow} onPress={() => navigation.navigate('Login')}>
            <Text style={styles.linkText}>Already have an account? <Text style={styles.link}>Sign in</Text></Text>
          </TouchableOpacity>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:    { flex: 1, backgroundColor: Colors.surface },
  container: { flexGrow: 1, padding: Spacing.xl, paddingTop: Spacing.xxl },
  header:  { marginBottom: Spacing.xl },
  title:   { fontSize: 26, fontWeight: '700', color: Colors.text },
  sub:     { fontSize: 14, color: Colors.text2, marginTop: 4 },
  linkRow: { marginTop: 20, alignItems: 'center' },
  linkText:{ fontSize: 14, color: Colors.text2 },
  link:    { color: Colors.primary, fontWeight: '600' },
});
