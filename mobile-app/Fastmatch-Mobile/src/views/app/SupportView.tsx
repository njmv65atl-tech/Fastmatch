import * as React from "react";
import { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Linking,
  ActivityIndicator,
  LayoutAnimation,
  Platform,
  UIManager,
  RefreshControl,
  Modal,
  BackHandler,
  KeyboardAvoidingView,
} from "react-native";
import { MobileContainer, Header } from "../../components/UIComponents";
import { AppView } from "../../types";
import { colors } from "../../utils/colors";
import {
  HelpCircle,
  Mail,
  ChevronDown,
  ChevronUp,
  Send,
  ShieldCheck,
  LifeBuoy,
  MessageSquare,
  Clock,
  CheckCircle2,
  X,
  CornerDownRight,
} from "lucide-react-native";
import LinearGradient from "react-native-linear-gradient";
import {
  useCreateSupportTicketMutation,
  useGetUserSupportTicketsQuery,
  useReplySupportTicketMutation,
} from "../../redux/services/auth";
import { ShowAlertMessage, popTypes } from "../../helpers/commonFunctions";
import { useSelector } from "react-redux";
import { userSelector } from "../../redux/slices/persistedSlice";

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface SupportViewProps {
  setView: (view: AppView) => void;
}

const FAQS = [
  {
    q: "Is my live video chat recorded or saved?",
    a: "No. All video streams on Fastmatch are 100% ephemeral and transmitted peer-to-peer using encrypted WebRTC. We never record, tap, monitor, or store any video or voice communications on our servers.",
  },
  {
    q: "How do subscriptions and refunds work?",
    a: "Subscriptions provide unlimited matching, advanced filters, and priority queues. They are processed securely via Apple App Store or Google Play and can be managed or cancelled anytime in your device store settings.",
  },
  {
    q: "How do I report or block abusive users?",
    a: "During any call or profile view, tap the Report button or the Flag icon. You can report nudity, harassment, or inappropriate conduct. Our automated moderation and human safety team review reports 24/7, and abusive users receive permanent device-level bans.",
  },
  {
    q: "What are virtual coins and how do I use them?",
    a: "Coins allow you to send animated virtual gifts to matches and unlock premium filters. You can purchase coins in the Wallet or earn daily login streak rewards.",
  },
  {
    q: "How do I permanently delete my account?",
    a: "Go to Settings > Delete Account. This will permanently erase your profile, photos, chat history, and tokens from our systems in accordance with privacy laws.",
  },
];

