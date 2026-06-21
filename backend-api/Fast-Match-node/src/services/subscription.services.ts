import { User } from "@models/user";
import { SubscriptionHistory } from "@models/subscription/schema";
import { Types } from "mongoose";
import axios from "axios";
import appConfig from "@config/config";
import { GoogleAuth } from 'google-auth-library';

// ─── Product ID Mapping ─────────────────────────────────────────
const PRODUCT_MAP: Record<string, { plan: 'monthly' | 'yearly'; price: number }> = {
    // iOS Product IDs (set these to match App Store Connect)
    'com.fastmatch.premium.monthly': { plan: 'monthly', price: 9 },
    'com.fastmatch.premium.yearly': { plan: 'yearly', price: 49 },
    // Android Product IDs (set these to match Play Console)
    'fastmatch_premium_monthly': { plan: 'monthly', price: 9 },
    'fastmatch_premium_yearly': { plan: 'yearly', price: 49 },
};

class SubscriptionService {

    // ═════════════════════════════════════════════════════════════
    // RECEIPT VERIFICATION (Called from App after purchase)
    // ═════════════════════════════════════════════════════════════

    /**
     * Verify In-App Purchase receipt and activate subscription
     */
    async verifyAndUpgrade(userId: Types.ObjectId, data: {
        receipt: string,
        platform: 'android' | 'ios',
        plan: 'monthly' | 'yearly',
        productId?: string,
        purchaseToken?: string
    }) {
        const { receipt, platform, plan, productId, purchaseToken } = data;

        console.log(`[Subscription] Verifying ${platform} receipt for user ${userId}, plan: ${plan}`);

        let verificationResult: any;

        if (platform === 'ios') {
            verificationResult = await this.verifyAppleReceipt(receipt);
        } else if (platform === 'android') {
            if (!productId || !purchaseToken) {
                throw new Error('productId and purchaseToken are required for Android verification.');
            }
            verificationResult = await this.verifyGoogleReceipt(productId, purchaseToken);
        } else {
            throw new Error('Invalid platform. Must be "ios" or "android".');
        }

        if (!verificationResult.isValid) {
            console.error(`[Subscription] ❌ Invalid receipt for user ${userId}`);
            throw new Error('Invalid purchase receipt. Please try again.');
        }

        // Determine plan from product ID
        const detectedPlan = verificationResult.productId
            ? (PRODUCT_MAP[verificationResult.productId]?.plan || plan)
            : plan;
        const detectedPrice = verificationResult.productId
            ? (PRODUCT_MAP[verificationResult.productId]?.price || (detectedPlan === 'yearly' ? 49 : 9))
            : (detectedPlan === 'yearly' ? 49 : 9);

        // Calculate expiry
        const expiresAt = verificationResult.expiresDate
            ? new Date(verificationResult.expiresDate)
            : this.calculateExpiry(detectedPlan);

        // Save subscription history
        const originalTxnId = verificationResult.originalTransactionId || `${platform}_${userId}_${Date.now()}`;

        await SubscriptionHistory.findOneAndUpdate(
            { originalTransactionId: originalTxnId },
            {
                userId,
                platform,
                plan: detectedPlan,
                status: 'active',
                productId: verificationResult.productId || productId || `fastmatch_premium_${detectedPlan}`,
                originalTransactionId: originalTxnId,
                latestTransactionId: verificationResult.transactionId || originalTxnId,
                purchaseToken: purchaseToken || null,
                latestReceipt: platform === 'ios' ? receipt : null,
                price: detectedPrice,
                currency: 'USD',
                purchaseDate: verificationResult.purchaseDate || new Date(),
                expiresDate: expiresAt,
                autoRenewing: verificationResult.autoRenewing !== false,
                isTrialPeriod: verificationResult.isTrialPeriod || false,
            },
            { upsert: true, new: true }
        );

        // Update user
        const updatedUser = await User.findByIdAndUpdate(userId, {
            isPremium: 'premium',
            subscriptionPlan: detectedPlan,
            subscriptionExpiresAt: expiresAt
        }, { new: true });

        console.log(`[Subscription] ✅ User ${userId} upgraded to ${detectedPlan} (expires: ${expiresAt.toISOString()})`);

        return updatedUser;
    }

