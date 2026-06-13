import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, TextInput, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import * as Clipboard from 'expo-clipboard';
import { useCurrency } from '../../context/CurrencyContext';
import { Button, Card, Row } from '../../components/UI';
import { Colors, Spacing, Radius } from '../../utils/theme';
import api, { API_BASE } from '../../utils/api';

const METHOD_META = {
  telebirr: { icon: '📱', color: '#E91E8C', bg: '#FDE8F4', label: 'Telebirr' },
  mpesa:    { icon: '💚', color: '#4CAF50', bg: '#E8F5E9', label: 'M-Pesa' },
  cbe:      { icon: '🏦', color: '#1976D2', bg: '#E3F2FD', label: 'CBE Bank' },
  cbe_birr: { icon: '💙', color: '#0D47A1', bg: '#E8EAF6', label: 'CBE Birr' },
};

export default function DepositScreen({ navigation }) {
  const { fmt } = useCurrency();
  const [step, setStep]           = useState(1);
  const [methods, setMethods]     = useState({});
  const [chosen, setChosen]       = useState(null);
  const [amount, setAmount]       = useState('');
  const [reference, setReference] = useState('');
  const [senderName, setSenderName] = useState('');
  const [senderPhone, setSenderPhone] = useState('');
  const [image, setImage]         = useState(null);
  const [history, setHistory]     = useState([]);
  const [loading, setLoading]     = useState(false);
  const [copied, setCopied]       = useState('');

  useEffect(() => {
    api.get('/deposits/methods').then(r => setMethods(r.data.methods)).catch(console.error);
    api.get('/deposits').then(r => setHistory(r.data.deposits)).catch(console.error);
  }, []);

  const copy = async (text, key) => {
    await Clipboard.setStringAsync(text);
    setCopied(key);
    setTimeout(() => setCopied(''), 2000);
  };

  const pickImage = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) { Alert.alert('Permission required', 'Please allow photo access to upload receipts.'); return; }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.8 });
    if (!result.canceled) setImage(result.assets[0]);
  };

  const submit = async () => {
    if (!amount || Number(amount) < 1) { Alert.alert('Error', 'Enter a valid amount.'); return; }
    if (!reference && !image) { Alert.alert('Error', 'Provide a reference number or upload a receipt.'); return; }
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('amountETB', amount);
      formData.append('method', chosen);
      formData.append('senderName', senderName);
      formData.append('senderPhone', senderPhone);
      if (reference) formData.append('paymentReference', reference);
      if (image) {
        formData.append('receipt', { uri: image.uri, type: 'image/jpeg', name: 'receipt.jpg' });
      }
      await api.post('/deposits', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      const upd = await api.get('/deposits');
      setHistory(upd.data.deposits);
      setStep(3);
    } catch (e) {
      Alert.alert('Error', e.response?.data?.error || 'Submission failed.');
    } finally { setLoading(false); }
  };

  const method = chosen ? methods[chosen] : null;
  const meta   = chosen ? METHOD_META[chosen] : null;

  const STATUS_COLOR = { pending: Colors.amber, approved: Colors.primary, rejected: Colors.red, under_review: Colors.blue };
  const STATUS_LABEL = { pending: 'Pending', approved: '✓ Approved', rejected: 'Rejected', under_review: 'Under review' };

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: Spacing.lg, paddingBottom: 40 }}>

        {/* Step 1: Choose method */}
        {step === 1 && (
          <>
            <Text style={styles.heading}>Choose payment method</Text>
            <Text style={styles.sub}>Select how you'll send money</Text>

            {Object.entries(METHOD_META).map(([key, m]) => (
              <TouchableOpacity key={key} activeOpacity={0.8} style={[styles.methodCard, { backgroundColor: m.bg, borderColor: m.color + '44' }]}
                onPress={() => { setChosen(key); setStep(2); }}>
                <Text style={styles.methodIcon}>{m.icon}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.methodLabel, { color: m.color }]}>{m.label}</Text>
                  {methods[key] && <Text style={styles.methodAccount}>{methods[key].accountNumber}</Text>}
                </View>
                <Text style={[styles.arrow, { color: m.color }]}>›</Text>
              </TouchableOpacity>
            ))}

            {/* History */}
            {history.length > 0 && (
              <>
                <Text style={[styles.heading, { marginTop: Spacing.xl, fontSize: 16 }]}>Recent deposits</Text>
                {history.slice(0, 5).map(d => {
                  const mm = METHOD_META[d.method] || {};
                  return (
                    <Card key={d._id} style={{ marginBottom: Spacing.sm }}>
                      <Row style={{ justifyContent: 'space-between' }}>
                        <Row style={{ gap: 10 }}>
                          <Text style={{ fontSize: 22 }}>{mm.icon}</Text>
                          <View>
                            <Text style={{ fontSize: 14, fontWeight: '600', color: Colors.text }}>{fmt(d.amountETB)}</Text>
                            <Text style={{ fontSize: 11, color: Colors.text3 }}>{mm.label} · {new Date(d.createdAt).toLocaleDateString()}</Text>
                          </View>
                        </Row>
                        <Text style={{ fontSize: 12, fontWeight: '600', color: STATUS_COLOR[d.status] || Colors.text3 }}>
                          {STATUS_LABEL[d.status] || d.status}
                        </Text>
                      </Row>
                      {d.adminNote ? <Text style={{ fontSize: 12, color: Colors.red, marginTop: 6 }}>{d.adminNote}</Text> : null}
                    </Card>
                  );
                })}
              </>
            )}
          </>
        )}

        {/* Step 2: Instructions + form */}
        {step === 2 && method && meta && (
          <>
            <TouchableOpacity onPress={() => setStep(1)} style={styles.backBtn}>
              <Text style={styles.backText}>‹ Back</Text>
            </TouchableOpacity>

            {/* Account details */}
            <View style={[styles.accountCard, { backgroundColor: meta.bg, borderColor: meta.color + '33' }]}>
              <Row style={{ gap: 12, marginBottom: Spacing.md }}>
                <Text style={{ fontSize: 32 }}>{meta.icon}</Text>
                <View>
                  <Text style={[styles.methodLabel, { color: meta.color }]}>{meta.label}</Text>
                  <Text style={{ fontSize: 12, color: Colors.text2 }}>Send to this account</Text>
                </View>
              </Row>
              {[
                { label: 'Account / Phone', value: method.accountNumber },
                { label: 'Account name', value: method.accountName },
              ].map(row => (
                <View key={row.label} style={styles.accountRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.accountRowLabel}>{row.label}</Text>
                    <Text style={styles.accountRowValue}>{row.value}</Text>
                  </View>
                  <TouchableOpacity style={styles.copyBtn} onPress={() => copy(row.value, row.label)}>
                    <Text style={styles.copyBtnText}>{copied === row.label ? '✓' : 'Copy'}</Text>
                  </TouchableOpacity>
                </View>
              ))}
              <Text style={styles.instructions}>{method.instructions}</Text>
            </View>

            {/* Form */}
            <Card style={{ marginTop: Spacing.md }}>
              <Text style={styles.sectionTitle}>Enter deposit details</Text>
              <TextInput style={styles.amountInput} placeholder="Amount (ETB)" placeholderTextColor={Colors.text3} keyboardType="numeric" value={amount} onChangeText={setAmount} />
              <TextInput style={styles.input} placeholder="Your name (as on transfer)" placeholderTextColor={Colors.text3} value={senderName} onChangeText={setSenderName} />
              <TextInput style={styles.input} placeholder="Your phone number" placeholderTextColor={Colors.text3} keyboardType="phone-pad" value={senderPhone} onChangeText={setSenderPhone} />
            </Card>

            <Card style={{ marginTop: Spacing.md }}>
              <Text style={styles.sectionTitle}>Proof of payment</Text>
              <Text style={styles.proofSub}>Provide either a reference number OR upload a screenshot</Text>
              <TextInput style={styles.input} placeholder="Transaction reference number" placeholderTextColor={Colors.text3} value={reference} onChangeText={setReference} />
              <Text style={styles.orText}>— OR —</Text>
              {!image ? (
                <TouchableOpacity style={styles.uploadBtn} onPress={pickImage}>
                  <Text style={styles.uploadIcon}>📎</Text>
                  <Text style={styles.uploadText}>Upload receipt screenshot</Text>
                  <Text style={styles.uploadSub}>JPG or PNG, max 5MB</Text>
                </TouchableOpacity>
              ) : (
                <View style={{ alignItems: 'center' }}>
                  <Image source={{ uri: image.uri }} style={styles.receiptPreview} resizeMode="cover" />
                  <TouchableOpacity onPress={() => setImage(null)} style={styles.removeBtn}>
                    <Text style={styles.removeBtnText}>Remove</Text>
                  </TouchableOpacity>
                </View>
              )}
            </Card>

            <Button
              title={`Submit deposit — ${amount ? fmt(Number(amount)) : '…'}`}
              onPress={submit}
              loading={loading}
              disabled={!amount}
              size="lg"
              style={{ marginTop: Spacing.lg }}
            />
          </>
        )}

        {/* Step 3: Success */}
        {step === 3 && (
          <View style={styles.successWrap}>
            <Text style={styles.successEmoji}>✅</Text>
            <Text style={styles.successTitle}>Request submitted!</Text>
            <Text style={styles.successSub}>Our team will verify your payment and credit your wallet within 1–2 hours.</Text>
            <Card style={{ width: '100%', marginTop: Spacing.xl }}>
              <Row style={{ gap: 12 }}>
                <Text style={{ fontSize: 22 }}>{meta?.icon}</Text>
                <View>
                  <Text style={{ fontWeight: '600', fontSize: 14 }}>{meta?.label} deposit</Text>
                  <Text style={{ fontSize: 13, color: Colors.text2 }}>{fmt(Number(amount))}</Text>
                  {reference ? <Text style={{ fontSize: 12, color: Colors.text3 }}>Ref: {reference}</Text> : null}
                </View>
                <View style={[styles.statusPill, { marginLeft: 'auto' }]}>
                  <Text style={styles.statusPillText}>Pending</Text>
                </View>
              </Row>
            </Card>
            <Button title="Back to wallet" onPress={() => navigation.goBack()} size="lg" style={{ marginTop: Spacing.xl, width: '100%' }} />
            <Button title="Make another deposit" onPress={() => { setStep(1); setChosen(null); setAmount(''); setReference(''); setImage(null); }} variant="outline" style={{ marginTop: Spacing.sm, width: '100%' }} />
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:          { flex: 1, backgroundColor: Colors.bg },
  heading:       { fontSize: 22, fontWeight: '700', color: Colors.text, marginBottom: 4 },
  sub:           { fontSize: 14, color: Colors.text2, marginBottom: Spacing.lg },
  methodCard:    { borderRadius: Radius.xl, borderWidth: 1.5, padding: Spacing.lg, flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: Spacing.sm },
  methodIcon:    { fontSize: 30 },
  methodLabel:   { fontSize: 16, fontWeight: '700' },
  methodAccount: { fontSize: 12, color: Colors.text2, marginTop: 2 },
  arrow:         { fontSize: 24, fontWeight: '300' },
  backBtn:       { marginBottom: Spacing.md },
  backText:      { fontSize: 16, color: Colors.primary, fontWeight: '600' },
  accountCard:   { borderRadius: Radius.xl, borderWidth: 1.5, padding: Spacing.lg },
  accountRow:    { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.7)', borderRadius: Radius.sm, padding: Spacing.md, marginBottom: 8 },
  accountRowLabel:{ fontSize: 11, color: Colors.text3, marginBottom: 2 },
  accountRowValue:{ fontSize: 15, fontWeight: '700', fontFamily: 'monospace' },
  copyBtn:       { backgroundColor: Colors.primary, borderRadius: 6, paddingHorizontal: 12, paddingVertical: 5 },
  copyBtnText:   { fontSize: 12, color: '#fff', fontWeight: '600' },
  instructions:  { fontSize: 12, color: Colors.text2, lineHeight: 20, marginTop: 10, backgroundColor: 'rgba(255,255,255,0.5)', borderRadius: 8, padding: 10 },
  sectionTitle:  { fontSize: 15, fontWeight: '600', color: Colors.text, marginBottom: 4 },
  proofSub:      { fontSize: 13, color: Colors.text2, marginBottom: Spacing.md },
  amountInput:   { borderWidth: 1.5, borderColor: Colors.border, borderRadius: Radius.md, padding: 14, fontSize: 22, fontWeight: '700', textAlign: 'center', color: Colors.text, marginBottom: Spacing.sm },
  input:         { borderWidth: 1.5, borderColor: Colors.border, borderRadius: Radius.md, padding: 12, fontSize: 14, color: Colors.text, marginBottom: Spacing.sm },
  orText:        { textAlign: 'center', color: Colors.text3, fontSize: 13, marginVertical: Spacing.sm },
  uploadBtn:     { borderWidth: 2, borderColor: Colors.border, borderStyle: 'dashed', borderRadius: Radius.lg, padding: Spacing.xl, alignItems: 'center' },
  uploadIcon:    { fontSize: 32, marginBottom: 8 },
  uploadText:    { fontSize: 14, fontWeight: '600', color: Colors.text2 },
  uploadSub:     { fontSize: 12, color: Colors.text3, marginTop: 4 },
  receiptPreview:{ width: '100%', height: 200, borderRadius: Radius.md, borderWidth: 1.5, borderColor: Colors.primary },
  removeBtn:     { marginTop: Spacing.sm, backgroundColor: Colors.redLight, borderRadius: 6, paddingHorizontal: 14, paddingVertical: 6 },
  removeBtnText: { fontSize: 13, color: Colors.red, fontWeight: '600' },
  successWrap:   { alignItems: 'center', paddingTop: Spacing.xxl },
  successEmoji:  { fontSize: 64, marginBottom: Spacing.md },
  successTitle:  { fontSize: 24, fontWeight: '700', color: Colors.text, marginBottom: 8 },
  successSub:    { fontSize: 14, color: Colors.text2, textAlign: 'center', lineHeight: 22 },
  statusPill:    { backgroundColor: Colors.amberLight, borderRadius: Radius.full, paddingHorizontal: 10, paddingVertical: 4 },
  statusPillText:{ fontSize: 11, color: '#854F0B', fontWeight: '600' },
});
