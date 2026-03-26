import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput,
  ScrollView, ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL;
const GOOGLE_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID;

export default function Index() {
  const router = useRouter();
  const [screen, setScreen] = useState<'splash' | 'login' | 'register'>('splash');
  const [loading, setLoading] = useState(true);
  const [authLoading, setAuthLoading] = useState(false);
  const [error, setError] = useState('');

  // Login fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Register fields
  const [name, setName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [role, setRole] = useState<'student' | 'teacher' | 'parent'>('student');
  const [gradeLevel, setGradeLevel] = useState<'middle_school' | 'high_school'>('high_school');

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const token = await AsyncStorage.getItem('auth_token');
      if (token) {
        const res = await fetch(`${API_URL}/api/auth/me`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          router.replace('/dashboard');
          return;
        }
      }
    } catch (e) {}
    setLoading(false);
    setScreen('splash');
  };

  const handleLogin = async () => {
    if (!email || !password) { setError('Please fill all fields'); return; }
    setAuthLoading(true);
    setError('');
    try {
      const res = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Login failed');
      await AsyncStorage.setItem('auth_token', data.token);
      await AsyncStorage.setItem('user_data', JSON.stringify(data.user));
      router.replace('/dashboard');
    } catch (e: any) {
      setError(e.message);
    }
    setAuthLoading(false);
  };

  const handleRegister = async () => {
    if (!name || !regEmail || !regPassword) { setError('Please fill all fields'); return; }
    setAuthLoading(true);
    setError('');
    try {
      const res = await fetch(`${API_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email: regEmail, password: regPassword, role: role, grade_level: gradeLevel })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Registration failed');
      await AsyncStorage.setItem('auth_token', data.token);
      await AsyncStorage.setItem('user_data', JSON.stringify(data.user));
      router.replace('/dashboard');
    } catch (e: any) {
      setError(e.message);
    }
    setAuthLoading(false);
  };

  // ✅ FIXED: Real Google OAuth2 — no more Emergent
  const handleGoogleLogin = () => {
    if (Platform.OS === 'web') {
      if (!GOOGLE_CLIENT_ID) {
        setError('Google Client ID not configured. Add EXPO_PUBLIC_GOOGLE_CLIENT_ID to your .env');
        return;
      }
      const redirectUri = window.location.origin + '/auth-callback';
      const params = new URLSearchParams({
        client_id: GOOGLE_CLIENT_ID,
        redirect_uri: redirectUri,
        response_type: 'code',
        scope: 'openid email profile',
        access_type: 'offline',
        prompt: 'select_account',
      });
      window.location.href = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4F46E5" />
      </View>
    );
  }

  if (screen === 'splash') {
    return (
      <View style={styles.container}>
        <LinearGradient colors={['#0F172A', '#1E293B', '#0F172A']} style={styles.gradient}>
          <View style={styles.splashContent}>
            <View style={styles.logoContainer}>
              <LinearGradient colors={['#4F46E5', '#7C3AED']} style={styles.logoBg}>
                <Ionicons name="sparkles" size={48} color="#FFD700" />
              </LinearGradient>
            </View>
            <Text style={styles.appTitle}>AI Sparks Junior</Text>
            <Text style={styles.appTagline}>Learn AI. Create with AI. Shape the Future.</Text>
            <Text style={styles.appSubtext}>India's fun AI learning platform for school students</Text>

            <View style={styles.splashButtons}>
              <TouchableOpacity
                testID="get-started-btn"
                onPress={() => setScreen('register')}
                activeOpacity={0.8}
              >
                <LinearGradient colors={['#4F46E5', '#7C3AED']} style={styles.primaryBtn}>
                  <Ionicons name="rocket" size={20} color="#FFF" />
                  <Text style={styles.primaryBtnText}>Get Started</Text>
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity
                testID="login-btn"
                style={styles.secondaryBtn}
                onPress={() => setScreen('login')}
                activeOpacity={0.8}
              >
                <Text style={styles.secondaryBtnText}>Already have an account? Log In</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.featureRow}>
              {[
                { icon: 'game-controller', label: 'Gamified' },
                { icon: 'shield-checkmark', label: 'Safe' },
                { icon: 'school', label: 'NEP 2020' },
              ].map((f, i) => (
                <View key={i} style={styles.featureItem}>
                  <Ionicons name={f.icon as any} size={24} color="#FF9F1C" />
                  <Text style={styles.featureLabel}>{f.label}</Text>
                </View>
              ))}
            </View>
          </View>
        </LinearGradient>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <LinearGradient colors={['#0F172A', '#1E293B']} style={styles.gradient}>
        <ScrollView contentContainerStyle={styles.authScroll} keyboardShouldPersistTaps="handled">
          <TouchableOpacity
            testID="back-btn"
            style={styles.backBtn}
            onPress={() => { setScreen('splash'); setError(''); }}
          >
            <Ionicons name="arrow-back" size={24} color="#F8FAFC" />
          </TouchableOpacity>

          <View style={styles.authHeader}>
            <LinearGradient colors={['#4F46E5', '#7C3AED']} style={styles.authLogoBg}>
              <Ionicons name="sparkles" size={32} color="#FFD700" />
            </LinearGradient>
            <Text style={styles.authTitle}>
              {screen === 'login' ? 'Welcome Back!' : 'Join AI Sparks Junior'}
            </Text>
            <Text style={styles.authSubtitle}>
              {screen === 'login' ? 'Continue your AI learning journey' : 'Start your AI adventure today'}
            </Text>
          </View>

          {error ? (
            <View style={styles.errorBox}>
              <Ionicons name="alert-circle" size={18} color="#EF4444" />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          {screen === 'register' && (
            <>
              <Text style={styles.inputLabel}>Full Name</Text>
              <TextInput
                testID="register-name-input"
                style={styles.input}
                placeholder="Enter your name"
                placeholderTextColor="#64748B"
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
              />

              <Text style={styles.inputLabel}>I am a</Text>
              <View style={styles.roleRow}>
                {(['student', 'teacher', 'parent'] as const).map((r) => (
                  <TouchableOpacity
                    key={r}
                    testID={`role-${r}-btn`}
                    style={[styles.roleBtn, role === r && styles.roleBtnActive]}
                    onPress={() => setRole(r)}
                  >
                    <Ionicons
                      name={r === 'student' ? 'school-outline' : r === 'teacher' ? 'person-outline' : 'people-outline'}
                      size={18}
                      color={role === r ? '#4F46E5' : '#64748B'}
                    />
                    <Text style={[styles.roleBtnText, role === r && styles.roleBtnTextActive]}>
                      {r.charAt(0).toUpperCase() + r.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {role === 'student' && (
                <>
                  <Text style={styles.inputLabel}>I am in</Text>
                  <View style={styles.gradeRow}>
                    {(['middle_school', 'high_school'] as const).map((g) => (
                      <TouchableOpacity
                        key={g}
                        testID={`grade-${g === 'middle_school' ? 'middle' : 'high'}-btn`}
                        style={[styles.gradeBtn, gradeLevel === g && styles.gradeBtnActive]}
                        onPress={() => setGradeLevel(g)}
                      >
                        <Text style={[styles.gradeBtnText, gradeLevel === g && styles.gradeBtnTextActive]}>
                          {g === 'middle_school' ? 'Grade 6-8' : 'Grade 9-12'}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </>
              )}
            </>
          )}

          <Text style={styles.inputLabel}>Email</Text>
          <TextInput
            testID={screen === 'login' ? 'login-email-input' : 'register-email-input'}
            style={styles.input}
            placeholder="your@email.com"
            placeholderTextColor="#64748B"
            value={screen === 'login' ? email : regEmail}
            onChangeText={screen === 'login' ? setEmail : setRegEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <Text style={styles.inputLabel}>Password</Text>
          <TextInput
            testID={screen === 'login' ? 'login-password-input' : 'register-password-input'}
            style={styles.input}
            placeholder="Enter password"
            placeholderTextColor="#64748B"
            value={screen === 'login' ? password : regPassword}
            onChangeText={screen === 'login' ? setPassword : setRegPassword}
            secureTextEntry
          />

          <TouchableOpacity
            testID={screen === 'login' ? 'login-submit-btn' : 'register-submit-btn'}
            onPress={screen === 'login' ? handleLogin : handleRegister}
            disabled={authLoading}
            activeOpacity={0.8}
          >
            <LinearGradient colors={['#4F46E5', '#7C3AED']} style={styles.submitBtn}>
              {authLoading ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <Text style={styles.submitBtnText}>
                  {screen === 'login' ? 'Log In' : 'Create Account'}
                </Text>
              )}
            </LinearGradient>
          </TouchableOpacity>

          {Platform.OS === 'web' && (
            <>
              <View style={styles.divider}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>or</Text>
                <View style={styles.dividerLine} />
              </View>
              <TouchableOpacity
                testID="google-login-btn"
                style={styles.googleBtn}
                onPress={handleGoogleLogin}
                activeOpacity={0.8}
              >
                <Ionicons name="logo-google" size={20} color="#F8FAFC" />
                <Text style={styles.googleBtnText}>Continue with Google</Text>
              </TouchableOpacity>
            </>
          )}

          <TouchableOpacity
            testID="switch-auth-btn"
            style={styles.switchBtn}
            onPress={() => { setScreen(screen === 'login' ? 'register' : 'login'); setError(''); }}
          >
            <Text style={styles.switchText}>
              {screen === 'login' ? "Don't have an account? Sign Up" : 'Already have an account? Log In'}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </LinearGradient>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  gradient: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0F172A' },
  splashContent: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24 },
  logoContainer: { marginBottom: 24 },
  logoBg: { width: 96, height: 96, borderRadius: 28, justifyContent: 'center', alignItems: 'center' },
  appTitle: { fontSize: 40, fontWeight: '800', color: '#F8FAFC', marginBottom: 8 },
  appTagline: { fontSize: 18, fontWeight: '600', color: '#FF9F1C', textAlign: 'center', marginBottom: 8 },
  appSubtext: { fontSize: 14, color: '#94A3B8', textAlign: 'center', marginBottom: 40 },
  splashButtons: { width: '100%', gap: 12, marginBottom: 40 },
  primaryBtn: { height: 56, borderRadius: 28, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8 },
  primaryBtnText: { fontSize: 18, fontWeight: '700', color: '#FFF' },
  secondaryBtn: { height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center', borderWidth: 1.5, borderColor: '#334155' },
  secondaryBtnText: { fontSize: 16, fontWeight: '600', color: '#94A3B8' },
  featureRow: { flexDirection: 'row', gap: 32 },
  featureItem: { alignItems: 'center', gap: 6 },
  featureLabel: { fontSize: 12, color: '#94A3B8', fontWeight: '500' },
  authScroll: { flexGrow: 1, paddingHorizontal: 24, paddingTop: 60, paddingBottom: 40 },
  backBtn: { width: 44, height: 44, justifyContent: 'center' },
  authHeader: { alignItems: 'center', marginBottom: 32 },
  authLogoBg: { width: 64, height: 64, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  authTitle: { fontSize: 28, fontWeight: '800', color: '#F8FAFC', marginBottom: 8 },
  authSubtitle: { fontSize: 15, color: '#94A3B8' },
  errorBox: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'rgba(239,68,68,0.1)', padding: 12, borderRadius: 12, marginBottom: 16 },
  errorText: { color: '#EF4444', fontSize: 14, flex: 1 },
  inputLabel: { fontSize: 14, fontWeight: '600', color: '#94A3B8', marginBottom: 8, marginTop: 12 },
  input: { height: 56, backgroundColor: '#1E293B', borderRadius: 12, paddingHorizontal: 16, fontSize: 16, color: '#F8FAFC', borderWidth: 1, borderColor: '#334155' },
  gradeRow: { flexDirection: 'row', gap: 12 },
  gradeBtn: { flex: 1, height: 48, borderRadius: 12, justifyContent: 'center', alignItems: 'center', borderWidth: 1.5, borderColor: '#334155' },
  gradeBtnActive: { borderColor: '#4F46E5', backgroundColor: 'rgba(79,70,229,0.15)' },
  gradeBtnText: { fontSize: 15, fontWeight: '600', color: '#64748B' },
  gradeBtnTextActive: { color: '#4F46E5' },
  roleRow: { flexDirection: 'row', gap: 10 },
  roleBtn: { flex: 1, height: 48, borderRadius: 12, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6, borderWidth: 1.5, borderColor: '#334155' },
  roleBtnActive: { borderColor: '#4F46E5', backgroundColor: 'rgba(79,70,229,0.15)' },
  roleBtnText: { fontSize: 14, fontWeight: '600', color: '#64748B' },
  roleBtnTextActive: { color: '#4F46E5' },
  submitBtn: { height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center', marginTop: 24 },
  submitBtnText: { fontSize: 17, fontWeight: '700', color: '#FFF' },
  divider: { flexDirection: 'row', alignItems: 'center', marginVertical: 20 },
  dividerLine: { flex: 1, height: 1, backgroundColor: '#334155' },
  dividerText: { marginHorizontal: 16, color: '#64748B', fontSize: 14 },
  googleBtn: { height: 56, borderRadius: 28, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 10, backgroundColor: '#334155', borderWidth: 1, borderColor: '#475569' },
  googleBtnText: { fontSize: 16, fontWeight: '600', color: '#F8FAFC' },
  switchBtn: { marginTop: 20, alignItems: 'center', paddingVertical: 8 },
  switchText: { color: '#4F46E5', fontSize: 15, fontWeight: '600' },
});