import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, Animated
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

export default function LessonDetail() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [lesson, setLesson] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [completing, setCompleting] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [xpEarned, setXpEarned] = useState(0);
  const [showXpAnimation, setShowXpAnimation] = useState(false);
  const [nextLessonTitle, setNextLessonTitle] = useState('');
  
  // Animation values
  const xpAnimScale = useRef(new Animated.Value(0)).current;
  const xpAnimOpacity = useRef(new Animated.Value(0)).current;
  
  // Prevent double navigation
  const isNavigating = useRef(false);

  useEffect(() => { fetchLesson(); }, [id]);

  const fetchLesson = async () => {
    setLoading(true);
    setCompleted(false);
    setShowXpAnimation(false);
    setXpEarned(0);
    setNextLessonTitle('');
    isNavigating.current = false;
    
    try {
      const token = await AsyncStorage.getItem('auth_token');
      if (!token) { router.replace('/'); return; }
      const res = await fetch(`${API_URL}/api/lessons/${id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) setLesson(await res.json());
    } catch (e) {}
    setLoading(false);
  };

  const playXpAnimation = (xp: number, nextTitle: string) => {
    setXpEarned(xp);
    setNextLessonTitle(nextTitle);
    setShowXpAnimation(true);
    
    // Reset animation values
    xpAnimScale.setValue(0);
    xpAnimOpacity.setValue(0);
    
    // Play animation sequence
    Animated.parallel([
      Animated.spring(xpAnimScale, {
        toValue: 1,
        friction: 4,
        tension: 100,
        useNativeDriver: true,
      }),
      Animated.timing(xpAnimOpacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handleComplete = async () => {
    // Prevent double taps
    if (completing || completed || isNavigating.current) return;
    
    setCompleting(true);
    try {
      const token = await AsyncStorage.getItem('auth_token');
      const res = await fetch(`${API_URL}/api/lessons/complete`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ lesson_id: id })
      });
      const data = await res.json();
      setCompleted(true);

      if (data.track_completed) {
        // Play XP animation then navigate to track complete screen
        playXpAnimation(data.xp_earned || 0, 'Track Complete!');
        
        // Delay navigation to allow animation to play
        setTimeout(() => {
          if (isNavigating.current) return;
          isNavigating.current = true;
          router.replace({
            pathname: '/track-complete',
            params: {
              track_id: data.track_id,
              total_xp: String(data.track_xp_total),
              xp_earned: String(data.xp_earned)
            }
          });
        }, 700);
      } else if (data.next_lesson) {
        // Play XP animation then auto-navigate to next lesson
        playXpAnimation(data.xp_earned || 0, data.next_lesson.title);
        
        // Delay navigation to allow animation to play
        setTimeout(() => {
          if (isNavigating.current) return;
          isNavigating.current = true;
          router.replace(`/lesson/${data.next_lesson.lesson_id}`);
        }, 700);
      } else {
        // Already completed, just show the XP earned (0)
        playXpAnimation(data.xp_earned || 0, 'Already completed');
      }
    } catch (e) {
      setCompleted(false);
      setShowXpAnimation(false);
    }
    setCompleting(false);
  };

  const renderContent = (content: string) => {
    const lines = content.split('\n');
    return lines.map((line: string, i: number) => {
      if (line.startsWith('## ')) return <Text key={i} style={styles.contentH2}>{line.replace('## ', '')}</Text>;
      if (line.startsWith('### ')) return <Text key={i} style={styles.contentH3}>{line.replace('### ', '')}</Text>;
      if (line.startsWith('**') && line.endsWith('**')) return <Text key={i} style={styles.contentBold}>{line.replace(/\*\*/g, '')}</Text>;
      if (line.startsWith('- **')) {
        const parts = line.replace('- **', '').split('**');
        return (
          <View key={i} style={styles.bulletRow}>
            <Text style={styles.bulletDot}>•</Text>
            <Text style={styles.bulletText}><Text style={styles.contentBoldInline}>{parts[0]}</Text>{parts[1] || ''}</Text>
          </View>
        );
      }
      if (line.startsWith('- ')) return (
        <View key={i} style={styles.bulletRow}>
          <Text style={styles.bulletDot}>•</Text>
          <Text style={styles.bulletText}>{line.replace('- ', '')}</Text>
        </View>
      );
      if (line.match(/^\d+\.\s/)) return (
        <View key={i} style={styles.bulletRow}>
          <Text style={styles.numberDot}>{line.match(/^\d+/)?.[0]}.</Text>
          <Text style={styles.bulletText}>{line.replace(/^\d+\.\s/, '')}</Text>
        </View>
      );
      if (line.startsWith('```')) return null;
      if (line.startsWith('*') && line.endsWith('*') && !line.startsWith('**')) return <Text key={i} style={styles.contentItalic}>{line.replace(/\*/g, '')}</Text>;
      if (line.trim() === '') return <View key={i} style={styles.spacer} />;
      return <Text key={i} style={styles.contentText}>{line}</Text>;
    });
  };

  if (loading) return <View style={styles.loadingContainer}><ActivityIndicator size="large" color="#4F46E5" /></View>;
  if (!lesson) return <View style={styles.loadingContainer}><Text style={styles.errorText}>Lesson not found</Text></View>;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity testID="back-from-lesson" onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#F8FAFC" />
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={styles.headerTitle} numberOfLines={1}>{lesson.title}</Text>
          <View style={styles.headerMeta}>
            <Ionicons name="time-outline" size={13} color="#64748B" />
            <Text style={styles.headerMetaText}>{lesson.duration_minutes} min</Text>
            <Ionicons name="flash" size={13} color="#FFD700" />
            <Text style={styles.headerMetaText}>{lesson.xp_reward} XP</Text>
          </View>
        </View>
      </View>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {renderContent(lesson.content)}
      </ScrollView>
      
      {/* XP Animation Overlay */}
      {showXpAnimation && (
        <View style={styles.xpOverlay}>
          <Animated.View style={[
            styles.xpAnimationContainer,
            {
              transform: [{ scale: xpAnimScale }],
              opacity: xpAnimOpacity,
            }
          ]}>
            <LinearGradient colors={['#FFD700', '#F59E0B']} style={styles.xpBadge}>
              <Ionicons name="flash" size={32} color="#FFF" />
              <Text style={styles.xpBadgeText}>+{xpEarned} XP</Text>
            </LinearGradient>
            {nextLessonTitle ? (
              <Text style={styles.nextLessonText}>
                {nextLessonTitle === 'Track Complete!' ? 'Track Complete!' : `Next: ${nextLessonTitle}`}
              </Text>
            ) : null}
          </Animated.View>
        </View>
      )}
      
      <View style={styles.footer}>
        <TouchableOpacity testID="complete-lesson-btn" onPress={handleComplete} disabled={completing || completed} activeOpacity={0.8}>
          <LinearGradient colors={completed ? ['#00F5D4', '#06B6D4'] : ['#4F46E5', '#7C3AED']} style={styles.completeBtn}>
            {completing ? <ActivityIndicator color="#FFF" /> : (
              <>
                <Ionicons name={completed ? 'checkmark-circle' : 'arrow-forward-circle'} size={20} color="#FFF" />
                <Text style={styles.completeBtnText}>{completed ? 'Completed!' : 'Complete & Continue'}</Text>
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F172A' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0F172A' },
  errorText: { color: '#EF4444', fontSize: 16 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 56, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: '#1E293B', gap: 12 },
  backBtn: { width: 44, height: 44, justifyContent: 'center' },
  headerInfo: { flex: 1 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#F8FAFC' },
  headerMeta: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  headerMetaText: { fontSize: 12, color: '#64748B' },
  scrollView: { flex: 1 },
  scrollContent: { paddingHorizontal: 24, paddingTop: 20, paddingBottom: 40 },
  contentH2: { fontSize: 22, fontWeight: '800', color: '#F8FAFC', marginTop: 20, marginBottom: 12 },
  contentH3: { fontSize: 18, fontWeight: '700', color: '#FF9F1C', marginTop: 16, marginBottom: 8 },
  contentBold: { fontSize: 16, fontWeight: '700', color: '#F8FAFC', marginVertical: 4 },
  contentBoldInline: { fontWeight: '700', color: '#F8FAFC' },
  contentText: { fontSize: 16, color: '#CBD5E1', lineHeight: 24, marginBottom: 4 },
  contentItalic: { fontSize: 16, color: '#94A3B8', fontStyle: 'italic', marginVertical: 4 },
  bulletRow: { flexDirection: 'row', paddingLeft: 8, marginBottom: 6, gap: 8 },
  bulletDot: { fontSize: 16, color: '#4F46E5', lineHeight: 24 },
  numberDot: { fontSize: 16, color: '#4F46E5', fontWeight: '700', lineHeight: 24, width: 20 },
  bulletText: { fontSize: 15, color: '#CBD5E1', lineHeight: 22, flex: 1 },
  spacer: { height: 8 },
  footer: { paddingHorizontal: 20, paddingVertical: 16, borderTopWidth: 1, borderTopColor: '#1E293B', paddingBottom: 32 },
  completeBtn: { height: 56, borderRadius: 28, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8 },
  completeBtnText: { fontSize: 17, fontWeight: '700', color: '#FFF' },
  // XP Animation Overlay Styles
  xpOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15,23,42,0.85)', justifyContent: 'center', alignItems: 'center', zIndex: 100 },
  xpAnimationContainer: { alignItems: 'center', gap: 16 },
  xpBadge: { width: 120, height: 120, borderRadius: 60, justifyContent: 'center', alignItems: 'center', shadowColor: '#FFD700', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.5, shadowRadius: 20, elevation: 10 },
  xpBadgeText: { fontSize: 24, fontWeight: '800', color: '#FFF', marginTop: 4 },
  nextLessonText: { fontSize: 16, fontWeight: '600', color: '#94A3B8', textAlign: 'center' },
});
