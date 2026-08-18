# Fastmatch App — Feature Review & Recommendations

## Features to Remove

| # | Feature | Location | Why Remove |
|---|---------|----------|------------|
| 1 | **MonetizationView** | `src/views/core/MonetizationView.tsx` | Completely redundant — `SubscriptionView` and `WalletView` already handle all premium upgrades and coin purchases far more professionally. This view also has broken relative `fetch()` URLs that crash on mobile. |
| 2 | **Admin Dashboard (Mobile)** | `src/views/app/AdminDashboard.tsx` | Uses 100% hardcoded mock data (12,405 users, static charts). Admins should use the web dashboard. A mobile admin panel adds no value and confuses the navigation. |
| 3 | **SearchingView (Duplicate)** | `src/views/core/SearchingView.tsx` | Redundant with `MatchFoundView.tsx` which already has the radar animation, searching state, and match preview all in one flow. Having two separate search screens creates a confusing UX. |
| 4 | **PAYMENT_SUCCESS view** | Declared in `AppView` enum | View enum exists but is never rendered in `renderView()`. Dead code that should be cleaned up. |

---

## Bugs to Fix

| # | Bug | Location | Fix |
|---|-----|----------|-----|
| 1 | **Relative `fetch()` URL in rating** | [`MatchFoundView.tsx`](file:///E:/Fastmatch%20App/mobile-app/Fastmatch-Mobile/src/views/core/MatchFoundView.tsx) line ~396 | Uses `fetch('/api/v1/match/rate')` which fails on mobile. Should use `BASE_URL` or the existing `useRateMatchMutation` RTK Query hook. |
| 2 | **Profile verification is mock** | [`ProfileView.tsx`](file:///E:/Fastmatch%20App/mobile-app/Fastmatch-Mobile/src/views/core/ProfileView.tsx) line ~73 | `handleVerify` toggles local state only instead of calling the real `/api/v1/user/request-verification` endpoint. |

---

## New Features to Add

### High Priority

| # | Feature | Description | Business Value |
|---|---------|-------------|----------------|
| 1 | **User Stories** | Backend already supports `/api/v1/story/upload` and `/api/v1/story/` retrieval, but there's **no UI for it**. Add an Instagram-style stories carousel on the Home screen where users can post photos/short videos. Premium users get unlimited stories; free users get 1/day. | Massively increases daily engagement and screen time. Users come back to check stories. |
| 2 | **Interest-Based Matching Tags** | Allow users to set "match interests" (e.g., Gaming, Music, Fitness, Travel) and match with people who share similar tags. Show common interests on the match preview screen. | Reduces skip rate, improves match quality and user satisfaction. |
| 3 | **Voice-Only Mode** | Add a "Voice Chat" toggle alongside video chat. Some users prefer audio-only conversations due to privacy or comfort. | Expands user base significantly — many users avoid video chat apps specifically because of camera anxiety. |
| 4 | **User Verification Badge System** | Currently verification is mock. Implement real selfie-based verification: user takes a live selfie matching a random pose, AI compares with profile photo. Verified users get a blue checkmark badge. | Builds trust, reduces catfishing, premium users can filter for verified-only matches. |
| 5 | **Push Notification for Connection Requests** | When a user receives a connection request from Global Network, send a Firebase push notification with the sender's name and message preview. | Users currently miss requests if they don't actively check the app. This drives re-engagement. |

### Medium Priority

| # | Feature | Description | Business Value |
|---|---------|-------------|----------------|
| 6 | **Favorite / Bookmark Users** | Let users save interesting profiles from Global Network or chat history to a "Favorites" list for quick access later. | Encourages return visits and deeper social investment in the platform. |
| 7 | **"Last Seen" Timestamps** | Show "Last active 2h ago" or "Active today" on user profiles and chat list instead of just online/offline. | Standard social feature users expect. Helps gauge responsiveness. |
| 8 | **Match History with Replay** | Show a timeline of past matches with partner name, call duration, date, and rating given. Add "Reconnect" button to send a direct message. | Encourages users to reconnect with great matches they may have forgotten about. |
| 9 | **Group Video Calls** | Allow 3-4 person group video chats. Could be a premium feature where a user invites friends or matched users into a group call. | Major differentiator from competitors. Creates viral sharing potential. |
| 10 | **Referral & Invite System** | Users get bonus coins or free premium days for inviting friends who sign up. Referral code + deep link sharing via WhatsApp/Instagram. | Organic growth engine — the most cost-effective user acquisition strategy. |

### Nice to Have

| # | Feature | Description | Business Value |
|---|---------|-------------|----------------|
| 11 | **Dark/Light Theme Toggle** | Currently the app is dark-only. Add a light mode option in Settings. | Improves accessibility and user comfort during daytime use. |
| 12 | **Typing Indicators in Chat** | Show "typing..." animation when the other user is composing a message. | Standard chat UX expectation. Makes conversations feel more real-time. |
| 13 | **Read Receipts Toggle** | Let users turn read receipts on/off in Settings for privacy. | Privacy-conscious users appreciate this control. |
| 14 | **In-App Language Selector** | Let users change the app language (English, Hindi, Spanish, Arabic, etc.) from Settings. | Opens the app to non-English speaking markets globally. |
| 15 | **Animated Profile Frames** | Premium users can select animated borders/frames for their profile picture. | Fun cosmetic monetization — creates visible status symbol. |

---

## Summary

> [!IMPORTANT]
> **Quick Wins**: Remove MonetizationView and AdminDashboard (dead code cleanup), fix the rating `fetch()` bug, and implement push notifications for connection requests.

> [!TIP]
> **Biggest Impact**: User Stories (backend already built!) and Interest-Based Matching would dramatically increase engagement and match quality with relatively low development effort.

> [!NOTE]
> The app's core experience (video matching, chat, gifting, Global Network) is already very strong. The focus should now shift from adding core features to **retention and engagement mechanics** — stories, notifications, favorites, and referrals keep users coming back daily.
