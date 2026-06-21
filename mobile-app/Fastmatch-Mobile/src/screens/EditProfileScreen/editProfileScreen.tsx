import * as React from "react";
import { useState, useCallback, useEffect } from "react";
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
  BackHandler, // Required for system back button
} from "react-native";
import { launchImageLibrary, launchCamera } from "react-native-image-picker";
import { Button, Input, Dropdown } from "./../../components/UIComponents";
import { User } from "lucide-react-native";
import { colors } from "./../../utils/colors";
import { PROFILE_SETUP_TEXT } from "./../../utils/commonText";
import { managerApiCall } from "../../helpers/managerApiCallFn";
import { useCompleteProfileMutation } from "../../redux/services/auth";
import { useDispatch } from "react-redux";
import { setGlobalUser } from "../../redux/slices/persistedSlice";
import { popTypes, ShowAlertMessage } from "../../helpers/commonFunctions";
import {
  check,
  request,
  PERMISSIONS,
  RESULTS,
  openSettings,
} from "react-native-permissions";
import { validateCompleteProfile, validateEditProfile } from "../../utils/validators";
import { IMAGE_URL } from "../../config/env";

const BASE_URL = IMAGE_URL;

interface EditProfileScreenProps {
  user: any;
  onCancel: () => void;
  onSave: (updatedUser: any) => void; 
}

