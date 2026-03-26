import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

export default function TeacherDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const token = await AsyncStorage.getItem('auth_token');
      if (!token) { router.replace('/'); return; }
      const res = await fetch(`${API_URL}/api/teacher/students`, { headers: { 'Authorization': `Bearer ${token}` } });
      if (res.ok) setData(await res.json());
      else if (res.status === 403) {
        const user = await AsyncStorage.getItem('user_data');
        if (user) {
          const u = JSON.parse(user);
          if (u.role !== 'teacher') { router.back(); return; }
        }
      }
    } catch (e) {}
    setLoading(false);
  };

  if (loading) return <View style={styles.loadingContainer}><ActivityIndicator size="large" color="#4F46E5" /></View>;

  const overview = data?.overview || {};
  const students = data?.students || [];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity testID="back-from-teacher" onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#F8FAFC" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Teacher Dashboard</Text>
        <View style={{ width: 44 }} />
      </View>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Overview Cards */}
        <View style={styles.overviewGrid}>
          <View style={styles.overviewCard}>
            <Ionicons name="people" size={24} color="#4F46E5" />
            <Text style={styles.overviewValue}>{overview.total_students || 0}</Text>
            <Text style={styles.overviewLabel}>Students</Text>
          </View>
          <View style={styles.overviewCard}>
            <Ionicons name="flash" size={24} color="#FF9F1C" />
            <Text style={styles.overviewValue}>{overview.active_today || 0}</Text>
            <Text style={styles.overviewLabel}>Active Today</Text>
          </View>
          <View style={styles.overviewCard}>
            <Ionicons name="stats-chart" size={24} color="#00F5D4" />
            <Text style={styles.overviewValue}>{overview.average_xp || 0}</Text>
            <Text style={styles.overviewLabel}>Avg XP</Text>
          </View>
          <View style={styles.overviewCard}>
            <Ionicons name="book" size={24} color="#A855F7" />
            <Text style={styles.overviewValue}>{overview.total_lessons_completed || 0}</Text>
            <Text style={styles.overviewLabel}>Lessons Done</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Student Progress ({students.length})</Text>
        {students.map((s: any) => (
          <View key={s.user_id} style={styles.studentCard}>
            <LinearGradient colors={['#4F46E5', '#7C3AED']} style={styles.studentAvatar}>
              <Text style={styles.studentAvatarText}>{(s.name || '?')[0].toUpperCase()}</Text>
            </LinearGradient>
            <View style={styles.studentInfo}>
              <Text style={styles.studentName}>{s.name}</Text>
              <Text style={styles.studentEmail}>{s.email}</Text>
              <View style={styles.studentMeta}>
                <Text style={styles.metaText}>Lvl {s.level || 1}</Text>
                <Text style={styles.metaDot}>·</Text>
                <Text style={styles.metaText}>{s.xp || 0} XP</Text>
                <Text style={styles.metaDot}>·</Text>
                <Text style={styles.metaText}>{s.lessons_completed || 0} lessons</Text>
                <Text style={styles.metaDot}>·</Text>
                <Text style={styles.metaText}>{s.quizzes_taken || 0} quizzes</Text>
              </View>
            </View>
            <View style={styles.streakBadge}>
              <Ionicons name="flame" size={14} color="#FF9F1C" />
              <Text style={styles.streakText}>{s.current_streak || 0}</Text>
            </View>
          </View>
        ))}
        {students.length === 0 && (
          <View style={styles.emptyState}>
            <Ionicons name="people-outline" size={48} color="#334155" />
            <Text style={styles.emptyText}>No students registered yet</Text>
          </View>
        )}
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
  overviewGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 24 },
  overviewCard: { width: '48%', backgroundColor: '#1E293B', borderRadius: 14, padding: 16, alignItems: 'center', gap: 6, borderWidth: 1, borderColor: '#334155' },
  overviewValue: { fontSize: 28, fontWeight: '800', color: '#F8FAFC' },
  overviewLabel: { fontSize: 12, color: '#64748B' },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#F8FAFC', marginBottom: 12 },
  studentCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1E293B', borderRadius: 14, padding: 14, marginBottom: 8, gap: 12, borderWidth: 1, borderColor: '#334155' },
  studentAvatar: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
  studentAvatarText: { fontSize: 18, fontWeight: '700', color: '#FFF' },
  studentInfo: { flex: 1 },
  studentName: { fontSize: 15, fontWeight: '700', color: '#F8FAFC' },
  studentEmail: { fontSize: 12, color: '#64748B', marginTop: 2 },
  studentMeta: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4, flexWrap: 'wrap' },
  metaText: { fontSize: 11, color: '#94A3B8' },
  metaDot: { fontSize: 11, color: '#475569' },
  streakBadge: { flexDirection: 'row', alignItems: 'center', gap: 2, backgroundColor: 'rgba(255,159,28,0.1)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10 },
  streakText: { fontSize: 13, fontWeight: '700', color: '#FF9F1C' },
  emptyState: { alignItems: 'center', marginTop: 40, gap: 8 },
  emptyText: { color: '#64748B', fontSize: 14 },
});
