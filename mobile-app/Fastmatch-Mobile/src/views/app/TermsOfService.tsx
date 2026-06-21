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

export const TermsOfService: React.FC<PrivacyProps> = ({ onAgree, goBack}) => {
  
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

              <Text style={styles.title}>Terms of Service</Text>

          <Text style={styles.policyText}>
            
            <Text style={{ color: colors.white, fontWeight: "bold" }}>
              1. User Conduct & Safety{"\n"}
            </Text>
            {`Users must not engage in harassment, nudity, explicit content, hate speech, or any abusive behavior during video calls or chats. Violations may result in immediate account suspension or permanent ban.\n\n\n`}

            <Text style={{ color: colors.white, fontWeight: "bold" }}>
              2. Age Requirement & Consent{"\n"}
            </Text>
            {`Users must be 12 years or older to use this platform. By using the app, you confirm you meet the age requirement and consent to being matched with strangers for video and chat interactions.\n\n`}
            <Text style={{ color: colors.white, fontWeight: "bold" }}>
              3. Privacy & Recording{"\n"}
            </Text>
            {`Users are strictly prohibited from recording, screenshots, or sharing any video calls or chat conversations without the explicit consent of the other party. We are not responsible for any unauthorized content captured by users.\n\n`}

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