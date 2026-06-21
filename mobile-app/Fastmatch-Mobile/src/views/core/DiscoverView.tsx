import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  ActivityIndicator,
  BackHandler,
  Platform,
  Dimensions,
} from "react-native";
import { MobileContainer, Header, Button } from "../../components/UIComponents";
import { AppView, User } from "../../types";
import { colors } from "../../utils/colors";
import { Crown } from "lucide-react-native";
import { managerApiCall } from "../../helpers/managerApiCallFn";
import { ShowAlertMessage, popTypes } from "../../helpers/commonFunctions";
import { useSelector } from "react-redux";
import { tokenSelector, userSelector } from "../../redux/slices/persistedSlice";
import LinearGradient from "react-native-linear-gradient";
import { socket } from "../../socket/socket";
import { BASE_URL, IMAGE_URL } from "../../config/env";

const { width } = Dimensions.get("window");
const CARD_MARGIN = 8;
const CARD_WIDTH = (width - 48 - CARD_MARGIN * 2) / 2; // 2 columns

interface DiscoverViewProps {
  setView: (view: AppView) => void;
}

export const DiscoverView: React.FC<DiscoverViewProps> = ({ setView }) => {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const token = useSelector(tokenSelector);
  const currentUser = useSelector(userSelector);

  useEffect(() => {
    fetchUsers();

    if (Platform.OS === 'android') {
      const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
        setView(AppView.HOME);
        return true;
      });
      return () => backHandler.remove();
    }
  }, [setView]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${BASE_URL}user/discover`, {
        headers: { 
          Authorization: `Bearer ${token}`,
          "x-access-token": `Bearer ${token}`
        }
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.message);
      
      setUsers(json.data);
    } catch (err: any) {
      console.warn("Discover error:", err);
      ShowAlertMessage(err.message || "Failed to load discover users", popTypes.error);
    } finally {
      setLoading(false);
    }
  };

  const handleSuperMatch = (targetUser: any) => {
    if ((currentUser?.walletBalance || 0) < 50) {
      ShowAlertMessage("Insufficient coins for Super Match (50 coins required). Get more in Wallet.", popTypes.error);
      return;
    }
    
    // Emit super request
    socket.emit("super-request", { targetUserId: targetUser._id, coinCost: 50 });
    ShowAlertMessage(`Super Request sent to ${targetUser.displayName || 'user'}!`, popTypes.success);
    setView(AppView.HOME);
  };

  return (
    <MobileContainer>
      <Header title="Discover Matches" onBack={() => setView(AppView.HOME)} />

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.container}>
          <View style={styles.grid}>
            {users.map((u) => (
              <View key={u._id} style={styles.card}>
                <Image 
                  source={{ uri: u.profilePicture ? `${IMAGE_URL}${u.profilePicture}` : "https://via.placeholder.com/150" }} 
                  style={styles.image} 
                  blurRadius={15} // Heavy blur for mystery
                />
                <View style={styles.infoOverlay}>
                  <Text style={styles.nameText}>{u.displayName || "Mystery Match"}</Text>
                  
                  <TouchableOpacity
                    style={styles.superBtn}
                    onPress={() => handleSuperMatch(u)}
                  >
                    <Crown size={14} color="#FFF" />
                    <Text style={styles.superBtnText}>Super Match</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
          {users.length === 0 && (
            <Text style={styles.emptyText}>No users found right now. Check back later!</Text>
          )}
        </ScrollView>
      )}
    </MobileContainer>
  );
};

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  container: {
    padding: 24,
    paddingBottom: 60,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  card: {
    width: CARD_WIDTH,
    height: CARD_WIDTH * 1.3,
    marginBottom: 16,
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  image: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  infoOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "flex-end",
    padding: 12,
    backgroundColor: "rgba(0,0,0,0.4)", // Dark gradient effect
  },
  nameText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 8,
  },
  superBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F59E0B",
    paddingVertical: 8,
    borderRadius: 8,
    gap: 4,
  },
  superBtnText: {
    color: "#FFF",
    fontSize: 12,
    fontWeight: "700",
  },
  emptyText: {
    color: colors.textPlaceholder,
    textAlign: "center",
    marginTop: 40,
  },
});