    // ═════════════════════════════════════════════════════════════
    // APPLE APP STORE VERIFICATION
    // ═════════════════════════════════════════════════════════════

    private async verifyAppleReceipt(receiptData: string) {
        const APPLE_PRODUCTION_URL = 'https://buy.itunes.apple.com/verifyReceipt';
        const APPLE_SANDBOX_URL = 'https://sandbox.itunes.apple.com/verifyReceipt';
        const APPLE_SHARED_SECRET = appConfig.appleSharedSecret || '';

        const payload = {
            'receipt-data': receiptData,
            'password': APPLE_SHARED_SECRET,
            'exclude-old-transactions': true
        };

        try {
            // Try production first
            let response = await axios.post(APPLE_PRODUCTION_URL, payload);

            // Status 21007 means sandbox receipt sent to production — retry on sandbox
            if (response.data.status === 21007) {
                console.log('[Apple] Sandbox receipt detected, retrying on sandbox...');
                response = await axios.post(APPLE_SANDBOX_URL, payload);
            }

            const data = response.data;

            if (data.status !== 0) {
                console.error(`[Apple] Verification failed with status: ${data.status}`);
                return { isValid: false };
            }

            // Get the latest subscription info
            const latestInfo = data.latest_receipt_info?.[0] || data.receipt?.in_app?.[0];

            if (!latestInfo) {
                console.error('[Apple] No receipt info found');
                return { isValid: false };
            }

            return {
                isValid: true,
                productId: latestInfo.product_id,
                originalTransactionId: latestInfo.original_transaction_id,
                transactionId: latestInfo.transaction_id,
                purchaseDate: new Date(parseInt(latestInfo.purchase_date_ms)),
                expiresDate: new Date(parseInt(latestInfo.expires_date_ms)),
                isTrialPeriod: latestInfo.is_trial_period === 'true',
                autoRenewing: data.pending_renewal_info?.[0]?.auto_renew_status === '1',
            };
        } catch (error: any) {
            console.error('[Apple] Receipt verification error:', error.message);
            return { isValid: false };
        }
    }

    // ═════════════════════════════════════════════════════════════
    // GOOGLE PLAY STORE VERIFICATION
    // ═════════════════════════════════════════════════════════════

    private async verifyGoogleReceipt(productId: string, purchaseToken: string) {
        try {
            const PACKAGE_NAME = appConfig.googlePackageName;

            const auth = new GoogleAuth({
                keyFile: appConfig.googleServiceAccountKeyPath || undefined,
                scopes: ['https://www.googleapis.com/auth/androidpublisher'],
            });

            const client = await auth.getClient();
            const url = `https://androidpublisher.googleapis.com/androidpublisher/v3/applications/${PACKAGE_NAME}/purchases/subscriptions/${productId}/tokens/${purchaseToken}`;

            const response = await client.request({ url });
            const data: any = response.data;

            console.log('[Google] Subscription data:', JSON.stringify(data, null, 2));

            // paymentState: 0 = pending, 1 = received, 2 = free trial, 3 = deferred
            const isValid = data.paymentState !== undefined && data.paymentState !== 0;

            return {
                isValid,
                productId,
                originalTransactionId: data.orderId?.split('..')[0] || data.orderId,
                transactionId: data.orderId,
                purchaseDate: new Date(parseInt(data.startTimeMillis)),
                expiresDate: new Date(parseInt(data.expiryTimeMillis)),
                isTrialPeriod: data.paymentState === 2,
                autoRenewing: data.autoRenewing === true,
                cancelReason: data.cancelReason,
            };
        } catch (error: any) {
            console.error('[Google] Receipt verification error:', error.message);
            return { isValid: false };
        }
    }

