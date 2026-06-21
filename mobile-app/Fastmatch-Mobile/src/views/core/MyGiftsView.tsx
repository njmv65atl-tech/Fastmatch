import * as React from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Image } from "react-native";
import { MobileContainer, Header } from "../../components/UIComponents";
import { AppView, User } from "../../types";
import { colors } from "../../utils/colors";
import { managerApiCall } from "../../helpers/managerApiCallFn";
import { ShowAlertMessage, popTypes } from "../../helpers/commonFunctions";
import { Gift, Coins, User as UserIcon } from "lucide-react-native";
import { IMAGE_URL } from "../../config/env";
import { setGlobalUser, tokenSelector } from "../../redux/slices/persistedSlice";
import { useSelector, useDispatch } from "react-redux";
import { BASE_URL as API_BASE_URL } from "../../config/env";

const BASE_URL = IMAGE_URL;

interface CoreProps {
  user: User;
  setView: (view: AppView, params?: any) => void;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
}

export const MyGiftsView: React.FC<CoreProps> = ({ user, setView, setUser }) => {
  const [loading, setLoading] = React.useState(true);
  const [gifts, setGifts] = React.useState<any[]>([]);
  const dispatch = useDispatch();
  const token = useSelector(tokenSelector);

  const fetchGifts = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE_URL}user/gifts`, {
        method: 'GET',
        headers: {
          'x-access-token': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      const json = await res.json();
      if (json.success) {
        setGifts(json.data || []);
      } else {
        ShowAlertMessage(json.message || "Failed to load gifts", popTypes.error);
      }
    } catch (e: any) {
      ShowAlertMessage(e.message || "Failed to load gifts", popTypes.error);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchGifts();
  }, []);

  const handleConvert = async (giftId: string, coinValue: number) => {
    try {
      const res = await fetch(`${API_BASE_URL}user/gifts/convert`, {
        method: 'POST',
        headers: {
          'x-access-token': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ giftId })
      });
      const json = await res.json();
      
      if (json.success) {
          ShowAlertMessage(`Converted to ${coinValue} coins!`, popTypes.success);
          // Remove gift from list
          setGifts(prev => prev.filter(g => g._id !== giftId));
          // Update user wallet
          if (json.data) {
             setUser(json.data);
             dispatch(setGlobalUser(json.data));
          }
      } else {
          ShowAlertMessage(json.message || "Failed to convert gift", popTypes.error);
      }
    } catch (e: any) {
      console.error(e);
      ShowAlertMessage(e.message || "Failed to convert gift", popTypes.error);
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <MobileContainer>
        <Header title="My Gifts" onBack={() => setView(AppView.SETTINGS)} />
        
        <View style={styles.statsContainer}>
          <View style={styles.statBox}>
            <Gift color={colors.primary} size={24} />
            <Text style={styles.statLabel}>Total Gifts</Text>
            <Text style={styles.statValue}>{gifts.length}</Text>
          </View>
          <View style={styles.statBox}>
            <Coins color="#f59e0b" size={24} />
            <Text style={styles.statLabel}>Total Value</Text>
            <Text style={styles.statValue}>{gifts.reduce((sum, g) => sum + g.coinValue, 0)} Coins</Text>
          </View>
        </View>

        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : gifts.length === 0 ? (
          <View style={styles.center}>
            <Gift color={colors.textMuted} size={64} style={{ marginBottom: 16, opacity: 0.5 }} />
            <Text style={styles.emptyText}>You don't have any gifts yet.</Text>
            <Text style={styles.emptySubtext}>Matches can send you gifts during video calls!</Text>
          </View>
        ) : (
          <ScrollView contentContainerStyle={styles.scroll}>
            <View style={styles.grid}>
              {gifts.map((gift) => {
                let senderPic = gift.senderId?.profilePicture || "";
                if (senderPic && !senderPic.includes("http")) {
                  senderPic = BASE_URL + senderPic;
                }

                return (
                  <View key={gift._id} style={styles.giftCard}>
                    <View style={styles.giftHeader}>
                      <Gift color={colors.gold} size={28} />
                      <View style={styles.coinBadge}>
                        <Coins color="#f59e0b" size={12} />
                        <Text style={styles.coinText}>{gift.coinValue}</Text>
                      </View>
                    </View>
                    <Text style={styles.giftName}>{gift.giftName}</Text>
                    
                    <View style={styles.senderInfo}>
                      <Text style={styles.senderLabel}>From:</Text>
                      <View style={styles.senderRow}>
                        {senderPic ? (
                          <Image source={{ uri: senderPic }} style={styles.senderAvatar} />
                        ) : (
                          <View style={styles.senderAvatarPlaceholder}>
                            <UserIcon color={colors.white} size={10} />
                          </View>
                        )}
                        <Text style={styles.senderName} numberOfLines={1}>
                          {gift.senderId?.displayName || 'Unknown'}
                        </Text>
                      </View>
                    </View>

                    <TouchableOpacity 
                      style={styles.convertBtn} 
                      onPress={() => handleConvert(gift._id, gift.coinValue)}
                    >
                      <Text style={styles.convertText}>Convert to Coins</Text>
                    </TouchableOpacity>
                  </View>
                );
              })}
            </View>
          </ScrollView>
        )}
      </MobileContainer>
    </View>
  );
};

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
  },
  scroll: {
    padding: 16,
    paddingBottom: 100,
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingTop: 8,
    gap: 12,
  },
  statBox: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.surfaceAlt,
  },
  statLabel: {
    color: colors.textMuted,
    fontSize: 12,
    marginTop: 8,
    marginBottom: 4,
  },
  statValue: {
    color: colors.white,
    fontSize: 20,
    fontWeight: 'bold',
  },
  emptyText: {
    color: colors.white,
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
  },
  emptySubtext: {
    color: colors.textMuted,
    fontSize: 14,
    textAlign: "center",
    marginTop: 8,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginTop: 16,
  },
  giftCard: {
    width: "48%",
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(99, 102, 241, 0.2)",
  },
  giftHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  coinBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(245, 158, 11, 0.1)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  coinText: {
    color: "#f59e0b",
    fontSize: 12,
    fontWeight: "bold",
  },
  giftName: {
    color: colors.white,
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 12,
  },
  senderInfo: {
    backgroundColor: colors.surfaceAlt,
    padding: 10,
    borderRadius: 12,
    marginBottom: 16,
  },
  senderLabel: {
    color: colors.textMuted,
    fontSize: 10,
    textTransform: "uppercase",
    marginBottom: 4,
  },
  senderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  senderAvatar: {
    width: 20,
    height: 20,
    borderRadius: 10,
  },
  senderAvatarPlaceholder: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.textMuted,
    justifyContent: "center",
    alignItems: "center",
  },
  senderName: {
    color: colors.white,
    fontSize: 13,
    flex: 1,
  },
  convertBtn: {
    backgroundColor: "rgba(34, 197, 94, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(34, 197, 94, 0.3)",
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: "center",
  },
  convertText: {
    color: "#22c55e",
    fontWeight: "bold",
    fontSize: 12,
  },
});
