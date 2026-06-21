import * as React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Dimensions,
  Platform,
} from "react-native";
import { ChevronDown, ChevronLeft, Zap, Star, X } from "lucide-react-native";
import { colors } from "../utils/colors";
import LinearGradient from "react-native-linear-gradient";
const { width } = Dimensions.get("window");
import MaskedView from "@react-native-masked-view/masked-view";
export const MobileContainer: React.FC<{
  children: React.ReactNode;
  style?: any;
  className?: string;
}> = ({ children, style }) => (
  <SafeAreaView style={[styles.container, style]}>
    <StatusBar barStyle="light-content" backgroundColor={colors.background} />
    <View style={styles.innerContainer}>{children}</View>
  </SafeAreaView>
);

export const Button: React.FC<{
  children: React.ReactNode;
  onClick?: () => void;
  variant?: "primary" | "ghost" | "danger" | "gold";
  fullWidth?: boolean;
  style?: any;
}> = ({ children, onClick, variant = "primary", style, fullWidth }) => {
  const isGradient = variant === "primary" || variant === "gold";

  const getGradientColors = () => {
    switch (variant) {
      case "primary":
        return ["#5B5FEF", "#7C3AED"];

      case "gold":
        return ["#FACC15", "#EAB308"]; // Gold gradient
      default:
        return [];
    }
  };

  const getButtonStyle = () => {
    switch (variant) {
      case "ghost":
        return styles.btnGhost;
      case "danger":
        return styles.btnDanger;
      default:
        return {};
    }
  };

  const getTextStyle = () => {
    switch (variant) {
      case "ghost":
        return styles.textGhost;
      case "danger":
        return styles.textDanger;
      case "gold":
      case "primary":
      default:
        return styles.textPrimary;
    }
  };

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onClick}
      style={[fullWidth && { width: "100%" }]}
    >
      {isGradient ? (
        <LinearGradient
          colors={getGradientColors()}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[styles.btnBase, style]}
        >
          <Text style={[styles.btnText, getTextStyle()]}>{children}</Text>
        </LinearGradient>
      ) : (
        <View style={[styles.btnBase, getButtonStyle(), style]}>
          <Text style={[styles.btnText, getTextStyle()]}>{children}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

import { TextInputProps } from "react-native";

interface InputProps extends TextInputProps {
  label?: string;
  icon?: React.ReactNode;
}

export const Input = React.forwardRef<TextInput, InputProps>(
  ({ label, icon, style, ...rest }, ref) => (
    <View style={styles.inputGroup}>
      {label && <Text style={styles.label}>{label}</Text>}

      <View style={styles.inputWrapper}>
        {icon && <View style={styles.inputIcon}>{icon}</View>}

        <TextInput
          ref={ref}
          style={[styles.input, style]}
          placeholderTextColor={colors.textPlaceholder}
          {...rest} // 🔥 allows returnKeyType, onSubmitEditing etc
        />
      </View>
    </View>
  ),
);

Input.displayName = "Input";

import { Video } from "lucide-react-native";

interface AppLogoProps {
  size?: "sm" | "md" | "xl";
  layout?: "horizontal" | "vertical";
}

export const AppLogo: React.FC<AppLogoProps> = ({
  size = "md",
  layout = "horizontal",
}) => {
  const isVertical = layout === "vertical";
  const isSmall = size === "sm";

  const sizes = {
    sm: { box: 32, icon: 16, badge: 15, text: 18 },
    md: { box: 48, icon: 24, badge: 20, text: 22 },
    xl: { box: 96, icon: 48, badge: 40, text: 40 },
  }[size];

  return (
    <View
      style={[
        styles.logoContainer,
        isVertical && !isSmall && styles.logoContainerVertical,

        isSmall && styles.logoContainerRow, // 👈 force row for sm
      ]}
    >
      <View
        style={{
          width: sizes.box,
          height: sizes.box,
          position: "relative",
        }}
      >
        <LinearGradient
          colors={["#6366F1", "#8B5CF6", "#4F46E5"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[
            styles.logoBox,
            {
              width: sizes.box,
              height: sizes.box,
              borderRadius: sizes.box / 4,
            },
          ]}
        >
          <Video size={sizes.icon} color="#FFFFFF" strokeWidth={2.5} />
        </LinearGradient>

        {/* Zap Badge INSIDE same wrapper */}
        <View
          style={[
            styles.badge,
            {
              width: sizes.badge,
              height: sizes.badge,
              borderRadius: sizes.badge / 2,
              right: -sizes.badge / 4,
              bottom: -sizes.badge / 4,
              borderWidth: isSmall ? 1 : 2,
            },
          ]}
        >
          <Zap
            size={sizes.badge * 0.6}
            fill="#1E1B4B"
            color="#1E1B4B"
            strokeWidth={3}
          />
        </View>
      </View>

      <View
        style={[
          styles.textRow,
          isVertical && styles.textRowVertical,
          isSmall && {
            marginLeft: 10,
            marginBottom: 10,
            flexDirection: "row",
            alignItems: "center",
          },
        ]}
      >
        <MaskedView
          maskElement={
            <Text style={[styles.fastText, { fontSize: sizes.text }]}>
              Fast
            </Text>
          }
        >
          <LinearGradient
            colors={["#FFFFFF", "#94A3B8"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <Text
              style={[styles.fastText, { opacity: 0, fontSize: sizes.text }]}
            >
              Fast
            </Text>
          </LinearGradient>
        </MaskedView>

        <Text style={[styles.matchText, { fontSize: sizes.text }]}>Match</Text>
      </View>
    </View>
  );
};

export const Header: React.FC<{
  title: string;
  onBack?: () => void;
  rightAction?: React.ReactNode;
}> = ({ title, onBack, rightAction }) => (
  <View style={styles.header}>
    <View style={styles.headerLeft}>
      {onBack && (
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <ChevronLeft color={colors.textMuted} size={24} />
        </TouchableOpacity>
      )}
      <Text style={styles.headerTitle}>{title}</Text>
    </View>

    <View style={styles.headerRight}>{rightAction}</View>
  </View>
);

import { Modal, FlatList } from "react-native";

interface DropdownProps {
  label?: string;
  options: string[];
  selectedValue: string;
  onSelect: (value: string) => void;
  placeholder?: string;
}

export const Dropdown: React.FC<DropdownProps> = ({
  label,
  options,
  selectedValue,
  onSelect,
  placeholder = "Select an option",
}) => {
  const [modalVisible, setModalVisible] = React.useState(false);

  return (
    <View style={styles.inputGroup}>
      {label && <Text style={styles.label}>{label}</Text>}
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => setModalVisible(true)}
        style={styles.inputWrapper}
      >
        <Text
          style={[
            styles.input,
            !selectedValue && { color: colors.textPlaceholder },
          ]}
        >
          {selectedValue || placeholder}
        </Text>
        <ChevronDown color={colors.textMuted} size={20} />
      </TouchableOpacity>

      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setModalVisible(false)}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{label || "Select Option"}</Text>
            </View>
            <FlatList
              data={options}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.optionItem,
                    item === selectedValue && styles.optionItemSelected,
                  ]}
                  onPress={() => {
                    onSelect(item);
                    setModalVisible(false);
                  }}
                >
                  <Text
                    style={[
                      styles.optionText,
                      item === selectedValue && styles.optionTextSelected,
                    ]}
                  >
                    {item}
                  </Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  innerContainer: {
    flex: 1,
  },
  gradientBtn: {
    paddingVertical: 16,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",

    // Glow effect
    shadowColor: "#7C3AED",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.35,
    shadowRadius: 20,
    elevation: 12,
  },

  btnText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
    letterSpacing: 0.3,
  },

  btnBase: {
    height: 56,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "row",
    paddingHorizontal: Platform.OS === "ios" ? 0 : 70,
    marginVertical: 8,
  },

  btnPrimary: {
    backgroundColor: colors.primary,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  textPrimary: {
    color: colors.white,
  },
  btnGhost: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: colors.borderMuted,
  },
  textGhost: {
    color: colors.textMuted,
  },
  btnDanger: {
    backgroundColor: colors.dangerBgSoft,
    borderWidth: 1,
    borderColor: colors.borderDanger,
  },
  textDanger: {
    color: colors.danger,
  },
  btnGold: {
    backgroundColor: colors.goldStrong,
  },
  textGold: {
    color: colors.black,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 8,
    marginLeft: 4,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.surfaceAlt,
    paddingHorizontal: 16,
    height: 56,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    color: colors.white,
    fontSize: 16,
  },

  logoIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: colors.primarySoft,
    justifyContent: "center",
    alignItems: "center",
  },
  logoText: {
    color: colors.white,
    fontWeight: "900",
    letterSpacing: -0.5,
  },

  backBtn: {
    padding: 8,
  },

  vertical: {
    flexDirection: "column",
    alignItems: "center",
  },

  iconWrapper: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: "rgba(79,70,229,0.15)", // subtle indigo glow
    justifyContent: "center",
    alignItems: "center",
  },

  text: {
    fontWeight: "900",
    letterSpacing: -0.5,
  },

  verticalText: {
    marginTop: 8,
  },
  container: { flex: 1, flexDirection: "row", alignItems: "center" },

  logoBox: {
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#6366F1",
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 8,
    zIndex: 99,
  },

  badge: {
    position: "absolute",
    backgroundColor: "#FBBF24",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 5,
    borderColor: "#0F172A",
    zIndex: 99,
  },

  textRow: {
    flexDirection: "row",
    marginLeft: 12,
    alignItems: "center",
    marginTop: 12,
  },

  textVertical: {
    marginTop: 12,
    marginLeft: 0,
  },

  fastText: {
    fontWeight: "900",
    letterSpacing: -1,
    fontStyle: "italic",
    //color: "transparent", // gradient wrapper
  },

  matchText: {
    fontWeight: "900",
    letterSpacing: -1,
    color: "#6366F1",
  },
  logoContainer: {
    flexDirection: "column",
    alignItems: "center",
  },
  logoContainerVertical: {
    flexDirection: "column",
    alignItems: "center",
  },
  textRowVertical: {
    alignItems: "center",
  },
  header: {
    height: 64,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
  },

  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1, // takes remaining space
  },

  headerRight: {
    minWidth: 40,
    alignItems: "flex-end",
    justifyContent: "center",
  },

  headerTitle: {
    color: colors.white,
    fontSize: 18,
    fontWeight: "700",
    marginLeft: 8, // spacing after back icon
  },
  logoContainerRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContent: {
    width: "100%",
    maxHeight: "70%",
    backgroundColor: colors.background,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.surfaceAlt,
    overflow: "hidden",
  },
  modalHeader: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.surfaceAlt,
    backgroundColor: colors.surface,
  },
  modalTitle: {
    color: colors.white,
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
  },
  optionItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.surfaceAlt,
  },
  optionItemSelected: {
    backgroundColor: colors.primarySoft,
  },
  optionText: {
    color: colors.textMuted,
    fontSize: 16,
    textAlign: "center",
  },
  optionTextSelected: {
    color: colors.white,
    fontWeight: "bold",
  },
  // ─── Rating Modal ───────────────────────────────────────────────────────────
  ratingContainer: {
    backgroundColor: colors.surface,
    borderRadius: 24,
    padding: 24,
    width: "90%",
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.surfaceAlt,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  ratingTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: colors.white,
    marginBottom: 8,
    textAlign: "center",
  },
  ratingSubtitle: {
    fontSize: 14,
    color: colors.textMuted,
    marginBottom: 24,
    textAlign: "center",
  },
  starsRow: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 32,
    gap: 8,
  },
  starButton: {
    padding: 4,
  },
  submitBtn: {
    width: "100%",
    height: 56,
    borderRadius: 16,
    overflow: "hidden",
  },
  submitGradient: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  submitText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: "700",
  },
  closeBtn: {
    position: "absolute",
    right: 16,
    top: 16,
    padding: 4,
    zIndex: 1,
  },
});

