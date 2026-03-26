import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, RefreshControl
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

export default function TracksScreen() {
  const router = useRouter();
  const [tracks, setTracks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchTracks(); }, []);

  const fetchTracks = async () => {
    try {
      const token = await AsyncStorage.getItem('auth_token');
      if (!token) { router.replace('/'); return; }
      const res = await fetch(`${API_URL}/api/tracks`, { headers: { 'Authorization': `Bearer ${token}` } });
      if (res.ok) setTracks(await res.json());
    } catch (e) {}
    setLoading(false);
  };

  const trackIcons: Record<string, string> = { 'brain': 'brain', 'tools': 'wrench', 'shield-check': 'shield-check', 'rocket-launch': 'rocket-launch' };
  const trackColors: Record<string, [string, string]> = {
    '#4F46E5': ['#4F46E5', '#7C3AED'], '#FF9F1C': ['#FF9F1C', '#F59E0B'],
    '#00F5D4': ['#00F5D4', '#06B6D4'], '#A855F7': ['#A855F7', '#EC4899'],
  };

  if (loading) return <View style={styles.loadingContainer}><ActivityIndicator size="large" color="#4F46E5" /></View>;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity testID="back-from-tracks" onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#F8FAFC" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Learning Tracks</Text>
        <View style={{ width: 44 }} />
      </View>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {tracks.map((track: any) => {
          const colors = trackColors[track.color] || ['#4F46E5', '#7C3AED'];
          const iconName = trackIcons[track.icon] || 'book';
          return (
            <TouchableOpacity
              key={track.track_id}
              testID={`track-card-${track.track_id}`}
              style={styles.trackCard}
              onPress={() => router.push(`/track/${track.track_id}`)}
              activeOpacity={0.85}
            >
              <LinearGradient colors={colors} style={styles.trackIconBg}>
                <MaterialCommunityIcons name={iconName as any} size={32} color="#FFF" />
              </LinearGradient>
              <View style={styles.trackInfo}>
                <Text style={styles.trackTitle}>{track.title}</Text>
                <Text style={styles.trackDesc} numberOfLines={2}>{track.description}</Text>
                <View style={styles.trackMeta}>
                  <View style={styles.metaItem}>
                    <Ionicons name="book-outline" size={14} color="#64748B" />
                    <Text style={styles.metaText}>{track.lesson_count} lessons</Text>
                  </View>
                  <View style={[styles.diffBadge, { backgroundColor: track.difficulty === 'beginner' ? 'rgba(0,245,212,0.15)' : track.difficulty === 'intermediate' ? 'rgba(255,159,28,0.15)' : 'rgba(168,85,247,0.15)' }]}>
                    <Text style={[styles.diffText, { color: track.difficulty === 'beginner' ? '#00F5D4' : track.difficulty === 'intermediate' ? '#FF9F1C' : '#A855F7' }]}>
                      {track.difficulty}
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
  headerTitle: { fontSize: 20, fontWeight: '700', color: '#F8FAFC' },
  scrollView: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 40, gap: 12 },
  trackCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1E293B', borderRadius: 16, padding: 16, gap: 14, borderWidth: 1, borderColor: '#334155' },
  trackIconBg: { width: 56, height: 56, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  trackInfo: { flex: 1 },
  trackTitle: { fontSize: 16, fontWeight: '700', color: '#F8FAFC', marginBottom: 4 },
  trackDesc: { fontSize: 13, color: '#94A3B8', marginBottom: 8, lineHeight: 18 },
  trackMeta: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontSize: 12, color: '#64748B' },
  diffBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
  diffText: { fontSize: 11, fontWeight: '600', textTransform: 'capitalize' },
});
