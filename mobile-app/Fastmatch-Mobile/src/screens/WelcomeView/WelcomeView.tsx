import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  StatusBar,
  TouchableOpacity,
  Platform,
  Modal,
  TextInput,
  ActivityIndicator,
} from "react-native";
import LinearGradient from "react-native-linear-gradient";
import { AppView, UserRole } from "./../../types";
import {
  MobileContainer,
  Button,
  AppLogo,
} from "./../../components/UIComponents";
import { useDispatch } from "react-redux";
import {
  setToken,
  setGlobalUser,
  setCompleteProfile,
} from "../../redux/slices/persistedSlice";
import { DataManager } from "../../helpers/dataManager";
import { useSocialAuthMutation } from "../../redux/services/auth";
import { ShowAlertMessage, popTypes } from "../../helpers/commonFunctions";
import DeviceInfo from "react-native-device-info";

const { width, height } = Dimensions.get("window");

interface AuthProps {
  setView: (view: any) => void;
  setUser?: (user: any) => void;
}

export const WelcomeView: React.FC<AuthProps> = ({ setView, setUser }) => {
  const dispatch = useDispatch();
  const [socialAuth, { isLoading: isSocialLoading }] = useSocialAuthMutation();
  const [socialModalVisible, setSocialModalVisible] = useState(false);
  const [socialProvider, setSocialProvider] = useState<"Google" | "Apple">("Google");
  const [socialEmail, setSocialEmail] = useState("");
  const [socialName, setSocialName] = useState("");

  const handleSocialClick = (provider: "Google" | "Apple") => {
    setSocialProvider(provider);
    setSocialEmail("");
    setSocialName("");
    setSocialModalVisible(true);
  };

  const handleCompleteSocialLogin = async () => {
    if (!socialEmail.trim()) {
      ShowAlertMessage("Please enter your email address", popTypes.error);
      return;
    }

    try {
      let deviceId = "";
      let deviceName = "";
      try {
        deviceId = await DeviceInfo.getUniqueId();
        deviceName = await DeviceInfo.getDeviceName();
      } catch (e) {
        console.log("Device info error:", e);
      }

      const fcmToken = (await DataManager.getFcmToken()) || "";

      const payload = {
        email: socialEmail.trim().toLowerCase(),
        provider: socialProvider.toLowerCase(),
        fullName: socialName.trim() || socialEmail.split("@")[0],
        displayName: socialName.trim() || socialEmail.split("@")[0],
        deviceId,
        deviceName,
        platform: Platform.OS,
        fcmToken,
      };

      const res: any = await socialAuth(payload).unwrap();

      setSocialModalVisible(false);

      if (res?.data?.token) {
        dispatch(setToken(res.data.token));
        await DataManager.setAccessToken(res.data.token);
      }

      if (res?.data?.user) {
        dispatch(setGlobalUser(res.data.user));
        setUser && setUser(res.data.user);

        if (res.data.user.isProfileComplete) {
          dispatch(setCompleteProfile(true));
          setView(AppView.HOME);
        } else {
          dispatch(setCompleteProfile(false));
          setView(AppView.PROFILE_SETUP);
        }
      }

      ShowAlertMessage(
        res?.message || `Signed in with ${socialProvider}`,
        popTypes.success
      );
    } catch (err: any) {
      console.warn("Social auth error:", err);
      ShowAlertMessage(
        err?.data?.message || "Social login failed. Please try again.",
        popTypes.error
      );
    }
  };

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

          {/* Social Sign-In Buttons */}
          <TouchableOpacity
            style={styles.socialBtn}
            onPress={() => handleSocialClick("Google")}
            activeOpacity={0.8}
          >
            <Text style={styles.socialIconG}>G</Text>
            <Text style={styles.socialBtnText}>Continue with Google</Text>
          </TouchableOpacity>

          {(Platform.OS === "ios" || Platform.OS === "android") && (
            <TouchableOpacity
              style={[styles.socialBtn, styles.appleBtn]}
              onPress={() => handleSocialClick("Apple")}
              activeOpacity={0.8}
            >
              <Text style={styles.socialIconApple}></Text>
              <Text style={[styles.socialBtnText, styles.appleBtnText]}>
                Continue with Apple
              </Text>
            </TouchableOpacity>
          )}

          <Button
            variant="ghost"
            fullWidth
            style={{ borderWidth: 0, borderColor: "#555", marginTop: 4 }}
            onClick={() => setView(AppView.LOGIN)}
          >
            Sign In with Password
          </Button>
        </View>
      </View>

      {/* Social Login Modal */}
      <Modal
        visible={socialModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setSocialModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>
              Sign In with {socialProvider}
            </Text>
            <Text style={styles.modalSubtitle}>
              Fastmatch will use your {socialProvider} account to verify your email.
            </Text>

            <Text style={styles.modalInputLabel}>Account Email</Text>
            <TextInput
              style={styles.modalInput}
              placeholder={`yourname@${socialProvider === "Apple" ? "icloud.com" : "gmail.com"}`}
              placeholderTextColor="#64748B"
              value={socialEmail}
              onChangeText={setSocialEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <Text style={styles.modalInputLabel}>Display / Full Name</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="e.g. Alex Smith"
              placeholderTextColor="#64748B"
              value={socialName}
              onChangeText={setSocialName}
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setSocialModalVisible(false)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalConfirmBtn}
                onPress={handleCompleteSocialLogin}
                disabled={isSocialLoading}
              >
                {isSocialLoading ? (
                  <ActivityIndicator color="#0F172A" />
                ) : (
                  <Text style={styles.modalConfirmText}>Continue</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  socialBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    paddingVertical: 14,
    marginTop: 12,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },
  appleBtn: {
    backgroundColor: "#000000",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
  },
  socialIconG: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#EA4335",
    marginRight: 10,
  },
  socialIconApple: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginRight: 10,
    marginTop: -2,
  },
  socialBtnText: {
    color: "#0F172A",
    fontWeight: "700",
    fontSize: 15,
  },
  appleBtnText: {
    color: "#FFFFFF",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.75)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalCard: {
    width: "100%",
    maxWidth: 380,
    backgroundColor: "#0F172A",
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  modalTitle: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 6,
  },
  modalSubtitle: {
    color: "#94A3B8",
    fontSize: 13,
    marginBottom: 20,
    lineHeight: 18,
  },
  modalInputLabel: {
    color: "#E2E8F0",
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 6,
    marginTop: 4,
  },
  modalInput: {
    backgroundColor: "#1E293B",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: "#FFFFFF",
    fontSize: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    marginBottom: 14,
  },
  modalActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 12,
    marginTop: 10,
  },
  modalCancelBtn: {
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: "#1E293B",
  },
  modalCancelText: {
    color: "#94A3B8",
    fontWeight: "600",
    fontSize: 14,
  },
  modalConfirmBtn: {
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: "#F59E0B",
    justifyContent: "center",
    alignItems: "center",
  },
  modalConfirmText: {
    color: "#0F172A",
    fontWeight: "bold",
    fontSize: 14,
  },
});
