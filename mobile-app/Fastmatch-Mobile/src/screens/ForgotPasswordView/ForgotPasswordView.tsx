

import * as React from "react";
import { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Platform,
  BackHandler,
} from "react-native";
import { MobileContainer, Button, Input } from "../../components/UIComponents";
import { AppView } from "../../types";
import { colors } from "../../utils/colors";
import { FORGOT_PASSWORD_TEXT } from "../../utils/commonText";
import { managerApiCall } from "../../helpers/managerApiCallFn";
import { validateForgotPassword } from "../../utils/validators";
import { useForgotPasswordMutation } from "../../redux/services/auth";
import { ShowAlertMessage, popTypes } from "../../helpers/commonFunctions";
import { DataManager } from "../../helpers/dataManager";

interface Props {
  setView: (view: AppView) => void;
  onOtpRequested: (email: string) => void;
}

export const ForgotPasswordView: React.FC<Props> = ({
  setView,
  onOtpRequested,
}) => {
  const [email, setEmail] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [forgotPass] = useForgotPasswordMutation();

  // Handle Android back button
  useEffect(() => {
    const handleBackPress = () => {
      setView(AppView.LOGIN);
      return true;
    };

    if (Platform.OS === "android") {
      const backHandler = BackHandler.addEventListener(
        "hardwareBackPress",
        handleBackPress
      );
      return () => backHandler.remove();
    }
  }, [setView]);

  const handleSend = () => {
    const normalizedEmail = email.trim().toLowerCase();

    // ✅ Validate using your validator
    const validation = validateForgotPassword({ email: normalizedEmail });
    if (validation?.error) {
      console.log("this validation error is : ",validation.error)
      setError(validation.error);
      ShowAlertMessage(
          validation?.error,
          popTypes.error          
        );

      return;
    }

    setError("");

    managerApiCall(
      forgotPass,
      { email: normalizedEmail },
      (res: any) => {
        console.log("Forgot password API response:", res);
        DataManager.setForgotOtpEmail(normalizedEmail);
        onOtpRequested(normalizedEmail);
        ShowAlertMessage(
          res?.message || res?.data?.message || "OTP sent successfully",
          popTypes.info
        );
      },
      (err) => {
        console.log("Forgot password API error:", err);
        // Use same error if you want, or a generic one
        setError(
          err?.message ||
            "Couldn’t send OTP. Please check your email and try again."
        );
      }
    );
  };

  return (
    <MobileContainer>
      <ScrollView contentContainerStyle={styles.container}>
        <TouchableOpacity onPress={() => setView(AppView.LOGIN)}>
          <Text style={styles.back}>{FORGOT_PASSWORD_TEXT.backLink}</Text>
        </TouchableOpacity>

        <Text style={styles.title}>{FORGOT_PASSWORD_TEXT.pageTitle}</Text>
        {/* <Text style={styles.subtitle}>{FORGOT_PASSWORD_TEXT.pageSubtitle}</Text> */}

        <View style={styles.form}>
          <Input
            label={FORGOT_PASSWORD_TEXT.emailLabel}
            placeholder={FORGOT_PASSWORD_TEXT.emailPlaceholder}
            value={email}
            maxLength={35}
            onChangeText={(txt) => {
              setEmail(txt);
              setError(""); // clear error on typing
            }}
          />
        </View>

        <Button onClick={handleSend}>{FORGOT_PASSWORD_TEXT.sendButton}</Button>
      </ScrollView>
    </MobileContainer>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 32,
    flexGrow: 1,
  },
  back: {
    color: colors.textPlaceholder,
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: colors.white,
    marginBottom:20
  },
  subtitle: {
    fontSize: 16,
    color: colors.textMuted,
    marginTop: 8,
    marginBottom: 24,
  },
  form: {
    marginBottom: 24,
  },
});