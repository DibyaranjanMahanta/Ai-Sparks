import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, TextInput, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

export default function ParentDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [children, setChildren] = useState<any[]>([]);
  const [showLink, setShowLink] = useState(false);
  const [childEmail, setChildEmail] = useState('');
  const [linking, setLinking] = useState(false);

  useEffect(() => { fetchChildren(); }, []);

  const fetchChildren = async () => {
    try {
      const token = await AsyncStorage.getItem('auth_token');
      if (!token) { router.replace('/'); return; }
      const res = await fetch(`${API_URL}/api/parent/children`, { headers: { 'Authorization': `Bearer ${token}` } });
      if (res.ok) { const data = await res.json(); setChildren(data.children || []); }
    } catch (e) {}
    setLoading(false);
  };

  const linkChild = async () => {
    if (!childEmail.trim()) return;
    setLinking(true);
    try {
      const token = await AsyncStorage.getItem('auth_token');
      const res = await fetch(`${API_URL}/api/parent/link-child`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ child_email: childEmail.trim() })
      });
      const data = await res.json();
      if (res.ok) {
        Alert.alert('Success', `Linked to ${data.child_name}`);
        setChildEmail('');
        setShowLink(false);
        fetchChildren();
      } else {
        Alert.alert('Error', data.detail || 'Could not link child');
      }
    } catch (e) {}
    setLinking(false);
  };

  const LEVEL_NAMES = ['Newbie', 'AI Explorer', 'AI Learner', 'AI Builder', 'AI Creator', 'AI Innovator', 'AI Master', 'AI Wizard', 'AI Champion', 'AI Legend'];

  if (loading) return <View style={styles.loadingContainer}><ActivityIndicator size="large" color="#4F46E5" /></View>;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity testID="back-from-parent" onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#F8FAFC" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Parent Dashboard</Text>
        <TouchableOpacity testID="add-child-btn" onPress={() => setShowLink(!showLink)} style={styles.addBtn}>
          <Ionicons name="add" size={24} color="#4F46E5" />
        </TouchableOpacity>
      </View>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {showLink && (
          <View style={styles.linkCard}>
            <Text style={styles.linkTitle}>Link Your Child's Account</Text>
            <TextInput testID="child-email-input" style={styles.input} placeholder="Child's email address" placeholderTextColor="#475569" value={childEmail} onChangeText={setChildEmail} keyboardType="email-address" autoCapitalize="none" />
            <TouchableOpacity testID="link-child-btn" onPress={linkChild} disabled={linking} activeOpacity={0.8}>
              <LinearGradient colors={['#4F46E5', '#7C3AED']} style={styles.linkBtn}>
                {linking ? <ActivityIndicator color="#FFF" /> : <Text style={styles.linkBtnText}>Link Child</Text>}
              </LinearGradient>
            </TouchableOpacity>
          </View>
        )}
        {children.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="people-outline" size={64} color="#334155" />
            <Text style={styles.emptyTitle}>No Children Linked</Text>
            <Text style={styles.emptyDesc}>Tap the + button to link your child's account using their email.</Text>
          </View>
        ) : (
          children.map((child: any) => {
            const levelName = LEVEL_NAMES[Math.min((child.level || 1) - 1, LEVEL_NAMES.length - 1)];
            return (
              <View key={child.user_id} style={styles.childCard}>
                <View style={styles.childHeader}>
                  <LinearGradient colors={['#4F46E5', '#7C3AED']} style={styles.childAvatar}>
                    <Text style={styles.childAvatarText}>{(child.name || '?')[0].toUpperCase()}</Text>
                  </LinearGradient>
                  <View style={styles.childInfo}>
                    <Text style={styles.childName}>{child.name}</Text>
                    <Text style={styles.childLevel}>{levelName} · Level {child.level || 1}</Text>
                  </View>
                  <View style={styles.streakBadge}>
                    <Ionicons name="flame" size={16} color="#FF9F1C" />
                    <Text style={styles.streakText}>{child.current_streak || 0}</Text>
                  </View>
                </View>
                <View style={styles.childStats}>
                  <View style={styles.statItem}><Text style={styles.statValue}>{child.xp || 0}</Text><Text style={styles.statLabel}>XP</Text></View>
                  <View style={styles.statItem}><Text style={styles.statValue}>{child.lessons_completed || 0}</Text><Text style={styles.statLabel}>Lessons</Text></View>
                  <View style={styles.statItem}><Text style={styles.statValue}>{child.quizzes_taken || 0}</Text><Text style={styles.statLabel}>Quizzes</Text></View>
                  <View style={styles.statItem}><Text style={styles.statValue}>{(child.badges || []).length}</Text><Text style={styles.statLabel}>Badges</Text></View>
                </View>
                {child.recent_activity_dates && child.recent_activity_dates.length > 0 && (
                  <View style={styles.activityRow}>
                    <Text style={styles.activityTitle}>Recent Activity</Text>
                    <View style={styles.activityDots}>
                      {[6, 5, 4, 3, 2, 1, 0].map((d) => {
                        const date = new Date(Date.now() - d * 86400000).toISOString().split('T')[0];
                        const active = child.recent_activity_dates.includes(date);
                        return <View key={d} style={[styles.activityDot, active && styles.activityDotActive]} />;
                      })}
                    </View>
                    <Text style={styles.activityLegend}>Last 7 days</Text>
                  </View>
                )}
                {child.recent_quizzes && child.recent_quizzes.length > 0 && (
                  <View style={styles.quizSection}>
                    <Text style={styles.quizTitle}>Recent Quiz Scores</Text>
                    {child.recent_quizzes.slice(0, 3).map((q: any, i: number) => (
                      <View key={i} style={styles.quizRow}>
                        <Ionicons name={q.score >= 80 ? 'checkmark-circle' : 'close-circle'} size={16} color={q.score >= 80 ? '#00F5D4' : '#EF4444'} />
                        <Text style={styles.quizScore}>{q.score}%</Text>
                        <Text style={styles.quizXP}>+{q.xp_earned} XP</Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            );
          })
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
  addBtn: { width: 44, height: 44, justifyContent: 'center', alignItems: 'center' },
  scrollView: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 40 },
  linkCard: { backgroundColor: '#1E293B', borderRadius: 16, padding: 16, marginBottom: 20, borderWidth: 1, borderColor: '#334155' },
  linkTitle: { fontSize: 16, fontWeight: '700', color: '#F8FAFC', marginBottom: 12 },
  input: { height: 48, backgroundColor: '#0F172A', borderRadius: 12, paddingHorizontal: 14, fontSize: 15, color: '#F8FAFC', borderWidth: 1, borderColor: '#334155', marginBottom: 12 },
  linkBtn: { height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
  linkBtnText: { fontSize: 15, fontWeight: '700', color: '#FFF' },
  emptyState: { alignItems: 'center', marginTop: 80, gap: 12 },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: '#F8FAFC' },
  emptyDesc: { fontSize: 14, color: '#64748B', textAlign: 'center', lineHeight: 20 },
  childCard: { backgroundColor: '#1E293B', borderRadius: 16, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: '#334155' },
  childHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 },
  childAvatar: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center' },
  childAvatarText: { fontSize: 20, fontWeight: '700', color: '#FFF' },
  childInfo: { flex: 1 },
  childName: { fontSize: 18, fontWeight: '700', color: '#F8FAFC' },
  childLevel: { fontSize: 13, color: '#94A3B8', marginTop: 2 },
  streakBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(255,159,28,0.1)', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12 },
  streakText: { fontSize: 15, fontWeight: '700', color: '#FF9F1C' },
  childStats: { flexDirection: 'row', marginBottom: 14 },
  statItem: { flex: 1, alignItems: 'center' },
  statValue: { fontSize: 22, fontWeight: '800', color: '#F8FAFC' },
  statLabel: { fontSize: 11, color: '#64748B', marginTop: 2 },
  activityRow: { marginBottom: 14 },
  activityTitle: { fontSize: 13, fontWeight: '600', color: '#94A3B8', marginBottom: 8 },
  activityDots: { flexDirection: 'row', gap: 8 },
  activityDot: { width: 32, height: 32, borderRadius: 8, backgroundColor: '#334155' },
  activityDotActive: { backgroundColor: '#00F5D4' },
  activityLegend: { fontSize: 11, color: '#475569', marginTop: 4 },
  quizSection: { marginTop: 4 },
  quizTitle: { fontSize: 13, fontWeight: '600', color: '#94A3B8', marginBottom: 8 },
  quizRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  quizScore: { fontSize: 14, fontWeight: '600', color: '#F8FAFC' },
  quizXP: { fontSize: 12, color: '#FFD700' },
});
