import React from "react";
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  Pressable,
} from "react-native";
import { useTranslation } from "react-i18next";
import { Globe, Check, X } from "lucide-react-native";
import { colors } from "../utils/colors";
import {
  AVAILABLE_LANGUAGES,
  SupportedLanguage,
  setAppLanguage,
} from "../i18n";
import { ShowAlertMessage, popTypes } from "../helpers/commonFunctions";

interface LanguageSelectorModalProps {
  visible: boolean;
  onClose: () => void;
}

export const LanguageSelectorModal: React.FC<LanguageSelectorModalProps> = ({
  visible,
  onClose,
}) => {
  const { t, i18n } = useTranslation();
  const currentLang = i18n.language || "en";

  const handleSelectLanguage = async (code: string) => {
    if (code === currentLang) {
      onClose();
      return;
    }
    await setAppLanguage(code);
    onClose();
    ShowAlertMessage(t("settings.languageChanged"), popTypes.success);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.content} onPress={(e) => e.stopPropagation()}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View style={styles.iconCircle}>
                <Globe size={20} color={colors.primary} />
              </View>
              <Text style={styles.title}>{t("settings.selectLanguage")}</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <X size={20} color="#94A3B8" />
            </TouchableOpacity>
          </View>

          {/* Language List */}
          <View style={styles.list}>
            {AVAILABLE_LANGUAGES.map((lang: SupportedLanguage) => {
              const isSelected =
                currentLang === lang.code ||
                (currentLang.startsWith(lang.code) && lang.code !== "en");

              return (
                <TouchableOpacity
                  key={lang.code}
                  style={[
                    styles.langItem,
                    isSelected && styles.langItemSelected,
                  ]}
                  onPress={() => handleSelectLanguage(lang.code)}
                  activeOpacity={0.7}
                >
                  <View style={styles.langLeft}>
                    <Text style={styles.flag}>{lang.flag}</Text>
                    <View style={styles.nameBlock}>
                      <Text
                        style={[
                          styles.nativeName,
                          isSelected && styles.nativeNameSelected,
                        ]}
                      >
                        {lang.nativeName}
                      </Text>
                      {lang.nativeName !== lang.name && (
                        <Text style={styles.subName}>{lang.name}</Text>
                      )}
                    </View>
                  </View>

                  {isSelected && (
                    <View style={styles.checkCircle}>
                      <Check size={16} color="#FFFFFF" />
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.75)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  content: {
    width: "100%",
    maxWidth: 360,
    backgroundColor: colors.surfaceAlt,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    padding: 20,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(99, 102, 241, 0.15)",
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.white,
  },
  closeBtn: {
    padding: 4,
  },
  list: {
    gap: 10,
  },
  langItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "rgba(255, 255, 255, 0.04)",
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.06)",
  },
  langItemSelected: {
    backgroundColor: "rgba(99, 102, 241, 0.15)",
    borderColor: colors.primary,
  },
  langLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  flag: {
    fontSize: 24,
  },
  nameBlock: {
    justifyContent: "center",
  },
  nativeName: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.white,
  },
  nativeNameSelected: {
    color: "#A5B4FC",
    fontWeight: "700",
  },
  subName: {
    fontSize: 12,
    color: "#94A3B8",
    marginTop: 2,
  },
  checkCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.primary,
    justifyContent: "center",
    alignItems: "center",
  },
});
