import { Types } from "mongoose";
import { User } from "../models/user";
import Pricing from "../models/pricing";
import { Transaction } from "../models/transaction";
import { sendEmail } from "../helpers/email";

/**
 * Automatically applies the VIP Free Trial to a newly registered user if enabled in Admin Pricing.
 */
export async function applyFreeTrialIfEligible(userId: Types.ObjectId | string): Promise<boolean> {
    try {
        const pricing = await Pricing.findOne().lean() as any;
        if (!pricing?.freeTrial?.enabled) {
            return false;
        }

        const user = await User.findById(userId);
        if (!user) return false;

        // Prevent abuse: only users who haven't used free trial and are not currently premium
        if (user.hasUsedFreeTrial || user.isPremium === 'premium') {
            return false;
        }

        const durationDays = Number(pricing.freeTrial.durationDays) || 3;
        const bonusCoins = Number(pricing.freeTrial.bonusCoins) || 0;
        const trialTitle = pricing.freeTrial.trialTitle || 'VIP Free Trial';

        const expiresAt = new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000);

        user.isPremium = 'premium';
        user.subscriptionPlan = 'trial';
        user.subscriptionExpiresAt = expiresAt;
        user.hasUsedFreeTrial = true;

        if (bonusCoins > 0) {
            user.walletBalance = (user.walletBalance || 0) + bonusCoins;
        }

        await user.save();

        // Record trial transaction in billing history
        await Transaction.create({
            userId: user._id,
            type: 'trial',
            amount: bonusCoins,
            description: `${trialTitle} (${durationDays} Days Active)`
        });

        console.log(`[FreeTrial] Granted ${durationDays} days VIP trial (${bonusCoins} bonus coins) to user ${user._id} (${user.email || user.phone})`);
        return true;
    } catch (err) {
        console.error('[FreeTrial] Error applying free trial:', err);
        return false;
    }
}

/**
 * Checks all users and downgrades any whose subscription expiration date has passed.
 */
export async function checkAndDowngradeExpiredSubscriptions(): Promise<number> {
    try {
        const now = new Date();
        const result = await User.updateMany(
            {
                isPremium: 'premium',
                subscriptionExpiresAt: { $lt: now, $ne: null }
            },
            {
                $set: {
                    isPremium: 'free',
                    subscriptionPlan: null
                }
            }
        );

        if (result.modifiedCount > 0) {
            console.log(`[SubscriptionWatcher] Auto-downgraded ${result.modifiedCount} expired VIP user(s) to free.`);
        }
        return result.modifiedCount;
    } catch (err) {
        console.error('[SubscriptionWatcher] Error checking expired subscriptions:', err);
        return 0;
    }
}

/**
 * Finds users whose subscription expires in 5 days (between 4 and 5 days from now)
 * and sends them a renewal reminder email (if not already sent).
 */
