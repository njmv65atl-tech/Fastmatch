import React from "react";
import { View, Text, StyleSheet, Dimensions, StatusBar } from "react-native";
import LinearGradient from "react-native-linear-gradient";
import { AppView, UserRole } from "./../../types";
import {
  MobileContainer,
  Button,
  AppLogo,
} from "./../../components/UIComponents";

const { width, height } = Dimensions.get("window");

interface AuthProps {
  setView: (view: any) => void;
}

export const WelcomeView: React.FC<AuthProps> = ({ setView }) => {
  console.log("you are entered in Welcome View")
  return (
    <LinearGradient colors={["#312E81", "#020617"]} style={styles.container}>
      <StatusBar barStyle="light-content" />

      <View style={styles.content}>
        <View style={styles.logoCard}>
          <AppLogo size="xl" /> 
        </View>

        <Text style={styles.title}>Connect Instantly</Text>

        <Text style={styles.subtitle}>
          Experience premium video chat with people around the globe.
        </Text>

        <View style={styles.buttonContainer}>
          <Button
            variant="primary"
            fullWidth
            onClick={() => setView(AppView.SIGNUP)}
          >
            Create Account
          </Button>

          <Button
            variant="ghost"
            fullWidth
            style={{ borderWidth: 0, borderColor: "#555" }} // 👈 force visible
            onClick={() => setView(AppView.LOGIN)}
          >
            Sign In
          </Button>
        </View>
      </View>
    </LinearGradient>
  );
};
const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  glowContainer: {
    position: "absolute",
    width: width,
    height: height,
    overflow: "hidden",
  },

  indigoGlow: {
    position: "absolute",
    top: -height * 0.1,
    left: -width * 0.1,
    width: width * 0.6,
    height: width * 0.6,
    backgroundColor: "#4F46E5",
    borderRadius: width,
    opacity: 0.2,
  },

  violetGlow: {
    position: "absolute",
    bottom: -height * 0.1,
    right: -width * 0.1,
    width: width * 0.6,
    height: width * 0.6,
    backgroundColor: "#7C3AED",
    borderRadius: width,
    opacity: 0.2,
  },

  content: {
    width: "100%",
    paddingHorizontal: 32,
    alignItems: "center",
    zIndex: 10,
  },

  logoCard: {
    marginBottom: 40,
    padding: 40,
    borderRadius: 48,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },

  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#FFFFFF",
    marginBottom: 8,
    textAlign: "center",
  },

  subtitle: {
    fontSize: 18,
    color: "#94A3B8",
    marginBottom: 48,
    textAlign: "center",
    lineHeight: 22,
    maxWidth: 260,
  },

  buttonContainer: {
    width: "100%",
  },
});
