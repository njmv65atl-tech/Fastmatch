import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  StatusBar,
  TouchableOpacity,
  Platform,
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
import { GoogleSignin, statusCodes } from "@react-native-google-signin/google-signin";
import { appleAuth } from "@invertase/react-native-apple-authentication";

const { width, height } = Dimensions.get("window");

interface AuthProps {
  setView: (view: any) => void;
  setUser?: (user: any) => void;
}

export const WelcomeView: React.FC<AuthProps> = ({ setView, setUser }) => {
  const dispatch = useDispatch();
  const [socialAuth, { isLoading: isSocialLoading }] = useSocialAuthMutation();
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    try {
      GoogleSignin.configure({
        scopes: ["email", "profile"],
        offlineAccess: false,
      });
    } catch (e) {
      console.warn("GoogleSignin configure error:", e);
    }
  }, []);

  const executeSocialAuth = async (
    email: string,
    provider: "google" | "apple",
    fullName: string,
    profilePicture: string | null
  ) => {
    try {
      setIsProcessing(true);
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
        email: email.trim().toLowerCase(),
        provider,
        fullName: fullName.trim() || email.split("@")[0],
        displayName: fullName.trim() || email.split("@")[0],
        profilePicture: profilePicture || undefined,
        deviceId,
        deviceName,
        platform: Platform.OS,
        fcmToken,
      };

      const res: any = await socialAuth(payload).unwrap();

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
        res?.message || `Signed in with ${provider === "google" ? "Google" : "Apple"}`,
        popTypes.success
      );
    } catch (err: any) {
      console.warn("Social auth error:", err);
      ShowAlertMessage(
        err?.data?.message || "Social login failed. Please try again.",
        popTypes.error
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const handleGoogleSignIn = async () => {
    if (isProcessing || isSocialLoading) return;
    try {
      if (Platform.OS === "android") {
        await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
      }
      const response: any = await GoogleSignin.signIn();
      const userObj = response?.data?.user || response?.user;
      const email = userObj?.email;
      const fullName = userObj?.name || userObj?.displayName || (email ? email.split("@")[0] : "Google User");
      const photo = userObj?.photo || null;

      if (!email) {
        ShowAlertMessage("Could not retrieve email from Google account.", popTypes.error);
        return;
      }

      await executeSocialAuth(email, "google", fullName, photo);
    } catch (error: any) {
      if (error?.code === statusCodes.SIGN_IN_CANCELLED) {
        // User cancelled the prompt - no error needed
        return;
      } else if (error?.code === statusCodes.IN_PROGRESS) {
        return;
      } else if (error?.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        ShowAlertMessage("Google Play Services is not available.", popTypes.error);
      } else {
        console.warn("Google Sign-In Error:", error);
        ShowAlertMessage(
          error?.message || "Google Sign-In failed. Please try again.",
          popTypes.error
        );
      }
    }
  };

  const handleAppleSignIn = async () => {
    if (isProcessing || isSocialLoading) return;
    if (Platform.OS !== "ios") {
      ShowAlertMessage("Apple Sign-In is only available on iOS devices.", popTypes.info);
      return;
    }

    try {
      const appleAuthRequestResponse = await appleAuth.performRequest({
        requestedOperation: appleAuth.Operation.LOGIN,
        requestedScopes: [appleAuth.Scope.EMAIL, appleAuth.Scope.FULL_NAME],
      });

      const { email, fullName, user: appleUserId } = appleAuthRequestResponse;

      let displayName = "";
      if (fullName?.givenName || fullName?.familyName) {
        displayName = `${fullName?.givenName || ""} ${fullName?.familyName || ""}`.trim();
      }

      const userEmail = email || `${appleUserId}@privaterelay.appleid.com`;
      displayName = displayName || userEmail.split("@")[0] || "Apple User";

      await executeSocialAuth(userEmail, "apple", displayName, null);
    } catch (error: any) {
      if (error?.code === appleAuth.Error.CANCELED) {
        return;
      }
      console.warn("Apple Sign-In Error:", error);
      ShowAlertMessage(
        error?.message || "Apple Sign-In failed. Please try again.",
        popTypes.error
      );
    }
  };

  const isLoading = isProcessing || isSocialLoading;

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
            onPress={handleGoogleSignIn}
            activeOpacity={0.8}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#0F172A" />
            ) : (
              <>
                <Text style={styles.socialIconG}>G</Text>
                <Text style={styles.socialBtnText}>Continue with Google</Text>
              </>
            )}
          </TouchableOpacity>

          {Platform.OS === "ios" && (
            <TouchableOpacity
              style={[styles.socialBtn, styles.appleBtn]}
              onPress={handleAppleSignIn}
              activeOpacity={0.8}
              disabled={isLoading}
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
});