export async function sendRenewalReminderEmails(): Promise<number> {
    try {
        const now = Date.now();
        const fourDaysFromNow = new Date(now + 4 * 24 * 60 * 60 * 1000);
        const fiveDaysFromNow = new Date(now + 5 * 24 * 60 * 60 * 1000);
        const sevenDaysAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);

        // Find premium users expiring in the 4-to-5 day window
        const expiringUsers = await User.find({
            isPremium: 'premium',
            email: { $exists: true, $ne: '' },
            subscriptionExpiresAt: {
                $gte: fourDaysFromNow,
                $lte: fiveDaysFromNow
            },
            $or: [
                { renewalReminderSentAt: null },
                { renewalReminderSentAt: { $lt: sevenDaysAgo } }
            ]
        }).select('_id email fullName displayName subscriptionPlan subscriptionExpiresAt');

        if (expiringUsers.length === 0) {
            return 0;
        }

        console.log(`[SubscriptionWatcher] Found ${expiringUsers.length} user(s) expiring in 5 days. Sending reminders...`);

        let sentCount = 0;
        for (const user of expiringUsers) {
            if (!user.email || !user.email.includes('@') || user.email.includes('privaterelay.appleid.com')) {
                continue;
            }

            const userName = user.displayName || user.fullName || 'FastMatch Member';
            const expDateStr = user.subscriptionExpiresAt
                ? new Date(user.subscriptionExpiresAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                })
                : 'in 5 days';

            const planLabel = user.subscriptionPlan === 'yearly'
                ? 'Yearly VIP'
                : user.subscriptionPlan === 'trial'
                ? 'VIP Free Trial'
                : 'Monthly VIP';

            const emailSubject = `⚡ FastMatch VIP: Your ${planLabel} expires in 5 days`;

            const emailHtml = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <style>
                    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px; color: #1e293b; }
                    .card { max-width: 540px; margin: 0 auto; background: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.08); border: 1px solid #e2e8f0; }
                    .header { background: linear-gradient(135deg, #7C3AED 0%, #D946EF 100%); padding: 36px 30px; text-align: center; color: #ffffff; }
                    .crown { font-size: 40px; line-height: 1; margin-bottom: 12px; }
                    .title { margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.5px; }
                    .subtitle { margin: 8px 0 0; font-size: 14px; opacity: 0.9; }
                    .body { padding: 32px 30px; }
                    .greeting { font-size: 18px; font-weight: 700; margin-bottom: 14px; color: #0f172a; }
                    .message { font-size: 15px; line-height: 1.6; color: #475569; margin-bottom: 24px; }
                    .alert-box { background: #FEF3C7; border-left: 4px solid #F59E0B; padding: 14px 18px; border-radius: 10px; margin-bottom: 24px; font-size: 14px; color: #92400E; }
                    .benefits { background: #F8FAFC; border-radius: 14px; padding: 20px; margin-bottom: 28px; }
                    .benefit-item { display: flex; align-items: center; margin-bottom: 10px; font-size: 14px; font-weight: 600; color: #334155; }
                    .benefit-icon { color: #7C3AED; margin-right: 10px; font-size: 16px; }
                    .cta { text-align: center; margin: 28px 0; }
                    .cta-button { display: inline-block; background: linear-gradient(135deg, #7C3AED 0%, #6D28D9 100%); color: #ffffff !important; text-decoration: none; padding: 14px 36px; border-radius: 9999px; font-weight: 700; font-size: 15px; box-shadow: 0 4px 12px rgba(124, 58, 237, 0.35); }
                    .footer { text-align: center; padding: 20px 30px; background: #f1f5f9; font-size: 12px; color: #94a3b8; border-top: 1px solid #e2e8f0; }
                </style>
            </head>
            <body>
                <div class="card">
                    <div class="header">
                        <div class="crown">👑</div>
                        <h1 class="title">FastMatch VIP Reminder</h1>
                        <p class="subtitle">Keep your VIP privileges uninterrupted</p>
                    </div>
                    <div class="body">
                        <div class="greeting">Hi ${userName},</div>
                        <p class="message">
                            Your <strong>FastMatch ${planLabel}</strong> membership is scheduled to expire in <strong>5 days</strong> on <strong>${expDateStr}</strong>.
                        </p>
                        <div class="alert-box">
                            ⚠️ After <strong>${expDateStr}</strong>, premium matching filters, direct messaging, and unlimited likes will revert to the standard free tier.
                        </div>
                        <div class="benefits">
                            <div style="font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: #64748b; margin-bottom: 12px;">What you keep with VIP:</div>
                            <div class="benefit-item"><span class="benefit-icon">✨</span> Unlimited Matches & Profile Likes</div>
                            <div class="benefit-item"><span class="benefit-icon">🎯</span> Super Match & Advanced Filter Controls</div>
                            <div class="benefit-item"><span class="benefit-icon">👀</span> See Who Liked Your Profile</div>
                            <div class="benefit-item"><span class="benefit-icon">💬</span> Priority Messaging & Video Calls</div>
                            <div class="benefit-item"><span class="benefit-icon">🚀</span> Global Discovery across all countries</div>
                        </div>
                        <p class="message" style="margin-bottom: 10px;">
                            To maintain active VIP status, simply open the FastMatch app and visit <strong>Settings &gt; VIP Membership</strong> to renew or manage your subscription.
                        </p>
                    </div>
                    <div class="footer">
                        © ${new Date().getFullYear()} FastMatch App. All rights reserved.<br>
                        Questions? Contact our team at <a href="mailto:support@fastmatch.app" style="color: #7C3AED; text-decoration: none;">support@fastmatch.app</a>
                    </div>
                </div>
            </body>
            </html>
            `;

            try {
                sendEmail(user.email, emailSubject, emailHtml);
                await User.updateOne(
                    { _id: user._id },
                    { $set: { renewalReminderSentAt: new Date() } }
                );
                sentCount++;
                console.log(`[SubscriptionWatcher] Sent 5-day reminder email to ${user.email} (${user._id})`);
            } catch (emailErr) {
                console.error(`[SubscriptionWatcher] Failed sending reminder email to ${user.email}:`, emailErr);
            }
        }

        return sentCount;
    } catch (err) {
        console.error('[SubscriptionWatcher] Error in sendRenewalReminderEmails:', err);
        return 0;
    }
}

/**
 * Initializes the background subscription watcher service.
 * Runs immediately once, then repeats every 1 hour.
 */
export function startSubscriptionWatcher(): void {
    console.log('[SubscriptionWatcher] Initializing Subscription Watcher background service...');

    // Run immediately on boot
    checkAndDowngradeExpiredSubscriptions().then(downgraded => {
        if (downgraded > 0) {
            console.log(`[SubscriptionWatcher] Initial boot check: ${downgraded} expired user(s) downgraded.`);
        }
    }).catch(err => console.error('[SubscriptionWatcher] Initial check error:', err));

    sendRenewalReminderEmails().then(sent => {
        if (sent > 0) {
            console.log(`[SubscriptionWatcher] Initial boot check: ${sent} 5-day renewal reminder email(s) sent.`);
        }
    }).catch(err => console.error('[SubscriptionWatcher] Initial reminder error:', err));

    // Schedule hourly check
    const ONE_HOUR = 60 * 60 * 1000;
    setInterval(async () => {
        try {
            await checkAndDowngradeExpiredSubscriptions();
            await sendRenewalReminderEmails();
        } catch (err) {
            console.error('[SubscriptionWatcher] Periodic execution error:', err);
        }
    }, ONE_HOUR);

    console.log('[SubscriptionWatcher] Subscription Watcher started (interval: 1 hour).');
}
