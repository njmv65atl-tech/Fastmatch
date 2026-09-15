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
              {`At Fastmatch, your privacy, personal boundaries, and safety are our foundational values. This Privacy Policy details how we handle and protect your personal information.\n\n`}

              <Text style={{ color: colors.white, fontWeight: "bold" }}>
                1. Zero Data Selling Guarantee{"\n"}
              </Text>
              {`We believe your personal life belongs to you. Fastmatch does NOT sell, lease, monetize, or trade your personal data, chat logs, profile information, or usage records to any third-party advertisers, data brokers, or marketing networks. Never have, never will.\n\n`}

              <Text style={{ color: colors.white, fontWeight: "bold" }}>
                2. Ephemeral Live Video & Audio Privacy{"\n"}
              </Text>
              {`All video and voice matches take place in real-time over secure WebRTC connections. We do NOT record, intercept, monitor, or archive any video or audio streams. When your call ends, the connection terminates instantly and leaves zero video footprints on our servers.\n\n`}

              <Text style={{ color: colors.white, fontWeight: "bold" }}>
                3. End-to-End Encrypted Direct Messages{"\n"}
              </Text>
              {`Private text messages sent between matched friends utilize device-generated cryptographic keypairs (Curve25519/TweetNaCl). Your messages are encrypted on your device before transmission, meaning only you and your conversation partner possess the keys to decrypt them.\n\n`}

              <Text style={{ color: colors.white, fontWeight: "bold" }}>
                4. Information We Collect{"\n"}
              </Text>
              {`• Account Information: Email address or phone number, display name, verified age (strictly 18+), gender, and interests.\n`}
              {`• Optional Profile Assets: Profile photo uploaded by you to represent your presence in the community.\n`}
              {`• Technical Data: Device ID, OS platform, and push notification tokens strictly used for authentication, account security, and delivering incoming call or message alerts.\n\n`}

              <Text style={{ color: colors.white, fontWeight: "bold" }}>
                5. User Rights, Data Control & Deletion{"\n"}
              </Text>
              {`In compliance with international privacy laws (including GDPR and CCPA), you hold full ownership of your data. You may export your information or permanently delete your account and all associated records at any moment from the Settings page or by contacting our data privacy officer.\n\n`}

              <Text style={{ color: colors.white, fontWeight: "bold" }}>
                6. Contact Privacy Team{"\n"}
              </Text>
              {`If you have questions, concerns, or requests regarding this Privacy Policy, please email our security and privacy team directly at: support@fastmatch.app\n`}
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