import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

export default function OlympiadScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [competitions, setCompetitions] = useState<any[]>([]);
  const [activeQuiz, setActiveQuiz] = useState<any>(null);
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [results, setResults] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);
  const [activeCompId, setActiveCompId] = useState('');

  useEffect(() => { fetchCompetitions(); }, []);

  useEffect(() => {
    if (timeLeft > 0 && activeQuiz) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    }
    if (timeLeft === 0 && activeQuiz && !results) {
      handleSubmit([...answers]);
    }
  }, [timeLeft, activeQuiz]);

  const fetchCompetitions = async () => {
    try {
      const token = await AsyncStorage.getItem('auth_token');
      if (!token) { router.replace('/'); return; }
      const res = await fetch(`${API_URL}/api/olympiad/competitions`, { headers: { 'Authorization': `Bearer ${token}` } });
      if (res.ok) { const data = await res.json(); setCompetitions(data.competitions || []); }
    } catch (e) {}
    setLoading(false);
  };

  const joinCompetition = async (compId: string) => {
    setLoading(true);
    try {
      const token = await AsyncStorage.getItem('auth_token');
      const res = await fetch(`${API_URL}/api/olympiad/join`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ competition_id: compId })
      });
      if (res.ok) {
        const data = await res.json();
        setActiveQuiz(data);
        setActiveCompId(compId);
        setTimeLeft(data.time_limit_minutes * 60);
        setCurrentQ(0);
        setAnswers([]);
        setSelectedOption(null);
      } else {
        const err = await res.json();
        Alert.alert('Cannot Join', err.detail || 'Error joining competition');
      }
    } catch (e) {}
    setLoading(false);
  };

  const nextQuestion = () => {
    if (selectedOption === null) return;
    const newAnswers = [...answers, selectedOption];
    setAnswers(newAnswers);
    if (currentQ + 1 < (activeQuiz?.questions?.length || 0)) {
      setCurrentQ(currentQ + 1);
      setSelectedOption(null);
    } else {
      handleSubmit(newAnswers);
    }
  };

  const handleSubmit = async (finalAnswers: number[]) => {
    setSubmitting(true);
    try {
      const token = await AsyncStorage.getItem('auth_token');
      const res = await fetch(`${API_URL}/api/olympiad/submit`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ competition_id: activeCompId, answers: finalAnswers })
      });
      if (res.ok) { setResults(await res.json()); setActiveQuiz(null); }
    } catch (e) {}
    setSubmitting(false);
  };

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;

  const iconMap: Record<string, string> = { 'brain': 'brain', 'shield-check': 'shield-check', 'rocket-launch': 'rocket-launch' };

  if (loading) return <View style={styles.loadingContainer}><ActivityIndicator size="large" color="#4F46E5" /></View>;

  // Results screen
  if (results) {
    const scoreColor = results.score >= 80 ? '#00F5D4' : results.score >= 50 ? '#FF9F1C' : '#EF4444';
    return (
      <View style={styles.container}>
        <ScrollView contentContainerStyle={styles.resultsContent}>
          <View style={styles.scoreCircle}>
            <Text style={[styles.scorePercent, { color: scoreColor }]}>{results.score}%</Text>
            <Text style={styles.scoreLabel}>{results.correct}/{results.total}</Text>
          </View>
          <Text style={styles.xpEarned}>+{results.xp_earned} XP</Text>
          {results.score >= 80 && <Text style={styles.winnerText}>🏆 Olympiad Champion!</Text>}
          <TouchableOpacity testID="olympiad-back-btn" onPress={() => { setResults(null); fetchCompetitions(); }} activeOpacity={0.8}>
            <LinearGradient colors={['#4F46E5', '#7C3AED']} style={styles.backDashBtn}>
              <Text style={styles.backDashBtnText}>Back to Competitions</Text>
            </LinearGradient>
          </TouchableOpacity>
        </ScrollView>
      </View>
    );
  }

  // Active quiz
  if (activeQuiz) {
    const q = activeQuiz.questions[currentQ];
    const progress = ((currentQ + 1) / activeQuiz.questions.length) * 100;
    const timeWarning = timeLeft < 60;
    return (
      <View style={styles.container}>
        <View style={styles.quizHeader}>
          <View style={styles.timerRow}>
            <Ionicons name="time" size={18} color={timeWarning ? '#EF4444' : '#FF9F1C'} />
            <Text style={[styles.timerText, timeWarning && { color: '#EF4444' }]}>{formatTime(timeLeft)}</Text>
          </View>
          <Text style={styles.qProgress}>Q{currentQ + 1}/{activeQuiz.questions.length}</Text>
        </View>
        <View style={styles.progressBarBg}><LinearGradient colors={['#A855F7', '#EC4899']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={[styles.progressBarFill, { width: `${progress}%` }]} /></View>
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.quizContent}>
          <Text style={styles.questionText}>{q.question}</Text>
          {q.options.map((opt: string, idx: number) => (
            <TouchableOpacity key={idx} testID={`olympiad-option-${idx}`} style={[styles.optionBtn, selectedOption === idx && styles.optionSelected]} onPress={() => setSelectedOption(idx)} activeOpacity={0.8}>
              <View style={[styles.optionCircle, selectedOption === idx && styles.optionCircleSelected]}>
                <Text style={[styles.optionLetter, selectedOption === idx && styles.optionLetterSelected]}>{String.fromCharCode(65 + idx)}</Text>
              </View>
              <Text style={[styles.optionText, selectedOption === idx && styles.optionTextSelected]}>{opt}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
        <View style={styles.footer}>
          <TouchableOpacity testID="olympiad-next-btn" onPress={nextQuestion} disabled={selectedOption === null || submitting} activeOpacity={0.8}>
            <LinearGradient colors={selectedOption !== null ? ['#A855F7', '#EC4899'] : ['#334155', '#334155']} style={styles.nextBtn}>
              {submitting ? <ActivityIndicator color="#FFF" /> : <Text style={styles.nextBtnText}>{currentQ + 1 < activeQuiz.questions.length ? 'Next' : 'Submit'}</Text>}
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Competition list
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity testID="back-from-olympiad" onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#F8FAFC" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>AI Olympiad</Text>
        <View style={{ width: 44 }} />
      </View>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.introCard}>
          <LinearGradient colors={['#A855F7', '#EC4899']} style={styles.introIcon}>
            <Ionicons name="trophy" size={36} color="#FFF" />
          </LinearGradient>
          <Text style={styles.introTitle}>AI Olympiad Competitions</Text>
          <Text style={styles.introDesc}>Challenge yourself with advanced AI quizzes. Compete with students across India!</Text>
        </View>
        {competitions.map((comp: any) => (
          <View key={comp.competition_id} style={styles.compCard}>
            <LinearGradient colors={['#1E293B', '#0F172A']} style={styles.compInner}>
              <View style={styles.compHeader}>
                <LinearGradient colors={['#A855F7', '#EC4899']} style={styles.compIcon}>
                  <MaterialCommunityIcons name={(iconMap[comp.icon] || 'trophy-variant') as any} size={24} color="#FFF" />
                </LinearGradient>
                <View style={styles.compInfo}>
                  <Text style={styles.compTitle}>{comp.title}</Text>
                  <Text style={styles.compDesc} numberOfLines={2}>{comp.description}</Text>
                </View>
              </View>
              <View style={styles.compMeta}>
                <View style={styles.compMetaItem}><Ionicons name="time-outline" size={14} color="#64748B" /><Text style={styles.compMetaText}>{comp.time_limit} min</Text></View>
                <View style={styles.compMetaItem}><Ionicons name="help-circle-outline" size={14} color="#64748B" /><Text style={styles.compMetaText}>{comp.num_questions} Qs</Text></View>
                <View style={styles.compMetaItem}><Ionicons name="flash-outline" size={14} color="#FFD700" /><Text style={styles.compMetaText}>{comp.xp_reward} XP</Text></View>
              </View>
              {comp.participated ? (
                <View style={styles.participatedBadge}><Ionicons name="checkmark-circle" size={16} color="#00F5D4" /><Text style={styles.participatedText}>Completed · Score: {comp.score}%</Text></View>
              ) : (
                <TouchableOpacity testID={`join-${comp.competition_id}`} onPress={() => joinCompetition(comp.competition_id)} activeOpacity={0.8}>
                  <LinearGradient colors={['#A855F7', '#EC4899']} style={styles.joinBtn}><Ionicons name="play" size={18} color="#FFF" /><Text style={styles.joinBtnText}>Start Challenge</Text></LinearGradient>
                </TouchableOpacity>
              )}
            </LinearGradient>
          </View>
        ))}
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
  introCard: { alignItems: 'center', marginBottom: 24 },
  introIcon: { width: 72, height: 72, borderRadius: 22, justifyContent: 'center', alignItems: 'center', marginBottom: 14 },
  introTitle: { fontSize: 22, fontWeight: '800', color: '#F8FAFC', marginBottom: 6 },
  introDesc: { fontSize: 14, color: '#94A3B8', textAlign: 'center', lineHeight: 20 },
  compCard: { marginBottom: 14, borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: '#334155' },
  compInner: { padding: 16 },
  compHeader: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  compIcon: { width: 48, height: 48, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  compInfo: { flex: 1 },
  compTitle: { fontSize: 16, fontWeight: '700', color: '#F8FAFC', marginBottom: 4 },
  compDesc: { fontSize: 13, color: '#94A3B8', lineHeight: 18 },
  compMeta: { flexDirection: 'row', gap: 16, marginBottom: 12 },
  compMetaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  compMetaText: { fontSize: 12, color: '#64748B' },
  joinBtn: { height: 44, borderRadius: 22, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6 },
  joinBtnText: { fontSize: 15, fontWeight: '700', color: '#FFF' },
  participatedBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, justifyContent: 'center', paddingVertical: 10 },
  participatedText: { fontSize: 14, color: '#00F5D4', fontWeight: '600' },
  quizHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 56, paddingBottom: 8 },
  timerRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  timerText: { fontSize: 18, fontWeight: '700', color: '#FF9F1C' },
  qProgress: { fontSize: 14, color: '#94A3B8', fontWeight: '600' },
  progressBarBg: { height: 4, backgroundColor: '#334155', marginHorizontal: 20 },
  progressBarFill: { height: 4 },
  quizContent: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 40 },
  questionText: { fontSize: 18, fontWeight: '700', color: '#F8FAFC', lineHeight: 26, marginBottom: 20 },
  optionBtn: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#1E293B', borderRadius: 14, padding: 14, marginBottom: 8, borderWidth: 1.5, borderColor: '#334155' },
  optionSelected: { borderColor: '#A855F7', backgroundColor: 'rgba(168,85,247,0.1)' },
  optionCircle: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#334155', justifyContent: 'center', alignItems: 'center' },
  optionCircleSelected: { backgroundColor: '#A855F7' },
  optionLetter: { fontSize: 14, fontWeight: '700', color: '#94A3B8' },
  optionLetterSelected: { color: '#FFF' },
  optionText: { fontSize: 14, color: '#CBD5E1', flex: 1 },
  optionTextSelected: { color: '#F8FAFC', fontWeight: '600' },
  footer: { paddingHorizontal: 20, paddingVertical: 16, borderTopWidth: 1, borderTopColor: '#1E293B', paddingBottom: 32 },
  nextBtn: { height: 52, borderRadius: 26, justifyContent: 'center', alignItems: 'center' },
  nextBtnText: { fontSize: 16, fontWeight: '700', color: '#FFF' },
  resultsContent: { paddingHorizontal: 20, paddingTop: 100, paddingBottom: 40, alignItems: 'center' },
  scoreCircle: { width: 140, height: 140, borderRadius: 70, backgroundColor: '#1E293B', justifyContent: 'center', alignItems: 'center', borderWidth: 3, borderColor: '#334155', marginBottom: 16 },
  scorePercent: { fontSize: 44, fontWeight: '800' },
  scoreLabel: { fontSize: 14, color: '#94A3B8' },
  xpEarned: { fontSize: 22, fontWeight: '700', color: '#FFD700', marginBottom: 8 },
  winnerText: { fontSize: 18, color: '#A855F7', fontWeight: '700', marginBottom: 24 },
  backDashBtn: { height: 52, borderRadius: 26, paddingHorizontal: 32, justifyContent: 'center', alignItems: 'center' },
  backDashBtnText: { fontSize: 16, fontWeight: '700', color: '#FFF' },
});
