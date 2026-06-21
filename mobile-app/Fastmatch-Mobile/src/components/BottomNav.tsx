// src/components/BottomNav.tsx
import * as React from "react";
import { View, TouchableOpacity, StyleSheet, Dimensions, SafeAreaView } from "react-native";
import { Home, MessageSquare, User, Users } from "lucide-react-native";
import { AppView } from "../types";
import { colors } from "../utils/colors";
import { useSelector } from "react-redux";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

export const BottomNav: React.FC<any> = ({ currentView, setView }) => {
  // Select the boolean from Redux
  const hasUnread = useSelector((state: any) => state.global.hasUnread);

  const tabs = [
    { icon: Home, view: AppView.HOME },
    { icon: MessageSquare, view: AppView.CHAT_INBOX },
    { icon: Users, view: AppView.FRIENDS },
    { icon: User, view: AppView.SETTINGS },
  ];

  const isActive = (view: AppView) => {
    if (view === AppView.HOME && (currentView === AppView.HOME || currentView === AppView.MATCH_FILTERS)) return true;
    if (view === AppView.CHAT_INBOX && (currentView === AppView.CHAT_INBOX || currentView === AppView.CHAT_DETAIL)) return true;
    return currentView === view;
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {tabs.map((tab) => {
          const active = isActive(tab.view);
          const Icon = tab.icon;
          const isChat = tab.view === AppView.CHAT_INBOX;

          return (
            <TouchableOpacity key={tab.view} onPress={() => setView(tab.view)} style={styles.tab}>
              <View style={[styles.iconContainer, active && styles.activeIconWrap]}>
                <Icon size={24} color={active ? colors.primary : colors.textPlaceholder} />
                
                {/* ── RED DOT LOGIC ── */}
                {isChat && hasUnread && <View style={styles.redDot} />}
              </View>
              {active && <View style={styles.indicatorDot} />}
            </TouchableOpacity>
          );
        })}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { position: "absolute", bottom: 10, left: 0, right: 0, alignItems: "center" },
  container: {
    flexDirection: "row",
    justifyContent: "space-around",
    width: "90%",
    backgroundColor: "rgba(15, 23, 42, 0.95)",
    borderRadius: 30,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  tab: { alignItems: "center", justifyContent: "center" },
  iconContainer: { position: "relative", padding: 4 },
  activeIconWrap: { transform: [{ scale: 1.1 }] },
  // ── THE RED DOT ──
  redDot: {
    position: "absolute",
    top: 2,
    right: 2,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#EF4444", // Modern Red
    borderWidth: 1.5,
    borderColor: "rgb(15, 23, 42)", // Matches Nav Background
  },
  indicatorDot: {
    marginTop: 4,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.primary,
  },
});