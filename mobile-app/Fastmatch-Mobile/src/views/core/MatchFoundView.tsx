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
  AppState,
  AppStateStatus,
  Modal,
  ScrollView,
  Dimensions,
} from "react-native";
import { AppView, User } from "../../types";
import { SkipForward, Video, ArrowLeft, Star, AlertTriangle, MapPin, Sparkles } from "lucide-react-native";
import { useCallback, useEffect, useRef, useState } from "react";
import Svg, { Circle as SvgCircle } from "react-native-svg";

import { MobileContainer } from "../../components/UIComponents";
import { colors } from "../../utils/colors";
import { socket } from "../../socket/socket";
import { saveUser } from "../../utils/storage";
import { IMAGE_URL } from "../../config/env";
import { useDispatch } from "react-redux";
import { pushSkippedUser } from "../../redux/slices/globalSlice";
import { useRateMatchMutation } from "../../redux/services/auth";
import LinearGradient from "react-native-linear-gradient";

const IMAGE_BASE_URL = IMAGE_URL;
const { width: SCREEN_WIDTH } = Dimensions.get("window");
const AVATAR_SIZE = 140;
const COUNTDOWN_SIZE = 56;
const COUNTDOWN_STROKE = 3;
const COUNTDOWN_RADIUS = (COUNTDOWN_SIZE - COUNTDOWN_STROKE) / 2;
const COUNTDOWN_CIRCUMFERENCE = 2 * Math.PI * COUNTDOWN_RADIUS;
const TOTAL_TIME = 10;

interface CoreProps {
  user: User;
  setView: (view: AppView, params?: any) => void;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
  preference?: 'everyone' | 'male' | 'female';
  showRatingModal?: boolean;
  lastMatchId?: string;
  lastPartnerName?: string;
}

// ─── Animated Countdown Ring ────────────────────────────────
const CountdownRing = ({ timeLeft }: { timeLeft: number }) => {
  const progress = timeLeft / TOTAL_TIME;
  const strokeDashoffset = COUNTDOWN_CIRCUMFERENCE * (1 - progress);
  const ringColor = timeLeft <= 3 ? "#ef4444" : timeLeft <= 6 ? "#eab308" : colors.success;

  return (
    <View style={cStyles.countdownWrap}>
      <Svg width={COUNTDOWN_SIZE} height={COUNTDOWN_SIZE} style={{ transform: [{ rotate: "-90deg" }] }}>
        <SvgCircle
          cx={COUNTDOWN_SIZE / 2}
          cy={COUNTDOWN_SIZE / 2}
          r={COUNTDOWN_RADIUS}
          stroke="rgba(255,255,255,0.1)"
          strokeWidth={COUNTDOWN_STROKE}
          fill="none"
        />
        <SvgCircle
          cx={COUNTDOWN_SIZE / 2}
          cy={COUNTDOWN_SIZE / 2}
          r={COUNTDOWN_RADIUS}
          stroke={ringColor}
          strokeWidth={COUNTDOWN_STROKE}
          fill="none"
          strokeDasharray={`${COUNTDOWN_CIRCUMFERENCE}`}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
        />
      </Svg>
      <Text style={[cStyles.countdownText, { color: ringColor }]}>{timeLeft}s</Text>
    </View>
  );
};

const cStyles = StyleSheet.create({
  countdownWrap: { justifyContent: "center", alignItems: "center" },
  countdownText: { position: "absolute", fontSize: 16, fontWeight: "800" },
});

