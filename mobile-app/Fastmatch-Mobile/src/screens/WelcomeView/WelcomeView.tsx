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
import { TouchableOpacity } from "react-native";
import { useTranslation } from "react-i18next";
import { Globe } from "lucide-react-native";
import { LanguageSelectorModal } from "../../components/LanguageSelectorModal";
import { AVAILABLE_LANGUAGES, SupportedLanguage } from "../../i18n";

const { width, height } = Dimensions.get("window");

interface AuthProps {
  setView: (view: any) => void;
  setUser?: (user: any) => void;
}

export const WelcomeView: React.FC<AuthProps> = ({ setView, setUser }) => {
  const { t, i18n } = useTranslation();
  const [showLanguageModal, setShowLanguageModal] = React.useState(false);

  const activeLanguageObj = AVAILABLE_LANGUAGES.find(
    (l: SupportedLanguage) => l.code === i18n.language || (i18n.language && i18n.language.startsWith(l.code))
  ) || AVAILABLE_LANGUAGES[0];
  return (
    <LinearGradient colors={["#312E81", "#020617"]} style={styles.container}>
            <StatusBar barStyle="light-content" />

      {/* Language Switcher Pill */}
      <TouchableOpacity
        onPress={() => setShowLanguageModal(true)}
        style={styles.langPill}
        activeOpacity={0.8}
      >
        <Globe size={14} color="#CBD5E1" />
        <Text style={styles.langPillText}>{activeLanguageObj.flag} {activeLanguageObj.nativeName}</Text>
      </TouchableOpacity>

      <View style={styles.content}>
        <View style={styles.logoCard}>
          <AppLogo size="xl" />
        </View>

        <Text style={styles.title}>{t("welcome.title")}</Text>

        <Text style={styles.subtitle}>{t("welcome.subtitle")}</Text>

        <View style={styles.buttonContainer}>
          <Button
            variant="primary"
            fullWidth
            onClick={() => setView(AppView.SIGNUP)}
          >
            {t("auth.signupBtn")}
          </Button>

          <Button
            variant="ghost"
            fullWidth
            style={{ borderWidth: 0, borderColor: "#555", marginTop: 8 }}
            onClick={() => setView(AppView.LOGIN)}
          >
            {t("auth.loginBtn")}
          </Button>

          <SocialAuthButtons setView={setView} setUser={setUser} />

          {/* EULA & Privacy Policy Agreement (Apple Review Guideline 1.2.0) */}
          <View style={styles.legalContainer}>
            <Text style={styles.legalText}>
              {t("welcome.byContinuing")}{" "}
              <Text
                style={styles.legalHighlight}
                onPress={() => setView(AppView.TERMS)}
              >
                {t("welcome.termsOfUse")}
              </Text>{" "}
              {t("welcome.and")}{" "}
              <Text
                style={styles.legalHighlight}
                onPress={() => setView(AppView.PRIVACY)}
              >
                {t("welcome.privacyPolicy")}
              </Text>.
            </Text>
            <Text style={styles.zeroToleranceText}>
              {t("welcome.zeroTolerance")}
            </Text>
          </View>
        </View>
      </View>
      <LanguageSelectorModal
        visible={showLanguageModal}
        onClose={() => setShowLanguageModal(false)}
      />
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
  langPill: {
    position: "absolute",
    top: 50,
    right: 24,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.15)",
    zIndex: 20,
  },
  langPillText: {
    fontSize: 12,
    color: "#E2E8F0",
    fontWeight: "600",
  },
});
