import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, ActivityIndicator, Image, KeyboardAvoidingView,
  Platform, Alert
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

export default function ArtStudio() {
  const router = useRouter();
  const [prompt, setPrompt] = useState('');
  const [generating, setGenerating] = useState(false);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [xpEarned, setXpEarned] = useState(0);

  const suggestedPrompts = [
    'A futuristic Indian classroom with AI robots teaching',
    'The Taj Mahal reimagined in a cyberpunk world',
    'A colorful Indian festival celebrated by robots',
    'A young Indian student inventing an AI machine',
    'Indian village with solar-powered AI drones',
  ];

  const generateArt = async () => {
    if (!prompt.trim()) { Alert.alert('Enter a prompt', 'Describe what you want AI to create!'); return; }
    setGenerating(true);
    setImageBase64(null);
    try {
      const token = await AsyncStorage.getItem('auth_token');
      const res = await fetch(`${API_URL}/api/art/generate`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: prompt.trim() })
      });
      if (res.ok) {
        const data = await res.json();
        setImageBase64(data.image_base64);
        setXpEarned(data.xp_earned || 15);
      } else {
        const err = await res.json().catch(() => ({}));
        Alert.alert('Generation Failed', err.detail || 'Could not generate image. Try again!');
      }
    } catch (e) {
      Alert.alert('Error', 'Something went wrong. Please try again.');
    }
    setGenerating(false);
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <View style={styles.header}>
        <TouchableOpacity testID="back-from-art" onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#F8FAFC" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>AI Art Studio</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        {imageBase64 ? (
          <View style={styles.imageContainer}>
            <Image
              source={{ uri: `data:image/png;base64,${imageBase64}` }}
              style={styles.generatedImage}
              resizeMode="contain"
            />
            {xpEarned > 0 && (
              <View style={styles.xpBadge}>
                <Ionicons name="flash" size={14} color="#FFD700" />
                <Text style={styles.xpBadgeText}>+{xpEarned} XP</Text>
              </View>
            )}
          </View>
        ) : (
          <View style={styles.placeholder}>
            <LinearGradient colors={['#1E293B', '#0F172A']} style={styles.placeholderInner}>
              {generating ? (
                <>
                  <ActivityIndicator size="large" color="#A855F7" />
                  <Text style={styles.generatingText}>Creating your masterpiece...</Text>
                  <Text style={styles.generatingSubtext}>This may take up to 60 seconds</Text>
                </>
              ) : (
                <>
                  <Ionicons name="color-palette" size={64} color="#334155" />
                  <Text style={styles.placeholderText}>Your AI art will appear here</Text>
                </>
              )}
            </LinearGradient>
          </View>
        )}

        <Text style={styles.inputLabel}>Describe your creation</Text>
        <TextInput
          testID="art-prompt-input"
          style={styles.promptInput}
          placeholder="A colorful Indian marketplace at sunset..."
          placeholderTextColor="#475569"
          value={prompt}
          onChangeText={setPrompt}
          multiline
          numberOfLines={3}
        />

        <TouchableOpacity testID="generate-art-btn" onPress={generateArt} disabled={generating} activeOpacity={0.8}>
          <LinearGradient colors={['#A855F7', '#EC4899']} style={styles.generateBtn}>
            {generating ? <ActivityIndicator color="#FFF" /> : (
              <>
                <Ionicons name="sparkles" size={20} color="#FFF" />
                <Text style={styles.generateBtnText}>Generate Art</Text>
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>

        <Text style={styles.suggestTitle}>Try these prompts</Text>
        {suggestedPrompts.map((sp, i) => (
          <TouchableOpacity
            key={i}
            testID={`suggested-prompt-${i}`}
            style={styles.suggestCard}
            onPress={() => setPrompt(sp)}
          >
            <Ionicons name="bulb-outline" size={18} color="#FF9F1C" />
            <Text style={styles.suggestText}>{sp}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F172A' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 56, paddingBottom: 16 },
  backBtn: { width: 44, height: 44, justifyContent: 'center' },
  headerTitle: { fontSize: 20, fontWeight: '700', color: '#F8FAFC' },
  scrollView: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 40 },
  imageContainer: { borderRadius: 16, overflow: 'hidden', marginBottom: 20, backgroundColor: '#1E293B' },
  generatedImage: { width: '100%', height: 300, borderRadius: 16 },
  xpBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, position: 'absolute', top: 12, right: 12, backgroundColor: 'rgba(15,23,42,0.8)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  xpBadgeText: { color: '#FFD700', fontWeight: '700', fontSize: 13 },
  placeholder: { marginBottom: 20, borderRadius: 16, overflow: 'hidden' },
  placeholderInner: { height: 250, borderRadius: 16, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#334155', borderStyle: 'dashed' },
  generatingText: { color: '#A855F7', fontSize: 16, fontWeight: '600', marginTop: 16 },
  generatingSubtext: { color: '#64748B', fontSize: 13, marginTop: 4 },
  placeholderText: { color: '#475569', fontSize: 15, marginTop: 12 },
  inputLabel: { fontSize: 14, fontWeight: '600', color: '#94A3B8', marginBottom: 8 },
  promptInput: { backgroundColor: '#1E293B', borderRadius: 14, padding: 16, fontSize: 15, color: '#F8FAFC', borderWidth: 1, borderColor: '#334155', minHeight: 80, textAlignVertical: 'top', marginBottom: 16 },
  generateBtn: { height: 56, borderRadius: 28, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8, marginBottom: 24 },
  generateBtnText: { fontSize: 17, fontWeight: '700', color: '#FFF' },
  suggestTitle: { fontSize: 16, fontWeight: '700', color: '#F8FAFC', marginBottom: 12 },
  suggestCard: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#1E293B', borderRadius: 12, padding: 14, marginBottom: 8, borderWidth: 1, borderColor: '#334155' },
  suggestText: { fontSize: 14, color: '#CBD5E1', flex: 1 },
});