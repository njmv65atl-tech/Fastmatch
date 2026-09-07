import * as React from "react";
import { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Platform,
} from "react-native";
import Svg, { Circle, Path, Rect, Ellipse, G } from "react-native-svg";
import { MobileContainer } from "../../components/UIComponents";
import { AppView, User, Gender } from "../../types";
import {
  Crown,
  MapPin,
  Users,
  Globe,
  SlidersHorizontal,
  ArrowLeft,
  ArrowRight,
  Check,
} from "lucide-react-native";
import LinearGradient from "react-native-linear-gradient";
import { colors } from "../../utils/colors";
import { useBackHandler } from "../../components/BackHandlerWrapper";
import NetInfo from "@react-native-community/netinfo";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { popTypes, ShowAlertMessage } from "../../helpers/commonFunctions";

// ─── Modern Youthful SVG Avatar Illustrations ────────────────
const MaleAvatar = ({ size = 54 }: { size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 60 60">
    {/* Circular Background */}
    <Circle cx="30" cy="30" r="28" fill="#1C2033" />

    {/* Shoulders / T-shirt */}
    <Path
      d="M10 58 C10 44 20 40 30 40 C40 40 50 44 50 58 Z"
      fill="#3B82F6"
    />
    {/* Crew neck collar */}
    <Path
      d="M24 40 C25 43.5 35 43.5 36 40"
      stroke="#2563EB"
      strokeWidth="1.5"
      fill="#FCD5B5"
    />

    {/* Neck */}
    <Rect x="26.5" y="32" width="7" height="8" rx="2" fill="#FCD5B5" />
    {/* Neck shadow */}
    <Path d="M26.5 34 C28 36 32 36 33.5 34 L33.5 32 L26.5 32 Z" fill="#EAB896" />

    {/* Ears */}
    <Circle cx="17.5" cy="27" r="3" fill="#FCD5B5" />
    <Circle cx="17.5" cy="27" r="1.5" fill="#EAB896" />
    <Circle cx="42.5" cy="27" r="3" fill="#FCD5B5" />
    <Circle cx="42.5" cy="27" r="1.5" fill="#EAB896" />

    {/* Head / Face */}
    <Path
      d="M18 24 C18 16 22 13 30 13 C38 13 42 16 42 24 C42 32 37 36 30 36 C23 36 18 32 18 24 Z"
      fill="#FCD5B5"
    />

    {/* Cheeks Blush */}
    <Ellipse cx="22" cy="29" rx="2.5" ry="1.2" fill="#FB7185" opacity="0.3" />
    <Ellipse cx="38" cy="29" rx="2.5" ry="1.2" fill="#FB7185" opacity="0.3" />

    {/* Eyes */}
    <Circle cx="24.5" cy="24.5" r="2" fill="#1E293B" />
    <Circle cx="24" cy="24" r="0.7" fill="#FFFFFF" />
    <Circle cx="35.5" cy="24.5" r="2" fill="#1E293B" />
    <Circle cx="35" cy="24" r="0.7" fill="#FFFFFF" />

    {/* Eyebrows */}
    <Path
      d="M22 20.5 Q24.5 19 27 20.5"
      stroke="#1E293B"
      strokeWidth="1.2"
      strokeLinecap="round"
    />
    <Path
      d="M33 20.5 Q35.5 19 38 20.5"
      stroke="#1E293B"
      strokeWidth="1.2"
      strokeLinecap="round"
    />

    {/* Nose */}
    <Path
      d="M29.5 26.5 Q30 27.5 30.5 26.5"
      stroke="#DDA078"
      strokeWidth="1"
      strokeLinecap="round"
    />

    {/* Smile */}
    <Path
      d="M26.5 29.5 Q30 33 33.5 29.5"
      stroke="#E11D48"
      strokeWidth="1.4"
      strokeLinecap="round"
      fill="none"
    />

    {/* Stylish Modern Textured Hair */}
    <Path
      d="M17 21 C16 14 20 8 30 8 C40 8 44 14 43 21 C41 18 41 15 39 14 C35 12 25 11 20 15 C18 17 17 19 17 21 Z"
      fill="#1E2029"
    />
    <Path
      d="M17 17 C20 10 28 8 34 9 C39 10 43 13 44 18 C41 16 38 15 34 16 C28 17 23 18 19 22 C17 19 17 18 17 17 Z"
      fill="#2B3042"
    />
    <Path
      d="M23 11 C28 9 34 9 38 11 C35 12 30 13 25 14 Z"
      fill="#3D4560"
    />
    <Path d="M18 20 L17.5 24 L19 23 Z" fill="#1E2029" />
    <Path d="M42 20 L42.5 24 L41 23 Z" fill="#1E2029" />
  </Svg>
);

const FemaleAvatar = ({ size = 54 }: { size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 60 60">
    {/* Circular Background */}
    <Circle cx="30" cy="30" r="28" fill="#281C33" />

    {/* Blonde Hair Behind Shoulders */}
    <Path
      d="M13 28 C11 36 11 48 15 52 C17 52 19 48 19 44 C19 38 17 32 17 28 Z"
      fill="#D97706"
    />
    <Path
      d="M47 28 C49 36 49 48 45 52 C43 52 41 48 41 44 C41 38 43 32 43 28 Z"
      fill="#D97706"
    />
    <Path
      d="M14 28 C12 36 13 46 16 50 C17.5 50 19 46 19.5 42"
      stroke="#FBBF24"
      strokeWidth="2.5"
      fill="none"
      strokeLinecap="round"
    />
    <Path
      d="M46 28 C48 36 47 46 44 50 C42.5 50 41 46 40.5 42"
      stroke="#FBBF24"
      strokeWidth="2.5"
      fill="none"
      strokeLinecap="round"
    />

    {/* Shoulders / Pink Top */}
    <Path
      d="M11 58 C11 44 20 40 30 40 C40 40 49 44 49 58 Z"
      fill="#EC4899"
    />
    {/* Feminine Neckline */}
    <Path
      d="M24 40 C25 44 35 44 36 40"
      stroke="#DB2777"
      strokeWidth="1.5"
      fill="#FDE2CD"
    />

    {/* Neck */}
    <Rect x="27" y="32" width="6" height="8" rx="2" fill="#FDE2CD" />
    <Path d="M27 34 C28.5 35.5 31.5 35.5 33 34 L33 32 L27 32 Z" fill="#F4BFA0" />

    {/* Earrings */}
    <Circle cx="17" cy="28" r="1.2" fill="#FDE047" />
    <Circle cx="43" cy="28" r="1.2" fill="#FDE047" />

    {/* Head / Face */}
    <Path
      d="M18.5 24 C18.5 16 22 13 30 13 C38 13 41.5 16 41.5 24 C41.5 32 36.5 36 30 36 C23.5 36 18.5 32 18.5 24 Z"
      fill="#FDE2CD"
    />

    {/* Rosy Cheeks */}
    <Ellipse cx="22" cy="29" rx="3" ry="1.4" fill="#FB7185" opacity="0.38" />
    <Ellipse cx="38" cy="29" rx="3" ry="1.4" fill="#FB7185" opacity="0.38" />

    {/* Feminine Eyes with Lashes */}
    <Circle cx="24.5" cy="24.5" r="2.1" fill="#1E293B" />
    <Circle cx="23.8" cy="23.8" r="0.8" fill="#FFFFFF" />
    <Circle cx="25.2" cy="25.2" r="0.35" fill="#FFFFFF" />
    <Path d="M22.5 23 L21 21.8" stroke="#1E293B" strokeWidth="0.9" strokeLinecap="round" />
    <Path d="M26.5 23 L27.8 21.8" stroke="#1E293B" strokeWidth="0.9" strokeLinecap="round" />

    <Circle cx="35.5" cy="24.5" r="2.1" fill="#1E293B" />
    <Circle cx="34.8" cy="23.8" r="0.8" fill="#FFFFFF" />
    <Circle cx="36.2" cy="25.2" r="0.35" fill="#FFFFFF" />
    <Path d="M33.5 23 L32.2 21.8" stroke="#1E293B" strokeWidth="0.9" strokeLinecap="round" />
    <Path d="M37.5 23 L39 21.8" stroke="#1E293B" strokeWidth="0.9" strokeLinecap="round" />

    {/* Eyebrows */}
    <Path
      d="M22 20 Q24.5 18.5 27 19.8"
      stroke="#B45309"
      strokeWidth="1"
      strokeLinecap="round"
    />
    <Path
      d="M33 19.8 Q35.5 18.5 38 20"
      stroke="#B45309"
      strokeWidth="1"
      strokeLinecap="round"
    />

    {/* Nose */}
    <Path
      d="M29.5 26.5 Q30 27.2 30.5 26.5"
      stroke="#EAA482"
      strokeWidth="0.9"
      strokeLinecap="round"
    />

    {/* Smiling Pink Lips */}
    <Path
      d="M26.5 29.8 Q30 33.5 33.5 29.8"
      stroke="#E11D48"
      strokeWidth="1.4"
      strokeLinecap="round"
      fill="#FDA4AF"
    />

    {/* Gorgeous Blonde Hair (Center-parted, framing face) */}
    <Path
      d="M17 20 C16 11 22 7 30 7 C38 7 44 11 43 20 C42 16 38 13 30 13 C22 13 18 16 17 20 Z"
      fill="#F59E0B"
    />
    <Path
      d="M17 17 C20 10 27 9 30 14 C33 9 40 10 43 17 C40 14 34 13 30 18 C26 13 20 14 17 17 Z"
      fill="#FBBF24"
    />
    <Path
      d="M17 18 C16.5 23 17 28 19 32 C18.5 27 18 22 19 18 Z"
      fill="#FCD34D"
    />
    <Path
      d="M43 18 C43.5 23 43 28 41 32 C41.5 27 42 22 41 18 Z"
      fill="#FCD34D"
    />
    <Path
      d="M23 9.5 C26 8.5 34 8.5 37 9.5 C34 10.5 26 10.5 23 9.5 Z"
      fill="#FEF08A"
    />
  </Svg>
);

const CoupleAvatar = ({ size = 54 }: { size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 64 60">
    {/* Circular Background */}
    <Circle cx="32" cy="30" r="28" fill="#1F1B35" />

    {/* Young Boy (Left) */}
    <G transform="translate(-5, 2)">
      {/* Boy Body */}
      <Path d="M12 56 C12 45 18 42 25 42 C32 42 36 45 36 56 Z" fill="#3B82F6" />
      {/* Boy Head */}
      <Path
        d="M16 26 C16 19 19 16 25 16 C31 16 34 19 34 26 C34 32 30 35 25 35 C20 35 16 32 16 26 Z"
        fill="#FCD5B5"
      />
      {/* Hair */}
      <Path
        d="M15 23 C14 17 18 12 25 12 C32 12 35 17 34 23 C33 20 31 18 25 18 C19 18 17 20 15 23 Z"
        fill="#1E2029"
      />
      <Path
        d="M15 20 C18 14 24 13 28 14 C32 15 34 18 35 21 C33 19 30 19 27 19 C22 19 18 20 15 20 Z"
        fill="#2B3042"
      />
      {/* Boy Eye & Smile */}
      <Circle cx="22" cy="26" r="1.5" fill="#1E293B" />
      <Circle cx="21.6" cy="25.6" r="0.5" fill="#FFFFFF" />
      <Circle cx="29" cy="26" r="1.5" fill="#1E293B" />
      <Circle cx="28.6" cy="25.6" r="0.5" fill="#FFFFFF" />
      <Path
        d="M23 30 Q25.5 32.5 28 30"
        stroke="#E11D48"
        strokeWidth="1.1"
        fill="none"
        strokeLinecap="round"
      />
    </G>

    {/* Young Blonde Girl (Right) */}
    <G transform="translate(6, 2)">
      {/* Hair behind */}
      <Path d="M37 28 C39 36 38 46 35 50" stroke="#FBBF24" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      {/* Girl Body */}
      <Path d="M22 56 C22 45 26 42 33 42 C40 42 46 45 46 56 Z" fill="#EC4899" />
      {/* Girl Head */}
      <Path
        d="M25 26 C25 19 28 16 34 16 C40 16 43 19 43 26 C43 32 39 35 34 35 C29 35 25 32 25 26 Z"
        fill="#FDE2CD"
      />
      {/* Blonde Hair */}
      <Path
        d="M24 23 C23 17 27 12 34 12 C41 12 44 17 43 23 C42 20 40 17 34 17 C28 17 26 20 24 23 Z"
        fill="#F59E0B"
      />
      <Path
        d="M24 20 C26 14 32 13 35 17 C37 13 42 14 44 20 C42 17 38 16 35 20 C32 16 26 17 24 20 Z"
        fill="#FBBF24"
      />
      {/* Girl Eye & Smile */}
      <Circle cx="30" cy="26" r="1.6" fill="#1E293B" />
      <Circle cx="29.6" cy="25.5" r="0.6" fill="#FFFFFF" />
      <Circle cx="37" cy="26" r="1.6" fill="#1E293B" />
      <Circle cx="36.6" cy="25.5" r="0.6" fill="#FFFFFF" />
      <Path
        d="M31 30 Q33.5 32.5 36 30"
        stroke="#E11D48"
        strokeWidth="1.1"
        fill="none"
        strokeLinecap="round"
      />
    </G>

    {/* Cute 3D Heart between them */}
    <Path
      d="M32 10 C32 8.5 33.5 7 35 8 C36.5 7 38 8.5 38 10 C38 12.5 35 15 35 15 C35 15 32 12.5 32 10 Z"
      fill="#A855F7"
    />
  </Svg>
);

interface CoreProps {
  user: User;
  setView: (view: AppView, params?: any) => void;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
}

export const MatchFiltersView: React.FC<CoreProps> = ({ user, setView }) => {
  const insets = useSafeAreaInsets();
  const [selectedGender, setSelectedGender] = useState<Gender>(Gender.ANY);
  const [selectedLocation, setSelectedLocation] = useState<
    "any" | "my_country"
  >("any");
  const [selectedLanguage, setSelectedLanguage] = useState<
    "any" | "my_language"
  >("any");
  const [selectedAge, setSelectedAge] = useState<
    "any" | "18-24" | "25-34" | "35+"
  >("any");

  const handleBack = React.useCallback(() => {
    setView(AppView.HOME);
  }, [setView]);

  useBackHandler(handleBack);

  const checkPremium = (isFreeFeature: boolean, featureName: string) => {
    if (!isFreeFeature && user?.isPremium !== "premium") {
      ShowAlertMessage(
        `Premium required for ${featureName} preference`,
        popTypes.info
      );
      setView(AppView.SUBSCRIPTION);
      return false;
    }
    return true;
  };

  const handleStartMatching = async () => {
    try {
      const state = await NetInfo.fetch();
      if (state && state.isConnected === false) {
        ShowAlertMessage(
          "Please check your internet connection",
          popTypes.error
        );
        return;
      }
    } catch (e) {
      console.warn("NetInfo fetch error:", e);
    }

    let preference: "everyone" | "male" | "female" = "everyone";
    if (selectedGender === Gender.MALE) preference = "male";
    else if (selectedGender === Gender.FEMALE) preference = "female";

    setView(AppView.MATCH_FOUND, {
      preference,
      locationMode: selectedLocation,
      languageMode: selectedLanguage,
      ageRange: selectedAge,
    });
  };

  // ─── Gender Card (Flex: 1 to guarantee 100% fit inside section) ─────
  const GenderCard = ({
    label,
    subtitle,
    value,
    avatar,
    isFree,
  }: {
    label: string;
    subtitle: string;
    value: Gender;
    avatar: React.ReactNode;
    isFree: boolean;
  }) => {
    const isActive = selectedGender === value;

    return (
      <TouchableOpacity
        onPress={() => {
          if (checkPremium(isFree, "Gender")) {
            setSelectedGender(value);
          }
        }}
        style={[styles.genderCard, isActive && styles.genderCardActive]}
        activeOpacity={0.75}
      >
        {/* Radio Indicator (Top Right - Matches Reference Screen) */}
        <View
          style={[
            styles.genderRadioCircle,
            isActive && styles.genderRadioCircleActive,
          ]}
        >
          {isActive && <Check size={11} color="#FFF" strokeWidth={3} />}
        </View>

        {/* Avatar circle */}
        <View
          style={[
            styles.genderAvatarCircle,
            isActive && styles.genderAvatarCircleActive,
          ]}
        >
          {avatar}
        </View>

        {/* Label */}
        <Text
          style={[styles.genderLabel, isActive && styles.genderLabelActive]}
          numberOfLines={1}
        >
          {label}
        </Text>
        <Text style={styles.genderSubLabel}>{subtitle}</Text>

        {/* Pro badge */}
        {!isFree && user?.isPremium !== "premium" && (
          <LinearGradient
            colors={["#F59E0B", "#D97706"]}
            style={styles.proBadgeSmall}
          >
            <Crown size={8} color="#FFF" />
            <Text style={styles.proBadgeTextSmall}>PRO</Text>
          </LinearGradient>
        )}
      </TouchableOpacity>
    );
  };

  // ─── Age Card (2x2 Grid) ────────────────────────────
  const AgeCard = ({
    label,
    subtitle,
    value,
    isFree,
  }: {
    label: string;
    subtitle: string;
    value: "any" | "18-24" | "25-34" | "35+";
    isFree: boolean;
  }) => {
    const isActive = selectedAge === value;

    return (
      <TouchableOpacity
        onPress={() => {
          if (checkPremium(isFree, "Age Range")) {
            setSelectedAge(value);
          }
        }}
        style={[styles.ageCard, isActive && styles.ageCardActive]}
        activeOpacity={0.75}
      >
        <View style={styles.ageCardContent}>
          <View style={{ flex: 1 }}>
            <Text
              style={[styles.ageLabel, isActive && styles.ageLabelActive]}
              numberOfLines={1}
            >
              {label}
            </Text>
            <Text style={styles.ageSubLabel} numberOfLines={1}>
              {subtitle}
            </Text>
          </View>
          <View
            style={[
              styles.checkCircle,
              isActive && styles.checkCircleActive,
            ]}
          >
            {isActive && <Check size={12} color="#FFF" strokeWidth={3} />}
          </View>
        </View>
        {!isFree && user?.isPremium !== "premium" && (
          <LinearGradient
            colors={["#F59E0B", "#D97706"]}
            style={styles.proBadgeInline}
          >
            <Crown size={8} color="#FFF" />
            <Text style={styles.proBadgeTextSmall}>PRO</Text>
          </LinearGradient>
        )}
      </TouchableOpacity>
    );
  };

  // ─── Simple Option Card (Location / Language) ─────────
  const SimpleOptionCard = ({
    label,
    subtitle,
    value,
    currentValue,
    setValue,
    isFree,
    featureName,
  }: {
    label: string;
    subtitle?: string;
    value: any;
    currentValue: any;
    setValue: (val: any) => void;
    isFree: boolean;
    featureName: string;
  }) => {
    const isActive = currentValue === value;
    return (
      <TouchableOpacity
        onPress={() => {
          if (checkPremium(isFree, featureName)) {
            setValue(value);
          }
        }}
        style={[styles.simpleCard, isActive && styles.simpleCardActive]}
        activeOpacity={0.75}
      >
        <View style={{ flex: 1 }}>
          <Text
            style={[
              styles.simpleLabel,
              isActive && styles.simpleLabelActive,
            ]}
          >
            {label}
          </Text>
          {subtitle && (
            <Text style={styles.simpleSubLabel}>{subtitle}</Text>
          )}
        </View>
        <View
          style={[styles.checkCircle, isActive && styles.checkCircleActive]}
        >
          {isActive && <Check size={12} color="#FFF" strokeWidth={3} />}
        </View>
        {!isFree && user?.isPremium !== "premium" && (
          <LinearGradient
            colors={["#F59E0B", "#D97706"]}
            style={[styles.proBadgeInline, { marginLeft: 8 }]}
          >
            <Crown size={8} color="#FFF" />
            <Text style={styles.proBadgeTextSmall}>PRO</Text>
          </LinearGradient>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <MobileContainer edges={["top"]}>
      <View style={styles.mainContainer}>
        {/* ── Header ── */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={handleBack}
            style={styles.backBtn}
            activeOpacity={0.8}
          >
            <ArrowLeft color={colors.textPrimary} size={22} />
          </TouchableOpacity>
          <View style={styles.headerTitleGroup}>
            <Text style={styles.headerTitle}>Match Preferences</Text>
            <Text style={styles.headerSubtitle}>
              Customize who you connect with
            </Text>
          </View>
        </View>

        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* ── Section: Gender Preference ── */}
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <View
                style={[
                  styles.sectionIconWrap,
                  { backgroundColor: "rgba(99, 102, 241, 0.15)" },
                ]}
              >
                <Users size={14} color="#6366F1" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.sectionTitle}>GENDER PREFERENCE</Text>
                <Text style={styles.sectionSubtitle}>
                  Choose who you'd like to see in your matches.
                </Text>
              </View>
            </View>
            <View style={styles.genderRow}>
              <GenderCard
                label="Everyone"
                subtitle="Men & Women"
                value={Gender.ANY}
                avatar={<CoupleAvatar size={50} />}
                isFree={true}
              />
              <GenderCard
                label="Male Only"
                subtitle="Men"
                value={Gender.MALE}
                avatar={<MaleAvatar size={50} />}
                isFree={false}
              />
              <GenderCard
                label="Female Only"
                subtitle="Women"
                value={Gender.FEMALE}
                avatar={<FemaleAvatar size={50} />}
                isFree={false}
              />
            </View>
          </View>

          {/* ── Section: Age Range (2x2 Grid) ── */}
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <View
                style={[
                  styles.sectionIconWrap,
                  { backgroundColor: "rgba(245, 158, 11, 0.15)" },
                ]}
              >
                <SlidersHorizontal size={14} color="#F59E0B" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.sectionTitle}>AGE RANGE</Text>
                <Text style={styles.sectionSubtitle}>
                  Select the age range for your matches.
                </Text>
              </View>
            </View>
            <View style={styles.ageGrid}>
              <AgeCard
                label="Any Age"
                subtitle="All age ranges"
                value="any"
                isFree={true}
              />
              <AgeCard
                label="18 – 24 years"
                subtitle="Late teens to mid 20s"
                value="18-24"
                isFree={false}
              />
              <AgeCard
                label="25 – 34 years"
                subtitle="Mid 20s to early 30s"
                value="25-34"
                isFree={false}
              />
              <AgeCard
                label="35+ years"
                subtitle="35 and older"
                value="35+"
                isFree={false}
              />
            </View>
          </View>

          {/* ── Section: Location ── */}
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <View
                style={[
                  styles.sectionIconWrap,
                  { backgroundColor: "rgba(16, 185, 129, 0.15)" },
                ]}
              >
                <MapPin size={14} color="#10B981" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.sectionTitle}>LOCATION</Text>
                <Text style={styles.sectionSubtitle}>
                  Choose where you'd like to find matches.
                </Text>
              </View>
            </View>
            <View style={styles.simpleList}>
              <SimpleOptionCard
                label="Global (Anywhere)"
                subtitle="Match with people worldwide"
                value="any"
                currentValue={selectedLocation}
                setValue={setSelectedLocation}
                isFree={true}
                featureName="Location"
              />
              <SimpleOptionCard
                label="My Country Only"
                subtitle="Match within your country"
                value="my_country"
                currentValue={selectedLocation}
                setValue={setSelectedLocation}
                isFree={false}
                featureName="Location"
              />
            </View>
          </View>

          {/* ── Section: Language ── */}
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <View
                style={[
                  styles.sectionIconWrap,
                  { backgroundColor: "rgba(59, 130, 246, 0.15)" },
                ]}
              >
                <Globe size={14} color="#3B82F6" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.sectionTitle}>LANGUAGE</Text>
                <Text style={styles.sectionSubtitle}>
                  Prefer matches who speak your language.
                </Text>
              </View>
            </View>
            <View style={styles.simpleList}>
              <SimpleOptionCard
                label="Any Language"
                subtitle="No language preference"
                value="any"
                currentValue={selectedLanguage}
                setValue={setSelectedLanguage}
                isFree={true}
                featureName="Language"
              />
              <SimpleOptionCard
                label="My Language"
                subtitle="Speak the same language"
                value="my_language"
                currentValue={selectedLanguage}
                setValue={setSelectedLanguage}
                isFree={true}
                featureName="Language"
              />
            </View>
          </View>
        </ScrollView>

        {/* ── Fixed Bottom Button ── */}
        <View
          style={[
            styles.fixedBottomBar,
            {
              paddingBottom:
                Math.max(
                  insets.bottom,
                  Platform.OS === "ios" ? 34 : 16
                ) + 12,
            },
          ]}
        >
          <TouchableOpacity
            style={styles.startMatchBtn}
            onPress={handleStartMatching}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={["#7C3AED", "#6366F1"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.startMatchGradient}
            >
              <Text style={styles.startMatchBtnText}>Continue to Explore</Text>
              <ArrowRight size={18} color="#FFF" strokeWidth={2.5} />
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    </MobileContainer>
  );
};

// ═════════════════════════════════════════════════════════════
const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: colors.surfaceAlt,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitleGroup: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: colors.textPrimary,
  },
  headerSubtitle: {
    fontSize: 12,
    color: colors.textPlaceholder,
    marginTop: 2,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 20,
    gap: 12,
  },

  // ── Section Card ──
  sectionCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    marginBottom: 10,
  },
  sectionIconWrap: {
    width: 26,
    height: 26,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 1,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: "800",
    color: "#F59E0B",
    letterSpacing: 1,
  },
  sectionSubtitle: {
    fontSize: 11,
    color: colors.textPlaceholder,
    marginTop: 2,
  },

  // ── Gender Cards ──
  genderRow: {
    flexDirection: "row",
    gap: 8,
  },
  genderCard: {
    flex: 1, // Equal width 3 columns, 100% inside container
    backgroundColor: colors.surfaceAlt,
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 4,
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "transparent",
    position: "relative",
  },
  genderCardActive: {
    borderColor: "#6366F1",
    backgroundColor: "rgba(99, 102, 241, 0.1)",
    shadowColor: "#6366F1",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 6,
  },
  genderRadioCircle: {
    position: "absolute",
    top: 6,
    right: 6,
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1.5,
    borderColor: colors.borderSlate,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "transparent",
    zIndex: 10,
  },
  genderRadioCircleActive: {
    borderColor: "#6366F1",
    backgroundColor: "#6366F1",
  },
  genderAvatarCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 6,
    overflow: "hidden",
  },
  genderAvatarCircleActive: {
    backgroundColor: "rgba(99, 102, 241, 0.2)",
  },
  genderLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.textMuted,
    textAlign: "center",
  },
  genderLabelActive: {
    color: "#FFFFFF",
  },
  genderSubLabel: {
    fontSize: 9,
    color: colors.textPlaceholder,
    textAlign: "center",
    marginTop: 1,
  },
  proBadgeSmall: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 5,
    gap: 2,
    marginTop: 4,
  },
  proBadgeTextSmall: {
    color: "#FFF",
    fontSize: 8,
    fontWeight: "800",
  },

  // ── Age Grid ──
  ageGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    rowGap: 8,
  },
  ageCard: {
    width: "48.5%",
    backgroundColor: colors.surfaceAlt,
    borderRadius: 12,
    padding: 10,
    borderWidth: 1.5,
    borderColor: "transparent",
  },
  ageCardActive: {
    borderColor: "#6366F1",
    backgroundColor: "rgba(99, 102, 241, 0.1)",
  },
  ageCardContent: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
  },
  ageLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.textMuted,
  },
  ageLabelActive: {
    color: "#FFFFFF",
  },
  ageSubLabel: {
    fontSize: 10,
    color: colors.textPlaceholder,
    marginTop: 2,
  },

  // ── Check Circle ──
  checkCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1.5,
    borderColor: colors.borderSlate,
    justifyContent: "center",
    alignItems: "center",
  },
  checkCircleActive: {
    borderColor: "#6366F1",
    backgroundColor: "#6366F1",
  },

  // ── Simple Cards (Location / Language) ──
  simpleList: {
    gap: 8,
  },
  simpleCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surfaceAlt,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderWidth: 1.5,
    borderColor: "transparent",
  },
  simpleCardActive: {
    borderColor: "#6366F1",
    backgroundColor: "rgba(99, 102, 241, 0.1)",
  },
  simpleLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.textMuted,
  },
  simpleLabelActive: {
    color: "#FFFFFF",
  },
  simpleSubLabel: {
    fontSize: 10,
    color: colors.textPlaceholder,
    marginTop: 1,
  },

  // ── Pro Badge Inline ──
  proBadgeInline: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 5,
    gap: 2,
  },

  // ── Bottom Bar ──
  fixedBottomBar: {
    paddingHorizontal: 16,
    paddingTop: 12,
    backgroundColor: colors.background,
    borderTopWidth: 1,
    borderTopColor: colors.borderSubtle,
  },
  startMatchBtn: {
    borderRadius: 16,
    overflow: "hidden",
    elevation: 10,
    shadowColor: "#7C3AED",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
  },
  startMatchGradient: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 15,
    gap: 8,
  },
  startMatchBtnText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
    letterSpacing: 0.3,
  },
});
