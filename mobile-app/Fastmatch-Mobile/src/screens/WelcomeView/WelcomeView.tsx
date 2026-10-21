import React from "react";
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  StatusBar,
} from "react-native";
import LinearGradient from "react-native-linear-gradient";
import { AppView } from "./../../types";
import {
  Button,
  AppLogo,
} from "./../../components/UIComponents";
import { SocialAuthButtons } from "../../components/SocialAuthButtons";

const { width, height } = Dimensions.get("window");

interface AuthProps {
  setView: (view: any) => void;
  setUser?: (user: any) => void;
}

export const WelcomeView: React.FC<AuthProps> = ({ setView, setUser }) => {
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
            style={{ borderWidth: 0, borderColor: "#555", marginTop: 8 }}
            onClick={() => setView(AppView.LOGIN)}
          >
            Sign In with Password
          </Button>

          <SocialAuthButtons setView={setView} setUser={setUser} />

          {/* EULA & Privacy Policy Agreement (Apple Review Guideline 1.2.0) */}
          <View style={styles.legalContainer}>
            <Text style={styles.legalText}>
              By continuing, you agree to our{" "}
              <Text
                style={styles.legalHighlight}
                onPress={() => setView(AppView.TERMS)}
              >
                Terms of Use (EULA)
              </Text>{" "}
              and{" "}
              <Text
                style={styles.legalHighlight}
                onPress={() => setView(AppView.PRIVACY)}
              >
                Privacy Policy
              </Text>.
            </Text>
            <Text style={styles.zeroToleranceText}>
              FastMatch enforces strict zero tolerance for objectionable content and abusive users.
            </Text>
          </View>
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
  legalContainer: {
    marginTop: 18,
    paddingHorizontal: 8,
    alignItems: "center",
  },
  legalText: {
    fontSize: 12,
    color: "#94A3B8",
    textAlign: "center",
    lineHeight: 18,
  },
  legalHighlight: {
    color: "#FBBF24",
    fontWeight: "700",
    textDecorationLine: "underline",
  },
  zeroToleranceText: {
    fontSize: 10.5,
    color: "#64748B",
    textAlign: "center",
    marginTop: 4,
    lineHeight: 14,
  },
});
