# FastMatch Feature Plan: Profile Face Enforcement & Identity Verification

This document contains the complete technical design, architecture, cost breakdown, and roadmap for future implementation when ready.

---

## 1. Feature Overview

### Part A: Face Detection & Quality Enforcement (Profile Photo Upload)
*Goal: Reject any photo that is not a clear, single human face.*

- **Trigger**: During user registration (`ProfileSetupView`) and profile updates (`EditProfileScreen`).
- **Engine**: AWS Rekognition `DetectFaces`.
- **Validation Rules**:
  1. Exactly 1 human face detected.
  2. Face detection confidence >= 95%.
  3. Image sharpness and brightness within acceptable ranges (not overly blurry or underexposed).
  4. Eyes open, face not occluded by heavy masks or dark sunglasses.
- **Error Feedback**:
  - 0 faces: *"No human face detected. Please upload a clear photo of yourself."*
  - >1 faces: *"Group photos not allowed. Please upload a solo photo."*
  - Blurry/Dark: *"Photo is too blurry or dark. Please choose a clearer photo."*

---

### Part B: Identity Verification (Live Selfie vs Profile Photo 1:1 Match)
*Goal: Guarantee the user is the actual person in their profile picture (prevent catfishing) and award the verified blue checkmark badge.*

- **Trigger**: User taps "Get Verified" in `ProfileView`.
- **Capture**: Front camera opens directly in live viewfinder mode (gallery upload disabled).
- **Engine**: AWS Rekognition `CompareFaces`.
- **Workflow**:
  1. User takes a live selfie.
  2. Backend compares live selfie against active `profilePicture`.
  3. If similarity >= 85%:
     - Auto-verifies account (`isVerified = true`).
     - Awards blue verified checkmark badge across profile, discovery cards, and video chats.
  4. If similarity between 60% and 84%:
     - Flags for optional manual Admin Review in FastMatch Admin Panel.
  5. If similarity < 60%:
     - Rejects attempt with guidance to retake in good lighting.

---

## 2. Architecture & Cost Analysis

- **AWS Rekognition**:
  - FastMatch is hosted on AWS EC2, so integration requires zero external accounts—only IAM credentials (`rekognition:DetectFaces`, `rekognition:CompareFaces`).
  - **Cost**: \$0.001 per photo check (\$1.00 per 1,000 photos).
  - **Free Tier**: First 5,000 images/month free.
  - Zero mobile bundle bloat (no heavy C++ on-device ML models).
- **Comparison to 3rd Party KYC (Sumsub/Veriff/Persona)**:
  - Third-party KYC services charge \$1.50 – \$3.00 per verification with \$500–\$1,000 monthly minimums, which is unnecessary and cost-prohibitive for a consumer dating/social app. AWS Rekognition achieves 99.9% accuracy at ~\$0.001 per check.

---

## 3. Files Planned for Implementation (When Ready)

1. **Backend**:
   - `backend-api/Fast-Match-node/src/services/faceDetection.service.ts` (AWS Rekognition wrapper)
   - `backend-api/Fast-Match-node/src/controllers/api/v1/user/index.ts` (add check to `completeProfile` and implement `verifyIdentity`)
   - `backend-api/Fast-Match-node/src/routes/v1/user/routes.ts` (route `POST /api/v1/user/verify-identity`)
2. **Mobile App**:
   - `mobile-app/Fastmatch-Mobile/src/components/SelfieVerificationModal.tsx` (live camera capture modal)
   - `mobile-app/Fastmatch-Mobile/src/views/core/ProfileView.tsx` (hook up "Get Verified" button)