interface RatingModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (rating: number) => void;
}

export const RatingModal: React.FC<RatingModalProps> = ({ visible, onClose, onSubmit }) => {
  const [rating, setRating] = React.useState(0);

  React.useEffect(() => {
    if (visible) {
      setRating(0);
    }
  }, [visible]);

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.modalOverlay}>
        <View style={styles.ratingContainer}>
          <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
            <X color={colors.textMuted} size={20} />
          </TouchableOpacity>

          <Text style={styles.ratingTitle}>Rate your call!</Text>
          <Text style={styles.ratingSubtitle}>
            How was your experience with the partner?
          </Text>

          <View style={styles.starsRow}>
            {[1, 2, 3, 4, 5].map((star) => (
              <TouchableOpacity
                key={star}
                onPress={() => setRating(star)}
                style={styles.starButton}
              >
                <Star
                  size={36}
                  fill={star <= rating ? "#FACC15" : "transparent"}
                  color={star <= rating ? "#FACC15" : colors.textMuted}
                />
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity
            style={styles.submitBtn}
            disabled={rating === 0}
            onPress={() => onSubmit(rating)}
          >
            <LinearGradient
              colors={rating === 0 ? [colors.surfaceAlt, colors.surfaceAlt] : ["#5B5FEF", "#7C3AED"]}
              style={styles.submitGradient}
            >
              <Text style={[styles.submitText, rating === 0 && { color: colors.textMuted }]}>
                Submit Feedback
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

