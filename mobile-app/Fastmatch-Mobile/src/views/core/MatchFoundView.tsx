
import * as React from "react";
import {
  ActivityIndicator,
  Animated,
  BackHandler,
  Image,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  AppState, // Added
  AppStateStatus, // Added
  Modal,
  ScrollView,
} from "react-native";
import { AppView, User } from "../../types";
import { SkipForward, Video, ArrowLeft, Star, AlertTriangle } from "lucide-react-native";
import { useCallback, useEffect, useRef, useState } from "react";

import { MobileContainer } from "../../components/UIComponents";
import { colors } from "../../utils/colors";
import { socket } from "../../socket/socket";
import { saveUser } from "../../utils/storage";
import { IMAGE_URL } from "../../config/env";
import { useDispatch } from "react-redux";
import { pushSkippedUser } from "../../redux/slices/globalSlice";

const IMAGE_BASE_URL = IMAGE_URL;

interface CoreProps {
  user: User;
  setView: (view: AppView, params?: any) => void;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
  preference?: 'everyone' | 'male' | 'female';
  showRatingModal?: boolean;
  lastMatchId?: string;
  lastPartnerName?: string;
}

export const MatchFoundView: React.FC<CoreProps> = ({ setView, preference = 'everyone', showRatingModal, lastMatchId, lastPartnerName }) => {
  React.useEffect(() => {
    console.log("ℹ️ [MatchFoundView] Component mounted/updated with preference:", preference);
  }, [preference]);

  const [ratingModalVisible, setRatingModalVisible] = useState(!!showRatingModal);
  const [givenRating, setGivenRating] = useState(0);

  const [data, setPick] = useState<any>(null);
  const [hasMatch, setHasMatch] = useState(false);
  const [matchName, setMatchName] = useState("");
  const [matchRole, setMatchRole] = useState("");
  const [matchIsPremium, setMatchIsPremium] = useState(false);
  const [matchUri, setMatchUri] = useState("");
  const dispatch = useDispatch();
  const [timeLeft, setTimeLeft] = useState(10);
  const [buttonState, setButtonState] = useState<ButtonState>("Request");
  const [buttonClr, setButtonClr] = useState<ButtonClr>("#5B5FEF");
  const [rating, setRating] = useState<number>(0);
  const [ratingCount, setRatingCount] = useState<number>(0);
  const [matchInterests, setMatchInterests] = useState<string[]>([]);
  const [showAllInterests, setShowAllInterests] = useState(false);
  const [matchType, setMatchType] = useState<string>('random');
  const [trustScore, setTrustScore] = useState<number>(100);

  const matchIdRef = useRef<string | null>(null);
  const remoteUserRef = useRef<any>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const translateY = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0.6)).current;

  type ButtonState = "Request" | "Requested" | "Accept" | "Accepted";
  type ButtonClr = "#5B5FEF" | "#7C3AED" | "#22c55e";

  // ─── Helpers ──────────────────────────────────────────────────────────────

  const resetToSearching = () => {
    setHasMatch(false);
    setMatchName("");
    setMatchUri("");
    setTimeLeft(10);
    matchIdRef.current = null;
    setPick(undefined);
    setButtonClr("#5B5FEF");
    setButtonState("Request");
    setRating(0);
    setRatingCount(0);
    setMatchInterests([]);
    setMatchType('random');
    if (timerRef.current) clearInterval(timerRef.current);
  };

  const startTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setTimeLeft(10);

    timerRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(timerRef.current!);
          const mid = matchIdRef.current;
          if (mid) {
            socket.emit("match-skip", { matchId: mid });
          }
          if (remoteUserRef.current) dispatch(pushSkippedUser(remoteUserRef.current));
          resetToSearching();
          socket.emit("find-match", { preference });
          return 10;
        }
        return t - 1;
      });
    }, 1000);
  };

  // ─── Shared Cancel/Back Logic ──────────────────────────────────────────────

  const handleGlobalStopSearch = useCallback(() => {
    console.log("[MatchFound] Emitting stop-search and navigating home");
    const mid = matchIdRef.current;

    if (mid) {
      socket.emit("match-skip", { matchId: mid });
      socket.emit("match-cancel", { matchId: mid });
    }
    socket.emit("stop-search");
    socket.emit("leave-matching");
     // Critical requirement
    setView(AppView.HOME);
  }, [setView]);

  // ─── Lifecycle & Sockets ───────────────────────────────────────────────────

  useEffect(() => {
    const startSearching = () => {
      console.log(`[MatchFound] Attempting to find match with preference: ${preference}...`);
      setTimeout(() => {
        if (socket.connected) {
          socket.emit("find-match", { preference });
        }
      }, 1000);
    };

    if (ratingModalVisible) {
       // Wait for user to rate before searching
       return;
    }

    if (socket.connected) startSearching();
    else socket.once("connect", startSearching);

    // ✅ App Background Scenario
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (nextAppState.match(/inactive|background/)) {
        console.log("[MatchFound] App Background — canceling and navigating home");
        handleGlobalStopSearch();
      }
    };
    const appStateSub = AppState.addEventListener("change", handleAppStateChange);

    const onMatchFound = (data: any) => {
      const mid = data?.match?._id || data?.matchId || data?._id;
      const user = data?.matchedUser || data?.remoteUser || data?.user || (data?.match?.users ? data.match.users[0] : null);

      if (!user && !mid) return;

      console.log("[MatchFound] matched user:", JSON.stringify(user, null, 2));

      const name = user?.displayName || user?.fullName || user?.name || "Unknown";
      let pic = user?.profilePicture || user?.image || "";
      if (pic && !pic.includes("http")) pic = `${IMAGE_BASE_URL}${pic}`;

      // ✅ Fix: Use correct field names from backend
      const rCount = user?.ratingCount || 0;
      const totalScore = user?.totalRatingScore || 0;
      const avgRating = rCount > 0 ? totalScore / rCount : 0;

      remoteUserRef.current = user;
      matchIdRef.current = mid;
      setMatchName(name);
      setMatchRole(user?.role || "");
      setMatchIsPremium(user?.isPremium === "premium");
      setMatchUri(pic);
      setRating(avgRating);
      setRatingCount(rCount);
      setMatchInterests(Array.isArray(user?.interests) ? user.interests : []);
      setMatchType(data?.matchType || 'random');
      setTrustScore(user?.trustScore ?? 100);
      setHasMatch(true);
      startTimer();
    };

    const onPingPresence = (incoming: any) => {
      const mid = incoming?.matchId || matchIdRef.current;
      socket.emit("pong-presence", { matchId: mid });
    };

    const onCallStart = (data: any) => {
      console.log("[MatchFound] call-start:", data);
      if (timerRef.current) clearInterval(timerRef.current);
      if (data?.remoteUser) {
        saveUser({
          _userId: data.remoteUser._id,
          _userName: data.remoteUser.fullName || data.remoteUser.displayName,
        });
      }
      const remoteUser = data?.remoteUser ?? remoteUserRef.current;
      
      const participantName = remoteUser?.displayName || remoteUser?.fullName || "Partner";
      let participantImage = remoteUser?.profilePicture || "";
      if (participantImage && !participantImage.includes("http")) {
        participantImage = `${IMAGE_BASE_URL}${participantImage}`;
      }

      setView(AppView.VIDEO_CHAT, {
        callId: data?.match?._id || data?.matchId,
        role: data?.role,
        matchId: data?.match?._id || data?.matchId,
        participantName,
        participantImage,
        matchData: data?.match,
        streamToken: data?.streamToken,
        remoteUserId: remoteUser?._id || remoteUser?.id,
        preference: preference,
      });
    };

    const onSearching = () => {
      console.log("ℹ️ [MatchFound] Received searching event, returning to radar animation");
      resetToSearching();
    };

    socket.on("match-found", onMatchFound);
    socket.on("ping-presence", onPingPresence);
    socket.on("call-start", onCallStart);
    socket.on("match-declined", onMatchDeclined);
    socket.on("partner-accepted", onPartnerAccepted);
    socket.on("searching", onSearching);

    return () => {
      // ✅ Screen Dispose/Unmount Scenario
      console.log("[MatchFound] Dispose — emitting stop-search");
      socket.emit("stop-search");

      appStateSub.remove();
      socket.off("connect", startSearching);
      socket.off("match-found", onMatchFound);
      socket.off("ping-presence", onPingPresence);
      socket.off("call-start", onCallStart);
      socket.off("match-declined", onMatchDeclined);
      socket.off("partner-accepted", onPartnerAccepted);
      socket.off("searching", onSearching);
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [socket, setView, handleGlobalStopSearch]);

  const onMatchDeclined = () => {
    resetToSearching();
    socket.emit("find-match", { preference });
  };

  const onPartnerAccepted = (incoming: any) => {
    if (incoming) {
      setPick(incoming);
      setButtonClr("#22c55e");
      setButtonState("Accept");
    }
  };

  // ✅ Android Hardware Back Press Scenario
  useEffect(() => {
    if (Platform.OS !== "android") return;
    const sub = BackHandler.addEventListener("hardwareBackPress", () => {
      handleGlobalStopSearch();
      return true;
    });
    return () => sub.remove();
  }, [handleGlobalStopSearch]);

  // ─── Animations ───────────────────────────────────────────────────────────

  useEffect(() => {
    Animated.loop(
      Animated.parallel([
        Animated.timing(scaleAnim, { toValue: 1, duration: 1500, useNativeDriver: true }),
        Animated.timing(opacityAnim, { toValue: 0, duration: 1500, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const scale = scaleAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 1.5] });

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(translateY, { toValue: 0.5, duration: 500, useNativeDriver: true }),
        Animated.timing(translateY, { toValue: 2.5, duration: 500, useNativeDriver: true }),
      ])
    ).start();
  }, [translateY]);

  // ─── Actions ──────────────────────────────────────────────────────────────

  const handleDecline = useCallback(() => {
    const mid = matchIdRef.current;
    if (remoteUserRef.current) dispatch(pushSkippedUser(remoteUserRef.current));
    resetToSearching();
    if (mid) {
      socket.emit("match-skip", { matchId: mid });
      socket.emit("find-match", { preference });
    } else {
      handleGlobalStopSearch();
    }
  }, [handleGlobalStopSearch, dispatch]);

  const [showLowRatingModal, setShowLowRatingModal] = useState(false);

  const handleAccept = () => {
    if (ratingCount > 0 && rating < 2.0) {
      setShowLowRatingModal(true);
      return;
    }
    proceedWithAccept();
  };

  const proceedWithAccept = () => {
    setShowLowRatingModal(false);
    const mid = matchIdRef.current;
    if (timerRef.current) clearInterval(timerRef.current);
    if (mid) {
      socket.emit("match-request", { matchId: mid });
      setButtonClr("#7C3AED");
      setButtonState(data ? "Accepted" : "Requested");
    }
  };

  // ─── UI Rendering ─────────────────────────────────────────────────────────

  if (!hasMatch) {
    return (
      <View style={{ flex: 1, marginBottom: 10 }}>
        <MobileContainer>
          <View style={styles.searchingWrap}>
            <View style={styles.pulseContainer}>
              <Animated.View style={[styles.pulseRing, { transform: [{ scale: scaleAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 2] }) }], opacity: opacityAnim }]} />
              <View style={styles.pulseCore}><ActivityIndicator size="large" color={colors.success} /></View>
            </View>
            <Animated.View style={[styles.foundBadge, { transform: [{ translateY }], marginTop: 48 }]}>
              <Text style={{ color: colors.success }}>Searching...</Text>
            </Animated.View>
            <Text style={styles.searchTitle}>Finding Your{"\n"}Match</Text>
            <Text style={styles.searchSubtitle}>Looking for someone to connect with...</Text>

            {/* ✅ Cancel Button Scenario */}
            <TouchableOpacity onPress={handleGlobalStopSearch} style={styles.cancelBtn}>
              <SkipForward color={colors.tertiary} size={20} />
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
          {/* Rating Modal for post-call */}
      <Modal visible={ratingModalVisible} transparent={true} animationType="fade">
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', alignItems: 'center' }}>
          <View style={{ backgroundColor: colors.surface, padding: 24, borderRadius: 20, width: '85%', alignItems: 'center' }}>
            <Text style={{ color: colors.white, fontSize: 22, fontWeight: 'bold', marginBottom: 10 }}>Rate Your Call</Text>
            <Text style={{ color: colors.textMuted, fontSize: 14, textAlign: 'center', marginBottom: 20 }}>
              How was your conversation with {lastPartnerName || 'your partner'}?
            </Text>
            <View style={{ flexDirection: 'row', justifyContent: 'center', marginBottom: 30 }}>
              {[1, 2, 3, 4, 5].map((star) => (
                <TouchableOpacity key={star} onPress={() => setGivenRating(star)} style={{ padding: 5 }}>
                  <Star size={40} color={givenRating >= star ? colors.gold : colors.surfaceAlt} fill={givenRating >= star ? colors.gold : "transparent"} />
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity 
              style={[styles.actionBtn, { width: '100%', backgroundColor: givenRating > 0 ? colors.primary : colors.surfaceAlt }]}
              disabled={givenRating === 0}
              onPress={async () => {
                if (givenRating > 0 && lastMatchId) {
                  try {
                    await fetch('/api/v1/match/rate', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${socket.auth?.token?.split(' ')[1]}` },
                      body: JSON.stringify({ matchId: lastMatchId, rating: givenRating })
                    });
                  } catch(e) {}
                }
                setRatingModalVisible(false);
                // Trigger searching after modal closes
                if (socket.connected) {
                  socket.emit("find-match", { preference });
                }
              }}
            >
              <Text style={{ color: colors.white, fontWeight: 'bold' }}>Submit Rating</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={{ marginTop: 15 }}
              onPress={() => {
                setRatingModalVisible(false);
                if (socket.connected) {
                  socket.emit("find-match", { preference });
                }
              }}
            >
              <Text style={{ color: colors.textMuted }}>Skip</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </MobileContainer>
  );
};

  return (
    <View style={{ flex: 1, marginBottom: 10 }}>
      <MobileContainer>
        <View style={styles.matchFoundWrap}>
          <Image source={{ uri: matchUri }} style={styles.matchBg} />
          <View style={styles.matchOverlay} />

          {/* ✅ UI Back Button Scenario */}
          <TouchableOpacity onPress={handleGlobalStopSearch} style={styles.cancelTopBtn}>
            <ArrowLeft color={colors.white} size={22} />
          </TouchableOpacity>

          <View style={styles.matchHeader}>
            <Animated.View style={[styles.foundBadge, { transform: [{ translateY }] }]}>
              <Text style={{ color: colors.success }}>Match Found</Text>
            </Animated.View>
            <Text style={styles.matchTitle}>It's a Match!</Text>
            <Text style={styles.matchSubtitle}>Someone wants to chat.</Text>
          </View>

          <View style={{ height: 30 }} />

          <View style={styles.matchCenter}>
            <View style={styles.matchAvatarWrap}>
              <Image source={{ uri: matchUri }} style={styles.matchAvatar} />
            </View>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginTop: 32 }}>
              <Text style={[styles.matchName, { marginTop: 0 }]}>{matchName}</Text>
              {matchIsPremium && (
                <View style={{ backgroundColor: "#FFD700", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 }}>
                  <Text style={{ color: "#000", fontWeight: "bold", fontSize: 12 }}>VIP</Text>
                </View>
              )}
            </View>

            <View style={styles.onlineBadge}>
              <View style={styles.onlineDotWrap}>
                <Animated.View
                  style={[
                    styles.onlinePulse,
                    { transform: [{ scale: scale }], opacity: opacityAnim }
                  ]}
                />
                <View style={styles.onlineDot} />
              </View>
              <Text style={styles.onlineText}>Online Now</Text>
            </View>

            <View style={styles.matchTypeBadge}>
              <Text style={styles.matchTypeText}>
                {matchType === 'interest' ? 'Interest Based Match' : 'Random Match'}
              </Text>
            </View>

            {/* Trust Score Badge */}
            <View style={[
              styles.trustBadge, 
              { backgroundColor: trustScore >= 80 ? 'rgba(34, 197, 94, 0.2)' : trustScore >= 50 ? 'rgba(234, 179, 8, 0.2)' : 'rgba(239, 68, 68, 0.2)' }
            ]}>
              <AlertTriangle color={trustScore >= 80 ? '#22c55e' : trustScore >= 50 ? '#eab308' : '#ef4444'} size={14} />
              <Text style={[
                styles.trustText, 
                { color: trustScore >= 80 ? '#22c55e' : trustScore >= 50 ? '#eab308' : '#ef4444' }
              ]}>
                Trust Score: {trustScore}
              </Text>
            </View>

            {ratingCount > 0 && rating < 2.0 && (
              <View style={styles.lowRatingWarning}>
                <AlertTriangle color="#f59e0b" size={14} />
                <Text style={styles.lowRatingText}>Low rated profile ({rating.toFixed(1)})</Text>
              </View>
            )}

            {matchInterests.length > 0 && (
              <View style={styles.interestsContainer}>
                {matchInterests.slice(0, 3).map((interest, index) => (
                  <View key={index} style={styles.interestBadge}>
                    <Text style={styles.interestText}>{interest}</Text>
                  </View>
                ))}
                {matchInterests.length > 3 && (
                  <TouchableOpacity style={styles.interestBadge} onPress={() => setShowAllInterests(true)}>
                    <Text style={styles.interestText}>+{matchInterests.length - 3}</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}

            {/* ✅ Only show rating if there are ratings */}
            {ratingCount > 0 && (
              <View style={styles.ratingContainer}>
                <View style={styles.starsRow}>
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star
                      key={s}
                      size={16}
                      color={s <= Math.round(rating) ? colors.gold : "rgba(255,255,255,0.2)"}
                      fill={s <= Math.round(rating) ? colors.gold : "transparent"}
                    />
                  ))}
                </View>
                <Text style={styles.ratingText}>
                  {rating.toFixed(1)} 
                </Text>
              </View>
            )}

          </View>

          <View style={styles.matchFooter}>
            <Text style={styles.skipInfo}>Auto-skipping in {timeLeft}s</Text>
            <View style={styles.matchBtns}>
              <TouchableOpacity onPress={handleDecline} style={[styles.actionBtn, { backgroundColor: data ? "red" : colors.surfaceAlt }]}>
                <SkipForward color={colors.tertiary} size={20} />
                <Text style={styles.declineText}>{data ? "Decline" : "Skip"}</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleAccept} style={[styles.actionBtn, { backgroundColor: buttonClr }]}>
                <Video color={colors.white} size={20} />
                <Text style={styles.acceptText}>{buttonState}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </MobileContainer>

      {/* ── Low Rating Warning Modal ── */}
      <Modal
        visible={showLowRatingModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowLowRatingModal(false)}
      >
        <View style={styles.modalOverlayInt}>
          <View style={styles.interestsModalContainer}>
            <View style={{ alignItems: "center", marginBottom: 16 }}>
              <AlertTriangle color="#f59e0b" size={48} />
            </View>
            <Text style={styles.interestsModalTitle}>Low Rated Profile</Text>
            <Text style={{ color: "rgba(255,255,255,0.8)", textAlign: "center", marginBottom: 24, fontSize: 16, lineHeight: 24 }}>
              This user has a low average rating ({rating.toFixed(1)}). They may have violated community guidelines in the past. Are you sure you want to connect?
            </Text>
            
            <View style={{ flexDirection: "row", gap: 12 }}>
              <TouchableOpacity
                style={[styles.actionBtn, { backgroundColor: colors.surfaceAlt, flex: 1, height: 50 }]}
                onPress={() => setShowLowRatingModal(false)}
              >
                <Text style={styles.declineText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.actionBtn, { backgroundColor: "#f59e0b", flex: 1, height: 50 }]}
                onPress={proceedWithAccept}
              >
                <Text style={styles.acceptText}>Connect</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ── All Interests Modal ── */}
      <Modal
        visible={showAllInterests}
        transparent
        animationType="fade"
        onRequestClose={() => setShowAllInterests(false)}
      >
        <View style={styles.modalOverlayInt}>
          <View style={styles.interestsModalContainer}>
            <Text style={styles.interestsModalTitle}>All Interests</Text>
            <ScrollView contentContainerStyle={styles.allInterestsScroll}>
              <View style={styles.interestsContainerModal}>
                {matchInterests.map((interest, index) => (
                  <View key={index} style={styles.interestBadgeModal}>
                    <Text style={styles.interestTextModal}>{interest}</Text>
                  </View>
                ))}
              </View>
            </ScrollView>
            <TouchableOpacity
              style={styles.closeInterestsBtn}
              onPress={() => setShowAllInterests(false)}
            >
              <Text style={styles.closeInterestsText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  searchingWrap: { flex: 1, justifyContent: "center", alignItems: "center", paddingHorizontal: 32 },
  pulseContainer: { width: 120, height: 120, justifyContent: "center", alignItems: "center" },
  cancelTopBtn: { position: "absolute", top: 52, left: 20, zIndex: 10, width: 44, height: 44, borderRadius: 14, backgroundColor: "rgba(255,255,255,0.12)", justifyContent: "center", alignItems: "center" },
  pulseRing: { position: "absolute", width: 100, height: 100, borderRadius: 50, backgroundColor: colors.success, opacity: 0.3 },
  pulseCore: { width: 80, height: 80, borderRadius: 40, backgroundColor: colors.surface, justifyContent: "center", alignItems: "center", borderWidth: 2, borderColor: colors.success },
  searchTitle: { fontSize: 36, fontWeight: "900", color: colors.white, textAlign: "center", marginTop: 16 },
  searchSubtitle: { fontSize: 16, color: "gray", marginTop: 8, textAlign: "center" },
  cancelBtn: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 48, height: 64, paddingHorizontal: 32, backgroundColor: colors.surfaceAlt, borderRadius: 20 },
  cancelText: { color: colors.tertiary, fontWeight: "bold", fontSize: 16 },
  matchFoundWrap: { flex: 1 },
  onlineDotWrap: { width: 14, height: 14, justifyContent: "center", alignItems: "center" },
  onlineDot:     { width: 10, height: 10, borderRadius: 5, backgroundColor: "#22c55e" },
  onlinePulse:   { position: "absolute", width: 14, height: 14, borderRadius: 7, backgroundColor: "#22c55e" },
  onlineBadge: {
    flexDirection: "row", alignItems: "center", gap: 8,
    backgroundColor: colors.surfaceOverlaySoft,
    paddingHorizontal: 16, paddingVertical: 4,
    borderRadius: 99, marginTop: 12,
    borderWidth: 1, borderColor: "rgba(255, 255, 255, 0.2)",
  },
  onlineText: { color: "gray", fontSize: 14, fontWeight: "600" },
  matchBg: { ...StyleSheet.absoluteFillObject, opacity: 0.25 },
  matchOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: colors.overlaySurfaceSoft },
  matchHeader: { paddingTop: 80, alignItems: "center" },
  foundBadge: { backgroundColor: colors.successBorderSoft, borderWidth: 1, borderColor: colors.successBorderSoft, paddingHorizontal: 16, paddingVertical: 6, borderRadius: 99, marginBottom: 16 },
  matchTitle: { fontSize: 40, fontWeight: "900", color: colors.white },
  matchSubtitle: { fontSize: 18, color: "gray", marginTop: 4 },
  matchCenter: { flex: 1, elevation: 20, justifyContent: "center", alignItems: "center" },
  matchAvatarWrap: { width: 192, height: 192, borderRadius: 32, backgroundColor: colors.success, padding: 6, transform: [{ rotate: "3deg" }] },
  matchAvatar: { width: "100%", height: "100%", borderRadius: 28, borderWidth: 4, borderColor: colors.background },
  matchName: { fontSize: 32, fontWeight: "bold", color: colors.white, marginTop: 32 },
  matchFooter: { padding: 32, paddingBottom: 48 },
  skipInfo: { textAlign: "center", fontSize: 10, color: colors.textPlaceholder, textTransform: "uppercase", letterSpacing: 2, marginBottom: 24 },
  matchBtns: { flexDirection: "row", gap: 16 },
  actionBtn: { flex: 1, height: 64, borderRadius: 20, flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 8 },
  declineText: { color: colors.tertiary, fontWeight: "bold", fontSize: 16 },
  acceptText: { color: colors.white, fontWeight: "bold", fontSize: 16 },
  interestsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 8,
    marginTop: 16,
  },
  interestBadge: {
    backgroundColor: "rgba(255,255,255,0.1)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
  },
  interestText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: "600",
  },
  matchTypeText: {
    color: "#60A5FA",
    fontSize: 12,
    fontWeight: "600",
  },
  trustBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginTop: 8,
    gap: 4,
  },
  trustText: {
    fontSize: 12,
    fontWeight: "700",
  },
  ratingContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 16,
    backgroundColor: "rgba(255,255,255,0.05)",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 99,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  starsRow: {
    flexDirection: "row",
    gap: 2,
  },
  matchTypeBadge: {
    backgroundColor: "rgba(99,102,241,0.15)",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 99,
    borderWidth: 1,
    borderColor: "rgba(99,102,241,0.3)",
    marginTop: 12,
  },
  lowRatingWarning: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(245,158,11,0.1)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 99,
    borderWidth: 1,
    borderColor: "rgba(245,158,11,0.3)",
    marginTop: 12,
  },
  lowRatingText: { color: "#f59e0b", fontSize: 12, fontWeight: "600" },
  ratingText: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 14,
    fontWeight: "600",
  },
  modalOverlayInt: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  interestsModalContainer: {
    width: "100%",
    backgroundColor: colors.surfaceAlt,
    borderRadius: 20,
    padding: 24,
    maxHeight: "70%",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  interestsModalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: colors.white,
    marginBottom: 16,
    textAlign: "center",
  },
  allInterestsScroll: {
    paddingBottom: 20,
  },
  interestsContainerModal: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 8,
  },
  interestBadgeModal: {
    backgroundColor: "rgba(99, 102, 241, 0.15)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(99, 102, 241, 0.25)",
  },
  interestTextModal: {
    color: "#a5b4fc",
    fontSize: 14,
    fontWeight: "600",
  },
  closeInterestsBtn: {
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: "center",
    marginTop: 16,
  },
  closeInterestsText: {
    color: colors.white,
    fontWeight: "bold",
    fontSize: 16,
  },
});