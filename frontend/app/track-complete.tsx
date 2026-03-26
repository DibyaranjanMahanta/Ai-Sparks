import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

export default function TrackComplete() {
  const router = useRouter();
  const { track_id, total_xp, xp_earned } = useLocalSearchParams<{ track_id: string; total_xp: string; xp_earned: string }>();
  const [trackTitle, setTrackTitle] = useState('');
  const [lessonCount, setLessonCount] = useState(0);

  useEffect(() => {
    fetchTrackInfo();
  }, []);

  const fetchTrackInfo = async () => {
    try {
      const token = await AsyncStorage.getItem('auth_token');
      const res = await fetch(`${API_URL}/api/tracks`, { headers: { 'Authorization': `Bearer ${token}` } });
      if (res.ok) {
        const tracks = await res.json();
        const t = tracks.find((tr: any) => tr.track_id === track_id);
        if (t) {
          setTrackTitle(t.title);
          setLessonCount(t.lesson_count);
        }
      }
    } catch (e) {}
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.celebration}>
          <LinearGradient colors={['#FFD700', '#F59E0B']} style={styles.trophyCircle}>
            <Ionicons name="trophy" size={64} color="#FFF" />
          </LinearGradient>
          <Text style={styles.congratsText}>Track Complete!</Text>
          <Text style={styles.trackName}>{trackTitle}</Text>
        </View>

        <View style={styles.statsCard}>
          <View style={styles.statItem}>
            <Ionicons name="flash" size={28} color="#FFD700" />
            <Text style={styles.statValue}>{total_xp || 0}</Text>
            <Text style={styles.statLabel}>Total XP Earned</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.statItem}>
            <Ionicons name="book" size={28} color="#4F46E5" />
            <Text style={styles.statValue}>{lessonCount}</Text>
            <Text style={styles.statLabel}>Lessons Done</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.statItem}>
            <MaterialCommunityIcons name="certificate" size={28} color="#00F5D4" />
            <Text style={styles.statValue}>1</Text>
            <Text style={styles.statLabel}>Certificate</Text>
          </View>
        </View>

        <View style={styles.badgesEarned}>
          <Text style={styles.badgesTitle}>Badges Earned</Text>
          <View style={styles.badgeRow}>
            <LinearGradient colors={['#4F46E5', '#7C3AED']} style={styles.badgeIcon}>
              <MaterialCommunityIcons name="flag-checkered" size={24} color="#FFF" />
            </LinearGradient>
            <View>
              <Text style={styles.badgeName}>Track Finisher</Text>
              <Text style={styles.badgeDesc}>Completed an entire track</Text>
            </View>
          </View>
          <View style={styles.badgeRow}>
            <LinearGradient colors={['#00F5D4', '#06B6D4']} style={styles.badgeIcon}>
              <MaterialCommunityIcons name="certificate" size={24} color="#FFF" />
            </LinearGradient>
            <View>
              <Text style={styles.badgeName}>Certified AI Learner</Text>
              <Text style={styles.badgeDesc}>Earned a course certificate</Text>
            </View>
          </View>
        </View>

        <TouchableOpacity testID="view-certificate-btn" onPress={() => router.push('/certificates')} activeOpacity={0.8}>
          <LinearGradient colors={['#00F5D4', '#06B6D4']} style={styles.certBtn}>
            <MaterialCommunityIcons name="certificate" size={20} color="#FFF" />
            <Text style={styles.certBtnText}>View Certificate</Text>
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity testID="back-dashboard-btn" onPress={() => router.push('/dashboard')} activeOpacity={0.8}>
          <LinearGradient colors={['#4F46E5', '#7C3AED']} style={styles.dashBtn}>
            <Ionicons name="home" size={20} color="#FFF" />
            <Text style={styles.dashBtnText}>Back to Dashboard</Text>
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity testID="explore-tracks-btn" style={styles.exploreBtn} onPress={() => router.push('/tracks')}>
          <Text style={styles.exploreBtnText}>Explore More Tracks</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F172A' },
  content: { paddingHorizontal: 24, paddingTop: 80, paddingBottom: 40, alignItems: 'center' },
  celebration: { alignItems: 'center', marginBottom: 32 },
  trophyCircle: { width: 120, height: 120, borderRadius: 60, justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  congratsText: { fontSize: 32, fontWeight: '800', color: '#FFD700', marginBottom: 8 },
  trackName: { fontSize: 18, color: '#94A3B8', fontWeight: '600' },
  statsCard: { flexDirection: 'row', backgroundColor: '#1E293B', borderRadius: 16, padding: 20, marginBottom: 24, width: '100%', borderWidth: 1, borderColor: '#334155' },
  statItem: { flex: 1, alignItems: 'center', gap: 6 },
  statValue: { fontSize: 28, fontWeight: '800', color: '#F8FAFC' },
  statLabel: { fontSize: 12, color: '#64748B', textAlign: 'center' },
  divider: { width: 1, backgroundColor: '#334155' },
  badgesEarned: { width: '100%', marginBottom: 24 },
  badgesTitle: { fontSize: 18, fontWeight: '700', color: '#F8FAFC', marginBottom: 12 },
  badgeRow: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#1E293B', borderRadius: 12, padding: 14, marginBottom: 8, borderWidth: 1, borderColor: '#334155' },
  badgeIcon: { width: 44, height: 44, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  badgeName: { fontSize: 15, fontWeight: '700', color: '#F8FAFC' },
  badgeDesc: { fontSize: 12, color: '#94A3B8', marginTop: 2 },
  certBtn: { height: 56, borderRadius: 28, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8, width: '100%', marginBottom: 12 },
  certBtnText: { fontSize: 17, fontWeight: '700', color: '#FFF' },
  dashBtn: { height: 56, borderRadius: 28, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8, width: '100%', marginBottom: 12 },
  dashBtnText: { fontSize: 17, fontWeight: '700', color: '#FFF' },
  exploreBtn: { paddingVertical: 12 },
  exploreBtnText: { fontSize: 15, color: '#4F46E5', fontWeight: '600' },
});
