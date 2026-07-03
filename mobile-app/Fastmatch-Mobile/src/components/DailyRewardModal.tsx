import React from "react";
import { Modal, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Zap } from "lucide-react-native";
import { colors } from "../utils/colors";

interface DailyRewardModalProps {
  visible: boolean;
  onClaim: () => void;
}

export const DailyRewardModal: React.FC<DailyRewardModalProps> = ({ visible, onClaim }) => {
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.modalOverlay}>
        <View style={styles.rewardModalContainer}>
          <Zap size={48} color={colors.gold} />
          <Text style={styles.rewardTitle}>Daily Reward!</Text>
          <Text style={styles.rewardSubtitle}>You earned 10 coins for logging in today.</Text>
          <TouchableOpacity style={styles.claimButton} onPress={onClaim}>
            <Text style={styles.claimButtonText}>Claim</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
  },
  rewardModalContainer: {
    width: "80%",
    backgroundColor: colors.white,
    borderRadius: 20,
    padding: 24,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
  },
  rewardTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: colors.black,
    marginTop: 12,
  },
  rewardSubtitle: {
    fontSize: 14,
    color: colors.textMuted,
    textAlign: "center",
    marginVertical: 12,
  },
  claimButton: {
    backgroundColor: colors.gold,
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 25,
    marginTop: 8,
  },
  claimButtonText: {
    color: colors.black,
    fontWeight: "bold",
    fontSize: 16,
  },
});
