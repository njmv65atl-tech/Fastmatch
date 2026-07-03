import * as React from "react";
import { useState, useCallback, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Platform,
} from "react-native";
import { MobileContainer, Button, Input } from "../../components/UIComponents";
import { AppView, UserRole, User } from "../../types";
import { Mail, Lock } from "lucide-react-native";
import { colors } from "../../utils/colors";
import { LOGIN_TEXT } from "../../utils/commonText";
import { fontFamily } from "../../assets/fonts/fontFamily";
import { useBackHandler } from "../../components/BackHandlerWrapper";
import { ArrowLeft } from "lucide-react-native";
import { BackButton } from "../../components/BackButton";
import { validateSignin } from "../../utils/validators";
import { managerApiCall } from "../../helpers/managerApiCallFn";
import { useUserSignInMutation } from "../../redux/services/auth";
import { DataManager } from "../../helpers/dataManager";
import {
  setCompleteProfile,
  setToken,
} from "../../redux/slices/persistedSlice";
import { useDispatch } from "react-redux";
import { popTypes, ShowAlertMessage } from "../../helpers/commonFunctions";
import { setGlobalUser } from "../../redux/slices/persistedSlice";
import DeviceInfo from 'react-native-device-info'; // Add this import
import messaging from '@react-native-firebase/messaging';
import { generateE2EKeyPair, getE2EKeys } from "../../helpers/e2e";


interface AuthProps {
  setView: (view: AppView) => void;
  login: (user: User) => void;
  setUser: any;
}

export const LoginView: React.FC<AuthProps> = ({ setView, login, setUser }) => {
  const [userSignIn] = useUserSignInMutation();
  const dispatch = useDispatch();
  const [deviceId, setDeviceId] = useState('');
  const [deviceName, setDeviceName] = useState('');
  const emailRef = React.useRef<any>(null);
  const passwordRef = React.useRef<any>(null);

  const [fields, setFields] = useState({
    email: "",
    password: "",
  });


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

  const handleBack = useCallback(() => {
    setView(AppView.WELCOME);
  }, [setView]);

  const handleLogin = async () => {
    const validation = validateSignin(fields);
    if (validation?.error) {
      ShowAlertMessage(validation?.error, popTypes.error);
      console.log(validation?.error);
    } else {
      let fcmToken = await DataManager.getFcmToken();
      
      // If token not in storage, try to get it directly
      if (!fcmToken) {
        try {
          fcmToken = await messaging().getToken();
          if (fcmToken) {
            await DataManager.setFcmToken(fcmToken);
          }
        } catch (error) {
          console.log('Error fetching FCM token directly:', error);
        }
      }

      // E2E Keys
      let { publicKey } = await getE2EKeys();
      if (!publicKey) {
        const keys = await generateE2EKeyPair();
        publicKey = keys?.publicKey || null;
      }

      // Create the payload including device information
      const loginPayload = {
        ...fields,
        deviceId: deviceId, // From state
        deviceName: deviceName, // From state
        platform: Platform.OS, // Good practice to include this too
        fcmToken: fcmToken || "", // Fallback to empty string if still null
        publicKey: publicKey, // E2EE Public Key
      };
      

      managerApiCall(
        userSignIn,
        loginPayload, // Send the updated payload here
        (res: any) => {
          dispatch(setToken(res?.data?.token));
          DataManager.setAccessToken(res?.data?.token);
          if (res?.data?.user?.displayName) {
            dispatch(setCompleteProfile(true));
            setView(AppView.HOME);
          } else {
            setView(AppView.PROFILE_SETUP);
          }
          dispatch(setGlobalUser(res?.data?.user));
          setUser(res?.data?.user);
          ShowAlertMessage(res?.message, popTypes.info);
        },
        (err) => {
          console.log(err, "err");
          ShowAlertMessage(err?.error, popTypes.error);
          
        },
      );
    }
  };

  return (
    <MobileContainer>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => setView(AppView.WELCOME)}
            style={styles.backLinkContainer}
          >
            <ArrowLeft
              size={20}
              color={colors.textPlaceholder}
              style={{ marginRight: 6, marginBottom: 20 }}
            />
            <Text style={styles.backLink}>{LOGIN_TEXT.backLink}</Text>
          </TouchableOpacity>

          <Text style={styles.pageTitle}>{LOGIN_TEXT.pageTitle}</Text>
          <Text style={styles.pageSubtitle}>{LOGIN_TEXT.pageSubtitle}</Text>
        </View>

        <View style={styles.form}>
          <Input
            ref={emailRef}
            label={LOGIN_TEXT.emailLabel}
            placeholder={LOGIN_TEXT.emailPlaceholder}
            icon={<Mail color={colors.textPlaceholder} size={18} />}
            value={fields.email}
            returnKeyType="next"
            maxLength={35}
            onChangeText={(txt) => {
              setFields((prev) => ({ ...prev, email: txt.trim() }));
            }}
            onSubmitEditing={() => passwordRef.current?.focus()}
          />
          <Input
            ref={passwordRef}
            label={LOGIN_TEXT.passwordLabel}
            secureTextEntry
            placeholder={LOGIN_TEXT.passwordPlaceholder}
            icon={<Lock color={colors.textPlaceholder} size={18} />}
            value={fields.password}
            maxLength={25}
            onChangeText={(txt) => {
              setFields((prev) => ({ ...prev, password: txt.trim() }));
            }}
          />
          <TouchableOpacity
            onPress={() => setView(AppView.FORGOT_PASSWORD)}
            style={styles.forgotBtn}
          >
            <Text style={styles.forgotText}>{LOGIN_TEXT.forgotPassword}</Text>
          </TouchableOpacity>
          <View style={styles.bottomActions}>
            <Button onClick={handleLogin}>{LOGIN_TEXT.logInButton}</Button>
            <View style={styles.footerRow}>
              <Text style={styles.footerText}>{LOGIN_TEXT.noAccount}</Text>
              <TouchableOpacity onPress={() => setView(AppView.SIGNUP)}>
                <Text style={styles.footerLink}>{LOGIN_TEXT.signUpLink}</Text>
              </TouchableOpacity>
            </View>
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
  backLink: {
    color: colors.textPlaceholder,
    fontSize: 14,
    marginBottom: 24,
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
  forgotBtn: {
    alignSelf: "flex-end",
    marginTop: -8,
  },
  forgotText: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: "600",
  },
  bottomActions: {
    marginTop: 20,
  },
  footerRow: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 32,
  },
  backLinkContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  footerText: {
    color: colors.textPlaceholder,
    fontSize: 14,
  },
  footerLink: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: "bold",
  },
});
