import React from "react";
import {
  TouchableOpacity,
  Text,
  View,
  StyleSheet,
  Animated,
} from "react-native";
import LinearGradient from "react-native-linear-gradient";
import { LogOut } from "lucide-react-native";

interface GradientButtonProps {
  title: string;
  onPress: () => void;
  disabled?: boolean;
}

const GradientButton: React.FC<GradientButtonProps> = ({
  title,
  onPress,
  disabled = false,
}) => {
  const scale = React.useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scale, {
      toValue: 0.95,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <LinearGradient
        colors={["#EF4444", "#DC2626"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={[styles.gradient, disabled && styles.disabledGradient]}
      >
        <TouchableOpacity
          onPress={onPress}
          disabled={disabled}
          activeOpacity={0.8}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          style={styles.inner}
        >
          <View style={styles.content}>
            <LogOut size={18} color={disabled ? "#FCA5A5" : "#fff"} />
            <Text style={[styles.text, disabled && styles.disabledText]}>
              {title}
            </Text>
          </View>
        </TouchableOpacity>
      </LinearGradient>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  gradient: {
    borderRadius: 12,
    shadowColor: "#B91C1C",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    width: "100%",
    elevation: 10,
  },
  disabledGradient: {
    opacity: 0.5,
  },
  inner: {
    paddingVertical: 18,
    paddingHorizontal: 20,
    borderRadius: 20,
    width: "100%",
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  text: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 14,
    letterSpacing: 1,
  },
  disabledText: {
    color: "#FCA5A5",
  },
});

export default GradientButton;
