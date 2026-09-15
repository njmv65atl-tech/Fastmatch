import * as React from "react";
import { useState } from "react";
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
} from "lucide-react-native";
import LinearGradient from "react-native-linear-gradient";
import { useCreateSupportTicketMutation, useGetUserSupportTicketsQuery } from "../../redux/services/auth";
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
    a: "Subscriptions (Monthly at $9.00/mo and Yearly at $90.00/yr) provide unlimited matching, advanced filters, and priority queues. They are processed securely via Apple App Store or Google Play and can be managed or cancelled anytime in your device store settings.",
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

  const [createSupportTicket, { isLoading: isSubmitting }] = useCreateSupportTicketMutation();
  const { data: ticketsData, isLoading: isLoadingTickets, refetch: refetchTickets } = useGetUserSupportTicketsQuery({});

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

      const res: any = await createSupportTicket(payload).unwrap();
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
            style={styles.emailBtn}
            onPress={handleSendEmail}
            activeOpacity={0.8}
          >
            <Mail size={16} color="#0F172A" />
            <Text style={styles.emailBtnText}>Email Support</Text>
          </TouchableOpacity>
        </LinearGradient>
      </View>

      {/* Tabs */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tabBtn, activeTab === "faq" && styles.tabBtnActive]}
          onPress={() => setActiveTab("faq")}
        >
          <Text style={[styles.tabText, activeTab === "faq" && styles.tabTextActive]}>
            FAQ
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabBtn, activeTab === "ticket" && styles.tabBtnActive]}
          onPress={() => setActiveTab("ticket")}
        >
          <Text style={[styles.tabText, activeTab === "ticket" && styles.tabTextActive]}>
            Submit Ticket
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabBtn, activeTab === "history" && styles.tabBtnActive]}
          onPress={() => setActiveTab("history")}
        >
          <Text style={[styles.tabText, activeTab === "history" && styles.tabTextActive]}>
            My Tickets
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* FAQ TAB */}
        {activeTab === "faq" && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Frequently Asked Questions</Text>
            {FAQS.map((faq, idx) => {
              const isOpen = expandedFaq === idx;
              return (
                <View key={idx} style={styles.faqCard}>
                  <TouchableOpacity
                    style={styles.faqHeader}
                    onPress={() => toggleFaq(idx)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.faqQuestion}>{faq.q}</Text>
                    {isOpen ? (
                      <ChevronUp size={20} color={colors.textMuted} />
                    ) : (
                      <ChevronDown size={20} color={colors.textMuted} />
                    )}
                  </TouchableOpacity>
                  {isOpen && (
                    <View style={styles.faqBody}>
                      <Text style={styles.faqAnswer}>{faq.a}</Text>
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        )}

        {/* SUBMIT TICKET TAB */}
        {activeTab === "ticket" && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Submit a Request</Text>
            <Text style={styles.formHint}>
              Describe your issue or question and our staff will respond within 24 hours.
            </Text>

            {/* Category Select */}
            <Text style={styles.inputLabel}>Category</Text>
            <View style={styles.categoryRow}>
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
            <Text style={styles.sectionTitle}>My Support Tickets</Text>
            {isLoadingTickets ? (
              <ActivityIndicator color={colors.primary} style={{ marginTop: 20 }} />
            ) : ticketsData?.data && ticketsData.data.length > 0 ? (
              ticketsData.data.map((t: any) => (
                <View key={t._id} style={styles.ticketCard}>
                  <View style={styles.ticketHeader}>
                    <Text style={styles.ticketSubject}>{t.subject}</Text>
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
                  <Text style={styles.ticketMessage}>{t.message}</Text>
                  <View style={styles.ticketMeta}>
                    <Clock size={12} color="#64748B" />
                    <Text style={styles.ticketDate}>
                      {new Date(t.createdAt).toLocaleDateString()}
                    </Text>
                    <Text style={styles.ticketCategory}>• {t.category.toUpperCase()}</Text>
                  </View>

                  {t.adminReply && (
                    <View style={styles.adminReplyBox}>
                      <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 4 }}>
                        <CheckCircle2 size={14} color="#10B981" />
                        <Text style={styles.adminReplyTitle}>Support Team Response:</Text>
                      </View>
                      <Text style={styles.adminReplyText}>{t.adminReply}</Text>
                    </View>
                  )}
                </View>
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
    </MobileContainer>
  );
};

const styles = StyleSheet.create({
  bannerWrapper: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 4,
  },
  banner: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  bannerContent: {
    flexDirection: "row",
    alignItems: "center",
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
    marginTop: 2,
    lineHeight: 16,
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
    paddingBottom: 100,
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
    borderRadius: 12,
    overflow: "hidden",
  },
  submitGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
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
});