    // ═════════════════════════════════════════════════════════════
    // APPLE WEBHOOK HANDLER (App Store Server Notifications V2)
    // ═════════════════════════════════════════════════════════════

    async handleAppleWebhook(body: any) {
        try {
            // Apple sends a JWT — for V1 notifications, the body is plain JSON
            const notificationType = body.notification_type || body.notificationType;
            const subtype = body.subtype || '';

            console.log(`[Apple Webhook] Type: ${notificationType}, Subtype: ${subtype}`);

            // Extract latest receipt info
            let latestInfo: any = null;
            let originalTransactionId: string = '';

            if (body.unified_receipt) {
                // V1 format
                latestInfo = body.unified_receipt.latest_receipt_info?.[0];
                originalTransactionId = latestInfo?.original_transaction_id;
            } else if (body.data) {
                // V2 format (JWT decoded)
                const signedTransactionInfo = body.data?.signedTransactionInfo;
                const signedRenewalInfo = body.data?.signedRenewalInfo;
                // In production, decode the JWS tokens. For now, treat as plain objects.
                latestInfo = signedTransactionInfo || {};
                originalTransactionId = latestInfo.originalTransactionId || latestInfo.original_transaction_id;
            }

            if (!originalTransactionId) {
                console.error('[Apple Webhook] No originalTransactionId found. Ignoring.');
                return;
            }

            const subscription = await SubscriptionHistory.findOne({ originalTransactionId });
            if (!subscription) {
                console.log(`[Apple Webhook] No subscription found for txn: ${originalTransactionId}. Ignoring.`);
                return;
            }

            // Save raw webhook for debugging
            subscription.lastWebhookType = notificationType;
            subscription.lastWebhookPayload = body;

            switch (notificationType) {
                // ── Renewal Success ──
                case 'DID_RENEW':
                case 'RENEWAL': {
                    const expiresDate = latestInfo.expires_date_ms
                        ? new Date(parseInt(latestInfo.expires_date_ms))
                        : (latestInfo.expiresDate ? new Date(latestInfo.expiresDate) : this.calculateExpiry(subscription.plan));

                    subscription.status = 'active';
                    subscription.expiresDate = expiresDate;
                    subscription.autoRenewing = true;
                    subscription.cancellationDate = undefined;
                    await subscription.save();

                    await this.activateUser(subscription.userId, subscription.plan, expiresDate);
                    console.log(`[Apple Webhook] ✅ Renewed subscription for user ${subscription.userId}`);
                    break;
                }

                // ── Cancelled / Expired ──
                case 'CANCEL':
                case 'DID_CHANGE_RENEWAL_STATUS': {
                    if (subtype === 'AUTO_RENEW_DISABLED') {
                        subscription.autoRenewing = false;
                        subscription.cancellationDate = new Date();
                        subscription.status = new Date() > subscription.expiresDate ? 'cancelled' : 'active';
                        await subscription.save();

                        // If already past expiry, deactivate immediately
                        if (new Date() > subscription.expiresDate) {
                            await this.deactivateUser(subscription.userId);
                        }
                        console.log(`[Apple Webhook] ⚠️ Auto-renew disabled for user ${subscription.userId}`);
                    } else if (subtype === 'AUTO_RENEW_ENABLED') {
                        // User re-enabled auto renew (resubscribe)
                        subscription.autoRenewing = true;
                        subscription.cancellationDate = undefined;
                        subscription.status = 'active';
                        await subscription.save();

                        await this.activateUser(subscription.userId, subscription.plan, subscription.expiresDate);
                        console.log(`[Apple Webhook] ✅ Auto-renew re-enabled for user ${subscription.userId}`);
                    }
                    break;
                }

                // ── Expired (No renewal happened) ──
                case 'EXPIRED': {
                    subscription.status = 'expired';
                    subscription.autoRenewing = false;
                    await subscription.save();

                    await this.deactivateUser(subscription.userId);
                    console.log(`[Apple Webhook] ❌ Subscription expired for user ${subscription.userId}`);
                    break;
                }

                // ── Grace Period (Billing retry) ──
                case 'DID_FAIL_TO_RENEW': {
                    if (subtype === 'GRACE_PERIOD') {
                        subscription.status = 'grace_period';
                        await subscription.save();
                        console.log(`[Apple Webhook] ⏳ Grace period started for user ${subscription.userId}`);
                    } else {
                        subscription.status = 'billing_retry';
                        await subscription.save();
                        console.log(`[Apple Webhook] 🔄 Billing retry for user ${subscription.userId}`);
                    }
                    break;
                }

                // ── Plan Upgrade / Downgrade ──
                case 'DID_CHANGE_RENEWAL_PREF': {
                    const newProductId = body.auto_renew_product_id ||
                        body.data?.signedRenewalInfo?.autoRenewProductId || '';
                    const newPlan = PRODUCT_MAP[newProductId]?.plan;

                    if (newPlan && newPlan !== subscription.plan) {
                        console.log(`[Apple Webhook] 🔄 Plan change: ${subscription.plan} → ${newPlan} for user ${subscription.userId}`);
                        subscription.plan = newPlan;
                        subscription.productId = newProductId;
                        subscription.price = PRODUCT_MAP[newProductId]?.price || subscription.price;
                        await subscription.save();

                        // Update user immediately with new plan
                        await User.findByIdAndUpdate(subscription.userId, {
                            subscriptionPlan: newPlan
                        });
                    }
                    break;
                }

                // ── Refund ──
                case 'REFUND': {
                    subscription.status = 'cancelled';
                    subscription.cancellationDate = new Date();
                    await subscription.save();

                    await this.deactivateUser(subscription.userId);
                    console.log(`[Apple Webhook] 💰 Refund processed — deactivated user ${subscription.userId}`);
                    break;
                }

                default:
                    console.log(`[Apple Webhook] Unhandled type: ${notificationType}`);
                    await subscription.save(); // Still save the webhook payload
            }
        } catch (error: any) {
            console.error('[Apple Webhook] Error:', error.message);
        }
    }