// ═══════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════

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
  const [timeLeft, setTimeLeft] = useState(TOTAL_TIME);
  const [buttonState, setButtonState] = useState<ButtonState>("Request");
  const [buttonClr, setButtonClr] = useState<ButtonClr>("#5B5FEF");
  const [rating, setRating] = useState<number>(0);
  const [rateMatch] = useRateMatchMutation();
  const [ratingCount, setRatingCount] = useState<number>(0);
  const [matchInterests, setMatchInterests] = useState<string[]>([]);
  const [showAllInterests, setShowAllInterests] = useState(false);
  const [matchType, setMatchType] = useState<string>('random');
  const [trustScore, setTrustScore] = useState<number>(100);
  const [freeCallsRemaining, setFreeCallsRemaining] = useState<number | null>(null);
  const [matchAge, setMatchAge] = useState<string>("");
  const [matchGender, setMatchGender] = useState<string>("");
  const [matchLocation, setMatchLocation] = useState<string>("");

  const matchIdRef = useRef<string | null>(null);
  const remoteUserRef = useRef<any>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Animations
  const pulseScale = useRef(new Animated.Value(1)).current;
  const pulseOpacity = useRef(new Animated.Value(0.6)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;
  const cardSlide = useRef(new Animated.Value(50)).current;
  const cardOpacity = useRef(new Animated.Value(0)).current;

  type ButtonState = "Request" | "Requested" | "Accept" | "Accepted";
  type ButtonClr = "#5B5FEF" | "#7C3AED" | "#22c55e";

  // ─── Helpers ──────────────────────────────────────────────

  const resetToSearching = () => {
    setHasMatch(false);
    setMatchName("");
    setMatchUri("");
    setTimeLeft(TOTAL_TIME);
    matchIdRef.current = null;
    setPick(undefined);
    setButtonClr("#5B5FEF");
    setButtonState("Request");
    setRating(0);
    setRatingCount(0);
    setMatchInterests([]);
    setMatchType('random');
    setMatchAge("");
    setMatchGender("");
    setMatchLocation("");
    cardSlide.setValue(50);
    cardOpacity.setValue(0);
    if (timerRef.current) clearInterval(timerRef.current);
  };

  const startTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setTimeLeft(TOTAL_TIME);
    timerRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(timerRef.current!);
          const mid = matchIdRef.current;
          if (mid) socket.emit("match-skip", { matchId: mid });
          if (remoteUserRef.current) dispatch(pushSkippedUser(remoteUserRef.current));
          resetToSearching();
          socket.emit("find-match", { preference });
          return TOTAL_TIME;
        }
        return t - 1;
      });
    }, 1000);
  };

  // ─── Shared Cancel/Back Logic ──────────────────────────────

  const handleGlobalStopSearch = useCallback(() => {
    const mid = matchIdRef.current;
    if (mid) {
      socket.emit("match-skip", { matchId: mid });
      socket.emit("match-cancel", { matchId: mid });
    }
    socket.emit("stop-search");
    socket.emit("leave-matching");
    setView(AppView.HOME);
  }, [setView]);

  // ─── Lifecycle & Sockets ───────────────────────────────────

  useEffect(() => {
    const startSearching = () => {
      setTimeout(() => {
        if (socket.connected) socket.emit("find-match", { preference });
      }, 1000);
    };

    if (ratingModalVisible) return;

    if (socket.connected) startSearching();
    else socket.once("connect", startSearching);

    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (nextAppState.match(/inactive|background/)) handleGlobalStopSearch();
    };
    const appStateSub = AppState.addEventListener("change", handleAppStateChange);

    const onMatchFound = (data: any) => {
      const mid = data?.match?._id || data?.matchId || data?._id;
      const user = data?.matchedUser || data?.remoteUser || data?.user || (data?.match?.users ? data.match.users[0] : null);
      if (!user && !mid) return;

      const name = user?.displayName || user?.fullName || user?.name || "Unknown";
      let pic = user?.profilePicture || user?.image || "";
      if (pic && !pic.includes("http")) pic = `${IMAGE_BASE_URL}${pic}`;

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
      setMatchAge(user?.age || "");
      setMatchGender(user?.gender || "");
      setMatchLocation(user?.location || "");
      setHasMatch(true);
      startTimer();

      // Animate card in
      Animated.parallel([
        Animated.spring(cardSlide, { toValue: 0, useNativeDriver: true, tension: 40, friction: 7 }),
        Animated.timing(cardOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
      ]).start();
    };

    const onPingPresence = (incoming: any) => {
      const mid = incoming?.matchId || matchIdRef.current;
      socket.emit("pong-presence", { matchId: mid });
    };

    const onCallStart = (data: any) => {
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
      if (participantImage && !participantImage.includes("http")) participantImage = `${IMAGE_BASE_URL}${participantImage}`;

      setView(AppView.VIDEO_CHAT, {
        callId: data?.match?._id || data?.matchId,
        role: data?.role,
        matchId: data?.match?._id || data?.matchId,
        participantName,
        participantImage,
        matchData: data?.match,
        streamToken: data?.streamToken,
        remoteUserId: remoteUser?._id || remoteUser?.id,
        preference,
      });
    };

    const onSearching = () => resetToSearching();

    const onLimitInfo = (data: any) => {
      if (data?.remaining !== undefined) setFreeCallsRemaining(data.remaining);
    };

    socket.on("match-found", onMatchFound);
    socket.on("ping-presence", onPingPresence);
    socket.on("call-start", onCallStart);
    socket.on("match-declined", onMatchDeclined);
    socket.on("partner-accepted", onPartnerAccepted);
    socket.on("searching", onSearching);
    socket.on("limit_info", onLimitInfo);

    return () => {
      socket.emit("stop-search");
      appStateSub.remove();
      socket.off("connect", startSearching);
      socket.off("match-found", onMatchFound);
      socket.off("call-start", onCallStart);
      socket.off("match-declined", onMatchDeclined);
      socket.off("partner-accepted", onPartnerAccepted);
      socket.off("searching", onSearching);
      socket.off("limit_info", onLimitInfo);
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

  // Android back
  useEffect(() => {
    if (Platform.OS !== "android") return;
    const sub = BackHandler.addEventListener("hardwareBackPress", () => {
      handleGlobalStopSearch();
      return true;
    });
    return () => sub.remove();
  }, [handleGlobalStopSearch]);

  // ─── Animations ───────────────────────────────────────────

  useEffect(() => {
    Animated.loop(
      Animated.parallel([
        Animated.timing(pulseScale, { toValue: 2, duration: 2000, useNativeDriver: true }),
        Animated.timing(pulseOpacity, { toValue: 0, duration: 2000, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, { toValue: 1, duration: 1500, useNativeDriver: false }),
        Animated.timing(glowAnim, { toValue: 0, duration: 1500, useNativeDriver: false }),
      ])
    ).start();
  }, []);

  // ─── Actions ──────────────────────────────────────────────

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

  // ═══════════════════════════════════════════════════════════
  // RENDER — SEARCHING STATE
  // ═══════════════════════════════════════════════════════════

  if (!hasMatch) {
    return (
      <View style={{ flex: 1 }}>
        <MobileContainer>
          <View style={styles.searchWrap}>
            {/* Pulse Rings */}
            <View style={styles.pulseContainer}>
              <Animated.View style={[styles.pulseRing, styles.pulseRing1, { transform: [{ scale: pulseScale }], opacity: pulseOpacity }]} />
              <Animated.View style={[styles.pulseRing, styles.pulseRing2, { transform: [{ scale: Animated.multiply(pulseScale, 0.7) }], opacity: Animated.multiply(pulseOpacity, 1.3) }]} />
              <View style={styles.pulseCore}>
                <Sparkles color={colors.primary} size={32} />
              </View>
            </View>

            <Text style={styles.searchTitle}>Finding Your Match</Text>
            <Text style={styles.searchSubtitle}>Looking for someone amazing to connect with...</Text>

            {freeCallsRemaining !== null && (
              <View style={styles.callsRemainingBadge}>
                <Text style={styles.callsRemainingText}>
                  {freeCallsRemaining}/10 free calls remaining today
                </Text>
              </View>
            )}

            <TouchableOpacity onPress={handleGlobalStopSearch} style={styles.cancelBtn}>
              <ArrowLeft color={colors.textMuted} size={18} />
              <Text style={styles.cancelText}>Cancel Search</Text>
            </TouchableOpacity>
          </View>

          {/* Rating Modal */}
          <Modal visible={ratingModalVisible} transparent animationType="fade">
            <View style={styles.ratingOverlay}>
              <View style={styles.ratingContent}>
                <Sparkles color={colors.primary} size={32} />
                <Text style={styles.ratingTitle}>Rate Your Call</Text>
                <Text style={styles.ratingSubtitle}>
                  How was your conversation with {lastPartnerName || "your partner"}?
                </Text>
                <View style={styles.starsRow}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <TouchableOpacity key={star} onPress={() => setGivenRating(star)} style={{ padding: 4 }}>
                      <Star size={36} color={givenRating >= star ? colors.gold : colors.surfaceAlt} fill={givenRating >= star ? colors.gold : "transparent"} />
                    </TouchableOpacity>
                  ))}
                </View>
                <TouchableOpacity
                  style={[styles.ratingSubmitBtn, { opacity: givenRating > 0 ? 1 : 0.4 }]}
                  disabled={givenRating === 0}
                  onPress={async () => {
                    if (givenRating > 0 && lastMatchId) {
                      try { await rateMatch({ matchId: lastMatchId, rating: givenRating }).unwrap(); } catch (e) {}
                    }
                    setRatingModalVisible(false);
                    if (socket.connected) socket.emit("find-match", { preference });
                  }}
                >
                  <Text style={styles.ratingSubmitText}>Submit</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={{ marginTop: 12 }}
                  onPress={() => {
                    setRatingModalVisible(false);
                    if (socket.connected) socket.emit("find-match", { preference });
                  }}
                >
                  <Text style={{ color: colors.textMuted, fontSize: 14 }}>Skip</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>
        </MobileContainer>
      </View>
    );
  }

  // ═══════════════════════════════════════════════════════════
  // RENDER — MATCH FOUND STATE
  // ═══════════════════════════════════════════════════════════

  const glowShadowOpacity = glowAnim.interpolate({ inputRange: [0, 1], outputRange: [0.3, 0.8] });

  return (
    <View style={{ flex: 1 }}>
      <MobileContainer>
        <View style={styles.matchWrap}>
          {/* Back button */}
          <TouchableOpacity onPress={handleGlobalStopSearch} style={styles.matchBackBtn}>
            <ArrowLeft color={colors.white} size={20} />
          </TouchableOpacity>

          {/* Top badge */}
          <View style={styles.matchBadgeRow}>
            <View style={styles.matchFoundBadge}>
              <View style={styles.matchFoundDot} />
              <Text style={styles.matchFoundText}>Match Found!</Text>
            </View>
          </View>

          {/* Animated card */}
          <Animated.View style={[styles.matchCard, { transform: [{ translateY: cardSlide }], opacity: cardOpacity }]}>
            {/* Avatar with glow */}
            <View style={styles.avatarSection}>
              <Animated.View style={[styles.avatarGlow, { opacity: glowShadowOpacity }]} />
              <View style={styles.avatarBorder}>
                {matchUri ? (
                  <Image source={{ uri: matchUri }} style={styles.avatar} />
                ) : (
                  <View style={[styles.avatar, { backgroundColor: colors.surfaceSecondary, justifyContent: "center", alignItems: "center" }]}>
                    <Text style={{ fontSize: 48, fontWeight: "bold", color: colors.textPlaceholder }}>{matchName.charAt(0)}</Text>
                  </View>
                )}
              </View>

              {/* VIP badge */}
              {matchIsPremium && (
                <View style={styles.vipBadge}>
                  <Text style={styles.vipText}>VIP</Text>
                </View>
              )}

              {/* Trust badge */}
              {trustScore < 80 && (
                <View style={[styles.trustOverlay, { backgroundColor: trustScore >= 50 ? "rgba(234,179,8,0.9)" : "rgba(239,68,68,0.9)" }]}>
                  <AlertTriangle color="#fff" size={10} />
                  <Text style={styles.trustOverlayText}>{trustScore}</Text>
                </View>
              )}
            </View>

            {/* Name + rating */}
            <Text style={styles.matchName}>{matchName}</Text>

            {ratingCount > 0 && (
              <View style={styles.ratingRow}>
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star key={s} size={14} color={s <= Math.round(rating) ? colors.gold : "rgba(255,255,255,0.15)"} fill={s <= Math.round(rating) ? colors.gold : "transparent"} />
                ))}
                <Text style={styles.ratingValue}>{rating.toFixed(1)}</Text>
              </View>
            )}

            {/* Info chips row */}
            <View style={styles.chipRow}>
              {matchAge ? <View style={styles.infoChip}><Text style={styles.infoChipText}>{matchAge} yrs</Text></View> : null}
              {matchGender ? <View style={styles.infoChip}><Text style={styles.infoChipText}>{matchGender}</Text></View> : null}
              {matchLocation ? (
                <View style={styles.infoChip}>
                  <MapPin color={colors.textMuted} size={10} />
                  <Text style={styles.infoChipText}>{matchLocation}</Text>
                </View>
              ) : null}
              <View style={[styles.infoChip, { borderColor: "rgba(34,197,94,0.3)" }]}>
                <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: colors.success }} />
                <Text style={[styles.infoChipText, { color: colors.success }]}>Online</Text>
              </View>
            </View>

            {/* Match type */}
            <View style={styles.matchTypePill}>
              <Sparkles color="#818cf8" size={12} />
              <Text style={styles.matchTypeLabel}>
                {matchType === 'interest' ? 'Interest Match' : 'Random Match'}
              </Text>
            </View>

            {/* Low rating warning */}
            {ratingCount > 0 && rating < 2.0 && (
              <View style={styles.lowRatingBanner}>
                <AlertTriangle color="#f59e0b" size={14} />
                <Text style={styles.lowRatingBannerText}>Low rated profile ({rating.toFixed(1)})</Text>
              </View>
            )}

            {/* Interests */}
            {matchInterests.length > 0 && (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.interestScroll} contentContainerStyle={{ gap: 6 }}>
                {matchInterests.slice(0, 5).map((int, i) => (
                  <View key={i} style={styles.interestPill}>
                    <Text style={styles.interestPillText}>{int}</Text>
                  </View>
                ))}
                {matchInterests.length > 5 && (
                  <TouchableOpacity style={styles.interestPill} onPress={() => setShowAllInterests(true)}>
                    <Text style={styles.interestPillText}>+{matchInterests.length - 5}</Text>
                  </TouchableOpacity>
                )}
              </ScrollView>
            )}
          </Animated.View>

          {/* ── Bottom: Countdown + Actions ── */}
          <View style={styles.matchFooter}>
            <View style={styles.actionRow}>
              <TouchableOpacity onPress={handleDecline} style={styles.skipBtn}>
                <SkipForward color={colors.tertiary} size={20} />
                <Text style={styles.skipBtnText}>{data ? "Decline" : "Skip"}</Text>
              </TouchableOpacity>

              <CountdownRing timeLeft={timeLeft} />

              <TouchableOpacity onPress={handleAccept} style={[styles.acceptBtn, { backgroundColor: buttonClr }]}>
                <Video color={colors.white} size={20} />
                <Text style={styles.acceptBtnText}>{buttonState}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* ── Low Rating Warning Modal ── */}
        <Modal visible={showLowRatingModal} transparent animationType="fade" onRequestClose={() => setShowLowRatingModal(false)}>
          <View style={styles.warningOverlay}>
            <View style={styles.warningContent}>
              <AlertTriangle color="#f59e0b" size={40} />
              <Text style={styles.warningTitle}>Low Rated Profile</Text>
              <Text style={styles.warningBody}>
                This user has a rating of {rating.toFixed(1)}. They may have violated guidelines. Continue?
              </Text>
              <View style={styles.warningBtns}>
                <TouchableOpacity style={styles.warningCancel} onPress={() => setShowLowRatingModal(false)}>
                  <Text style={styles.warningCancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.warningConfirm} onPress={proceedWithAccept}>
                  <Text style={styles.warningConfirmText}>Connect</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* ── All Interests Modal ── */}
        <Modal visible={showAllInterests} transparent animationType="fade" onRequestClose={() => setShowAllInterests(false)}>
          <View style={styles.warningOverlay}>
            <View style={styles.warningContent}>
              <Text style={styles.warningTitle}>All Interests</Text>
              <View style={styles.allInterestsWrap}>
                {matchInterests.map((int, i) => (
                  <View key={i} style={styles.interestPillModal}>
                    <Text style={styles.interestPillModalText}>{int}</Text>
                  </View>
                ))}
              </View>
              <TouchableOpacity style={styles.warningCancel} onPress={() => setShowAllInterests(false)}>
                <Text style={styles.warningCancelText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </MobileContainer>
    </View>
  );
};

