import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useLanguage, LANGUAGES, LanguageCode } from '../context/LanguageContext';

export default function LanguageSettings() {
  const router = useRouter();
  const { language, setLanguage, t } = useLanguage();

  const handleLanguageChange = async (lang: LanguageCode) => {
    await setLanguage(lang);
    Alert.alert(
      lang === 'en' ? 'Success' : lang === 'hi' ? 'सफल' : lang === 'od' ? 'ସଫଳ' : 'வெற்றி',
      t('language_changed'),
      [{ text: 'OK', onPress: () => router.back() }]
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity testID="back-from-language" onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#F8FAFC" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('select_language')}</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <Text style={styles.sectionTitle}>{t('language')}</Text>
        
        {(Object.keys(LANGUAGES) as LanguageCode[]).map((lang) => {
          const isSelected = language === lang;
          const langInfo = LANGUAGES[lang];
          
          return (
            <TouchableOpacity
              key={lang}
              testID={`lang-${lang}`}
              style={[styles.languageOption, isSelected && styles.languageOptionSelected]}
              onPress={() => handleLanguageChange(lang)}
              activeOpacity={0.8}
            >
              <View style={styles.langInfo}>
                <Text style={styles.langFlag}>{langInfo.flag}</Text>
                <View>
                  <Text style={styles.langNative}>{langInfo.nativeName}</Text>
                  <Text style={styles.langEnglish}>{langInfo.name}</Text>
                </View>
              </View>
              {isSelected && (
                <LinearGradient colors={['#4F46E5', '#7C3AED']} style={styles.checkCircle}>
                  <Ionicons name="checkmark" size={18} color="#FFF" />
                </LinearGradient>
              )}
            </TouchableOpacity>
          );
        })}

        <View style={styles.infoCard}>
          <Ionicons name="information-circle-outline" size={24} color="#64748B" />
          <Text style={styles.infoText}>
            {language === 'en' && 'Changing language will update all text in the app to your selected language.'}
            {language === 'hi' && 'भाषा बदलने से ऐप में सभी टेक्स्ट आपकी चुनी हुई भाषा में अपडेट हो जाएगा।'}
            {language === 'od' && 'ଭାଷା ବଦଳାଇବା ଦ୍ୱାରା ଆପ୍‌ର ସମସ୍ତ ଟେକ୍ସଟ୍ ଆପଣଙ୍କ ବାଛିଥିବା ଭାଷାରେ ଅପଡେଟ୍ ହେବ।'}
            {language === 'ta' && 'மொழியை மாற்றுவது ஆப்பில் உள்ள அனைத்து உரையையும் நீங்கள் தேர்ந்தெடுத்த மொழிக்கு புதுப்பிக்கும்.'}
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F172A' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 56, paddingBottom: 16 },
  backBtn: { width: 44, height: 44, justifyContent: 'center' },
  headerTitle: { fontSize: 20, fontWeight: '700', color: '#F8FAFC' },
  scrollView: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 40 },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: '#94A3B8', marginBottom: 16, marginTop: 8 },
  languageOption: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#1E293B', borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 2, borderColor: 'transparent' },
  languageOptionSelected: { borderColor: '#4F46E5', backgroundColor: 'rgba(79,70,229,0.1)' },
  langInfo: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  langFlag: { fontSize: 32 },
  langNative: { fontSize: 18, fontWeight: '700', color: '#F8FAFC' },
  langEnglish: { fontSize: 14, color: '#64748B', marginTop: 2 },
  checkCircle: { width: 28, height: 28, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  infoCard: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, backgroundColor: '#1E293B', borderRadius: 12, padding: 16, marginTop: 20, borderWidth: 1, borderColor: '#334155' },
  infoText: { flex: 1, fontSize: 14, color: '#94A3B8', lineHeight: 20 },
});