export const SupportView: React.FC<SupportViewProps> = ({ setView }) => {
  const user = useSelector(userSelector);
  const [activeTab, setActiveTab] = useState<"faq" | "ticket" | "history">("faq");
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  // Ticket form state
  const [category, setCategory] = useState("account");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [email, setEmail] = useState(user?.email || "");

  // Interactive ticket detail & reply state
  const [selectedTicket, setSelectedTicket] = useState<any | null>(null);
  const [replyMessage, setReplyMessage] = useState("");

  const [createSupportTicket, { isLoading: isSubmitting }] = useCreateSupportTicketMutation();
  const { data: ticketsData, isLoading: isLoadingTickets, refetch: refetchTickets } = useGetUserSupportTicketsQuery({});
  const [replySupportTicket, { isLoading: isReplying }] = useReplySupportTicketMutation();

  // Android back button handling
  useEffect(() => {
    if (Platform.OS === 'android') {
      const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
        if (selectedTicket) {
          setSelectedTicket(null);
          return true;
        }
        setView(AppView.SETTINGS);
        return true;
      });
      return () => backHandler.remove();
    }
  }, [selectedTicket, setView]);

  const toggleFaq = (index: number) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedFaq(expandedFaq === index ? null : index);
  };

  const handleSendEmail = () => {
    Linking.openURL("mailto:support@fastmatch.app?subject=Support Request - Fastmatch");
  };

  const handleSubmitTicket = async () => {
    if (!subject.trim()) {
      ShowAlertMessage("Please enter a subject", popTypes.error);
      return;
    }
    if (!message.trim()) {
      ShowAlertMessage("Please describe your issue", popTypes.error);
      return;
    }

    try {
      const payload = {
        category,
        subject: subject.trim(),
        message: message.trim(),
        email: email.trim() || user?.email,
      };

      await createSupportTicket(payload).unwrap();
      ShowAlertMessage("Support ticket submitted! We'll reply soon.", popTypes.success);
      setSubject("");
      setMessage("");
      refetchTickets();
      setActiveTab("history");
    } catch (err: any) {
      console.warn("Support ticket error:", err);
      ShowAlertMessage(err?.data?.message || "Failed to submit ticket. Please try again.", popTypes.error);
    }
  };

  const handleSendReply = async () => {
    if (!replyMessage.trim() || !selectedTicket) {
      ShowAlertMessage("Please type a response message", popTypes.error);
      return;
    }

    try {
      const res: any = await replySupportTicket({
        ticketId: selectedTicket._id,
        message: replyMessage.trim(),
      }).unwrap();

      ShowAlertMessage("Reply sent to support team!", popTypes.success);
      setReplyMessage("");

      // Update local state and refetch
      if (res?.data) {
        setSelectedTicket(res.data);
      } else {
        const updatedMessages = [...(selectedTicket.messages || [])];
        updatedMessages.push({
          sender: "user",
          message: replyMessage.trim(),
          createdAt: new Date(),
        });
        setSelectedTicket({
          ...selectedTicket,
          messages: updatedMessages,
          userReply: replyMessage.trim(),
        });
      }
      refetchTickets();
    } catch (err: any) {
      console.warn("Reply ticket error:", err);
      ShowAlertMessage(err?.data?.message || "Failed to send reply. Please try again.", popTypes.error);
    }
  };

  const categories = [
    { id: "account", label: "Account" },
    { id: "billing", label: "Billing / IAP" },
    { id: "technical", label: "Technical Issue" },
    { id: "safety", label: "Safety & Reports" },
    { id: "other", label: "Other" },
  ];

  return (
    <MobileContainer>
      <Header title="Help & Support" onBack={() => setView(AppView.SETTINGS)} />

      {/* Navigation Tabs */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === "faq" && styles.activeTab]}
          onPress={() => setActiveTab("faq")}
        >
          <HelpCircle size={16} color={activeTab === "faq" ? "#F59E0B" : "#64748B"} />
          <Text style={[styles.tabText, activeTab === "faq" && styles.activeTabText]}>
            FAQs
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === "ticket" && styles.activeTab]}
          onPress={() => setActiveTab("ticket")}
        >
          <Send size={16} color={activeTab === "ticket" ? "#F59E0B" : "#64748B"} />
          <Text style={[styles.tabText, activeTab === "ticket" && styles.activeTabText]}>
            Open Ticket
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === "history" && styles.activeTab]}
          onPress={() => setActiveTab("history")}
        >
          <MessageSquare size={16} color={activeTab === "history" ? "#F59E0B" : "#64748B"} />
          <Text style={[styles.tabText, activeTab === "history" && styles.activeTabText]}>
            My Tickets
          </Text>
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 100 : 0}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={true}
          alwaysBounceVertical={true}
          refreshControl={
            <RefreshControl
              refreshing={isLoadingTickets}
              onRefresh={refetchTickets}
              tintColor={colors.primary}
              colors={[colors.primary]}
            />
          }
        >
          {/* Direct Contact Banner */}
          <View style={styles.bannerWrapper}>
            <LinearGradient
              colors={["#1E1B4B", "#312E81"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.banner}
            >
              <View style={styles.bannerContent}>
                <LifeBuoy size={28} color="#FBBF24" />
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={styles.bannerTitle}>Fastmatch Help Desk</Text>
                  <Text style={styles.bannerSubtitle}>
                    Our team is available 24/7. Reach us anytime at{" "}
                    <Text style={{ color: "#FBBF24", fontWeight: "bold" }}>support@fastmatch.app</Text>
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                style={styles.bannerBtn}
                onPress={handleSendEmail}
                activeOpacity={0.8}
              >
                <Mail size={16} color="#0F172A" />
                <Text style={styles.bannerBtnText}>Email Support</Text>
              </TouchableOpacity>
            </LinearGradient>
          </View>
        {/* FAQS TAB */}
        {activeTab === "faq" && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Frequently Asked Questions</Text>
            {FAQS.map((faq, index) => {
              const isExpanded = expandedFaq === index;
              return (
                <View key={index} style={styles.faqCard}>
                  <TouchableOpacity
                    style={styles.faqHeader}
                    onPress={() => toggleFaq(index)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.faqQuestion}>{faq.q}</Text>
                    {isExpanded ? (
                      <ChevronUp size={18} color="#94A3B8" />
                    ) : (
                      <ChevronDown size={18} color="#94A3B8" />
                    )}
                  </TouchableOpacity>
                  {isExpanded && (
                    <View style={styles.faqBody}>
                      <Text style={styles.faqAnswer}>{faq.a}</Text>
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        )}

        {/* OPEN TICKET TAB */}
        {activeTab === "ticket" && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Submit a Request</Text>
            <Text style={styles.sectionSubtitle}>
              Please select a category and provide details. Our support team typically responds within a few hours.
            </Text>

            {/* Category Select */}
            <Text style={styles.inputLabel}>Category</Text>
            <View style={styles.categoriesRow}>
              {categories.map((cat) => (
                <TouchableOpacity
                  key={cat.id}
                  style={[
                    styles.categoryChip,
                    category === cat.id && styles.categoryChipActive,
                  ]}
                  onPress={() => setCategory(cat.id)}
                >
                  <Text
                    style={[
                      styles.categoryChipText,
                      category === cat.id && styles.categoryChipTextActive,
                    ]}
                  >
                    {cat.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Subject */}
            <Text style={styles.inputLabel}>Subject</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Question about my subscription renewal"
              placeholderTextColor="#64748B"
              value={subject}
              onChangeText={setSubject}
              maxLength={100}
            />

            {/* Description */}
            <Text style={styles.inputLabel}>Message</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Provide as much detail as possible so we can help quickly..."
              placeholderTextColor="#64748B"
              value={message}
              onChangeText={setMessage}
              multiline
              numberOfLines={5}
              textAlignVertical="top"
              maxLength={1000}
            />

            {/* Email */}
            <Text style={styles.inputLabel}>Contact Email</Text>
            <TextInput
              style={styles.input}
              placeholder="your@email.com"
              placeholderTextColor="#64748B"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />

            {/* Submit Button */}
            <TouchableOpacity
              style={styles.submitBtn}
              onPress={handleSubmitTicket}
              disabled={isSubmitting}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={["#F59E0B", "#D97706"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.submitGradient}
              >
                {isSubmitting ? (
                  <ActivityIndicator color="#0F172A" />
                ) : (
                  <>
                    <Send size={18} color="#0F172A" style={{ marginRight: 8 }} />
                    <Text style={styles.submitBtnText}>Submit Support Ticket</Text>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>
        )}

        {/* MY TICKETS HISTORY TAB */}
        {activeTab === "history" && (
          <View style={styles.section}>
            <View style={styles.historyTitleRow}>
              <Text style={styles.sectionTitle}>My Support Tickets</Text>
              <Text style={styles.pullToRefreshHint}>Pull down to refresh</Text>
            </View>

            {isLoadingTickets ? (
              <ActivityIndicator color={colors.primary} style={{ marginTop: 20 }} />
            ) : ticketsData?.data && ticketsData.data.length > 0 ? (
              ticketsData.data.map((t: any) => (
                <TouchableOpacity
                  key={t._id}
                  style={styles.ticketCard}
                  activeOpacity={0.85}
                  onPress={() => setSelectedTicket(t)}
                >
                  <View style={styles.ticketHeader}>
                    <Text style={styles.ticketSubject} numberOfLines={1}>{t.subject}</Text>
                    <View
                      style={[
                        styles.statusBadge,
                        t.status === "resolved"
                          ? styles.statusResolved
                          : t.status === "in_progress"
                          ? styles.statusInProgress
                          : styles.statusOpen,
                      ]}
                    >
                      <Text style={styles.statusText}>{t.status.toUpperCase()}</Text>
                    </View>
                  </View>
                  <Text style={styles.ticketMessage} numberOfLines={2}>{t.message}</Text>
                  <View style={styles.ticketMeta}>
                    <Clock size={12} color="#64748B" />
                    <Text style={styles.ticketDate}>
                      {new Date(t.createdAt).toLocaleDateString()}
                    </Text>
                    <Text style={styles.ticketCategory}>• {t.category?.toUpperCase()}</Text>
                  </View>

                  {t.adminReply && (
                    <View style={styles.adminReplyBox}>
                      <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 4 }}>
                        <CheckCircle2 size={14} color="#10B981" />
                        <Text style={styles.adminReplyTitle}>Support Response (Tap to reply):</Text>
                      </View>
                      <Text style={styles.adminReplyText} numberOfLines={2}>{t.adminReply}</Text>
                    </View>
                  )}

                  <View style={styles.tapToViewRow}>
                    <Text style={styles.tapToViewText}>
                      {t.adminReply ? "Tap to view conversation & reply →" : "Tap to view details →"}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))
            ) : (
              <View style={styles.emptyWrap}>
                <MessageSquare size={48} color="#334155" />
                <Text style={styles.emptyText}>No support tickets yet</Text>
                <Text style={styles.emptySubtext}>
                  If you experience any issues, submit a ticket and our team will get right back to you.
                </Text>
              </View>
            )}
          </View>
        )}
      </ScrollView>
      </KeyboardAvoidingView>

      {/* TICKET DETAIL & INTERACTIVE REPLY MODAL */}
      <Modal
        visible={!!selectedTicket}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setSelectedTicket(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            {selectedTicket && (
              <>
                {/* Modal Header */}
                <View style={styles.modalHeader}>
                  <View style={{ flex: 1, marginRight: 12 }}>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 4 }}>
                      <Text style={styles.modalTicketId}>
                        Ticket #{selectedTicket._id?.slice(-6)}
                      </Text>
                      <View
                        style={[
                          styles.statusBadge,
                          selectedTicket.status === "resolved"
                            ? styles.statusResolved
                            : selectedTicket.status === "in_progress"
                            ? styles.statusInProgress
                            : styles.statusOpen,
                        ]}
                      >
                        <Text style={styles.statusText}>{selectedTicket.status?.toUpperCase()}</Text>
                      </View>
                    </View>
                    <Text style={styles.modalSubject} numberOfLines={2}>
                      {selectedTicket.subject}
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={styles.closeModalBtn}
                    onPress={() => setSelectedTicket(null)}
                  >
                    <X size={20} color="#94A3B8" />
                  </TouchableOpacity>
                </View>

                {/* Modal Message Thread */}
                <ScrollView style={styles.modalThreadScroll} contentContainerStyle={{ padding: 16 }}>
                  {/* Original Ticket Description */}
                  <View style={styles.originalQueryBox}>
                    <View style={styles.queryHeaderRow}>
                      <Text style={styles.querySender}>Your Query</Text>
                      <Text style={styles.queryTime}>
                        {new Date(selectedTicket.createdAt).toLocaleString([], {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </Text>
                    </View>
                    <Text style={styles.queryMessageText}>{selectedTicket.message}</Text>
                  </View>

                  {/* Message Thread History */}
                  {selectedTicket.messages && selectedTicket.messages.length > 0 ? (
                    selectedTicket.messages.map((m: any, idx: number) => (
                      <View
                        key={idx}
                        style={[
                          styles.bubbleWrapper,
                          m.sender === "admin" ? styles.adminBubbleWrapper : styles.userBubbleWrapper,
                        ]}
                      >
                        <View
                          style={[
                            styles.bubble,
                            m.sender === "admin" ? styles.adminBubble : styles.userBubble,
                          ]}
                        >
                          <Text style={m.sender === "admin" ? styles.adminSenderText : styles.userSenderText}>
                            {m.sender === "admin" ? "🛡️ Support Team" : "You"}
                          </Text>
                          <Text style={styles.bubbleText}>{m.message}</Text>
                          {m.createdAt && (
                            <Text style={styles.bubbleTime}>
                              {new Date(m.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                            </Text>
                          )}
                        </View>
                      </View>
                    ))
                  ) : (
                    <>
                      {/* Fallback to adminReply if messages array not yet populated */}
                      {selectedTicket.adminReply && (
                        <View style={[styles.bubbleWrapper, styles.adminBubbleWrapper]}>
                          <View style={[styles.bubble, styles.adminBubble]}>
                            <Text style={styles.adminSenderText}>🛡️ Support Team</Text>
                            <Text style={styles.bubbleText}>{selectedTicket.adminReply}</Text>
                          </View>
                        </View>
                      )}
                      {selectedTicket.userReply && (
                        <View style={[styles.bubbleWrapper, styles.userBubbleWrapper]}>
                          <View style={[styles.bubble, styles.userBubble]}>
                            <Text style={styles.userSenderText}>You</Text>
                            <Text style={styles.bubbleText}>{selectedTicket.userReply}</Text>
                          </View>
                        </View>
                      )}
                    </>
                  )}
                </ScrollView>

                {/* Reply Input Bar */}
                <View style={styles.modalReplyBar}>
                  <TextInput
                    style={styles.modalReplyInput}
                    placeholder="Type a response to support..."
                    placeholderTextColor="#64748B"
                    value={replyMessage}
                    onChangeText={setReplyMessage}
                    multiline
                    maxLength={1000}
                  />
                  <TouchableOpacity
                    style={[
                      styles.modalReplySendBtn,
                      !replyMessage.trim() && { opacity: 0.5 },
                    ]}
                    onPress={handleSendReply}
                    disabled={isReplying || !replyMessage.trim()}
                  >
                    {isReplying ? (
                      <ActivityIndicator size="small" color="#0F172A" />
                    ) : (
                      <Send size={18} color="#0F172A" />
                    )}
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>
    </MobileContainer>
  );
};

const styles = StyleSheet.create({
  bannerWrapper: {
    paddingHorizontal: 0,
    paddingTop: 4,
    paddingBottom: 16,
  },
  banner: {
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    overflow: "hidden",
  },
  bannerContent: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  bannerTitle: {
    color: colors.white,
    fontSize: 16,
    fontWeight: "bold",
  },
  bannerSubtitle: {
    color: "#CBD5E1",
    fontSize: 12,
    marginTop: 4,
    lineHeight: 18,
    flexWrap: "wrap",
  },
  emailBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FBBF24",
    paddingVertical: 10,
    borderRadius: 10,
  },
  emailBtnText: {
    color: "#0F172A",
    fontWeight: "bold",
    fontSize: 13,
    marginLeft: 6,
  },
  tabBar: {
    flexDirection: "row",
    paddingHorizontal: 16,
    marginTop: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.08)",
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
  },
  tabBtnActive: {
    borderBottomWidth: 2,
    borderBottomColor: "#F59E0B",
  },
  tabText: {
    color: "#94A3B8",
    fontSize: 14,
    fontWeight: "600",
  },
  tabTextActive: {
    color: "#F59E0B",
    fontWeight: "bold",
  },
  scrollContent: {
    padding: 16,
    paddingBottom: Platform.OS === "ios" ? 220 : 100,
    flexGrow: 1,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    color: colors.white,
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 12,
  },
  formHint: {
    color: "#94A3B8",
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 16,
  },
  faqCard: {
    backgroundColor: "#0F172A",
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
    overflow: "hidden",
  },
  faqHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
  },
  faqQuestion: {
    color: colors.white,
    fontSize: 14,
    fontWeight: "600",
    flex: 1,
    paddingRight: 10,
  },
  faqBody: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.04)",
    paddingTop: 10,
  },
  faqAnswer: {
    color: "#94A3B8",
    fontSize: 13,
    lineHeight: 20,
  },
  inputLabel: {
    color: "#E2E8F0",
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 8,
    marginTop: 10,
  },
  categoryRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 10,
  },
  categoryChip: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: "#1E293B",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },
  categoryChipActive: {
    backgroundColor: "#F59E0B",
    borderColor: "#F59E0B",
  },
  categoryChipText: {
    color: "#94A3B8",
    fontSize: 12,
    fontWeight: "600",
  },
  categoryChipTextActive: {
    color: "#0F172A",
    fontWeight: "bold",
  },
  input: {
    backgroundColor: "#0F172A",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: colors.white,
    fontSize: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  textArea: {
    height: 110,
  },
  submitBtn: {
    marginTop: 24,
    marginBottom: Platform.OS === "ios" ? 60 : 12,
    borderRadius: 12,
    overflow: "hidden",
  },
  submitGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    minHeight: 48,
  },
  submitBtnText: {
    color: "#0F172A",
    fontSize: 15,
    fontWeight: "bold",
  },
  ticketCard: {
    backgroundColor: "#0F172A",
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },
  ticketHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  ticketSubject: {
    color: colors.white,
    fontSize: 15,
    fontWeight: "bold",
    flex: 1,
    marginRight: 10,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusOpen: {
    backgroundColor: "rgba(234,179,8,0.15)",
  },
  statusInProgress: {
    backgroundColor: "rgba(59,130,246,0.15)",
  },
  statusResolved: {
    backgroundColor: "rgba(16,185,129,0.15)",
  },
  statusText: {
    color: "#FBBF24",
    fontSize: 10,
    fontWeight: "bold",
  },
  ticketMessage: {
    color: "#94A3B8",
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 10,
  },
  ticketMeta: {
    flexDirection: "row",
    alignItems: "center",
  },
  ticketDate: {
    color: "#64748B",
    fontSize: 11,
    marginLeft: 4,
  },
  ticketCategory: {
    color: "#64748B",
    fontSize: 11,
    marginLeft: 6,
  },
  adminReplyBox: {
    marginTop: 12,
    backgroundColor: "rgba(16,185,129,0.08)",
    borderRadius: 8,
    padding: 12,
    borderLeftWidth: 3,
    borderLeftColor: "#10B981",
  },
  adminReplyTitle: {
    color: "#10B981",
    fontSize: 12,
    fontWeight: "bold",
    marginLeft: 4,
  },
  adminReplyText: {
    color: "#E2E8F0",
    fontSize: 13,
    lineHeight: 18,
    marginTop: 2,
  },
  emptyWrap: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
  },
  emptyText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: "bold",
    marginTop: 12,
  },
  emptySubtext: {
    color: "#64748B",
    fontSize: 13,
    textAlign: "center",
    marginTop: 6,
    paddingHorizontal: 20,
    lineHeight: 18,
  },
  bannerBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FBBF24",
    paddingVertical: 12,
    borderRadius: 10,
    marginTop: 10,
    minHeight: 44,
  },
  bannerBtnText: {
    color: "#0F172A",
    fontWeight: "bold",
    fontSize: 13,
    marginLeft: 6,
  },
  tabContainer: {
    flexDirection: "row",
    paddingHorizontal: 16,
    marginTop: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.08)",
  },
  tab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 12,
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: "#F59E0B",
  },
  activeTabText: {
    color: "#F59E0B",
    fontWeight: "bold",
  },
  sectionSubtitle: {
    color: "#94A3B8",
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 16,
  },
  categoriesRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 10,
  },
  historyTitleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  pullToRefreshHint: {
    color: "#64748B",
    fontSize: 11,
  },
  tapToViewRow: {
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.05)",
    alignItems: "flex-end",
  },
  tapToViewText: {
    color: "#F59E0B",
    fontSize: 12,
    fontWeight: "600",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.75)",
    justifyContent: "flex-end",
  },
  modalContainer: {
    backgroundColor: "#0F172A",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: "88%",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    overflow: "hidden",
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    padding: 18,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.08)",
  },
  modalTicketId: {
    color: "#F59E0B",
    fontSize: 13,
    fontWeight: "bold",
  },
  modalSubject: {
    color: colors.white,
    fontSize: 16,
    fontWeight: "bold",
  },
  closeModalBtn: {
    padding: 6,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  modalThreadScroll: {
    maxHeight: 400,
  },
  originalQueryBox: {
    backgroundColor: "rgba(255,255,255,0.03)",
    borderRadius: 14,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },
  queryHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  querySender: {
    color: "#94A3B8",
    fontSize: 12,
    fontWeight: "bold",
  },
  queryTime: {
    color: "#64748B",
    fontSize: 11,
  },
  queryMessageText: {
    color: "#E2E8F0",
    fontSize: 14,
    lineHeight: 20,
  },
  bubbleWrapper: {
    marginBottom: 12,
    flexDirection: "row",
  },
  adminBubbleWrapper: {
    justifyContent: "flex-start",
  },
  userBubbleWrapper: {
    justifyContent: "flex-end",
  },
  bubble: {
    maxWidth: "85%",
    borderRadius: 16,
    padding: 12,
  },
  adminBubble: {
    backgroundColor: "rgba(16,185,129,0.12)",
    borderWidth: 1,
    borderColor: "rgba(16,185,129,0.3)",
    borderBottomLeftRadius: 4,
  },
  userBubble: {
    backgroundColor: "#312E81",
    borderWidth: 1,
    borderColor: "rgba(99,102,241,0.3)",
    borderBottomRightRadius: 4,
  },
  adminSenderText: {
    color: "#10B981",
    fontSize: 12,
    fontWeight: "bold",
    marginBottom: 4,
  },
  userSenderText: {
    color: "#818CF8",
    fontSize: 12,
    fontWeight: "bold",
    marginBottom: 4,
  },
  bubbleText: {
    color: colors.white,
    fontSize: 13,
    lineHeight: 18,
  },
  bubbleTime: {
    color: "#64748B",
    fontSize: 10,
    marginTop: 4,
    alignSelf: "flex-end",
  },
  modalReplyBar: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.08)",
    backgroundColor: "#0B1120",
    gap: 10,
  },
  modalReplyInput: {
    flex: 1,
    backgroundColor: "#1E293B",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    color: colors.white,
    fontSize: 14,
    maxHeight: 90,
  },
  modalReplySendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#F59E0B",
    alignItems: "center",
    justifyContent: "center",
  },
});
