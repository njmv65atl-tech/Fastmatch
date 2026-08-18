import * as React from "react";
import { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from "react-native";
import { MobileContainer, Button, Header } from "../../components/UIComponents";
import { AppView, UserRole, User, Gender } from "../../types";
import { Sliders, Crown, MapPin, Users, Globe } from "lucide-react-native";
import { colors } from "../../utils/colors";
import { MATCH_FILTERS_TEXT } from "../../utils/commonText";
import { fontFamily } from "../../assets/fonts/fontFamily";
import { useBackHandler } from "../../components/BackHandlerWrapper";
import NetInfo from "@react-native-community/netinfo";

import { findMatch } from "../../socket/fastMatchSocket";
import { popTypes, ShowAlertMessage } from "../../helpers/commonFunctions";


interface CoreProps {
  user: User;
  setView: (view: AppView, params?: any) => void;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
}

export const MatchFiltersView: React.FC<CoreProps> = ({ user, setView }) => {
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

  const renderOption = (
    label: string, 
    value: any, 
    currentValue: any, 
    setValue: (val: any) => void, 
    isFree: boolean,
    featureName: string
  ) => {
    const isActive = currentValue === value;
    return (
      <TouchableOpacity
        key={value}
        onPress={() => {
          if (checkPremium(isFree, featureName)) {
            setValue(value);
          }
        }}
        style={[styles.optionBtn, isActive && styles.optionBtnActive]}
      >
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <Text style={[styles.optionText, isActive && styles.optionTextActive]}>
            {label}
          </Text>
          {!isFree && user?.isPremium !== 'premium' && (
            <View style={styles.lockBadge}>
              <Crown size={10} color={colors.goldStrong} />
              <Text style={styles.lockBadgeText}>PRO</Text>
            </View>
          )}
        </View>
        <View style={styles.optionRight}>
          <View style={[styles.radio, isActive && styles.radioActive]}>
            {isActive && <View style={styles.radioDot} />}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={{ flex: 1 }}>
      <MobileContainer>
        <Header
          title={MATCH_FILTERS_TEXT.pageTitle}
          onBack={() => setView(AppView.HOME)}
        />
        <ScrollView style={styles.filterContent} contentContainerStyle={{ paddingBottom: 100 }}>
          
          {/* GENDER SECTION */}
          <View style={styles.filterSection}>
            <View style={styles.filterHeader}>
              <Users size={16} color={colors.textMuted} />
              <Text style={styles.filterLabel}>GENDER</Text>
            </View>
            <View style={styles.optionsGrid}>
              {renderOption(MATCH_FILTERS_TEXT.everyone, Gender.ANY, selectedGender, setSelectedGender, true, "Gender")}
              {renderOption(MATCH_FILTERS_TEXT.male, Gender.MALE, selectedGender, setSelectedGender, false, "Gender")}
              {renderOption(MATCH_FILTERS_TEXT.female, Gender.FEMALE, selectedGender, setSelectedGender, false, "Gender")}
            </View>
          </View>

          {/* AGE SECTION */}
          <View style={styles.filterSection}>
            <View style={styles.filterHeader}>
              <Sliders size={16} color={colors.textMuted} />
              <Text style={styles.filterLabel}>AGE RANGE</Text>
            </View>
            <View style={styles.optionsGrid}>
              {renderOption("Any Age", 'any', selectedAge, setSelectedAge, true, "Age Range")}
              {renderOption("18 - 24", '18-24', selectedAge, setSelectedAge, false, "Age Range")}
              {renderOption("25 - 34", '25-34', selectedAge, setSelectedAge, false, "Age Range")}
              {renderOption("35+", '35+', selectedAge, setSelectedAge, false, "Age Range")}
            </View>
          </View>

          {/* LOCATION SECTION */}
          <View style={styles.filterSection}>
            <View style={styles.filterHeader}>
              <MapPin size={16} color={colors.textMuted} />
              <Text style={styles.filterLabel}>LOCATION</Text>
            </View>
            <View style={styles.optionsGrid}>
              {renderOption("Anywhere", 'any', selectedLocation, setSelectedLocation, true, "Location")}
              {renderOption("My Country", 'my_country', selectedLocation, setSelectedLocation, false, "Location")}
            </View>
          </View>

          {/* LANGUAGE SECTION */}
          <View style={styles.filterSection}>
            <View style={styles.filterHeader}>
              <Globe size={16} color={colors.textMuted} />
              <Text style={styles.filterLabel}>LANGUAGE</Text>
            </View>
            <View style={styles.optionsGrid}>
              {renderOption("Any Language", 'any', selectedLanguage, setSelectedLanguage, true, "Language")}
              {renderOption("My Language", 'my_language', selectedLanguage, setSelectedLanguage, true, "Language")}
            </View>
          </View>

          <Button
            variant="primary"
            onClick={async () => {
              const state = await NetInfo.fetch();
              if (state.isConnected) {
                let preference: 'everyone' | 'male' | 'female' = 'everyone';
                if (selectedGender === Gender.MALE) preference = 'male';
                else if (selectedGender === Gender.FEMALE) preference = 'female';

                console.log("🚀 [MatchFilters] Selected preferences:", { preference, selectedLocation, selectedLanguage, selectedAge });
                
                findMatch({
                    preference,
                    locationMode: selectedLocation,
                    languageMode: selectedLanguage,
                    ageRange: selectedAge
                });
                setView(AppView.MATCH_FOUND, { preference });
              } else {
                ShowAlertMessage("Please check your internet connection", popTypes.error);
              }
            }}
            style={styles.findBtn}
          >
            {MATCH_FILTERS_TEXT.findMatch}
          </Button>

        </ScrollView>
      </MobileContainer>
    </View>
  );
};

const styles = StyleSheet.create({
  filterContent: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 10,
  },
  filterSection: {
    marginBottom: 24,
  },
  filterHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  filterLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.textPlaceholder,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  optionsGrid: {
    gap: 8,
  },
  optionBtn: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.surfaceAlt,
  },
  optionBtnActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primarySofter,
  },
  optionText: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.textMuted,
  },
  optionTextActive: {
    color: colors.white,
  },
  optionRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  lockBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.goldSoft,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    gap: 4,
  },
  lockBadgeText: {
    fontSize: 9,
    fontWeight: "bold",
    color: colors.goldStrong,
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.borderSlate,
    justifyContent: "center",
    alignItems: "center",
  },
  radioActive: {
    borderColor: colors.primary,
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.primary,
  },
  findBtn: {
    marginTop: 10,
    marginBottom: 20,
  },
});
