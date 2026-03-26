import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useLanguage } from "../context/LanguageContext";

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

const LEVEL_NAMES = [
  "Newbie",
  "AI Explorer",
  "AI Learner",
  "AI Builder",
  "AI Creator",
  "AI Innovator",
  "AI Master",
  "AI Wizard",
  "AI Champion",
  "AI Legend",
];
const LEVEL_THRESHOLDS = [0, 100, 300, 600, 1000, 1500, 2200, 3000, 4000, 5500];

export default function Dashboard() {
  const router = useRouter();
  const { t } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [dashData, setDashData] = useState<any>(null);
  const [tracks, setTracks] = useState<any[]>([]);

  const fetchData = async () => {
    try {
      const token = await AsyncStorage.getItem("auth_token");
      console.log("TOKEN:", token);

      if (!token) {
        router.replace("/");
        return;
      }

      const headers = {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      };

      const dashRes = await fetch(`${API_URL}/api/dashboard`, { headers });
      console.log("DASH STATUS:", dashRes.status);

      if (dashRes.status === 401) {
        await AsyncStorage.removeItem("auth_token"); // not clear()
        router.replace("/");
        return;
      }

      const tracksRes = await fetch(`${API_URL}/api/tracks`, { headers });

      const dd = await dashRes.json();
      const tt = await tracksRes.json();

      setDashData(dd);
      setTracks(tt);
    } catch (e) {
      console.error("Dashboard fetch error:", e);
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  }, []);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4F46E5" />
      </View>
    );
  }

  const user = dashData?.user || {};
  const stats = dashData?.stats || {};
  const levelName =
    LEVEL_NAMES[Math.min((user.level || 1) - 1, LEVEL_NAMES.length - 1)];
  const levelProgress = Math.min(stats.level_progress || 0, 100);

  const trackIcons: Record<string, string> = {
    brain: "brain",
    tools: "wrench",
    "shield-check": "shield-check",
    "rocket-launch": "rocket-launch",
  };

  const trackColors: Record<string, [string, string]> = {
    "#4F46E5": ["#4F46E5", "#7C3AED"],
    "#FF9F1C": ["#FF9F1C", "#F59E0B"],
    "#00F5D4": ["#00F5D4", "#06B6D4"],
    "#A855F7": ["#A855F7", "#EC4899"],
  };

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#4F46E5"
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>
              {t("hey")}, {user.name?.split(" ")[0] || t("student")}! ✨
            </Text>
            <Text style={styles.subGreeting}>
              {levelName} · {t("level")} {user.level || 1}
            </Text>
          </View>
          <TouchableOpacity
            testID="profile-btn"
            onPress={() => router.push("/profile")}
            style={styles.avatarBtn}
          >
            <LinearGradient
              colors={["#4F46E5", "#7C3AED"]}
              style={styles.avatarCircle}
            >
              <Text style={styles.avatarText}>
                {(user.name || "S")[0].toUpperCase()}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* XP Card */}
        <LinearGradient colors={["#1E293B", "#0F172A"]} style={styles.xpCard}>
          <View style={styles.xpHeader}>
            <View style={styles.xpLeft}>
              <Ionicons name="flash" size={20} color="#FFD700" />
              <Text style={styles.xpAmount}>{stats.total_xp || 0} XP</Text>
            </View>
            <View style={styles.levelBadge}>
              <Text style={styles.levelBadgeText}>Lvl {user.level || 1}</Text>
            </View>
          </View>
          <View style={styles.xpBarBg}>
            <LinearGradient
              colors={["#4F46E5", "#7C3AED"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={[
                styles.xpBarFill,
                { width: `${Math.max(levelProgress, 2)}%` },
              ]}
            />
          </View>
          <Text style={styles.xpToNext}>
            {stats.xp_to_next_level || 0} {t("xp_to_next")}
          </Text>
        </LinearGradient>

        {/* Quick Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Ionicons name="book" size={24} color="#4F46E5" />
            <Text style={styles.statValue}>{stats.lessons_completed || 0}</Text>
            <Text style={styles.statLabel}>{t("lessons")}</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="help-circle" size={24} color="#FF9F1C" />
            <Text style={styles.statValue}>{stats.quizzes_taken || 0}</Text>
            <Text style={styles.statLabel}>{t("quizzes_taken")}</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="ribbon" size={24} color="#A855F7" />
            <Text style={styles.statValue}>{(user.badges || []).length}</Text>
            <Text style={styles.statLabel}>{t("badges")}</Text>
          </View>
        </View>

        {/* Learning Tracks */}
        <Text style={styles.sectionTitle}>{t("tracks")}</Text>
        <View style={styles.tracksGrid}>
          {tracks.map((track: any) => {
            const colors = trackColors[track.color] || ["#4F46E5", "#7C3AED"];
            const iconName = trackIcons[track.icon] || "book";
            return (
              <TouchableOpacity
                key={track.track_id}
                testID={`track-${track.track_id}`}
                style={styles.trackCard}
                onPress={() => router.push(`/track/${track.track_id}`)}
                activeOpacity={0.85}
              >
                <LinearGradient colors={colors} style={styles.trackIconBg}>
                  <MaterialCommunityIcons
                    name={iconName as any}
                    size={28}
                    color="#FFF"
                  />
                </LinearGradient>
                <Text style={styles.trackTitle} numberOfLines={1}>
                  {track.title}
                </Text>
                <Text style={styles.trackDesc} numberOfLines={2}>
                  {track.description}
                </Text>
                <View style={styles.trackMeta}>
                  <Text style={styles.trackLessons}>
                    {track.lesson_count} lessons
                  </Text>
                  <View
                    style={[
                      styles.diffBadge,
                      {
                        backgroundColor:
                          track.difficulty === "beginner"
                            ? "rgba(0,245,212,0.15)"
                            : track.difficulty === "intermediate"
                              ? "rgba(255,159,28,0.15)"
                              : "rgba(168,85,247,0.15)",
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.diffText,
                        {
                          color:
                            track.difficulty === "beginner"
                              ? "#00F5D4"
                              : track.difficulty === "intermediate"
                                ? "#FF9F1C"
                                : "#A855F7",
                        },
                      ]}
                    >
                      {track.difficulty}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Quick Actions */}
        <Text style={styles.sectionTitle}>{t("quick_actions")}</Text>
        <View style={styles.actionsRow}>
          <TouchableOpacity
            testID="quiz-action-btn"
            style={styles.actionBtn}
            onPress={() => router.push("/quiz")}
          >
            <LinearGradient
              colors={["#FF9F1C", "#F59E0B"]}
              style={styles.actionIcon}
            >
              <Ionicons name="help-circle" size={24} color="#FFF" />
            </LinearGradient>
            <Text style={styles.actionText}>{t("take_quiz")}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            testID="art-action-btn"
            style={styles.actionBtn}
            onPress={() => router.push("/art")}
          >
            <LinearGradient
              colors={["#A855F7", "#EC4899"]}
              style={styles.actionIcon}
            >
              <Ionicons name="color-palette" size={24} color="#FFF" />
            </LinearGradient>
            <Text style={styles.actionText}>{t("ai_art")}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            testID="leaderboard-action-btn"
            style={styles.actionBtn}
            onPress={() => router.push("/leaderboard")}
          >
            <LinearGradient
              colors={["#00F5D4", "#06B6D4"]}
              style={styles.actionIcon}
            >
              <Ionicons name="trophy" size={24} color="#FFF" />
            </LinearGradient>
            <Text style={styles.actionText}>{t("ranks")}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            testID="badges-action-btn"
            style={styles.actionBtn}
            onPress={() => router.push("/badges")}
          >
            <LinearGradient
              colors={["#EF4444", "#F97316"]}
              style={styles.actionIcon}
            >
              <Ionicons name="medal" size={24} color="#FFF" />
            </LinearGradient>
            <Text style={styles.actionText}>{t("badges")}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Bottom Nav */}
      <View style={styles.bottomNav}>
        <TouchableOpacity testID="nav-home" style={styles.navItem}>
          <Ionicons name="home" size={24} color="#4F46E5" />
          <Text style={[styles.navLabel, { color: "#4F46E5" }]}>
            {t("home")}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          testID="nav-tracks"
          style={styles.navItem}
          onPress={() => router.push("/tracks")}
        >
          <Ionicons name="book-outline" size={24} color="#64748B" />
          <Text style={styles.navLabel}>{t("tracks")}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          testID="nav-quiz"
          style={styles.navItem}
          onPress={() => router.push("/quiz")}
        >
          <Ionicons name="help-circle-outline" size={24} color="#64748B" />
          <Text style={styles.navLabel}>{t("quiz")}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          testID="nav-art"
          style={styles.navItem}
          onPress={() => router.push("/art")}
        >
          <Ionicons name="color-palette-outline" size={24} color="#64748B" />
          <Text style={styles.navLabel}>{t("ai_art")}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          testID="nav-profile"
          style={styles.navItem}
          onPress={() => router.push("/profile")}
        >
          <Ionicons name="person-outline" size={24} color="#64748B" />
          <Text style={styles.navLabel}>{t("profile")}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0F172A" },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#0F172A",
  },
  scrollView: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingTop: 56, paddingBottom: 100 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  greeting: { fontSize: 28, fontWeight: "800", color: "#F8FAFC" },
  subGreeting: { fontSize: 14, color: "#94A3B8", marginTop: 4 },
  avatarBtn: {},
  avatarCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: { fontSize: 20, fontWeight: "700", color: "#FFF" },
  xpCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#334155",
  },
  xpHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  xpLeft: { flexDirection: "row", alignItems: "center", gap: 8 },
  xpAmount: { fontSize: 22, fontWeight: "800", color: "#FFD700" },
  levelBadge: {
    backgroundColor: "rgba(79,70,229,0.2)",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  levelBadgeText: { color: "#4F46E5", fontWeight: "700", fontSize: 13 },
  xpBarBg: {
    height: 8,
    backgroundColor: "#334155",
    borderRadius: 4,
    overflow: "hidden",
  },
  xpBarFill: { height: 8, borderRadius: 4 },
  xpToNext: { fontSize: 12, color: "#64748B", marginTop: 8 },
  statsRow: { flexDirection: "row", gap: 12, marginBottom: 28 },
  statCard: {
    flex: 1,
    backgroundColor: "#1E293B",
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
    gap: 6,
    borderWidth: 1,
    borderColor: "#334155",
  },
  statValue: { fontSize: 24, fontWeight: "800", color: "#F8FAFC" },
  statLabel: { fontSize: 12, color: "#64748B" },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#F8FAFC",
    marginBottom: 16,
  },
  tracksGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 28,
  },
  trackCard: {
    width: "48%",
    backgroundColor: "#1E293B",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#334155",
  },
  trackIconBg: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  trackTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#F8FAFC",
    marginBottom: 4,
  },
  trackDesc: {
    fontSize: 12,
    color: "#94A3B8",
    marginBottom: 10,
    lineHeight: 16,
  },
  trackMeta: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  trackLessons: { fontSize: 11, color: "#64748B" },
  diffBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
  diffText: { fontSize: 10, fontWeight: "600", textTransform: "capitalize" },
  actionsRow: { flexDirection: "row", gap: 12, marginBottom: 20 },
  actionBtn: { flex: 1, alignItems: "center", gap: 8 },
  actionIcon: {
    width: 56,
    height: 56,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
  },
  actionText: { fontSize: 12, color: "#94A3B8", fontWeight: "600" },
  bottomNav: {
    flexDirection: "row",
    backgroundColor: "#1E293B",
    borderTopWidth: 1,
    borderTopColor: "#334155",
    paddingVertical: 8,
    paddingBottom: 24,
    paddingHorizontal: 16,
  },
  navItem: { flex: 1, alignItems: "center", gap: 4 },
  navLabel: { fontSize: 11, color: "#64748B", fontWeight: "500" },
});
