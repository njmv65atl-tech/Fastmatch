import * as React from "react";
import { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Image,
  Alert,
  Platform,
  PermissionsAndroid,
} from "react-native";
import { launchImageLibrary, launchCamera } from "react-native-image-picker";
import {
  MobileContainer,
  Button,
  Input,
  Dropdown,
} from "./../../components/UIComponents";
import { AppView, UserRole } from "./../../types";
import { User, ChevronLeft } from "lucide-react-native";
import { colors } from "./../../utils/colors";
import { PROFILE_SETUP_TEXT } from "./../../utils/commonText";
import { fontFamily } from ".../../assets/fonts/fontFamily";
import { validateCompleteProfile } from "../../utils/validators";
import { managerApiCall } from "../../helpers/managerApiCallFn";
import { useCompleteProfileMutation } from "../../redux/services/auth";
import { useDispatch } from "react-redux";
import {
  setCompleteProfile,
  setGlobalUser,
} from "../../redux/slices/persistedSlice";
import { popTypes, ShowAlertMessage } from "../../helpers/commonFunctions";
import {
  check,
  request,
  PERMISSIONS,
  RESULTS,
  openSettings,
} from "react-native-permissions";
import DeviceInfo from 'react-native-device-info';
import messaging from '@react-native-firebase/messaging';
import { DataManager } from "../../helpers/dataManager";

interface AuthProps {
  setView: (view: AppView) => void;
  login: (user: any) => void;
  user: any;
  setUser: any;
}