    // ═════════════════════════════════════════════════════════════
    // GOOGLE PLAY WEBHOOK HANDLER (Real-Time Developer Notifications)
    // ═════════════════════════════════════════════════════════════

    async handleGoogleWebhook(body: any) {
        try {
            // Google sends via Pub/Sub
            const messageData = body.message?.data;
            if (!messageData) {
                console.error('[Google Webhook] No message data found');
                return;
            }

            const decoded = JSON.parse(Buffer.from(messageData, 'base64').toString());
            console.log('[Google Webhook] Decoded:', JSON.stringify(decoded, null, 2));

            const subscriptionNotification = decoded.subscriptionNotification;
            if (!subscriptionNotification) {
                console.log('[Google Webhook] Not a subscription notification, ignoring.');
                return;
            }

            const { notificationType, purchaseToken, subscriptionId } = subscriptionNotification;
            const PACKAGE_NAME = decoded.packageName;

            console.log(`[Google Webhook] Type: ${notificationType}, Product: ${subscriptionId}`);

            // Look up subscription by purchaseToken or fetch from Google
            let subscription = await SubscriptionHistory.findOne({ purchaseToken });

            // If not found by token, try to verify and find by the latest data
            let googleData: any = null;
            try {
                const verifyResult = await this.verifyGoogleReceipt(subscriptionId, purchaseToken);
                googleData = verifyResult;

                if (!subscription && verifyResult.originalTransactionId) {
                    subscription = await SubscriptionHistory.findOne({
                        originalTransactionId: verifyResult.originalTransactionId
                    });
                }
            } catch (e: any) {
                console.error('[Google Webhook] Verify error:', e.message);
            }

            if (!subscription) {
                console.log(`[Google Webhook] No subscription found for token. Ignoring.`);
                return;
            }

            // Save raw webhook
            subscription.lastWebhookType = `GOOGLE_${notificationType}`;
            subscription.lastWebhookPayload = decoded;
            subscription.purchaseToken = purchaseToken; // Update token

            /*
                Google notificationType values:
                1  = SUBSCRIPTION_RECOVERED (renewed from hold)
                2  = SUBSCRIPTION_RENEWED
                3  = SUBSCRIPTION_CANCELED
                4  = SUBSCRIPTION_PURCHASED (new purchase)
                5  = SUBSCRIPTION_ON_HOLD (billing failed)
                6  = SUBSCRIPTION_IN_GRACE_PERIOD
                7  = SUBSCRIPTION_RESTARTED (resubscribe)
                8  = SUBSCRIPTION_PRICE_CHANGE_CONFIRMED
                9  = SUBSCRIPTION_DEFERRED
                10 = SUBSCRIPTION_PAUSED
                11 = SUBSCRIPTION_PAUSE_SCHEDULE_CHANGED
                12 = SUBSCRIPTION_REVOKED (refund)
                13 = SUBSCRIPTION_EXPIRED
                20 = SUBSCRIPTION_PENDING_PURCHASE_CANCELED
            */

            switch (notificationType) {
                // ── New Purchase ──
                case 4: {
                    const newPlan = PRODUCT_MAP[subscriptionId]?.plan || subscription.plan;
                    const expiresDate = googleData?.expiresDate || this.calculateExpiry(newPlan);

                    subscription.status = 'active';
                    subscription.plan = newPlan;
                    subscription.expiresDate = expiresDate;
                    subscription.autoRenewing = googleData?.autoRenewing !== false;
                    await subscription.save();

                    await this.activateUser(subscription.userId, newPlan, expiresDate);
                    console.log(`[Google Webhook] ✅ New purchase for user ${subscription.userId}`);
                    break;
                }

                // ── Renewed ──
                case 1:
                case 2: {
                    const expiresDate = googleData?.expiresDate || this.calculateExpiry(subscription.plan);

                    subscription.status = 'active';
                    subscription.expiresDate = expiresDate;
                    subscription.autoRenewing = true;
                    subscription.cancellationDate = undefined;
                    await subscription.save();

                    await this.activateUser(subscription.userId, subscription.plan, expiresDate);
                    console.log(`[Google Webhook] ✅ Subscription renewed for user ${subscription.userId}`);
                    break;
                }

                // ── Cancelled ──
                case 3: {
                    subscription.autoRenewing = false;
                    subscription.cancellationDate = new Date();
                    // Keep active until expiry
                    subscription.status = new Date() > subscription.expiresDate ? 'cancelled' : 'active';
                    await subscription.save();

                    if (new Date() > subscription.expiresDate) {
                        await this.deactivateUser(subscription.userId);
                    }
                    console.log(`[Google Webhook] ⚠️ Subscription cancelled for user ${subscription.userId} (access until ${subscription.expiresDate})`);
                    break;
                }

                // ── Grace Period ──
                case 6: {
                    subscription.status = 'grace_period';
                    await subscription.save();
                    console.log(`[Google Webhook] ⏳ Grace period for user ${subscription.userId}`);
                    break;
                }

                // ── On Hold (Billing failed) ──
                case 5: {
                    subscription.status = 'billing_retry';
                    await subscription.save();

                    await this.deactivateUser(subscription.userId);
                    console.log(`[Google Webhook] 🔄 On hold (billing retry) for user ${subscription.userId}`);
                    break;
                }

                // ── Resubscribe ──
                case 7: {
                    const expiresDate = googleData?.expiresDate || this.calculateExpiry(subscription.plan);

                    subscription.status = 'active';
                    subscription.autoRenewing = true;
                    subscription.cancellationDate = undefined;
                    subscription.expiresDate = expiresDate;
                    await subscription.save();

                    await this.activateUser(subscription.userId, subscription.plan, expiresDate);
                    console.log(`[Google Webhook] ✅ User ${subscription.userId} resubscribed!`);
                    break;
                }

                // ── Expired ──
                case 13: {
                    subscription.status = 'expired';
                    subscription.autoRenewing = false;
                    await subscription.save();

                    await this.deactivateUser(subscription.userId);
                    console.log(`[Google Webhook] ❌ Subscription expired for user ${subscription.userId}`);
                    break;
                }

                // ── Revoked (Refund) ──
                case 12: {
                    subscription.status = 'cancelled';
                    subscription.cancellationDate = new Date();
                    await subscription.save();

                    await this.deactivateUser(subscription.userId);
                    console.log(`[Google Webhook] 💰 Revoked (refund) for user ${subscription.userId}`);
                    break;
                }

                // ── Price Change Confirmed (plan upgrade/downgrade via Play Store) ──
                case 8: {
                    const newPlan = PRODUCT_MAP[subscriptionId]?.plan;
                    if (newPlan && newPlan !== subscription.plan) {
                        console.log(`[Google Webhook] 🔄 Plan change: ${subscription.plan} → ${newPlan}`);
                        subscription.plan = newPlan;
                        subscription.productId = subscriptionId;
                        subscription.price = PRODUCT_MAP[subscriptionId]?.price || subscription.price;
                        await subscription.save();

                        await User.findByIdAndUpdate(subscription.userId, {
                            subscriptionPlan: newPlan
                        });
                    }
                    break;
                }

                default:
                    console.log(`[Google Webhook] Unhandled type: ${notificationType}`);
                    await subscription.save();
            }
        } catch (error: any) {
            console.error('[Google Webhook] Error:', error.message);
        }
    }

