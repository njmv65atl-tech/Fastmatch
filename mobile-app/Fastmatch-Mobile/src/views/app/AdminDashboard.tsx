import * as React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from "react-native";
import { MobileContainer, Header } from "../../components/UIComponents";
import { AppView } from "../../types";
import { colors } from "../../utils/colors";
import { ADMIN_DASHBOARD_TEXT } from "../../utils/commonText";

export const AdminDashboard: React.FC<{ setView: (v: AppView) => void }> = ({
  setView,
}) => {
  const data = ADMIN_DASHBOARD_TEXT.days.map((name, index) => ({
    name,
    users: [40, 30, 55, 45, 60, 80, 70][index],
  }));

  return (
    <MobileContainer>
      <Header
        title={ADMIN_DASHBOARD_TEXT.pageTitle}
        rightAction={
          <TouchableOpacity onPress={() => setView(AppView.LOGIN)}>
            <Text
              style={{ color: colors.danger, fontWeight: "bold", fontSize: 12 }}
            >
              {ADMIN_DASHBOARD_TEXT.logoutButton}
            </Text>
          </TouchableOpacity>
        }
      />
      <ScrollView style={styles.adminScroll}>
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Total Users</Text>
            <Text style={styles.statValue}>12,405</Text>
          </View>
          <View style={[styles.statCard, styles.statActive]}>
            <Text style={[styles.statLabel, { color: colors.successAlt }]}>
              Active Now
            </Text>
            <Text style={styles.statValue}>1,204</Text>
          </View>
        </View>

        <View style={styles.chartCard}>
          <Text style={styles.chartTitle}>User Growth</Text>
          <View style={styles.barChart}>
            {data.map((item) => (
              <View key={item.name} style={styles.barWrap}>
                <View style={[styles.bar, { height: item.users }]} />
                <Text style={styles.barLabel}>{item.name}</Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </MobileContainer>
  );
};

const styles = StyleSheet.create({
  adminScroll: {
    padding: 24,
  },
  statsRow: {
    flexDirection: "row",
    gap: 16,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.surface,
    padding: 20,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.primaryBorderSoft,
  },
  statActive: {
    borderColor: colors.successBorderAlt,
  },
  statLabel: {
    color: colors.primary,
    fontSize: 10,
    fontWeight: "bold",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 4,
  },
  statValue: {
    color: colors.white,
    fontSize: 24,
    fontWeight: "bold",
  },
  chartCard: {
    backgroundColor: colors.surface,
    padding: 20,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  chartTitle: {
    color: colors.textMuted,
    fontWeight: "bold",
    marginBottom: 24,
  },
  barChart: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    height: 120,
    paddingHorizontal: 8,
  },
  barWrap: {
    alignItems: "center",
    gap: 8,
  },
  bar: {
    width: 20,
    backgroundColor: colors.primary,
    borderRadius: 4,
  },
  barLabel: {
    fontSize: 10,
    color: colors.textPlaceholder,
  },
});
