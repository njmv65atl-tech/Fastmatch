import * as React from "react";
import { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { MobileContainer, Button, Header } from "../../components/UIComponents";
import { AppView, UserRole, User, Gender } from "../../types";
import { Sliders, Crown } from "lucide-react-native";
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

  const handleBack = React.useCallback(() => {
    setView(AppView.HOME);
  }, [setView]);

  useBackHandler(handleBack);
  return (
    <View style={{ flex: 1 }}>
      <MobileContainer>
        <Header
          title={MATCH_FILTERS_TEXT.pageTitle}
          onBack={() => setView(AppView.HOME)}
        />
        <View style={styles.filterContent}>
          <View style={styles.filterSection}>
            <View style={styles.filterHeader}>
              <Sliders size={16} color={colors.textMuted} />
              <Text style={styles.filterLabel}>
                {MATCH_FILTERS_TEXT.filterLabel}
              </Text>
            </View>

            <View style={styles.optionsGrid}>
              {[
                {
                  label: MATCH_FILTERS_TEXT.everyone,
                  value: Gender.ANY,
                  free: true,
                },
                {
                  label: MATCH_FILTERS_TEXT.male,
                  value: Gender.MALE,
                  free: true,
                },
                {
                  label: MATCH_FILTERS_TEXT.female,
                  value: Gender.FEMALE,
                  free: true,
                },
              ].map((option) => (
                <TouchableOpacity
                  key={option.value}
                  onPress={() => {
                    setSelectedGender(option.value);
                  }}
                  style={[
                    styles.optionBtn,
                    selectedGender === option.value && styles.optionBtnActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.optionText,
                      selectedGender === option.value &&
                        styles.optionTextActive,
                    ]}
                  >
                    {option.label}
                  </Text>

                  <View style={styles.optionRight}>
                    <View
                      style={[
                        styles.radio,
                        selectedGender === option.value && styles.radioActive,
                      ]}
                    >
                      {selectedGender === option.value && (
                        <View style={styles.radioDot} />
                      )}
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
            <Button
              variant="primary"
              onClick={async () => {
                const state = await NetInfo.fetch();   // ✅ one-time check, no listener
                if (state.isConnected) {
                  let preference: 'everyone' | 'male' | 'female' = 'everyone';
                  if (selectedGender === Gender.MALE) {
                    preference = 'male';
                  } else if (selectedGender === Gender.FEMALE) {
                    preference = 'female';
                  }

                  console.log("🚀 [MatchFilters] Selected preference to emit:", preference);
                  findMatch(preference);
                  setView(AppView.MATCH_FOUND, { preference });
                } else {
                  ShowAlertMessage("Please check your internet connection", popTypes.error);
                }
              }}
              style={styles.findBtn}
            >
              {MATCH_FILTERS_TEXT.findMatch}
            </Button>
          </View>
        </View>
      </MobileContainer>
    </View>
  );
};

     
const styles = StyleSheet.create({
  filterContent: {
    flex: 1,
    padding: 24,
  },
  filterSection: {
    flex: 1,
  },
  filterHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 16,
  },
  filterLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.textPlaceholder,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  optionsGrid: {
    gap: 12,
  },
  optionBtn: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.surfaceAlt,
  },
  optionBtnActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primarySofter,
  },
  optionText: {
    fontSize: 18,
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
    marginTop: 25,
    //marginBottom: 350,
  },
});