export const ProfileSetupView: React.FC<AuthProps> = ({ setView, setUser }) => {  
  const interests = PROFILE_SETUP_TEXT.interests;
  const [name, setName] = useState<string>("");
  const [age, setAge] = useState<string>("");
  const [location, setLocation] = useState<string>("");
  const [language, setLanguage] = useState<string>("English");
  const [selected, setSelected] = useState<string[]>([]);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [deviceId, setDeviceId] = useState('');
  const [deviceName, setDeviceName] = useState('');
  const dispatch = useDispatch();

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

  const [completeProfile] = useCompleteProfileMutation();

  const toggleInterest = (interest: string) => {
    if (selected.includes(interest)) {
      setSelected(selected.filter((i) => i !== interest));
    } else {
      setSelected([...selected, interest]);
    }
  };

  const checkAndRequestPermission = async (permission: any, type: string) => {
    const status = await check(permission);

    switch (status) {
      case RESULTS.UNAVAILABLE:
        Alert.alert("Unavailable", `${type} is not available on this device`);
        return false;

      case RESULTS.DENIED: {
        const requestStatus = await request(permission);
        if (requestStatus === RESULTS.GRANTED) {
          return true;
        }
        return false;
      }

      case RESULTS.BLOCKED:
        Alert.alert(
          "Permission Required",
          `${type} permission is required to continue. Please enable it from settings.`,
          [
            { text: "Cancel", style: "cancel" },
            { text: "Open Settings", onPress: () => openSettings() },
          ],
        );
        return false;

      case RESULTS.GRANTED:
        return true;

      case RESULTS.LIMITED:
        return true;

      default:
        return false;
    }
  };

 

  const handleImageFromGallery = async () => {
    try {
      if (Platform.OS === "ios") {
        const granted = await checkAndRequestPermission(
          PERMISSIONS.IOS.PHOTO_LIBRARY,
          "Photo Library",
        );

        if (!granted) return;
      }

      

      launchImageLibrary(
        {
          mediaType: "photo",
          quality: 0.8,
        },
        (response) => {
          if (response?.assets && response?.assets[0]?.uri) {
            setProfileImage(response?.assets[0]?.uri);
          }
        },
      );
    } catch (err) {
      Alert.alert("Error", "Something went wrong while opening gallery.");
    }
  };

  const handleImageFromCamera = async () => {
    try {
      if (Platform.OS === "ios") {
        const granted = await checkAndRequestPermission(
          PERMISSIONS.IOS.CAMERA,
          "Camera",
        );

        if (!granted) return;
      }

      if (Platform.OS === "android") {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.CAMERA,
        );

        if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
          Alert.alert(
            "Permission Required",
            `Camera permission is required to continue. Please enable it from settings.`,
            [
              { text: "Cancel", style: "cancel" },
              { text: "Open Settings", onPress: () => openSettings() },
            ],
          );
          return;
        }
      }

      launchCamera(
        {
          mediaType: "photo",
          quality: 0.8,
          cameraType: "front",
        },
        (response) => {
          if (response?.assets && response?.assets[0]?.uri) {
            setProfileImage(response?.assets[0]?.uri);
          }
        },
      );
    } catch (err) {
      Alert.alert("Error", "Something went wrong while opening camera.");
    }
  };

  const handleComplete = () => {
    const validation = validateCompleteProfile({
      displayName: name,
      interests: selected,
      profilePicture: profileImage,
      age: age,
      location: location,
      language: language,
    });

    if (validation.error) {
      ShowAlertMessage(validation.error, popTypes.error);
    } else {
      console.log(profileImage, selected, "seomthing");
      const image = {
        uri: profileImage,
        type: "image/png",
        name: profileImage?.split("/").pop(),
      };
      const formData = new FormData();
      formData.append("displayName", name);
      formData.append("interests", JSON.stringify(selected));
      formData.append("profilePicture", image as any);
      formData.append("age",age);
      formData.append("location",location);
      formData.append("language", language);

      const addDeviceInfo = async () => {
        let fcmToken = await DataManager.getFcmToken();
        if (!fcmToken) {
          try {
            const fetchTokenTask = async () => {
              if (Platform.OS === 'ios' && !messaging().isDeviceRegisteredForRemoteMessages) {
                await messaging().registerDeviceForRemoteMessages();
              }
              return await messaging().getToken();
            };

            const timeoutPromise = new Promise<string>((_, reject) =>
              setTimeout(() => reject(new Error('FCM token timeout')), 4000)
            );
            
            fcmToken = await Promise.race([
              fetchTokenTask(),
              timeoutPromise
            ]);

            if (fcmToken) {
              await DataManager.setFcmToken(fcmToken);
            }
          } catch (error) {
            console.log('Error fetching FCM token:', error);
          }
        }
        formData.append("deviceId", deviceId);
        formData.append("deviceName", deviceName);
        formData.append("fcmToken", fcmToken || "");
        formData.append("platform", Platform.OS);
      };

      const submitProfile = async () => {
        await addDeviceInfo();
        managerApiCall(
          completeProfile,
          formData,
          (res: any) => {
            dispatch(setCompleteProfile(true));
            setView(AppView.HOME);
            dispatch(setGlobalUser(res?.data?.user));
            setUser(res?.data?.user);
            ShowAlertMessage("Profile created successfully", popTypes.info);
          },
          () => {},
        );
      };

      submitProfile();
    }
  };

  const handleAvatarPress = () => {
    Alert.alert(
      "Choose Image Source",
      "Select where you want to get your profile picture",
      [
        {
          text: "Camera",
          onPress: handleImageFromCamera,
        },
        {
          text: "Gallery",
          onPress: handleImageFromGallery,
        },
        {
          text: "Cancel",
          onPress: () => console.log("Cancelled"),
          style: "cancel",
        },
      ],
    );
  };

  return (
    <MobileContainer>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => setView(AppView.WELCOME)}
        >
          <ChevronLeft color={colors.white} size={28} />
        </TouchableOpacity>
        <Text style={styles.pageTitle}>{PROFILE_SETUP_TEXT.pageTitle}</Text>
        <Text style={styles.pageSubtitle}>
          {PROFILE_SETUP_TEXT.pageSubtitle}
        </Text>

        <View style={styles.avatarWrap}>
          <TouchableOpacity onPress={handleAvatarPress}>
            <View style={styles.avatarPlaceholder}>
              {profileImage ? (
                <Image
                  source={{ uri: profileImage }}
                  style={styles.avatarImage}
                />
              ) : (
                <User color={colors.surfaceAlt} size={40} />
              )}
              <View style={styles.avatarAdd}>
                <Text style={styles.plus}>+</Text>
              </View>
            </View>
          </TouchableOpacity>
        </View>

        {/* Display Name  */}

        <Input
          label={PROFILE_SETUP_TEXT.displayNameLabel}
          placeholder="Enter display name"
          value={name}
          maxLength={12}
          onChangeText={(txt) => {
            setName(txt.trimStart());
          }}
          //defaultValue={PROFILE_SETUP_TEXT.displayNameDefault}
        />

        {/* ── Age ── */}
                <Input
                  label={PROFILE_SETUP_TEXT.age}
                  placeholder="Enter your age"
                  value={age}
                  maxLength={3}
                  onChangeText={(txt) => setAge(txt.trimStart())}
                  keyboardType="number-pad"
        
                />
        
                {/* ── Location ── */}
                <Input
                  label={PROFILE_SETUP_TEXT.Location}
                  placeholder="Enter your location"
                  value={location}
                  maxLength={100}
                  onChangeText={(txt) => setLocation(txt.trimStart())}
                  
                />

                <Dropdown
                  label={PROFILE_SETUP_TEXT.languageLabel}
                  options={PROFILE_SETUP_TEXT.languages}
                  selectedValue={language}
                  onSelect={(val) => setLanguage(val)}
                />

                



        <View style={styles.section}>
          <Text style={styles.label}>{PROFILE_SETUP_TEXT.interestsLabel}</Text>
          <View style={styles.tagGrid}>
            {interests.map((interest) => (
              <TouchableOpacity
                key={interest}
                onPress={() => toggleInterest(interest)}
                style={[
                  styles.tag,
                  selected.includes(interest) && styles.tagSelected,
                ]}
              >
                <Text
                  style={[
                    styles.tagText,
                    selected.includes(interest) && styles.tagTextSelected,
                  ]}
                >
                  {interest}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <Button onClick={handleComplete}>
          {PROFILE_SETUP_TEXT.finishSetup}
        </Button>
      </ScrollView>
    </MobileContainer>
  );
};

const styles = StyleSheet.create({
  scrollContent: {
    padding: 32,
    flexGrow: 1,
  },
  backButton: {
    marginBottom: 16,
    alignSelf: 'flex-start',
    marginLeft: -8, // slight adjustment to align the icon visually
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
  avatarWrap: {
    alignItems: "center",
    marginVertical: 32,
  },
  avatarPlaceholder: {
    width: 112,
    height: 112,
    borderRadius: 56,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderSlate,
    borderStyle: "dashed",
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  avatarImage: {
    width: 112,
    height: 112,
    borderRadius: 56,
  },
  avatarAdd: {
    position: "absolute",
    bottom: 4,
    right: 4,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: colors.background,
  },
  plus: {
    color: colors.white,
    fontWeight: "bold",
  },
  section: {
    marginBottom: 40,
  },
  label: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 16,
  },
  tagGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  tag: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.surfaceAlt,
  },
  tagSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  tagText: {
    color: colors.textMuted,
    fontSize: 14,
    fontWeight: "600",
  },
  tagTextSelected: {
    color: colors.white,
  },
});
