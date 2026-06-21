






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
import { validateOTP } from "../../utils/validators"; // import
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

  // Handle Android back button - go back to WELCOME screen
  useEffect(() => {
    if (Platform.OS === "android") {
      const backHandler = BackHandler.addEventListener(
        "hardwareBackPress",
        () => {
          setView(AppView.WELCOME);
          return true; // Prevent app closing
        }
      );

      return () => backHandler.remove();
    }
  }, [setView]);

  const handleOtpChange = (value: string, index: number) => {
    // Only accept single digit numbers
    if (!/^\d?$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus to next input if a digit is entered
    if (value && index < 3) {
      inputRefs.current[index + 1]?.focus();
    }

    // Clear error on typing
    setOtpError("");
  };

  const handleKeyPress = (key: string, index: number) => {
    // Handle backspace to focus previous input
    if (key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleResendOtp = async () => {
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
    // ✅ FRONTEND OTP VALIDATION
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
    
    // Explicitly identify flow to prevent crossover:
    // Use the type prop if explicitly set, otherwise assume signup if we have user credentials.
    const isForgotFlow = type === "forgot" || (!signupPhone && !signupEmail && !!forgotEmail);

    console.log("🔍 OTP Flow:", {
      type,
      hasPropEmail: !!email,
      hasStoredForgotEmail: !!storedForgotEmail,
      isForgotFlow,
      loginType: user?.loginType,
    });

    setOtpError(""); // already cleared above, but safe

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
          console.log("After OTP verification : ");
          DataManager.setAccessToken(res?.data?.token);
          DataManager.clearForgotOtpEmail();
          setView(AppView.RESET_PASSWORD);
          ShowAlertMessage(res?.message , popTypes.info)
          
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
        console.log("✅ API RESPONSE:", res);
        

        if (res?.data?.success === false) {
          setOtpError("Invalid OTP. Please try again.");
          return;
        }

        dispatch(setToken(res?.data?.token));
        DataManager.setAccessToken(res?.data?.token);
        setView(AppView.PROFILE_SETUP);
        console.log("now i am in profile setup");
        setTimeout(() => {
          ShowAlertMessage("OTP verified successfully", popTypes.info);
        }, 2000);
      }
    );
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        <MobileContainer>
          <View style={styles.otpWrap}>
            <View style={styles.iconCircle}>
              <CheckCircle color={colors.primary} size={40} />
            </View>
            <Text style={styles.pageTitle}>{OTP_TEXT.pageTitle}</Text>
            <Text style={styles.pageSubtitle}>{OTP_TEXT.pageSubtitle}</Text>

            <View style={styles.otpGrid}>
              {[0, 1, 2, 3].map((i) => (
                <TextInput
                  key={i}
                  ref={(ref) => (inputRefs.current[i] = ref)}
                  style={[
                    styles.otpInput,
                    otpError && styles.otpInputError,
                  ]}
                  maxLength={1}
                  keyboardType="numeric"
                  value={otp[i]}
                  onChangeText={(value) => handleOtpChange(value, i)}
                  onKeyPress={({ nativeEvent: { key } }) =>
                    handleKeyPress(key, i)
                  }
                />
              ))}
            </View>
            {otpError ? (
              <Text style={styles.errorText}>{otpError}</Text>
            ) : null}
            <View style={{ width: "100%" }}>
              <Button onClick={handleOtp} fullWidth>
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
            </View>
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
  otpInputError: {
    borderColor: "red",
  },
  errorText: {
    color: "red",
    fontSize: 12,
    marginTop: -20,
    marginBottom: 20,
    textAlign: "left",
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
  otpGrid: {
    flexDirection: "row",
    gap: 16,
    marginVertical: 40,
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
  },
});
