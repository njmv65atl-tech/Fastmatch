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
import { MobileContainer } from "../../components/UIComponents";
import { AppView, User, Gender } from "../../types";
import { Crown, MapPin, Users, Globe, SlidersHorizontal, ArrowLeft, Video } from "lucide-react-native";
import LinearGradient from "react-native-linear-gradient";
import { colors } from "../../utils/colors";
import { useBackHandler } from "../../components/BackHandlerWrapper";
import NetInfo from "@react-native-community/netinfo";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { popTypes, ShowAlertMessage } from "../../helpers/commonFunctions";

interface CoreProps {
  user: User;
  setView: (view: AppView, params?: any) => void;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
}

export const MatchFiltersView: React.FC<CoreProps> = ({ user, setView }) => {
  const insets = useSafeAreaInsets();
  const [selectedGender, setSelectedGender] = useState<Gender>(Gender.ANY);
  const [selectedLocation, setSelectedLocation] = useState<'any' | 'my_country'>('any');
  const [selectedLanguage, setSelectedLanguage] = useState<'any' | 'my_language'>('any');
  const [selectedAge, setSelectedAge] = useState<'any' | '18-24' | '25-34' | '35+'>('any');

  const handleBack = React.useCallback(() => {
    setView(AppView.HOME);
  }, [setView]);

  useBackHandler(handleBack);

  const checkPremium = (isFreeFeature: boolean, featureName: string) => {
    if (!isFreeFeature && user?.isPremium !== 'premium') {
      ShowAlertMessage(`Premium required for ${featureName} preference`, popTypes.info);
      setView(AppView.SUBSCRIPTION);
      return false;
    }
    return true;
  };

  const handleStartMatching = async () => {
    try {
      const state = await NetInfo.fetch();
      if (state && state.isConnected === false) {
        ShowAlertMessage("Please check your internet connection", popTypes.error);
        return;
      }
    } catch (e) {
      console.warn("NetInfo fetch error:", e);
    }

    let preference: 'everyone' | 'male' | 'female' = 'everyone';
    if (selectedGender === Gender.MALE) preference = 'male';
    else if (selectedGender === Gender.FEMALE) preference = 'female';

    setView(AppView.MATCH_FOUND, {
      preference,
      locationMode: selectedLocation,
      languageMode: selectedLanguage,
      ageRange: selectedAge,
    });
  };

  // ─── Option Card Component ──────────────────────────────────
  const OptionCard = ({
    label,
    value,
    currentValue,
    setValue,
    isFree,
    featureName,
  }: {
    label: string;
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
        style={[styles.optionCard, isActive && styles.optionCardActive]}
        activeOpacity={0.75}
      >
        <View style={styles.optionLeft}>
          <Text style={[styles.optionLabel, isActive && styles.optionLabelActive]}>
            {label}
          </Text>
          {!isFree && user?.isPremium !== 'premium' && (
            <LinearGradient colors={["#F59E0B", "#D97706"]} style={styles.proBadge}>
              <Crown size={9} color="#FFF" />
              <Text style={styles.proBadgeText}>PRO</Text>
            </LinearGradient>
          )}
        </View>

        <View style={[styles.radioCircle, isActive && styles.radioCircleActive]}>
          {isActive && <View style={styles.radioDot} />}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <MobileContainer edges={["top"]}>
      <View style={styles.mainContainer}>
        {/* ── Header ── */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBack} style={styles.backBtn} activeOpacity={0.8}>
            <ArrowLeft color={colors.textPrimary} size={22} />
          </TouchableOpacity>
          <View style={styles.headerTitleGroup}>
            <Text style={styles.headerTitle}>Match Preferences</Text>
            <Text style={styles.headerSubtitle}>Customize who you connect with</Text>
          </View>
        </View>

        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
        {/* ── Section: Gender ── */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <View style={[styles.sectionIconWrap, { backgroundColor: "rgba(99, 102, 241, 0.15)" }]}>
              <Users size={16} color="#6366F1" />
            </View>
            <Text style={styles.sectionTitle}>GENDER PREFERENCE</Text>
          </View>
          <View style={styles.optionsList}>
            <OptionCard
              label="Everyone"
              value={Gender.ANY}
              currentValue={selectedGender}
              setValue={setSelectedGender}
              isFree={true}
              featureName="Gender"
            />
            <OptionCard
              label="Male Only"
              value={Gender.MALE}
              currentValue={selectedGender}
              setValue={setSelectedGender}
              isFree={false}
              featureName="Gender"
            />
            <OptionCard
              label="Female Only"
              value={Gender.FEMALE}
              currentValue={selectedGender}
              setValue={setSelectedGender}
              isFree={false}
              featureName="Gender"
            />
          </View>
        </View>

        {/* ── Section: Age Range ── */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <View style={[styles.sectionIconWrap, { backgroundColor: "rgba(245, 158, 11, 0.15)" }]}>
              <SlidersHorizontal size={16} color="#F59E0B" />
            </View>
            <Text style={styles.sectionTitle}>AGE RANGE</Text>
          </View>
          <View style={styles.optionsList}>
            <OptionCard
              label="Any Age"
              value="any"
              currentValue={selectedAge}
              setValue={setSelectedAge}
              isFree={true}
              featureName="Age Range"
            />
            <OptionCard
              label="18 – 24 years"
              value="18-24"
              currentValue={selectedAge}
              setValue={setSelectedAge}
              isFree={false}
              featureName="Age Range"
            />
            <OptionCard
              label="25 – 34 years"
              value="25-34"
              currentValue={selectedAge}
              setValue={setSelectedAge}
              isFree={false}
              featureName="Age Range"
            />
            <OptionCard
              label="35+ years"
              value="35+"
              currentValue={selectedAge}
              setValue={setSelectedAge}
              isFree={false}
              featureName="Age Range"
            />
          </View>
        </View>

        {/* ── Section: Location ── */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <View style={[styles.sectionIconWrap, { backgroundColor: "rgba(16, 185, 129, 0.15)" }]}>
              <MapPin size={16} color="#10B981" />
            </View>
            <Text style={styles.sectionTitle}>LOCATION</Text>
          </View>
          <View style={styles.optionsList}>
            <OptionCard
              label="Global (Anywhere)"
              value="any"
              currentValue={selectedLocation}
              setValue={setSelectedLocation}
              isFree={true}
              featureName="Location"
            />
            <OptionCard
              label="My Country Only"
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
            <View style={[styles.sectionIconWrap, { backgroundColor: "rgba(59, 130, 246, 0.15)" }]}>
              <Globe size={16} color="#3B82F6" />
            </View>
            <Text style={styles.sectionTitle}>LANGUAGE</Text>
          </View>
          <View style={styles.optionsList}>
            <OptionCard
              label="Any Language"
              value="any"
              currentValue={selectedLanguage}
              setValue={setSelectedLanguage}
              isFree={true}
              featureName="Language"
            />
            <OptionCard
              label="My Language"
              value="my_language"
              currentValue={selectedLanguage}
              setValue={setSelectedLanguage}
              isFree={true}
              featureName="Language"
            />
          </View>
        </View>
      </ScrollView>

      {/* ── Fixed Bottom Button (Always Fully Visible on iOS & Android) ── */}
      <View
        style={[
          styles.fixedBottomBar,
          {
            paddingBottom: Math.max(insets.bottom, Platform.OS === "ios" ? 34 : 16) + 12,
          },
        ]}
      >
        <TouchableOpacity
          style={styles.startMatchBtn}
          onPress={handleStartMatching}
          activeOpacity={0.85}
        >
          <LinearGradient
            colors={["#6366F1", "#4F46E5"]}
            style={styles.startMatchGradient}
          >
            <Video size={20} color="#FFF" />
            <Text style={styles.startMatchBtnText}>Find Match Now</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
      </View>
    </MobileContainer>
  );
};

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
    paddingVertical: 14,
    gap: 12,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: colors.surfaceAlt,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitleGroup: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: colors.textPrimary,
  },
  headerSubtitle: {
    fontSize: 12,
    color: colors.textPlaceholder,
    marginTop: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 24,
    gap: 14,
  },
  sectionCard: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  sectionIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: "800",
    color: colors.textPlaceholder,
    letterSpacing: 1,
  },
  optionsList: {
    gap: 8,
  },
  optionCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: colors.surfaceAlt,
    borderRadius: 14,
    paddingVertical: 13,
    paddingHorizontal: 14,
    borderWidth: 1.5,
    borderColor: "transparent",
  },
  optionCardActive: {
    backgroundColor: "rgba(99, 102, 241, 0.12)",
    borderColor: "#6366F1",
  },
  optionLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  optionLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.textMuted,
  },
  optionLabelActive: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
  proBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    gap: 3,
  },
  proBadgeText: {
    color: "#FFFFFF",
    fontSize: 9,
    fontWeight: "800",
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.borderSlate,
    justifyContent: "center",
    alignItems: "center",
  },
  radioCircleActive: {
    borderColor: "#6366F1",
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#6366F1",
  },
  fixedBottomBar: {
    paddingHorizontal: 16,
    paddingTop: 14,
    backgroundColor: colors.background,
    borderTopWidth: 1,
    borderTopColor: colors.borderSubtle,
  },
  startMatchBtn: {
    borderRadius: 18,
    overflow: "hidden",
    elevation: 10,
    shadowColor: "#6366F1",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
  },
  startMatchGradient: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 16,
    gap: 8,
  },
  startMatchBtnText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
    letterSpacing: 0.3,
  },
});
