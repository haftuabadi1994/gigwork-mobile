import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import { Input, Button } from '../../components/UI';
import { Colors, Spacing, Fonts } from '../../utils/theme';

export default function LoginScreen({ navigation }) {
  const { login } = useAuth();
  const [form, setForm]       = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);

  const handle = async () => {
    if (!form.email || !form.password) {
      Alert.alert('Error', 'Please enter your email and password.');
      return;
    }
    setLoading(true);
    try {
      await login(form.email.trim().toLowerCase(), form.password);
    } catch (err) {
      Alert.alert('Login failed', err.response?.data?.error || 'Check your credentials and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">

          {/* Logo */}
          <View style={styles.logoWrap}>
            <View style={styles.logoCircle}>
              <Text style={styles.logoText}>G</Text>
            </View>
            <Text style={styles.appName}>GigWork</Text>
            <Text style={styles.tagline}>Earn money completing real tasks 🇪🇹</Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
            <Input
              label="Email address"
              placeholder="you@example.com"
              value={form.email}
              onChangeText={v => setForm(f => ({ ...f, email: v }))}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
            <Input
              label="Password"
              placeholder="••••••••"
              value={form.password}
              onChangeText={v => setForm(f => ({ ...f, password: v }))}
              secureTextEntry
            />

            <Button title="Sign in" onPress={handle} loading={loading} size="lg" style={{ marginTop: 8 }} />

            <TouchableOpacity style={styles.linkRow} onPress={() => navigation.navigate('Register')}>
              <Text style={styles.linkText}>Don't have an account? <Text style={styles.link}>Sign up</Text></Text>
            </TouchableOpacity>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:      { flex: 1, backgroundColor: Colors.surface },
  container: { flexGrow: 1, padding: Spacing.xl, justifyContent: 'center' },
  logoWrap:  { alignItems: 'center', marginBottom: 40 },
  logoCircle:{ width: 72, height: 72, borderRadius: 36, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  logoText:  { fontSize: 36, fontWeight: '800', color: '#fff' },
  appName:   { fontSize: 28, fontWeight: '700', color: Colors.primary },
  tagline:   { fontSize: 14, color: Colors.text2, marginTop: 6, textAlign: 'center' },
  form:      { gap: 4 },
  linkRow:   { marginTop: 20, alignItems: 'center' },
  linkText:  { fontSize: 14, color: Colors.text2 },
  link:      { color: Colors.primary, fontWeight: '600' },
});