// ═══════════════════════════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════════════════════════

const styles = StyleSheet.create({
  // ── Searching ──
  searchWrap: { flex: 1, justifyContent: "center", alignItems: "center", paddingHorizontal: 32 },
  pulseContainer: { width: 120, height: 120, justifyContent: "center", alignItems: "center", marginBottom: 32 },
  pulseRing: { position: "absolute", width: 120, height: 120, borderRadius: 60, borderWidth: 2 },
  pulseRing1: { borderColor: colors.primary },
  pulseRing2: { borderColor: "rgba(99,102,241,0.3)" },
  pulseCore: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.surface,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: colors.primary,
  },
  searchTitle: { fontSize: 28, fontWeight: "900", color: colors.white, textAlign: "center" },
  searchSubtitle: { fontSize: 15, color: colors.textMuted, marginTop: 8, textAlign: "center" },
  callsRemainingBadge: {
    marginTop: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  callsRemainingText: { color: colors.textMuted, fontSize: 13, fontWeight: "600" },
  cancelBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 40,
    height: 52,
    paddingHorizontal: 28,
    backgroundColor: colors.surfaceAlt,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  cancelText: { color: colors.textMuted, fontWeight: "bold", fontSize: 15 },

  // ── Match Found ──
  matchWrap: { flex: 1 },
  matchBackBtn: {
    position: "absolute",
    top: 8,
    left: 4,
    zIndex: 10,
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.08)",
    justifyContent: "center",
    alignItems: "center",
  },
  matchBadgeRow: { alignItems: "center", marginTop: 16, marginBottom: 16 },
  matchFoundBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(34,197,94,0.1)",
    borderWidth: 1,
    borderColor: "rgba(34,197,94,0.3)",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  matchFoundDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.success },
  matchFoundText: { color: colors.success, fontWeight: "700", fontSize: 14 },

  // ── Card ──
  matchCard: {
    flex: 1,
    alignItems: "center",
    paddingHorizontal: 20,
    justifyContent: "center",
  },
  avatarSection: { alignItems: "center", marginBottom: 16 },
  avatarGlow: {
    position: "absolute",
    width: AVATAR_SIZE + 24,
    height: AVATAR_SIZE + 24,
    borderRadius: (AVATAR_SIZE + 24) / 2,
    backgroundColor: colors.primary,
  },
  avatarBorder: {
    width: AVATAR_SIZE + 8,
    height: AVATAR_SIZE + 8,
    borderRadius: (AVATAR_SIZE + 8) / 2,
    padding: 3,
    borderWidth: 3,
    borderColor: colors.primary,
  },
  avatar: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
  },
  vipBadge: {
    position: "absolute",
    top: 0,
    right: -4,
    backgroundColor: "#FFD700",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  vipText: { color: "#000", fontWeight: "bold", fontSize: 10 },
  trustOverlay: {
    position: "absolute",
    bottom: 4,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  trustOverlayText: { color: "#fff", fontSize: 10, fontWeight: "bold" },

  matchName: { fontSize: 28, fontWeight: "800", color: colors.white, textAlign: "center" },

  ratingRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 6 },
  ratingValue: { color: "rgba(255,255,255,0.6)", fontSize: 13, fontWeight: "600", marginLeft: 4 },

  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 6,
    marginTop: 14,
  },
  infoChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  infoChipText: { color: colors.textMuted, fontSize: 12, fontWeight: "600" },

  matchTypePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 12,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    backgroundColor: "rgba(99,102,241,0.1)",
    borderWidth: 1,
    borderColor: "rgba(99,102,241,0.25)",
  },
  matchTypeLabel: { color: "#818cf8", fontSize: 12, fontWeight: "600" },

  lowRatingBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 10,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    backgroundColor: "rgba(245,158,11,0.1)",
    borderWidth: 1,
    borderColor: "rgba(245,158,11,0.3)",
  },
  lowRatingBannerText: { color: "#f59e0b", fontSize: 12, fontWeight: "600" },

  interestScroll: { marginTop: 14, maxHeight: 30 },
  interestPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
  },
  interestPillText: { color: colors.white, fontSize: 11, fontWeight: "600" },

  // ── Footer ──
  matchFooter: { paddingHorizontal: 20, paddingBottom: 24 },
  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  skipBtn: {
    flex: 1,
    height: 52,
    borderRadius: 16,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 6,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  skipBtnText: { color: colors.tertiary, fontWeight: "bold", fontSize: 14 },
  acceptBtn: {
    flex: 1,
    height: 52,
    borderRadius: 16,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 6,
  },
  acceptBtnText: { color: colors.white, fontWeight: "bold", fontSize: 14 },

  // ── Rating Modal ──
  ratingOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.85)", justifyContent: "center", alignItems: "center" },
  ratingContent: {
    backgroundColor: colors.surface,
    padding: 28,
    borderRadius: 24,
    width: "85%",
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  ratingTitle: { color: colors.white, fontSize: 22, fontWeight: "bold", marginTop: 12 },
  ratingSubtitle: { color: colors.textMuted, fontSize: 14, textAlign: "center", marginTop: 6, marginBottom: 20 },
  starsRow: { flexDirection: "row", justifyContent: "center", marginBottom: 24 },
  ratingSubmitBtn: {
    width: "100%",
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: colors.primary,
    alignItems: "center",
  },
  ratingSubmitText: { color: colors.white, fontWeight: "bold", fontSize: 15 },

  // ── Warning / Interests Modals ──
  warningOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.7)", justifyContent: "center", alignItems: "center", padding: 20 },
  warningContent: {
    width: "100%",
    backgroundColor: colors.surface,
    borderRadius: 24,
    padding: 24,
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  warningTitle: { fontSize: 20, fontWeight: "bold", color: colors.white, marginTop: 12, marginBottom: 8 },
  warningBody: { color: "rgba(255,255,255,0.7)", textAlign: "center", marginBottom: 24, fontSize: 14, lineHeight: 22 },
  warningBtns: { flexDirection: "row", gap: 12, width: "100%" },
  warningCancel: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: colors.surfaceAlt,
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  warningCancelText: { color: colors.textMuted, fontWeight: "bold" },
  warningConfirm: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: "#f59e0b",
    alignItems: "center",
  },
  warningConfirmText: { color: "#fff", fontWeight: "bold" },
  allInterestsWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 8,
    marginBottom: 20,
  },
  interestPillModal: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: "rgba(99,102,241,0.15)",
    borderWidth: 1,
    borderColor: "rgba(99,102,241,0.25)",
  },
  interestPillModalText: { color: "#a5b4fc", fontSize: 13, fontWeight: "600" },
});