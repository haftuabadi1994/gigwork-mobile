import React from 'react';
import { View, Text, TouchableOpacity, TextInput, ActivityIndicator, StyleSheet } from 'react-native';
import { Colors, Spacing, Radius, Fonts, Shadow } from '../utils/theme';

// ── Button ────────────────────────────────────────────────────────────────────
export function Button({ title, onPress, variant = 'primary', size = 'md', disabled, loading, icon, style }) {
  const bg = variant === 'primary' ? Colors.primary
    : variant === 'danger'   ? Colors.red
    : variant === 'outline'  ? 'transparent'
    : Colors.bg;

  const textColor = variant === 'primary' ? '#fff'
    : variant === 'danger'  ? '#fff'
    : variant === 'outline' ? Colors.primary
    : Colors.text;

  const borderColor = variant === 'outline' ? Colors.primary : 'transparent';
  const pad = size === 'sm' ? { paddingVertical: 8, paddingHorizontal: 14 }
            : size === 'lg' ? { paddingVertical: 15, paddingHorizontal: 24 }
            : { paddingVertical: 13, paddingHorizontal: 20 };

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
      style={[styles.btn, { backgroundColor: bg, borderColor, borderWidth: variant === 'outline' ? 1.5 : 0, opacity: disabled ? 0.5 : 1 }, pad, style]}
    >
      {loading
        ? <ActivityIndicator color={textColor} size="small" />
        : <Text style={[styles.btnText, { color: textColor, fontSize: size === 'sm' ? 13 : 15 }]}>{icon}{icon ? ' ' : ''}{title}</Text>
      }
    </TouchableOpacity>
  );
}

// ── Card ──────────────────────────────────────────────────────────────────────
export function Card({ children, style, onPress }) {
  if (onPress) {
    return (
      <TouchableOpacity activeOpacity={0.85} onPress={onPress} style={[styles.card, Shadow.sm, style]}>
        {children}
      </TouchableOpacity>
    );
  }
  return <View style={[styles.card, Shadow.sm, style]}>{children}</View>;
}

// ── Badge ─────────────────────────────────────────────────────────────────────
const BADGE_STYLES = {
  green:  { bg: Colors.primaryLight, text: Colors.primaryDark },
  amber:  { bg: Colors.amberLight,   text: '#854F0B' },
  blue:   { bg: Colors.blueLight,    text: '#185FA5' },
  red:    { bg: Colors.redLight,     text: '#A32D2D' },
  gray:   { bg: '#F1EFE8',           text: '#5F5E5A' },
  purple: { bg: Colors.purpleLight,  text: '#5B21B6' },
};
export function Badge({ label, color = 'gray' }) {
  const s = BADGE_STYLES[color] || BADGE_STYLES.gray;
  return (
    <View style={[styles.badge, { backgroundColor: s.bg }]}>
      <Text style={[styles.badgeText, { color: s.text }]}>{label}</Text>
    </View>
  );
}

// ── Input ─────────────────────────────────────────────────────────────────────
export function Input({ label, error, style, ...props }) {
  return (
    <View style={{ marginBottom: Spacing.md }}>
      {label && <Text style={styles.label}>{label}</Text>}
      <TextInput
        style={[styles.input, error && { borderColor: Colors.red }, style]}
        placeholderTextColor={Colors.text3}
        {...props}
      />
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
}

// ── Avatar ────────────────────────────────────────────────────────────────────
export function Avatar({ name, size = 40, color = Colors.primary }) {
  const initials = name?.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || '?';
  return (
    <View style={[styles.avatar, { width: size, height: size, borderRadius: size / 2, backgroundColor: color + '22' }]}>
      <Text style={[styles.avatarText, { color, fontSize: size * 0.35 }]}>{initials}</Text>
    </View>
  );
}

// ── Section Header ────────────────────────────────────────────────────────────
export function SectionHeader({ title, action, onAction }) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {action && <TouchableOpacity onPress={onAction}><Text style={styles.sectionAction}>{action}</Text></TouchableOpacity>}
    </View>
  );
}

// ── Empty State ───────────────────────────────────────────────────────────────
export function EmptyState({ icon = '📋', title, subtitle, action, onAction }) {
  return (
    <View style={styles.empty}>
      <Text style={styles.emptyIcon}>{icon}</Text>
      <Text style={styles.emptyTitle}>{title}</Text>
      {subtitle && <Text style={styles.emptySub}>{subtitle}</Text>}
      {action && <Button title={action} onPress={onAction} style={{ marginTop: Spacing.md }} />}
    </View>
  );
}

// ── Stat Card ─────────────────────────────────────────────────────────────────
export function StatCard({ label, value, bg = Colors.primaryLight, textColor = Colors.primaryDark }) {
  return (
    <View style={[styles.statCard, { backgroundColor: bg }]}>
      <Text style={[styles.statLabel, { color: textColor }]}>{label}</Text>
      <Text style={[styles.statValue, { color: textColor }]}>{value}</Text>
    </View>
  );
}

// ── Divider ───────────────────────────────────────────────────────────────────
export function Divider() {
  return <View style={styles.divider} />;
}

// ── Row ───────────────────────────────────────────────────────────────────────
export function Row({ children, style }) {
  return <View style={[{ flexDirection: 'row', alignItems: 'center' }, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  btn:       { borderRadius: Radius.md, alignItems: 'center', justifyContent: 'center', flexDirection: 'row' },
  btnText:   { fontWeight: '600' },
  card:      { backgroundColor: Colors.surface, borderRadius: Radius.lg, padding: Spacing.lg, borderWidth: 0.5, borderColor: Colors.border },
  badge:     { borderRadius: Radius.full, paddingHorizontal: 9, paddingVertical: 3, alignSelf: 'flex-start' },
  badgeText: { fontSize: 11, fontWeight: '600' },
  label:     { fontSize: 13, fontWeight: '500', color: Colors.text2, marginBottom: 5 },
  input:     { borderWidth: 1.5, borderColor: Colors.border, borderRadius: Radius.md, padding: 12, fontSize: 15, color: Colors.text, backgroundColor: Colors.surface },
  errorText: { fontSize: 12, color: Colors.red, marginTop: 4 },
  avatar:    { alignItems: 'center', justifyContent: 'center' },
  avatarText:{ fontWeight: '700' },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.sm },
  sectionTitle:  { fontSize: 15, fontWeight: '600', color: Colors.text },
  sectionAction: { fontSize: 13, color: Colors.primary, fontWeight: '600' },
  empty:     { alignItems: 'center', padding: Spacing.xxl },
  emptyIcon: { fontSize: 48, marginBottom: Spacing.md },
  emptyTitle:{ fontSize: 16, fontWeight: '600', color: Colors.text2, textAlign: 'center' },
  emptySub:  { fontSize: 13, color: Colors.text3, textAlign: 'center', marginTop: 6 },
  statCard:  { borderRadius: Radius.lg, padding: Spacing.lg, flex: 1 },
  statLabel: { fontSize: 11, fontWeight: '500', marginBottom: 4 },
  statValue: { fontSize: 22, fontWeight: '700' },
  divider:   { height: 0.5, backgroundColor: Colors.border, marginVertical: Spacing.sm },
});
