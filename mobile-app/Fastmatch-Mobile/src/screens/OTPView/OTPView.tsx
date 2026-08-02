import * as React from "react";
import { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableWithoutFeedback,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  BackHandler,
} from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  withDelay,
  Easing,
  withSpring
} from 'react-native-reanimated';
import { MobileContainer, Button } from "../../components/UIComponents";
import { AppView, UserRole } from "../../types";
import { CheckCircle } from "lucide-react-native";
import { colors } from "../../utils/colors";
import { OTP_TEXT } from "../../utils/commonText";
import { fontFamily } from "../../assets/fonts/fontFamily";
import {
  useVerifyOtpMutation,
  useVerifySignUpOtpMutation,
  useResendOtpMutation,
} from "../../redux/services/auth";
import { managerApiCall } from "../../helpers/managerApiCallFn";
import { useDispatch } from "react-redux";
import { setToken } from "../../redux/slices/persistedSlice";
import { DataManager } from "../../helpers/dataManager";
import { validateOTP } from "../../utils/validators";
import { popTypes, ShowAlertMessage } from "../../helpers/commonFunctions";

interface AuthProps {
  setView: (view: AppView) => void;
  login: (user: any) => void;
  user: any;
  email?: string;
  type?: "signup" | "forgot";
}

export const OTPView: React.FC<AuthProps> = ({ setView, user, email, type }) => {
  const [otp, setOtp] = React.useState(["", "", "", ""]);
  const inputRefs = React.useRef<(TextInput | null)[]>([]);
  const dispatch = useDispatch();
  const [otpError, setOtpError] = React.useState("");
  const [verifyOtp] = useVerifySignUpOtpMutation();
  const [verifyForgotOtp] = useVerifyOtpMutation();
  const [resendOtp] = useResendOtpMutation();

  const [status, setStatus] = React.useState<'idle' | 'success'>('idle');

  // Animation Values
  const shockwaveScale = useSharedValue(1);
  const shockwaveOpacity = useSharedValue(0);
  const checkmarkY = useSharedValue(20);
  const checkmarkOpacity = useSharedValue(0);
  const headerOpacity = useSharedValue(1);

  useEffect(() => {
    if (status === 'success') {
      Keyboard.dismiss();
      headerOpacity.value = withTiming(0, { duration: 300 });
      
      // Shockwave plays after inputs converge (around 1.2s)
      shockwaveOpacity.value = withDelay(1200, withSequence(
        withTiming(0.8, { duration: 100 }),
        withTiming(0, { duration: 700 })
      ));
      shockwaveScale.value = withDelay(1200, withTiming(3.5, { duration: 800, easing: Easing.out(Easing.ease) }));
      
      // Checkmark appears after shockwave
      checkmarkOpacity.value = withDelay(1600, withTiming(1, { duration: 500 }));
      checkmarkY.value = withDelay(1600, withSpring(0));
    }
  }, [status]);

  // Handle Android back button
  useEffect(() => {
    if (Platform.OS === "android") {
      const backHandler = BackHandler.addEventListener(
        "hardwareBackPress",
        () => {
          setView(AppView.WELCOME);
          return true;
        }
      );
      return () => backHandler.remove();
    }
  }, [setView]);

  const handleOtpChange = (value: string, index: number) => {
    if (status === 'success') return;
    if (!/^\d?$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    if (value && index < 3) {
      inputRefs.current[index + 1]?.focus();
    }

    setOtpError("");
  };

  const handleKeyPress = (key: string, index: number) => {
    if (status === 'success') return;
    if (key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleResendOtp = async () => {
    if (status === 'success') return;
    const signupPhone = (user?.phone || "").trim();
    const signupEmail = (user?.email || "").trim();
    const storedForgotEmail = (await DataManager.getForgotOtpEmail()) || "";
    const forgotEmail = (email || storedForgotEmail || "").trim().toLowerCase();
    
    const isForgotFlow = type === "forgot" || (!signupPhone && !signupEmail && !!forgotEmail);
    
    let identifier = "";
    if (isForgotFlow) {
      identifier = forgotEmail;
    } else {
      identifier = user?.loginType === "phone" ? signupPhone : signupEmail;
    }

    if (!identifier) {
      ShowAlertMessage("User information not found. Please try again.", popTypes.error);
      return;
    }

    managerApiCall(
      resendOtp,
      {
        email: user?.loginType === "phone" ? undefined : identifier,
        phone: user?.loginType === "phone" ? identifier : undefined,
      },
      (res: any) => {
        ShowAlertMessage(res?.message || "OTP resent successfully", popTypes.success);
      }
    );
  };

  const handleOtp = async () => {
    if (status === 'success') return;
    const localError = validateOTP(otp);
    if (localError) {
      setOtpError(localError);
      return;
    }

    const finalOtp = otp.join("");
    const otpAsNumber = Number(finalOtp);
    const storedForgotEmail = (await DataManager.getForgotOtpEmail()) || "";
    const forgotEmail = (email || storedForgotEmail || "").trim().toLowerCase();
    const signupPhone = (user?.phone || "").trim();
    const signupEmail = (user?.email || "").trim();
    
    const isForgotFlow = type === "forgot" || (!signupPhone && !signupEmail && !!forgotEmail);

    setOtpError(""); 

    if (isForgotFlow) {
      if (!forgotEmail) {
        setOtpError("Email is required");
        return;
      }

      managerApiCall(
        verifyForgotOtp,
        {
          email: forgotEmail,
          otp: otpAsNumber,
        },
        (res: any) => {
          DataManager.setAccessToken(res?.data?.token);
          DataManager.clearForgotOtpEmail();
          setStatus('success');
          setTimeout(() => {
            setView(AppView.RESET_PASSWORD);
            ShowAlertMessage(res?.message , popTypes.info);
          }, 2500);
        }
      );
      return;
    }

    if (!signupPhone && !signupEmail) {
      setOtpError("Email or phone is required. Please request OTP again.");
      return;
    }

    managerApiCall(
      verifyOtp,
      {
        otp: otpAsNumber,
        ...(user?.loginType === "phone"
          ? { phone: signupPhone }
          : { email: signupEmail }),
      },
      (res: any) => {
        if (res?.data?.success === false) {
          setOtpError("Invalid OTP. Please try again.");
          return;
        }

        setStatus('success');
        setTimeout(() => {
          dispatch(setToken(res?.data?.token));
          DataManager.setAccessToken(res?.data?.token);
          // App.tsx useEffect will handle the redirect to PROFILE_SETUP or HOME based on token
          // setView(AppView.PROFILE_SETUP);
          ShowAlertMessage("OTP verified successfully", popTypes.info);
        }, 2500);
      }
    );
  };

  const getInputAnimatedStyle = (index: number) => {
    return useAnimatedStyle(() => {
      // 0: +114, 1: +38, 2: -38, 3: -114
      const targetX = index === 0 ? 114 : index === 1 ? 38 : index === 2 ? -38 : -114;
      
      const translateX = withTiming(status === 'success' ? targetX : 0, { 
        duration: 800, 
        easing: Easing.inOut(Easing.ease) 
      });
      
      const scale = withDelay(800, withTiming(status === 'success' ? 0 : 1, { duration: 400 }));
      const opacity = withDelay(800, withTiming(status === 'success' ? 0 : 1, { duration: 400 }));

      return {
        transform: [{ translateX }, { scale }],
        opacity,
      };
    });
  };

  const shockwaveStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: shockwaveScale.value }],
      opacity: shockwaveOpacity.value,
    };
  });

  const checkmarkContainerStyle = useAnimatedStyle(() => {
    return {
      opacity: checkmarkOpacity.value,
      transform: [{ translateY: checkmarkY.value }],
    };
  });

  const headerAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: headerOpacity.value,
    };
  });

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        <MobileContainer>
          <View style={styles.otpWrap}>
            
            <Animated.View style={[styles.headerContainer, headerAnimatedStyle]}>
              <View style={styles.iconCircle}>
                <CheckCircle color={colors.primary} size={40} />
              </View>
              <Text style={styles.pageTitle}>{OTP_TEXT.pageTitle}</Text>
              <Text style={styles.pageSubtitle}>{OTP_TEXT.pageSubtitle}</Text>
            </Animated.View>

            <View style={styles.animationContainer}>
              <View style={styles.otpGrid}>
                {/* Connecting Dotted Line Background */}
                <View style={styles.dottedLine} />

                {/* The 4 Inputs */}
                {[0, 1, 2, 3].map((i) => (
                  <Animated.View key={i} style={[getInputAnimatedStyle(i), { zIndex: 10 }]}>
                    <TextInput
                      ref={(ref) => (inputRefs.current[i] = ref)}
                      style={[
                        styles.otpInput,
                        otpError ? styles.otpInputError : null,
                        status === 'success' ? styles.otpInputSuccess : null
                      ]}
                      maxLength={1}
                      keyboardType="numeric"
                      value={otp[i]}
                      editable={status !== 'success'}
                      onChangeText={(value) => handleOtpChange(value, i)}
                      onKeyPress={({ nativeEvent: { key } }) => handleKeyPress(key, i)}
                    />
                  </Animated.View>
                ))}

                {/* Shockwave Element */}
                <Animated.View style={[styles.shockwave, shockwaveStyle]} pointerEvents="none" />
              </View>

              {/* Success Checkmark & Text overlay */}
              <Animated.View style={[styles.successOverlay, checkmarkContainerStyle]} pointerEvents="none">
                <CheckCircle color="#22c55e" size={64} />
                <Text style={styles.successTitle}>Verified Successfully</Text>
                <Text style={styles.successSubtitle}>Your number has been verified.</Text>
              </Animated.View>
            </View>

            {otpError ? (
              <Animated.Text style={[styles.errorText, headerAnimatedStyle]}>{otpError}</Animated.Text>
            ) : null}
            
            <Animated.View style={[{ width: "100%" }, headerAnimatedStyle]}>
              <Button onClick={handleOtp} fullWidth disabled={status === 'success'}>
                {OTP_TEXT.verifyButton}
              </Button>
              <View style={{ marginTop: 24, alignItems: "center" }}>
                <Text style={{ color: colors.textMuted, fontSize: 16 }}>
                  Didn't receive code?{" "}
                  <Text
                    style={{ color: colors.primary, fontWeight: "bold" }}
                    onPress={handleResendOtp}
                  >
                    Resend OTP
                  </Text>
                </Text>
              </View>
            </Animated.View>
          </View>
        </MobileContainer>
      </KeyboardAvoidingView>
    </TouchableWithoutFeedback>
  );
};

