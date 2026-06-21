import * as React from "react";
import { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  Animated,
} from "react-native";
import LinearGradient from "react-native-linear-gradient";
import { MobileContainer } from "../../components/UIComponents";
import { AppView, User } from "../../types";
import { colors } from "../../utils/colors";
import { SEARCHING_TEXT } from "../../utils/commonText";
import { useSelector, useDispatch } from "react-redux";
import { skippedStackSelector, popSkippedUser } from "../../redux/slices/globalSlice";
import { userSelector } from "../../redux/slices/persistedSlice";
import { socket } from "../../socket/socket";
import { ShowAlertMessage, popTypes } from "../../helpers/commonFunctions";
import { RotateCcw } from "lucide-react-native";

interface CoreProps {
  user: User;
  setView: (view: AppView) => void;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
}

export const SearchingView: React.FC<CoreProps> = ({ setView }) => {
  const opacity = useRef(new Animated.Value(1)).current;
  const rippleAnim = useRef(new Animated.Value(0)).current;

  const dispatch = useDispatch();
  const currentUser = useSelector(userSelector);
  const skippedStack = useSelector(skippedStackSelector);
  const lastSkipped = skippedStack.length > 0 ? skippedStack[skippedStack.length - 1] : null;

  const handleRewind = () => {
    if (!lastSkipped) return;
    if ((currentUser?.walletBalance || 0) < 10) {
      ShowAlertMessage("Insufficient coins for Rewind (10 coins required).", popTypes.error);
      return;
    }
    // Emit super request as rewind
    socket.emit("super-request", { targetUserId: lastSkipped._id, coinCost: 10 });
    ShowAlertMessage(`Rewind request sent to ${lastSkipped.displayName || 'user'}!`, popTypes.success);
    dispatch(popSkippedUser());
  };

  useEffect(() => {
    // Avatar + title pulse
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.6,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ]),
    );
    pulse.start();
    return () => pulse.stop();
  }, [opacity]);

  useEffect(() => {
    // Ripple loop
    const rippleLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(rippleAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(rippleAnim, {
          toValue: 0,
          duration: 0,
          useNativeDriver: true,
        }),
      ]),
    );

    rippleLoop.start();
    return () => rippleLoop.stop();
  }, [rippleAnim]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setView(AppView.MATCH_FOUND);
    }, 3000);
    return () => clearTimeout(timer);
  }, [setView]);

  return (
    <MobileContainer>
      <View style={styles.searchingWrap}>
        <View style={styles.avatarWrapper}>
          <Animated.View
            style={[
              styles.rippleContainer,
              {
                transform: [
                  {
                    scale: rippleAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [1, 2.5],
                    }),
                  },
                ],
                opacity: rippleAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.5, 0],
                }),
              },
            ]}
          >
            <View style={styles.ripple} />
          </Animated.View>

          <LinearGradient
            colors={["#6366F1", "#8B5CF6"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.avatarCircle}
          >
            <View style={styles.avatarInner}>
              <Animated.Image
                source={{ uri: "https://picsum.photos/200/200" }}
                style={[styles.myAvatar, { opacity }]}
              />
            </View>
          </LinearGradient>
        </View>

        {/* Title */}
        <Animated.Text style={[styles.searchTitle, { opacity }]}>
          {SEARCHING_TEXT.searchTitle}
        </Animated.Text>

        <Text style={styles.searchSubtitle}>
          {SEARCHING_TEXT.searchSubtitle}
        </Text>

        {/* Rewind Button */}
        {lastSkipped && (
          <TouchableOpacity style={styles.rewindBtn} onPress={handleRewind}>
            <RotateCcw color="#F59E0B" size={20} />
            <Text style={styles.rewindText}>Rewind {lastSkipped.displayName || "User"} (10 Coins)</Text>
          </TouchableOpacity>
        )}

        {/* Cancel Button */}
        <TouchableOpacity
          onPress={() => setView(AppView.MATCH_FILTERS)}
          style={styles.cancelBtn}
        >
          <Text style={styles.cancelText}>{SEARCHING_TEXT.cancelSearch}</Text>
        </TouchableOpacity>
      </View>
    </MobileContainer>
  );
};

const styles = StyleSheet.create({
  searchingWrap: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
    backgroundColor: "#020617", // slate-950
  },

  glowLarge: {
    position: "absolute",
    width: 400,
    height: 400,
    borderRadius: 200,
    backgroundColor: "rgba(99,102,241,0.15)",
    top: "35%",
    alignSelf: "center",
  },

  glowSmall: {
    position: "absolute",
    width: 250,
    height: 250,
    borderRadius: 125,
    backgroundColor: "rgba(139,92,246,0.15)",
    top: "20%",
    left: "20%",
  },

  avatarWrapper: {
    marginBottom: 60,
    justifyContent: "center",
    alignItems: "center",
  },

  avatarCircle: {
    width: 128,
    height: 128,
    borderRadius: 64,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#6366F1",
    shadowOpacity: 0.6,
    shadowRadius: 25,
    elevation: 15,
  },

  avatarInner: {
    padding: 4,
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },

  myAvatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 4,
    borderColor: "#020617",
  },

  rippleContainer: {
    position: "absolute",
    width: 200,
    height: 200,
    borderRadius: 100,
    alignItems: "center",
    justifyContent: "center",
  },

  ripple: {
    width: 200,
    height: 200,
    borderRadius: 100,
    borderWidth: 1,
    borderColor: "rgba(99,102,241,0.4)",
  },

  searchTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: "white",
    textAlign: "center",
  },

  searchSubtitle: {
    fontSize: 14,
    color: "#94A3B8",
    marginTop: 8,
    textAlign: "center",
  },

  cancelBtn: {
    marginTop: 64,
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },

  cancelText: {
    color: "#CBD5E1",
    fontWeight: "600",
    fontSize: 14,
  },
  rewindBtn: {
    marginTop: 24,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(245, 158, 11, 0.15)",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: "rgba(245, 158, 11, 0.4)",
    gap: 8,
  },
  rewindText: {
    color: "#F59E0B",
    fontWeight: "700",
    fontSize: 15,
  },
});
