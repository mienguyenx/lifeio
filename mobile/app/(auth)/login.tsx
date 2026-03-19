import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';

const C = {
  bg: '#0f0f0f',
  card: '#1a1a1a',
  border: '#2a2a2a',
  foreground: '#f8f8f8',
  muted: '#a0a0a0',
  primary: '#8b5cf6',
  destructive: '#ef4444',
};

export default function LoginScreen() {
  const { signIn, signUp } = useAuth();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!email || !password) {
      setError('Vui lòng nhập email và mật khẩu');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const result = isSignUp
        ? await signUp(email, password, name)
        : await signIn(email, password);
      if (result.error) setError(result.error);
      else router.replace('/(tabs)/today');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.logoSection}>
          <View style={styles.logoIcon}>
            <Text style={styles.logoText}>L</Text>
          </View>
          <Text style={styles.logoTitle}>LifeOSS</Text>
          <Text style={styles.logoSubtitle}>Quản lý cuộc sống của bạn</Text>
        </View>

        <View style={styles.form}>
          {isSignUp && (
            <View style={styles.field}>
              <Text style={styles.label}>Tên</Text>
              <TextInput
                style={styles.input}
                placeholder="Nhập tên của bạn"
                placeholderTextColor="#666"
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
              />
            </View>
          )}

          <View style={styles.field}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              placeholder="email@example.com"
              placeholderTextColor="#666"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Mật khẩu</Text>
            <TextInput
              style={styles.input}
              placeholder="••••••••"
              placeholderTextColor="#666"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
          </View>

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <TouchableOpacity
            style={styles.primaryBtn}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={styles.primaryBtnText}>
                {isSignUp ? 'Đăng ký' : 'Đăng nhập'}
              </Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.toggleBtn}
            onPress={() => { setIsSignUp(!isSignUp); setError(''); }}
          >
            <Text style={styles.toggleText}>
              {isSignUp ? 'Đã có tài khoản? ' : 'Chưa có tài khoản? '}
              <Text style={styles.toggleLink}>
                {isSignUp ? 'Đăng nhập' : 'Đăng ký'}
              </Text>
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  scroll: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: 24, paddingVertical: 48 },
  logoSection: { alignItems: 'center', marginBottom: 40 },
  logoIcon: {
    width: 64, height: 64, borderRadius: 16,
    backgroundColor: C.primary, alignItems: 'center', justifyContent: 'center', marginBottom: 16,
  },
  logoText: { color: 'white', fontSize: 28, fontWeight: 'bold' },
  logoTitle: { color: C.foreground, fontSize: 28, fontWeight: 'bold' },
  logoSubtitle: { color: C.muted, fontSize: 14, marginTop: 4 },
  form: { gap: 16 },
  field: {},
  label: { color: C.foreground, fontSize: 14, fontWeight: '500', marginBottom: 8 },
  input: {
    backgroundColor: C.card, borderWidth: 1, borderColor: C.border,
    borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12,
    color: C.foreground, fontSize: 16,
  },
  error: { color: C.destructive, fontSize: 14 },
  primaryBtn: {
    backgroundColor: C.primary, borderRadius: 12,
    paddingVertical: 16, alignItems: 'center', marginTop: 8,
  },
  primaryBtnText: { color: 'white', fontWeight: '600', fontSize: 16 },
  toggleBtn: { alignItems: 'center', paddingVertical: 8 },
  toggleText: { color: C.muted, fontSize: 14 },
  toggleLink: { color: C.primary, fontWeight: '500' },
});
