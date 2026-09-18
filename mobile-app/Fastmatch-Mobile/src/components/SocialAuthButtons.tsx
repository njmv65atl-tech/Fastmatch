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
  <Svg width={size} height={size} viewBox="0 0 170 170">
    <Path
      d="M150.37 130.25c-2.45 5.66-5.35 10.87-8.71 15.66-4.58 6.53-8.33 11.05-11.22 13.56-4.48 4.12-9.28 6.23-14.42 6.35-3.69 0-8.14-1.05-13.32-3.18-5.19-2.12-9.97-3.17-14.34-3.17-4.58 0-9.49 1.05-14.75 3.17-5.26 2.13-9.5 3.24-12.74 3.35-4.35.13-9.16-1.9-14.42-6.08-3.69-3.04-7.66-7.86-11.92-14.46-6.3-9.77-11.21-20.9-14.74-33.39-3.53-12.49-5.3-24.32-5.3-35.48 0-14.68 3.86-26.68 11.58-36 7.72-9.33 17.1-14.07 28.14-14.23 4.8 0 10.15 1.34 16.06 4.02 5.91 2.68 9.77 4.09 11.58 4.24 1.54-.15 5.61-1.63 12.22-4.43 6.61-2.8 12.06-4.04 16.36-3.71 13.06.66 23.47 5.73 31.24 15.22-11.09 6.74-16.51 16.29-16.27 28.64.24 10.13 4.14 18.49 11.7 25.07 7.57 6.58 16.48 10.3 26.74 11.16-2.2 6.53-4.8 13.07-7.8 19.63zM119.22 33.72c0-7.39 2.67-14.36 8.01-20.91 5.34-6.55 12.08-10.82 20.22-12.81.33 1.34.49 2.58.49 3.71 0 7.39-2.75 14.39-8.25 21-5.5 6.61-12.35 10.66-20.55 12.16-.24-1.04-.36-2.09-.36-3.15z"
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
        onLoginSuccess && onLoginSuccess(res.data.user);

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

        {/* Apple Sleek Button (iOS only or as requested) */}
        {Platform.OS === "ios" && (
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
        )}
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
