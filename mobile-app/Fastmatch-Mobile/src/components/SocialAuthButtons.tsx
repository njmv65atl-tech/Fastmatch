import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  ActivityIndicator,
} from "react-native";
import Svg, { Path } from "react-native-svg";
import { useDispatch } from "react-redux";
import { GoogleSignin, statusCodes } from "@react-native-google-signin/google-signin";
import { appleAuth } from "@invertase/react-native-apple-authentication";
import DeviceInfo from "react-native-device-info";
import { AppView } from "../types";
import {
  setToken,
  setGlobalUser,
  setCompleteProfile,
} from "../redux/slices/persistedSlice";
import { DataManager } from "../helpers/dataManager";
import { useSocialAuthMutation } from "../redux/services/auth";
import { ShowAlertMessage, popTypes } from "../helpers/commonFunctions";
import { colors } from "../utils/colors";

export const GoogleIcon = ({ size = 22 }: { size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24">
    <Path
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      fill="#4285F4"
    />
    <Path
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      fill="#34A853"
    />
    <Path
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
      fill="#FBBC05"
    />
    <Path
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
      fill="#EA4335"
    />
  </Svg>
);

export const AppleIcon = ({ size = 22, color = "#FFFFFF" }: { size?: number; color?: string }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24">
    <Path
      d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.37c.62-.75 1.04-1.8 1.01-2.87-.96.04-2.1.64-2.77 1.42-.58.68-1.09 1.76-.95 2.8.03.01.06.01.08.01 1.01 0 2.01-.61 2.63-1.36z"
      fill={color}
    />
  </Svg>
);

interface SocialAuthButtonsProps {
  setView: (view: AppView) => void;
  setUser?: (user: any) => void;
  onLoginSuccess?: (user: any) => void;
  dividerText?: string;
}

const isAppleRelayId = (val?: string | null): boolean => {
  if (!val) return false;
  const s = val.trim();
  return (
    /^[0-9]+\.[a-f0-9]{10,}\.[0-9]+/i.test(s) ||
    /^[a-f0-9]{24,}$/i.test(s) ||
    s.includes("privaterelay")
  );
};

export const SocialAuthButtons: React.FC<SocialAuthButtonsProps> = ({
  setView,
  setUser,
  onLoginSuccess,
  dividerText = "or continue with",
}) => {
  const dispatch = useDispatch();
  const [socialAuth, { isLoading: isSocialLoading }] = useSocialAuthMutation();
  const [loadingProvider, setLoadingProvider] = useState<"google" | "apple" | null>(null);

  useEffect(() => {
    try {
      GoogleSignin.configure({
        scopes: ["email", "profile"],
        iosClientId: "205547608843-go7vud6rut8qtijonakr8oiuhbp2vp6h.apps.googleusercontent.com",
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
      setLoadingProvider(provider);
      let deviceId = "";
      let deviceName = "";
      try {
        deviceId = await DeviceInfo.getUniqueId();
        deviceName = await DeviceInfo.getDeviceName();
      } catch (e) {
        console.log("Device info error:", e);
      }

      const fcmToken = (await DataManager.getFcmToken()) || "";

      let cleanName = fullName?.trim() || "";
      if (!cleanName || isAppleRelayId(cleanName) || isAppleRelayId(email?.split("@")[0])) {
        cleanName = provider === "apple" ? "Apple User" : (email ? email.split("@")[0] : "User");
      }

      const payload = {
        email: email.trim().toLowerCase(),
        provider,
        fullName: cleanName,
        displayName: cleanName,
        profilePicture: profilePicture || undefined,
        deviceId,
        deviceName,
        platform: Platform.OS,
        fcmToken,
      };

      const res: any = await socialAuth(payload).unwrap();

      if (res?.data?.user) {
        const isComplete = !!res.data.user.isProfileComplete;

        // Set completeProfile and user BEFORE token to prevent App.tsx useEffect([token]) race condition
        dispatch(setCompleteProfile(isComplete));
        dispatch(setGlobalUser(res.data.user));
        setUser && setUser(res.data.user);
        onLoginSuccess && onLoginSuccess(res.data.user);

        if (res?.data?.token) {
          dispatch(setToken(res.data.token));
          await DataManager.setAccessToken(res.data.token);
        }

        if (isComplete) {
          setView(AppView.HOME);
        } else {
          setView(AppView.PROFILE_SETUP);
        }
      } else if (res?.data?.token) {
        dispatch(setToken(res.data.token));
        await DataManager.setAccessToken(res.data.token);
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
      setLoadingProvider(null);
    }
  };

  const handleGoogleSignIn = async () => {
    if (loadingProvider || isSocialLoading) return;
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
    if (loadingProvider || isSocialLoading) return;
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

      const userEmail = email || (appleUserId ? `${appleUserId}@privaterelay.appleid.com` : "");
      if (!displayName || isAppleRelayId(displayName)) {
        displayName = "Apple User";
      }

      await executeSocialAuth(userEmail, "apple", displayName, null);
    } catch (error: any) {
      if (error?.code === appleAuth.Error.CANCELED) {
        return;
      }
      console.warn("Apple Sign-In Error:", error);
      let errorMsg = "Apple Sign-In failed. Please try again.";
      if (error?.code === "1000" || error?.message?.includes("1000")) {
        errorMsg = "Apple Sign-In authorization failed. Please make sure Sign in with Apple is enabled on your Apple ID in Settings and try again.";
      } else if (error?.message) {
        errorMsg = error.message;
      }
      ShowAlertMessage(errorMsg, popTypes.error);
    }
  };

  const isBusy = !!loadingProvider || isSocialLoading;

  return (
    <View style={styles.container}>
      {/* Divider */}
      <View style={styles.dividerRow}>
        <View style={styles.dividerLine} />
        <Text style={styles.dividerText}>{dividerText}</Text>
        <View style={styles.dividerLine} />
      </View>

      {/* Sleek Buttons Row */}
      <View style={styles.buttonsRow}>
        {/* Google Sleek Button */}
        <TouchableOpacity
          style={styles.iconButton}
          onPress={handleGoogleSignIn}
          activeOpacity={0.7}
          disabled={isBusy}
        >
          {loadingProvider === "google" ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <GoogleIcon size={22} />
          )}
        </TouchableOpacity>

        {/* Apple Sleek Button */}
        <TouchableOpacity
          style={[styles.iconButton, styles.appleButton]}
          onPress={handleAppleSignIn}
          activeOpacity={0.7}
          disabled={isBusy}
        >
          {loadingProvider === "apple" ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <AppleIcon size={22} color="#FFFFFF" />
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: "100%",
    marginVertical: 14,
  },
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 14,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "rgba(255, 255, 255, 0.12)",
  },
  dividerText: {
    color: "#94A3B8",
    fontSize: 12,
    fontWeight: "500",
    textTransform: "lowercase",
    paddingHorizontal: 14,
    letterSpacing: 0.3,
  },
  buttonsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
  },
  iconButton: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.14)",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  appleButton: {
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
});