    // ═════════════════════════════════════════════════════════════
    // SUBSCRIPTION STATUS CHECK
    // ═════════════════════════════════════════════════════════════

    /**
     * Check and sync subscription status (called from API)
     */
    async checkSubscriptionStatus(userId: Types.ObjectId) {
        const user = await User.findById(userId);
        if (!user) return null;

        if (user.isPremium === 'premium' && user.subscriptionExpiresAt) {
            if (new Date() > user.subscriptionExpiresAt) {
                // Subscription expired — check if there's a newer record
                const latestSub = await SubscriptionHistory.findOne({
                    userId, status: 'active'
                }).sort({ expiresDate: -1 });

                if (latestSub && new Date() < latestSub.expiresDate) {
                    // There's a valid subscription, sync user
                    return await this.activateUser(userId, latestSub.plan, latestSub.expiresDate);
                }

                // Truly expired
                console.log(`[Subscription] Auto-expiring user ${userId}`);
                return await this.deactivateUser(userId);
            }
        }
        return user;
    }

    // ═════════════════════════════════════════════════════════════
    // HELPER FUNCTIONS
    // ═════════════════════════════════════════════════════════════

    private async activateUser(userId: Types.ObjectId, plan: 'monthly' | 'yearly', expiresDate: Date) {
        return await User.findByIdAndUpdate(userId, {
            isPremium: 'premium',
            subscriptionPlan: plan,
            subscriptionExpiresAt: expiresDate
        }, { new: true });
    }

    private async deactivateUser(userId: Types.ObjectId) {
        return await User.findByIdAndUpdate(userId, {
            isPremium: 'free',
            subscriptionPlan: null,
            subscriptionExpiresAt: null
        }, { new: true });
    }

    private calculateExpiry(plan: 'monthly' | 'yearly'): Date {
        const now = new Date();
        if (plan === 'yearly') {
            now.setFullYear(now.getFullYear() + 1);
        } else {
            now.setMonth(now.getMonth() + 1);
        }
        return now;
    }
}

export default new SubscriptionService();
