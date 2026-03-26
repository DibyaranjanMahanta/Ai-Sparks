import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

export default function TrackDetail() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [lessons, setLessons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [completedLessons, setCompletedLessons] = useState<string[]>([]);

  useEffect(() => { fetchLessons(); }, [id]);

  const fetchLessons = async () => {
    try {
      const token = await AsyncStorage.getItem('auth_token');
      if (!token) { router.replace('/'); return; }
      const headers = { 'Authorization': `Bearer ${token}` };
      const [lessonsRes, progressRes] = await Promise.all([
        fetch(`${API_URL}/api/tracks/${id}/lessons`, { headers }),
        fetch(`${API_URL}/api/progress`, { headers })
      ]);
      if (lessonsRes.ok) setLessons(await lessonsRes.json());
      if (progressRes.ok) {
        const prog = await progressRes.json();
        setCompletedLessons((prog.completed_lessons || []).map((c: any) => c.lesson_id));
      }
    } catch (e) {}
    setLoading(false);
  };

  const typeColors: Record<string, string> = {
    theory: '#4F46E5',
    interactive: '#FF9F1C',
    project: '#A855F7',
  };

  if (loading) return <View style={styles.loadingContainer}><ActivityIndicator size="large" color="#4F46E5" /></View>;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity testID="back-from-track-detail" onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#F8FAFC" />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>{lessons[0]?.track_id?.replace('track_', '').replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase()) || 'Lessons'}</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {lessons.map((lesson: any, index: number) => {
          const isCompleted = completedLessons.includes(lesson.lesson_id);
          return (
            <TouchableOpacity
              key={lesson.lesson_id}
              testID={`lesson-${lesson.lesson_id}`}
              style={[styles.lessonCard, isCompleted && styles.lessonCompleted]}
              onPress={() => router.push(`/lesson/${lesson.lesson_id}`)}
              activeOpacity={0.85}
            >
              <View style={[styles.lessonNumber, isCompleted && styles.lessonNumberCompleted]}>
                {isCompleted ? (
                  <Ionicons name="checkmark" size={18} color="#FFF" />
                ) : (
                  <Text style={styles.lessonNumberText}>{index + 1}</Text>
                )}
              </View>
              <View style={styles.lessonInfo}>
                <Text style={styles.lessonTitle}>{lesson.title}</Text>
                <Text style={styles.lessonDesc} numberOfLines={1}>{lesson.description}</Text>
                <View style={styles.lessonMeta}>
                  <View style={styles.metaItem}>
                    <Ionicons name="time-outline" size={13} color="#64748B" />
                    <Text style={styles.metaText}>{lesson.duration_minutes} min</Text>
                  </View>
                  <View style={styles.metaItem}>
                    <Ionicons name="flash-outline" size={13} color="#FFD700" />
                    <Text style={styles.metaText}>{lesson.xp_reward} XP</Text>
                  </View>
                  <View style={[styles.typeBadge, { backgroundColor: `${typeColors[lesson.lesson_type] || '#4F46E5'}20` }]}>
                    <Text style={[styles.typeText, { color: typeColors[lesson.lesson_type] || '#4F46E5' }]}>
                      {lesson.lesson_type}
                    </Text>
                  </View>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#475569" />
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F172A' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0F172A' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 56, paddingBottom: 16 },
  backBtn: { width: 44, height: 44, justifyContent: 'center' },
  headerTitle: { fontSize: 20, fontWeight: '700', color: '#F8FAFC', flex: 1, textAlign: 'center' },
  scrollView: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 40, gap: 10 },
  lessonCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1E293B', borderRadius: 16, padding: 16, gap: 14, borderWidth: 1, borderColor: '#334155' },
  lessonCompleted: { borderColor: 'rgba(0,245,212,0.3)' },
  lessonNumber: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#334155', justifyContent: 'center', alignItems: 'center' },
  lessonNumberCompleted: { backgroundColor: '#00F5D4' },
  lessonNumberText: { fontSize: 14, fontWeight: '700', color: '#94A3B8' },
  lessonInfo: { flex: 1 },
  lessonTitle: { fontSize: 15, fontWeight: '700', color: '#F8FAFC', marginBottom: 4 },
  lessonDesc: { fontSize: 13, color: '#94A3B8', marginBottom: 8 },
  lessonMeta: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontSize: 12, color: '#64748B' },
  typeBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
  typeText: { fontSize: 10, fontWeight: '600', textTransform: 'capitalize' },
});
