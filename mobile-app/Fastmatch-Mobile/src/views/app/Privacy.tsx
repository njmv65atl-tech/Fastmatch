import React, { useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  BackHandler,
  Platform,
} from "react-native";
import { MobileContainer, Button } from "../../components/UIComponents";
import { colors } from "../../utils/colors";
import { ArrowLeft } from "lucide-react-native";

interface PrivacyProps {
  onAgree: () => void;
  goBack: () => void;

}

export const Privacy: React.FC<PrivacyProps> = ({ onAgree, goBack,  }) => {
  
  // ── Handle System Back Button ─────────────────────────────────────────────
  useEffect(() => {
    const backAction = () => {
      // Execute the goBack function passed via props
      goBack();
      // Return true to prevent the app from closing/exiting
      return true;
    };

    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      backAction
    );

    // Clean up the listener when the component unmounts
    return () => backHandler.remove();
  }, [goBack]);

  return (
    <View style={{ flex: 1 }}>
      <MobileContainer>
        <ScrollView contentContainerStyle={styles.container}>
          <TouchableOpacity onPress={goBack} style={styles.backBtn}>
            <ArrowLeft color={colors.textPlaceholder} size={22} />
          </TouchableOpacity>



          <View>
              <Text style={styles.title}>Privacy & Safety Policy</Text>

          <Text style={styles.policyText}>
            {`Welcome to our app. Your privacy and safety are our highest priorities. Please read this policy carefully before using our services.\n\n`}

            <Text style={{ color: colors.white, fontWeight: "bold" }}>
              1. Information We Collect{"\n"}
            </Text>
            {`When you create an account, we collect your name, email address or phone number, and a password. During your use of the app, we may also collect profile information such as your display name and profile picture. We also collect usage data such as the features you interact with, session duration, and general app activity to help us improve our services.\n\n`}

            <Text style={{ color: colors.white, fontWeight: "bold" }}>
              2. How We Use Your Information{"\n"}
            </Text>
            {`We use your information to create and manage your account, match you with other users, provide customer support, send important service notifications, and improve the overall experience of the app. We do not use your data for any purpose beyond what is described in this policy without your explicit consent.\n\n`}
          </Text>
          </View>

             

          
          
        </ScrollView>
      </MobileContainer>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 24,
    paddingBottom: 60,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: colors.white,
    marginBottom: 24,
    textAlign: "center",
  },
  backBtn: {
    alignSelf: "flex-start",
    marginBottom: 16,
  },
  policyText: {
    fontSize: 14,
    color: colors.textPlaceholder,
    lineHeight: 22,
    marginBottom: 40,
  },
});