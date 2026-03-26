import React, { useEffect, useRef } from "react";
import { View, Text, ActivityIndicator, StyleSheet, Platform } from "react-native";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

export default function AuthCallback() {
  const router = useRouter();
  const hasProcessed = useRef(false);

  useEffect(() => {
    if (hasProcessed.current) return;
    hasProcessed.current = true;
    processSession();
  }, []);

  const processSession = async () => {
    try {
      if (Platform.OS !== "web") {
        redirectToHome();
        return;
      }

      const params = new URLSearchParams(window.location.search);
      const code = params.get("code");
      const error = params.get("error");

      // Google rejected the login (user cancelled etc.)
      if (error) {
        console.error("Google OAuth error:", error);
        redirectToHome();
        return;
      }

      if (!code) {
        console.error("No code in callback URL:", window.location.search);
        redirectToHome();
        return;
      }

      // Send code to our backend to exchange for a JWT
      const res = await fetch(`${API_URL}/api/auth/google`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          code,
          redirect_uri: window.location.origin + "/auth-callback",
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        console.error("Backend auth error:", err);
        redirectToHome();
        return;
      }

      const data = await res.json();
      await AsyncStorage.setItem("auth_token", data.token);
      await AsyncStorage.setItem("user_data", JSON.stringify(data.user));
      redirectToDashboard();
    } catch (error) {
      console.error("Auth callback error:", error);
      redirectToHome();
    }
  };

  const redirectToDashboard = () => {
    if (Platform.OS === "web") {
      window.location.replace("/dashboard");
    } else {
      router.replace("/dashboard");
    }
  };

  const redirectToHome = () => {
    if (Platform.OS === "web") {
      window.location.replace("/");
    } else {
      router.replace("/");
    }
  };

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#4F46E5" />
      <Text style={styles.text}>Signing you in...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#0F172A" },
  text: { color: "#94A3B8", fontSize: 16, marginTop: 16 },
});