const styles = StyleSheet.create({
  otpWrap: {
    flex: 1,
    padding: 32,
    alignItems: "center",
  },
  headerContainer: {
    alignItems: "center",
    width: "100%",
  },
  otpInputError: {
    borderColor: "red",
  },
  errorText: {
    color: "red",
    fontSize: 12,
    marginTop: -20,
    marginBottom: 20,
    textAlign: "center",
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primarySoft,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 32,
    borderWidth: 1,
    borderColor: colors.primaryBorderSoft,
  },
  pageTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: colors.white,
  },
  pageSubtitle: {
    fontSize: 16,
    color: colors.textMuted,
    marginTop: 8,
    textAlign: "center",
  },
  animationContainer: {
    height: 150,
    justifyContent: "center",
    alignItems: "center",
    marginVertical: 20,
    width: "100%",
  },
  otpGrid: {
    flexDirection: "row",
    gap: 16,
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  dottedLine: {
    position: "absolute",
    height: 1,
    left: 30,
    right: 30,
    top: "50%",
    borderStyle: "dashed",
    borderWidth: 1,
    borderColor: colors.surfaceAlt,
    zIndex: 0,
  },
  otpInput: {
    width: 60,
    height: 60,
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.surfaceAlt,
    justifyContent: "center",
    alignItems: "center",
    color: colors.white,
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  otpInputSuccess: {
    borderColor: "#22c55e",
    backgroundColor: "rgba(34, 197, 94, 0.1)",
  },
  shockwave: {
    position: "absolute",
    width: 60,
    height: 60,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: "#22c55e",
    zIndex: 5,
  },
  successOverlay: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 20,
  },
  successTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#22c55e",
    marginTop: 16,
  },
  successSubtitle: {
    fontSize: 14,
    color: colors.textMuted,
    marginTop: 4,
  },
});