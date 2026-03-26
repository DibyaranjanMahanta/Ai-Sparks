import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

export default function LeaderboardScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [currentUserId, setCurrentUserId] = useState('');

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const token = await AsyncStorage.getItem('auth_token');
      const userData = await AsyncStorage.getItem('user_data');
      if (!token) { router.replace('/'); return; }
      if (userData) setCurrentUserId(JSON.parse(userData).user_id || '');
      const res = await fetch(`${API_URL}/api/leaderboard`, { headers: { 'Authorization': `Bearer ${token}` } });
      if (res.ok) {
        const data = await res.json();
        setLeaderboard(data.leaderboard || []);
      }
    } catch (e) {}
    setLoading(false);
  };

  const getMedalColor = (rank: number) => {
    if (rank === 0) return '#FFD700';
    if (rank === 1) return '#C0C0C0';
    if (rank === 2) return '#CD7F32';
    return '#475569';
  };

  if (loading) return <View style={styles.loadingContainer}><ActivityIndicator size="large" color="#4F46E5" /></View>;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity testID="back-from-leaderboard" onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#F8FAFC" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Leaderboard</Text>
        <View style={{ width: 44 }} />
      </View>

      {/* Top 3 podium */}
      {leaderboard.length >= 3 && (
        <View style={styles.podium}>
          {[1, 0, 2].map((idx) => {
            const u = leaderboard[idx];
            if (!u) return null;
            const isFirst = idx === 0;
            return (
              <View key={idx} style={[styles.podiumItem, isFirst && styles.podiumFirst]}>
                <View style={[styles.podiumAvatar, { borderColor: getMedalColor(idx) }]}>
                  <Text style={styles.podiumAvatarText}>{(u.name || '?')[0].toUpperCase()}</Text>
                </View>
                {isFirst && <Ionicons name="trophy" size={20} color="#FFD700" style={styles.crown} />}
                <Text style={styles.podiumName} numberOfLines={1}>{u.name?.split(' ')[0] || 'User'}</Text>
                <Text style={styles.podiumXP}>{u.xp} XP</Text>
                <View style={[styles.podiumRank, { backgroundColor: getMedalColor(idx) }]}>
                  <Text style={styles.podiumRankText}>{idx + 1}</Text>
                </View>
              </View>
            );
          })}
        </View>
      )}

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {leaderboard.slice(3).map((u: any, i: number) => {
          const isMe = u.user_id === currentUserId;
          return (
            <View key={u.user_id} style={[styles.rankCard, isMe && styles.rankCardMe]}>
              <Text style={styles.rankNum}>{i + 4}</Text>
              <View style={styles.rankAvatar}>
                <Text style={styles.rankAvatarText}>{(u.name || '?')[0].toUpperCase()}</Text>
              </View>
              <View style={styles.rankInfo}>
                <Text style={styles.rankName}>{u.name}{isMe ? ' (You)' : ''}</Text>
                <Text style={styles.rankLevel}>Level {u.level || 1}</Text>
              </View>
              <View style={styles.rankXP}>
                <Ionicons name="flash" size={14} color="#FFD700" />
                <Text style={styles.rankXPText}>{u.xp}</Text>
              </View>
            </View>
          );
        })}
        {leaderboard.length === 0 && (
          <View style={styles.emptyState}>
            <Ionicons name="trophy-outline" size={48} color="#334155" />
            <Text style={styles.emptyText}>No rankings yet. Start learning to earn XP!</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F172A' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0F172A' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 56, paddingBottom: 8 },
  backBtn: { width: 44, height: 44, justifyContent: 'center' },
  headerTitle: { fontSize: 20, fontWeight: '700', color: '#F8FAFC' },
  podium: { flexDirection: 'row', justifyContent: 'center', alignItems: 'flex-end', paddingHorizontal: 20, paddingVertical: 20, gap: 12 },
  podiumItem: { alignItems: 'center', width: 90 },
  podiumFirst: { marginBottom: 16 },
  podiumAvatar: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#1E293B', justifyContent: 'center', alignItems: 'center', borderWidth: 3, marginBottom: 6 },
  podiumAvatarText: { fontSize: 22, fontWeight: '700', color: '#F8FAFC' },
  crown: { position: 'absolute', top: -10 },
  podiumName: { fontSize: 13, fontWeight: '600', color: '#F8FAFC' },
  podiumXP: { fontSize: 12, color: '#FFD700', fontWeight: '700', marginTop: 2 },
  podiumRank: { width: 24, height: 24, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginTop: 4 },
  podiumRankText: { fontSize: 12, fontWeight: '800', color: '#FFF' },
  scrollView: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 40, gap: 8 },
  rankCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1E293B', borderRadius: 14, padding: 14, gap: 12, borderWidth: 1, borderColor: '#334155' },
  rankCardMe: { borderColor: '#4F46E5', backgroundColor: 'rgba(79,70,229,0.08)' },
  rankNum: { fontSize: 16, fontWeight: '700', color: '#475569', width: 28, textAlign: 'center' },
  rankAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#334155', justifyContent: 'center', alignItems: 'center' },
  rankAvatarText: { fontSize: 16, fontWeight: '700', color: '#94A3B8' },
  rankInfo: { flex: 1 },
  rankName: { fontSize: 15, fontWeight: '600', color: '#F8FAFC' },
  rankLevel: { fontSize: 12, color: '#64748B', marginTop: 2 },
  rankXP: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  rankXPText: { fontSize: 14, fontWeight: '700', color: '#FFD700' },
  emptyState: { alignItems: 'center', marginTop: 60, gap: 12 },
  emptyText: { color: '#64748B', fontSize: 15, textAlign: 'center' },
});
