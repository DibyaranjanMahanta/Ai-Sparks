import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

export default function BadgesScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [badges, setBadges] = useState<any[]>([]);

  useEffect(() => { fetchBadges(); }, []);

  const fetchBadges = async () => {
    try {
      const token = await AsyncStorage.getItem('auth_token');
      if (!token) { router.replace('/'); return; }
      const res = await fetch(`${API_URL}/api/badges`, { headers: { 'Authorization': `Bearer ${token}` } });
      if (res.ok) {
        const data = await res.json();
        setBadges(data.badges || []);
      }
    } catch (e) {}
    setLoading(false);
  };

  const badgeColors: Record<string, [string, string]> = {
    first_login: ['#4F46E5', '#7C3AED'],
    first_lesson: ['#FF9F1C', '#F59E0B'],
    quiz_master: ['#00F5D4', '#06B6D4'],
    prompt_master: ['#A855F7', '#EC4899'],
    five_lessons: ['#4F46E5', '#06B6D4'],
    streak_3: ['#EF4444', '#F97316'],
    ai_ethics: ['#00F5D4', '#10B981'],
    data_detective: ['#FF9F1C', '#EF4444'],
    level_5: ['#FFD700', '#F59E0B'],
  };

  if (loading) return <View style={styles.loadingContainer}><ActivityIndicator size="large" color="#4F46E5" /></View>;

  const earned = badges.filter(b => b.earned);
  const locked = badges.filter(b => !b.earned);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity testID="back-from-badges" onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#F8FAFC" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Badges</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.summary}>
          <Text style={styles.summaryText}>{earned.length} of {badges.length} earned</Text>
        </View>

        {earned.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Earned</Text>
            <View style={styles.badgeGrid}>
              {earned.map((badge) => {
                const colors = badgeColors[badge.badge_id] || ['#4F46E5', '#7C3AED'];
                return (
                  <View key={badge.badge_id} style={styles.badgeCard}>
                    <LinearGradient colors={colors} style={styles.badgeIcon}>
                      <MaterialCommunityIcons name={badge.icon as any} size={28} color="#FFF" />
                    </LinearGradient>
                    <Text style={styles.badgeName}>{badge.name}</Text>
                    <Text style={styles.badgeDesc} numberOfLines={2}>{badge.description}</Text>
                  </View>
                );
              })}
            </View>
          </>
        )}

        {locked.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Locked</Text>
            <View style={styles.badgeGrid}>
              {locked.map((badge) => (
                <View key={badge.badge_id} style={[styles.badgeCard, styles.badgeCardLocked]}>
                  <View style={styles.badgeIconLocked}>
                    <MaterialCommunityIcons name={badge.icon as any} size={28} color="#475569" />
                  </View>
                  <Text style={styles.badgeNameLocked}>{badge.name}</Text>
                  <Text style={styles.badgeDescLocked} numberOfLines={2}>{badge.description}</Text>
                </View>
              ))}
            </View>
          </>
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
  summary: { alignItems: 'center', marginBottom: 24 },
  summaryText: { fontSize: 16, color: '#94A3B8', fontWeight: '600' },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#F8FAFC', marginBottom: 12 },
  badgeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 24 },
  badgeCard: { width: '47%', backgroundColor: '#1E293B', borderRadius: 16, padding: 16, alignItems: 'center', borderWidth: 1, borderColor: '#334155' },
  badgeCardLocked: { opacity: 0.5 },
  badgeIcon: { width: 56, height: 56, borderRadius: 18, justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
  badgeIconLocked: { width: 56, height: 56, borderRadius: 18, justifyContent: 'center', alignItems: 'center', marginBottom: 10, backgroundColor: '#334155' },
  badgeName: { fontSize: 14, fontWeight: '700', color: '#F8FAFC', textAlign: 'center', marginBottom: 4 },
  badgeNameLocked: { fontSize: 14, fontWeight: '700', color: '#475569', textAlign: 'center', marginBottom: 4 },
  badgeDesc: { fontSize: 12, color: '#94A3B8', textAlign: 'center', lineHeight: 16 },
  badgeDescLocked: { fontSize: 12, color: '#475569', textAlign: 'center', lineHeight: 16 },
});
