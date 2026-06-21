import * as React from "react";
import { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Pressable,
  Platform,
  BackHandler,
} from "react-native";
import { ArrowLeft } from "lucide-react-native";
import { MobileContainer, Button, Input } from "../../components/UIComponents";
import { AppView, UserRole, User } from "../../types";
import { User as UserIcon, Mail, Lock } from "lucide-react-native";
import { colors } from "../../utils/colors";
import { SIGNUP_TEXT } from "../../utils/commonText";
import { fontFamily } from "../../assets/fonts/fontFamily";
import { useBackHandler } from "../../components/BackHandlerWrapper";
import { validateSignup } from "../../utils/validators";
import { managerApiCall } from "../../helpers/managerApiCallFn";
import { useUserSignUpMutation } from "../../redux/services/auth";
import { popTypes, ShowAlertMessage } from "../../helpers/commonFunctions";
import { Privacy } from "../../views/app/Privacy";
import DeviceInfo from 'react-native-device-info'; // Add this import
import { TermsOfService } from "../../views/app/TermsOfService";

interface AuthProps {
  setView: (view: AppView) => void;
  login: (user: User) => void;
  setUser: any;
}

export const SignupView: React.FC<AuthProps> = ({ setView, setUser }) => {
  const [userSignUp] = useUserSignUpMutation();
  const [privacy, setPrivacy] = React.useState(false);
  const [terms, setTerms] = React.useState(false);

  // Device info state
  const [deviceId, setDeviceId] = useState('');
  const [deviceName, setDeviceName] = useState('');

  // Updated fields with gender
  const [fields, setFields] = React.useState({
    gender: '' as 'male' | 'female' | 'other' | '',
    emailOrPhone: "",
    password: "",
  });

  // Fetch device info on mount
  useEffect(() => {
    const getDeviceInfo = async () => {
      try {
        const id = await DeviceInfo.getUniqueId();
        const name = await DeviceInfo.getDeviceName();
        setDeviceId(id);
        setDeviceName(name);
      } catch (error) {
        console.log('Device info error:', error);
      }
    };
    getDeviceInfo();
  }, []);

  // Handle Android back button
  useEffect(() => {
    if (Platform.OS === 'android') {
      const backHandler = BackHandler.addEventListener(
        'hardwareBackPress',
        () => {
          setView(AppView.WELCOME);
          return true;
        }
      );
      return () => backHandler.remove();
    }
  }, [setView]);

  const handleBack = useCallback(() => {
    setView(AppView.WELCOME);
  }, [setView]);

  const handleText1 = () => {
    setTerms(!terms);
    
  };

  const handleText2 = () => {
    setPrivacy(!privacy);
  };

  const emailRef = React.useRef<any>(null);
  const passwordRef = React.useRef<any>(null);

  // Gender selection handler
  const selectGender = (gender: 'male' | 'female' | 'other') => {
    setFields(prev => ({
      ...prev,
      gender: prev.gender === gender ? '' : gender // Toggle: select/deselect
    }));
  };

  const handleSignUp = () => {
    const validation = validateSignup(fields);
    
    if (validation.error) {
      ShowAlertMessage(validation.error, popTypes.error);
    } else {
      const payload = {
        gender: fields.gender,
        password: fields.password,
        ...(validation?.type === "phone"
          ? { phone: fields.emailOrPhone }
          : { email: fields.emailOrPhone }),
        // Extra device info
        deviceId,
        deviceName,
        platform: Platform.OS,
      };

      managerApiCall(
        userSignUp,
        payload,
        () => {
          setUser((prev: any) => ({
            ...prev,
            fullName: 'dummy-full-name',
            gender: fields.gender,
            ...(validation?.type === "phone"
              ? { phone: fields.emailOrPhone }
              : { email: fields.emailOrPhone }),
            loginType: validation?.type,
          }));
          setView(AppView.OTP);
        },
        () => {},
      );
    }
  };

  if (privacy) {
    return <Privacy onAgree={handleText2} goBack={handleText2} />;
  }
  if(terms){
    return <TermsOfService onAgree={handleText1} goBack={handleText1} />;
  }


  return (
    <MobileContainer>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View>
          <TouchableOpacity
            onPress={() => setView(AppView.WELCOME)}
            style={styles.backLinkContainer}
          >
            <ArrowLeft
              size={20}
              color={colors.textPlaceholder}
              style={{ marginRight: 6 }}
            />
            <Text style={styles.backLink}>{SIGNUP_TEXT.backLink}</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.header}>
          <Text style={styles.pageTitle}>{SIGNUP_TEXT.pageTitle}</Text>
          <Text style={styles.pageSubtitle}>{SIGNUP_TEXT.pageSubtitle}</Text>
        </View>

        <View style={styles.form}>
          {/* Gender Selector */}
          <View style={styles.genderSection}>
            <Text style={styles.genderLabel}>Gender *</Text>
            <View style={styles.genderOptions}>
              {(['male', 'female', 'other'] as const).map((gender) => (
                <TouchableOpacity
                  key={gender}
                  style={[
                    styles.genderOption,
                    fields.gender === gender && styles.genderOptionSelected
                  ]}
                  onPress={() => selectGender(gender)}
                  activeOpacity={0.7}
                >
                  <Text style={[
                    styles.genderOptionText,
                    fields.gender === gender && styles.genderOptionTextSelected
                  ]}>
                    {gender.charAt(0).toUpperCase() + gender.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <Input
            ref={emailRef}
            label={SIGNUP_TEXT.emailLabel}
            placeholder={SIGNUP_TEXT.emailPlaceholder}
            icon={<Mail color={colors.textPlaceholder} size={18} />}
            maxLength={35}
            returnKeyType="next"
            blurOnSubmit={false}
            onSubmitEditing={() => passwordRef.current?.focus()}
            value={fields.emailOrPhone}
            onChangeText={(txt) => {
              setFields((prev) => ({ ...prev, emailOrPhone: txt.trim() }));
            }}
          />

          <Input
            ref={passwordRef}
            label={SIGNUP_TEXT.passwordLabel}
            placeholder={SIGNUP_TEXT.passwordPlaceholder}
            icon={<Lock color={colors.textPlaceholder} size={18} />}
            returnKeyType="done"
            secureTextEntry={true}
            maxLength={25}
            value={fields.password}
            onChangeText={(txt) => {
              setFields((prev) => ({ ...prev, password: txt.trim() }));
            }}
          />

          <View style={styles.bottomActions}>
            <Button onClick={handleSignUp}>{SIGNUP_TEXT.continueButton}</Button>

            <Pressable >
              <Text style={styles.termsText}>
                By signing up, you agree to our{" "}
                
                <Text style={{ color: "#FFFFFF" }} onPress={() => handleText1()} >Terms </Text>and{" "}
                <Text style={{ color: "#FFFFFF" }} onPress={() => handleText2()}>Privacy Policy.</Text>
              </Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </MobileContainer>
  );
};

const styles = StyleSheet.create({
  scrollContent: {
    padding: 32,
    flexGrow: 1,
  },
  header: {
    marginTop: 20,
    marginBottom: 40,
  },
  backLinkContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  backLink: {
    fontSize: 16,
    color: colors.textPlaceholder,
    fontWeight: "500",
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
  },
  form: {
    marginBottom: 40,
  },
  // NEW GENDER STYLES
  genderSection: {
    marginBottom: 24,
  },
  genderLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  genderOptions: {
    flexDirection: "row",
    gap: 12,
  },
  genderOption: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    backgroundColor: colors.surface,
    alignItems: "center",
  },
  genderOptionSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  genderOptionText: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.textMuted,
  },
  genderOptionTextSelected: {
    color: colors.white,
  },
  genderError: {
    color: "red",
    fontSize: 12,
    marginTop: 4,
  },
  bottomActions: {
    marginTop: "auto",
  },
  termsText: {
    textAlign: "center",
    fontSize: 12,
    color: colors.textSubtle,
    marginTop: 24,
    lineHeight: 16,
  },
});