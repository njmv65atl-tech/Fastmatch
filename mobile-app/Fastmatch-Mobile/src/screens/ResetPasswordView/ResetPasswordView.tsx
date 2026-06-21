import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, ScrollView, BackHandler } from "react-native";
import { MobileContainer, Button, Input } from "../../components/UIComponents";
import { Lock } from "lucide-react-native";
import { colors } from "../../utils/colors";
import { AppView } from "../../types";
import { validateResetPassword } from "../../utils/validators";
import { ShowAlertMessage, popTypes } from "../../helpers/commonFunctions";
import { managerApiCall } from "../../helpers/managerApiCallFn";
import { useResetPasswordMutation } from "../../redux/services/auth";
import { useSelector } from "react-redux";
import { userSelector } from "../../redux/slices/persistedSlice";

interface ResetProps {
  setView: (view: AppView) => void;
}

export const ResetPasswordView: React.FC<ResetProps> = ({ setView }) => {
  const [resetPasswordApi] = useResetPasswordMutation();
  const currentUser = useSelector(userSelector);

  const [fields, setFields] = useState({
    password: "",
    confirmPassword: "",
  });

  // ── Handle System Back Button ─────────────────────────────────────────────
  useEffect(() => {
    const backAction = () => {
      // Navigate back to Login view when system back is pressed
      setView(AppView.LOGIN);
      return true; // Prevents the app from exiting
    };

    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      backAction
    );

    return () => backHandler.remove(); // Cleanup listener on unmount
  }, [setView]);

  const handleReset = () => {
    const validation = validateResetPassword(fields);

    if (validation.error) {
      ShowAlertMessage(validation.error, popTypes.error);
      return;
    }

    const resetPayload = {
      newPassword: fields.password,
    };

    managerApiCall(
      resetPasswordApi,
      resetPayload,
      (res: any) => {
        ShowAlertMessage(res?.message || "Password reset successfully!", popTypes.info);
        setView(AppView.LOGIN);
      },
      (err: any) => {
        console.log(err, "Reset Password Error");
        ShowAlertMessage(err?.error || "Failed to reset password", popTypes.error);
      }
    );
  };

  return (
    <MobileContainer>
      <ScrollView 
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <Text style={styles.title}>Reset Password</Text>
          <Text style={styles.subtitle}>Enter your new password below.</Text>
        </View>

        <View style={styles.form}>
          <Input
            label="New Password"
            placeholder="Enter new password"
            secureTextEntry
            icon={<Lock color={colors.textPlaceholder} size={18} />}
            value={fields.password}
            maxLength={25}
            onChangeText={(txt) => setFields((prev) => ({ ...prev, password: txt.trim() }))}
          />

          <Input
            label="Confirm New Password"
            placeholder="Confirm new password"
            secureTextEntry
            icon={<Lock color={colors.textPlaceholder} size={18} />}
            value={fields.confirmPassword}
            maxLength={25}
            onChangeText={(txt) => setFields((prev) => ({ ...prev, confirmPassword: txt.trim() }))}
          />

          <View style={styles.bottomActions}>
            <Button onClick={handleReset}>Reset Password</Button>
          </View>
        </View>
      </ScrollView>
    </MobileContainer>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 32,
    flexGrow: 1,
  },
  header: {
    marginTop: 20,
    marginBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: colors.white,
  },
  subtitle: {
    fontSize: 16,
    color: colors.textMuted,
    marginTop: 8,
  },
  form: {
    marginBottom: 40,
  },
  bottomActions: {
    marginTop: 20,
  },
});