export const EditProfileScreen: React.FC<EditProfileScreenProps> = ({
  user,
  onCancel,
  onSave,
}) => {
  const interests = PROFILE_SETUP_TEXT.interests;
  const dispatch = useDispatch();
  const [completeProfile] = useCompleteProfileMutation();

  const initialInterests = Array.isArray(user?.interests)
    ? user.interests.map((i: string) => {
        const trimmed = i.trim();
        const match = PROFILE_SETUP_TEXT.interests.find(
          (pi) => pi.toLowerCase() === trimmed.toLowerCase()
        );
        return match || trimmed;
      })
    : typeof user?.interests === "string"
    ? user?.interests.split(",").map((i: string) => {
        const trimmed = i.trim();
        const match = PROFILE_SETUP_TEXT.interests.find(
          (pi) => pi.toLowerCase() === trimmed.toLowerCase()
        );
        return match || trimmed;
      })
    : [];

  // ── States ────────────────────────────────────────────────────────────────
  const [name, setName] = useState<string>(user?.displayName ?? "");
  const [age, setAge] = useState<string>(user?.age ?? "");
  const [location, setLocation] = useState<string>(user?.location ?? "");
  const [language, setLanguage] = useState<string>(user?.language ?? "English");
  const [selected, setSelected] = useState<string[]>(initialInterests);
  const [profileImage, setProfileImage] = useState<string | null>(null);

  // ── Handle System Back Button ─────────────────────────────────────────────
  useEffect(() => {
    const backAction = () => {
      onCancel(); // Executes the cancel function passed from parent
      return true; // Prevents the app from exiting
    };

    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      backAction
    );

    return () => backHandler.remove(); // Cleanup listener on unmount
  }, [onCancel]);

  // ── Logic Functions ───────────────────────────────────────────────────────
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
        return requestStatus === RESULTS.GRANTED;
      }
      case RESULTS.BLOCKED:
        Alert.alert(
          "Permission Required",
          `${type} permission is required. Please enable it from settings.`,
          [
            { text: "Cancel", style: "cancel" },
            { text: "Open Settings", onPress: () => openSettings() },
          ]
        );
        return false;
      case RESULTS.GRANTED:
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
          "Photo Library"
        );
        if (!granted) return;
      }
      launchImageLibrary({ mediaType: "photo", quality: 0.8 }, (response) => {
        if (response?.assets && response?.assets[0]?.uri) {
          setProfileImage(response.assets[0].uri);
        }
      });
    } catch (err) {
      Alert.alert("Error", "Something went wrong while opening gallery.");
    }
  };

  const handleImageFromCamera = async () => {
    try {
      if (Platform.OS === "ios") {
        const granted = await checkAndRequestPermission(
          PERMISSIONS.IOS.CAMERA,
          "Camera"
        );
        if (!granted) return;
      }
      if (Platform.OS === "android") {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.CAMERA
        );
        if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
          Alert.alert(
            "Permission Required",
            "Camera permission is required. Please enable it from settings.",
            [
              { text: "Cancel", style: "cancel" },
              { text: "Open Settings", onPress: () => openSettings() },
            ]
          );
          return;
        }
      }
      launchCamera(
        { mediaType: "photo", quality: 0.8, cameraType: "front" },
        (response) => {
          if (response?.assets && response?.assets[0]?.uri) {
            setProfileImage(response.assets[0].uri);
          }
        }
      );
    } catch (err) {
      Alert.alert("Error", "Something went wrong while opening camera.");
    }
  };

  const handleAvatarPress = () => {
    Alert.alert(
      "Choose Image Source",
      "Select where you want to get your profile picture",
      [
        { text: "Camera", onPress: handleImageFromCamera },
        { text: "Gallery", onPress: handleImageFromGallery },
        { text: "Cancel", style: "cancel" },
      ]
    );
  };

  const handleSave = () => {
    // if (!name.trim()) {
    //   ShowAlertMessage("Please enter display name", popTypes.error);
    //   return;
    // }
    // if (selected.length === 0) {
    //   ShowAlertMessage("Please select at least one interest.", popTypes.error);
    //   return;
    // }
    // if (selected.length === 0) {
    //   ShowAlertMessage("Please select at least one interest.", popTypes.error);
    //   return;
    // }


    const validate = validateEditProfile(
      {
        displayName: name.trim(),
        interests: selected,
        // profilePicture: profileImage,
        age: age,
        location: location,
        language: language,
      }
    )
    if(validate.error){
      ShowAlertMessage(validate.error, popTypes.error);
      return;
    }    

    const formData = new FormData();
    formData.append("displayName", name.trim());
    formData.append("interests", selected.join(","));
    formData.append("age", age);
    formData.append("location", location);
    formData.append("language", language);
    formData.append("isUpdate", "true");

    if (profileImage) {
      formData.append("profilePicture", {
        uri: profileImage,
        type: "image/png",
        name: profileImage.split("/").pop(),
      } as any);
    } else if (user?.profilePicture) {
      formData.append("profilePicture", user.profilePicture);
    }

    managerApiCall(
      completeProfile,
      formData,
      
      (res: any) => {
        const updatedUser = res?.data?.user;
        dispatch(setGlobalUser(updatedUser));
        onSave(updatedUser);
      },
      () => {
        ShowAlertMessage("Failed to update profile.", popTypes.error);
      }
    );
  };

  const avatarUri = profileImage
    ? profileImage
    : user?.profilePicture
    ? `${BASE_URL}${user.profilePicture}`
    : null;

  return (
    <View style={styles.root}>
      {/* ── Top bar ── */}
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.topBtn} onPress={onCancel}>
          <Text style={styles.topBtnText}>Cancel</Text>
        </TouchableOpacity>
        <Text style={styles.topTitle}>Edit Profile</Text>
        <TouchableOpacity style={styles.topBtn} onPress={handleSave}>
          <Text style={[styles.topBtnText, styles.topBtnSave]}>Save</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* ── Avatar ── */}
        <View style={styles.avatarWrap}>
          <TouchableOpacity onPress={handleAvatarPress}>
            <View style={styles.avatarPlaceholder}>
              {avatarUri ? (
                <Image source={{ uri: avatarUri }} style={styles.avatarImage} />
              ) : (
                <User color={colors.surfaceAlt} size={40} />
              )}
              <View style={styles.avatarAdd}>
                <Text style={styles.plus}>+</Text>
              </View>
            </View>
          </TouchableOpacity>
        </View>

        {/* ── Display name ── */}
        <Input
          label={PROFILE_SETUP_TEXT.displayNameLabel}
          placeholder="Enter display name"
          value={name}
          maxLength={12}
          onChangeText={(txt) => setName(txt.trimStart())}
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







        {/* ── Interests ── */}
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

        <Button onClick={handleSave}>Save Changes</Button>
        <View style={styles.bottomSpacer} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 54,
    paddingBottom: 14,
    borderBottomWidth: 0.5,
    borderBottomColor: colors.borderSlate,
  },
  topBtn: { minWidth: 60, alignItems: "center" },
  topBtnText: { fontSize: 15, color: colors.textMuted, fontWeight: "400" },
  topBtnSave: { color: colors.primary, fontWeight: "600" },
  topTitle: { fontSize: 17, fontWeight: "600", color: colors.white },
  scrollContent: { padding: 32, flexGrow: 1 },
  avatarWrap: { alignItems: "center", marginVertical: 32 },
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
  avatarImage: { width: 112, height: 112, borderRadius: 56 },
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
  plus: { color: colors.white, fontWeight: "bold" },
  section: { marginBottom: 40 },
  label: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 16,
  },
  tagGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  tag: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.surfaceAlt,
  },
  tagSelected: { backgroundColor: colors.primary, borderColor: colors.primary },
  tagText: { color: colors.textMuted, fontSize: 14, fontWeight: "600" },
  tagTextSelected: { color: colors.white },
  bottomSpacer: { height: 40 },
});