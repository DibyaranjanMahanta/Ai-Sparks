import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

export default function CertificatesScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [certs, setCerts] = useState<any[]>([]);

  useEffect(() => { fetchCerts(); }, []);

  const fetchCerts = async () => {
    try {
      const token = await AsyncStorage.getItem('auth_token');
      if (!token) { router.replace('/'); return; }
      const res = await fetch(`${API_URL}/api/certificates`, { headers: { 'Authorization': `Bearer ${token}` } });
      if (res.ok) { const data = await res.json(); setCerts(data.certificates || []); }
    } catch (e) {}
    setLoading(false);
  };

  if (loading) return <View style={styles.loadingContainer}><ActivityIndicator size="large" color="#4F46E5" /></View>;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity testID="back-from-certs" onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#F8FAFC" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Certificates</Text>
        <View style={{ width: 44 }} />
      </View>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {certs.length === 0 ? (
          <View style={styles.emptyState}>
            <MaterialCommunityIcons name="certificate" size={64} color="#334155" />
            <Text style={styles.emptyTitle}>No Certificates Yet</Text>
            <Text style={styles.emptyDesc}>Complete all lessons in a track to earn your first certificate!</Text>
            <TouchableOpacity testID="go-tracks-btn" onPress={() => router.push('/tracks')} activeOpacity={0.8}>
              <LinearGradient colors={['#4F46E5', '#7C3AED']} style={styles.goBtn}>
                <Text style={styles.goBtnText}>Start Learning</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        ) : (
          certs.map((cert: any) => (
            <View key={cert.cert_id} style={styles.certCard}>
              <LinearGradient colors={['#1E293B', '#0F172A']} style={styles.certInner}>
                <View style={styles.certHeader}>
                  <LinearGradient colors={['#FFD700', '#F59E0B']} style={styles.certIcon}>
                    <MaterialCommunityIcons name="certificate" size={28} color="#FFF" />
                  </LinearGradient>
                  <View style={styles.certBorder} />
                </View>
                <Text style={styles.certTitle}>Certificate of Completion</Text>
                <Text style={styles.certName}>{cert.user_name}</Text>
                <Text style={styles.certTrack}>has successfully completed</Text>
                <Text style={styles.certTrackName}>{cert.track_title}</Text>
                <View style={styles.certStats}>
                  <View style={styles.certStat}>
                    <Text style={styles.certStatVal}>{cert.lessons_completed}</Text>
                    <Text style={styles.certStatLabel}>Lessons</Text>
                  </View>
                  <View style={styles.certStat}>
                    <Text style={styles.certStatVal}>{cert.total_xp}</Text>
                    <Text style={styles.certStatLabel}>XP Earned</Text>
                  </View>
                </View>
                <Text style={styles.certDate}>Issued: {new Date(cert.issued_at).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}</Text>
                <Text style={styles.certId}>ID: {cert.cert_id}</Text>
              </LinearGradient>
            </View>
          ))
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
  emptyState: { alignItems: 'center', marginTop: 80, gap: 12 },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: '#F8FAFC' },
  emptyDesc: { fontSize: 14, color: '#64748B', textAlign: 'center', lineHeight: 20 },
  goBtn: { height: 48, borderRadius: 24, paddingHorizontal: 32, justifyContent: 'center', alignItems: 'center', marginTop: 8 },
  goBtnText: { fontSize: 15, fontWeight: '700', color: '#FFF' },
  certCard: { marginBottom: 20, borderRadius: 16, overflow: 'hidden', borderWidth: 2, borderColor: '#FFD700' },
  certInner: { padding: 24, alignItems: 'center' },
  certHeader: { alignItems: 'center', marginBottom: 16 },
  certIcon: { width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center' },
  certBorder: { width: 200, height: 2, backgroundColor: '#FFD700', marginTop: 12, opacity: 0.3 },
  certTitle: { fontSize: 14, color: '#FFD700', fontWeight: '600', letterSpacing: 1, marginBottom: 12, textTransform: 'uppercase' },
  certName: { fontSize: 24, fontWeight: '800', color: '#F8FAFC', marginBottom: 4 },
  certTrack: { fontSize: 14, color: '#94A3B8', marginBottom: 4 },
  certTrackName: { fontSize: 20, fontWeight: '700', color: '#4F46E5', marginBottom: 16 },
  certStats: { flexDirection: 'row', gap: 32, marginBottom: 16 },
  certStat: { alignItems: 'center' },
  certStatVal: { fontSize: 22, fontWeight: '800', color: '#FFD700' },
  certStatLabel: { fontSize: 12, color: '#64748B' },
  certDate: { fontSize: 12, color: '#64748B', marginBottom: 4 },
  certId: { fontSize: 10, color: '#475569' },
});
