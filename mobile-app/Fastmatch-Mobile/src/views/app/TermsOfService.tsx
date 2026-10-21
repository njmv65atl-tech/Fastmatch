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
              {`Welcome to Fastmatch. By accessing or using the Fastmatch mobile application and services, you agree to be bound by these Terms of Service. If you do not agree with any part of these terms, you may not use our services.\n\n`}

              <Text style={{ color: colors.white, fontWeight: "bold" }}>
                1. Strict 18+ Age Requirement{"\n"}
              </Text>
              {`You must be at least 18 years of age to use Fastmatch. By registering or using the service, you represent and warrant that you are at least 18 years old. We operate a zero-tolerance policy regarding underage users, and any account found to belong to an individual under 18 will be permanently deleted immediately.\n\n`}

              <Text style={{ color: colors.white, fontWeight: "bold" }}>
                2. Zero Tolerance Policy for Objectionable Content & Abusive Behavior{"\n"}
              </Text>
              {`FastMatch strictly enforces a ZERO-TOLERANCE policy for objectionable content and abusive users. You agree that you will NOT post, share, stream, or transmit any content that:\n`}
              {`• Contains nudity, sexually explicit acts, pornography, or sexual solicitations.\n`}
              {`• Harasses, bullies, intimidates, stalks, defames, or threatens any other user.\n`}
              {`• Transmits hate speech, promotes violence, discrimination, or unlawful acts.\n`}
              {`• Impersonates any person or entity or misrepresents your affiliation.\n`}
              {`Any violation will result in immediate account termination, a permanent hardware-level ban, and potential referral to law enforcement. There is zero tolerance for objectionable content or abusive users.\n\n`}

              <Text style={{ color: colors.white, fontWeight: "bold" }}>
                3. Strict Ban on Unauthorized Recording & Screenshots{"\n"}
              </Text>
              {`Users are strictly prohibited from taking screenshots, recording video/audio, or redistributing any portion of video calls or chat interactions without explicit, documented consent from the other party. Fastmatch employs proactive screenshot prevention mechanisms where supported by the operating system.\n\n`}

              <Text style={{ color: colors.white, fontWeight: "bold" }}>
                4. Ephemeral Live Video Communications{"\n"}
              </Text>
              {`Live video chats are streamed directly between users via secure real-time WebRTC connections. Fastmatch does not record, archive, or retain your private video streams on any servers.\n\n`}

              <Text style={{ color: colors.white, fontWeight: "bold" }}>
                5. Subscriptions, Virtual Coins & Payments{"\n"}
              </Text>
              {`• Premium Subscriptions: Monthly ($9.00/month) and Yearly ($90.00/year) subscriptions renew automatically through your Apple App Store or Google Play account unless cancelled at least 24 hours prior to the end of the current billing cycle.\n`}
              {`• Virtual Coins: Coins are digital consumables purchased for in-app interactions (e.g., virtual gifts, priority matching). Coins have no monetary cash value, are non-refundable, non-transferable, and cannot be redeemed for real currency.\n\n`}

              <Text style={{ color: colors.white, fontWeight: "bold" }}>
                6. User-Generated Content Moderation, Reporting & Immediate Blocking{"\n"}
              </Text>
              {`FastMatch provides built-in automated filtering and 24/7 human moderation. Users can instantly block any user or report objectionable content from any profile, global discovery, chat conversation, or live video call. All reports are reviewed within 24 hours, and content or users in violation will be permanently removed immediately.\n\n`}

              <Text style={{ color: colors.white, fontWeight: "bold" }}>
                7. Contact Us{"\n"}
              </Text>
              {`For inquiries, legal notices, or account assistance, contact our legal and support team at: support@fastmatch.app\n`}
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