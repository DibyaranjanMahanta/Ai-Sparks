import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, Alert
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLanguage, LANGUAGES } from '../context/LanguageContext';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

const LEVEL_NAMES = ['Newbie', 'AI Explorer', 'AI Learner', 'AI Builder', 'AI Creator', 'AI Innovator', 'AI Master', 'AI Wizard', 'AI Champion', 'AI Legend'];

export default function ProfileScreen() {
  const router = useRouter();
  const { language, t } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);

  useEffect(() => { fetchProfile(); }, []);

  const fetchProfile = async () => {
    try {
      const token = await AsyncStorage.getItem('auth_token');
      if (!token) { router.replace('/'); return; }
      const res = await fetch(`${API_URL}/api/dashboard`, { headers: { 'Authorization': `Bearer ${token}` } });
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
        setStats(data.stats);
      }
    } catch (e) {}
    setLoading(false);
  };

  const handleLogout = async () => {
    try {
      const token = await AsyncStorage.getItem('auth_token');
      await fetch(`${API_URL}/api/auth/logout`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
    } catch (e) {}
    await AsyncStorage.clear();
    router.replace('/');
  };

  if (loading) return <View style={styles.loadingContainer}><ActivityIndicator size="large" color="#4F46E5" /></View>;

  const levelName = LEVEL_NAMES[Math.min((user?.level || 1) - 1, LEVEL_NAMES.length - 1)];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity testID="back-from-profile" onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#F8FAFC" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('profile')}</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Profile Card */}
        <View style={styles.profileCard}>
          <LinearGradient colors={['#4F46E5', '#7C3AED']} style={styles.avatarLarge}>
            <Text style={styles.avatarLargeText}>{(user?.name || 'S')[0].toUpperCase()}</Text>
          </LinearGradient>
          <Text style={styles.userName}>{user?.name || 'Student'}</Text>
          <Text style={styles.userEmail}>{user?.email}</Text>
          <View style={styles.levelRow}>
            <View style={styles.levelPill}>
              <Ionicons name="flash" size={14} color="#FFD700" />
              <Text style={styles.levelPillText}>{levelName}</Text>
            </View>
            <View style={styles.gradePill}>
              <Ionicons name="school" size={14} color="#4F46E5" />
              <Text style={styles.gradePillText}>
                {user?.grade_level === 'middle_school' ? 'Grade 6-8' : 'Grade 9-12'}
              </Text>
            </View>
          </View>
        </View>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <View style={styles.statBox}>
            <Text style={styles.statBoxValue}>{stats?.total_xp || 0}</Text>
            <Text style={styles.statBoxLabel}>Total XP</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statBoxValue}>{user?.level || 1}</Text>
            <Text style={styles.statBoxLabel}>Level</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statBoxValue}>{stats?.lessons_completed || 0}</Text>
            <Text style={styles.statBoxLabel}>Lessons</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statBoxValue}>{stats?.quizzes_taken || 0}</Text>
            <Text style={styles.statBoxLabel}>Quizzes</Text>
          </View>
        </View>

        {/* Badges */}
        <TouchableOpacity testID="view-badges-btn" style={styles.menuItem} onPress={() => router.push('/badges')}>
          <MaterialCommunityIcons name="medal" size={22} color="#FF9F1C" />
          <Text style={styles.menuText}>{t('my_badges')} ({(user?.badges || []).length})</Text>
          <Ionicons name="chevron-forward" size={20} color="#475569" />
        </TouchableOpacity>

        <TouchableOpacity testID="view-leaderboard-btn" style={styles.menuItem} onPress={() => router.push('/leaderboard')}>
          <Ionicons name="trophy" size={22} color="#FFD700" />
          <Text style={styles.menuText}>{t('leaderboard')}</Text>
          <Ionicons name="chevron-forward" size={20} color="#475569" />
        </TouchableOpacity>

        <TouchableOpacity testID="view-progress-btn" style={styles.menuItem} onPress={() => router.push('/tracks')}>
          <Ionicons name="stats-chart" size={22} color="#4F46E5" />
          <Text style={styles.menuText}>{t('learning_progress')}</Text>
          <Ionicons name="chevron-forward" size={20} color="#475569" />
        </TouchableOpacity>

        <TouchableOpacity testID="view-certificates-btn" style={styles.menuItem} onPress={() => router.push('/certificates')}>
          <MaterialCommunityIcons name="certificate" size={22} color="#00F5D4" />
          <Text style={styles.menuText}>{t('my_certificates')}</Text>
          <Ionicons name="chevron-forward" size={20} color="#475569" />
        </TouchableOpacity>

        <TouchableOpacity testID="view-olympiad-btn" style={styles.menuItem} onPress={() => router.push('/olympiad')}>
          <Ionicons name="trophy-outline" size={22} color="#A855F7" />
          <Text style={styles.menuText}>{t('olympiad')}</Text>
          <Ionicons name="chevron-forward" size={20} color="#475569" />
        </TouchableOpacity>

        {/* Language Settings */}
        <TouchableOpacity testID="language-settings-btn" style={styles.menuItem} onPress={() => router.push('/language-settings')}>
          <Ionicons name="language" size={22} color="#06B6D4" />
          <Text style={styles.menuText}>{t('language')}</Text>
          <View style={styles.langBadge}>
            <Text style={styles.langBadgeText}>{LANGUAGES[language].nativeName}</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#475569" />
        </TouchableOpacity>

        {/* Role-based Dashboard Access */}
        {user?.role === 'teacher' && (
          <TouchableOpacity testID="teacher-dashboard-btn" style={styles.menuItemHighlight} onPress={() => router.push('/teacher-dashboard')}>
            <Ionicons name="school" size={22} color="#4F46E5" />
            <Text style={styles.menuText}>{t('teacher_dash')}</Text>
            <Ionicons name="chevron-forward" size={20} color="#475569" />
          </TouchableOpacity>
        )}

        {user?.role === 'parent' && (
          <TouchableOpacity testID="parent-dashboard-btn" style={styles.menuItemHighlight} onPress={() => router.push('/parent-dashboard')}>
            <Ionicons name="people" size={22} color="#4F46E5" />
            <Text style={styles.menuText}>{t('parent_dash')}</Text>
            <Ionicons name="chevron-forward" size={20} color="#475569" />
          </TouchableOpacity>
        )}

        {/* Logout */}
        <TouchableOpacity testID="logout-btn" style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.8}>
          <Ionicons name="log-out-outline" size={20} color="#EF4444" />
          <Text style={styles.logoutText}>{t('logout')}</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F172A' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0F172A' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 56, paddingBottom: 16 },
  backBtn: { width: 44, height: 44, justifyContent: 'center' },
  headerTitle: { fontSize: 20, fontWeight: '700', color: '#F8FAFC' },
  scrollView: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 40 },
  profileCard: { alignItems: 'center', marginBottom: 28 },
  avatarLarge: { width: 88, height: 88, borderRadius: 44, justifyContent: 'center', alignItems: 'center', marginBottom: 14 },
  avatarLargeText: { fontSize: 36, fontWeight: '700', color: '#FFF' },
  userName: { fontSize: 24, fontWeight: '800', color: '#F8FAFC', marginBottom: 4 },
  userEmail: { fontSize: 14, color: '#64748B', marginBottom: 12 },
  levelRow: { flexDirection: 'row', gap: 10 },
  levelPill: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(255,215,0,0.1)', paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20 },
  levelPillText: { fontSize: 13, fontWeight: '600', color: '#FFD700' },
  gradePill: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(79,70,229,0.1)', paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20 },
  gradePillText: { fontSize: 13, fontWeight: '600', color: '#4F46E5' },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 28 },
  statBox: { width: '47%', backgroundColor: '#1E293B', borderRadius: 14, padding: 16, alignItems: 'center', borderWidth: 1, borderColor: '#334155' },
  statBoxValue: { fontSize: 28, fontWeight: '800', color: '#F8FAFC' },
  statBoxLabel: { fontSize: 12, color: '#64748B', marginTop: 4 },
  menuItem: { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: '#1E293B', borderRadius: 14, padding: 16, marginBottom: 10, borderWidth: 1, borderColor: '#334155' },
  menuItemHighlight: { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: 'rgba(79,70,229,0.1)', borderRadius: 14, padding: 16, marginBottom: 10, borderWidth: 1, borderColor: 'rgba(79,70,229,0.3)' },
  menuText: { flex: 1, fontSize: 15, fontWeight: '600', color: '#F8FAFC' },
  langBadge: { backgroundColor: 'rgba(6,182,212,0.15)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10, marginRight: 4 },
  langBadgeText: { fontSize: 12, fontWeight: '600', color: '#06B6D4' },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 20, paddingVertical: 16, borderRadius: 14, borderWidth: 1, borderColor: 'rgba(239,68,68,0.3)', backgroundColor: 'rgba(239,68,68,0.05)' },
  logoutText: { fontSize: 16, fontWeight: '600', color: '#EF4444' },
});
