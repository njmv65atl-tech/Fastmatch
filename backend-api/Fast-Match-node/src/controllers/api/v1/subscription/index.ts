import { Request, Response } from 'express';
import { ResponseHandler } from '@config/responseHandler';
import subscriptionService from '@services/subscription.services';
import { Types } from 'mongoose';

class SubscriptionController extends ResponseHandler {
    constructor() {
        super();
        this.verifyPurchase = this.verifyPurchase.bind(this);
        this.getStatus = this.getStatus.bind(this);
        this.handleAppleWebhook = this.handleAppleWebhook.bind(this);
        this.handleGoogleWebhook = this.handleGoogleWebhook.bind(this);
    }

    /**
     * POST /api/v1/subscription/verify
     * Called from app after user makes a purchase
     */
    async verifyPurchase(req: Request, res: Response) {
        const userId = req.user._id as Types.ObjectId;
        const { receipt, platform, plan, productId, purchaseToken } = req.body;

        if (!receipt || !platform || !plan) {
            throw new Error('Receipt, platform, and plan are required.');
        }

        const user = await subscriptionService.verifyAndUpgrade(userId, {
            receipt, platform, plan, productId, purchaseToken
        });
        return this.handleResponse(res, 'Subscription upgraded successfully.', user);
    }

    /**
     * GET /api/v1/subscription/status
     * Check current subscription status
     */
    async getStatus(req: Request, res: Response) {
        const userId = req.user._id as Types.ObjectId;
        const user = await subscriptionService.checkSubscriptionStatus(userId);
        return this.handleResponse(res, 'Subscription status fetched.', {
            isPremium: user?.isPremium,
            plan: user?.subscriptionPlan,
            expiresAt: user?.subscriptionExpiresAt
        });
    }

    /**
     * POST /api/v1/subscription/webhook/apple
     * Apple App Store Server Notifications endpoint
     * PUBLIC — No auth required (Apple calls this)
     */
    async handleAppleWebhook(req: Request, res: Response) {
        console.log('[Apple Webhook] 📥 Received notification');

        // Process in background to ensure we respond quickly
        subscriptionService.handleAppleWebhook(req.body).catch(err => {
            console.error('[Apple Webhook] Background processing error:', err.message);
        });

        // Always return 200 to Apple
        return res.status(200).json({ success: true });
    }

    /**
     * POST /api/v1/subscription/webhook/google
     * Google Play Real-Time Developer Notifications (via Pub/Sub)
     * PUBLIC — No auth required (Google calls this)
     */
    async handleGoogleWebhook(req: Request, res: Response) {
        console.log('[Google Webhook] 📥 Received notification');

        // Process in background
        subscriptionService.handleGoogleWebhook(req.body).catch(err => {
            console.error('[Google Webhook] Background processing error:', err.message);
        });

        // Always return 200 to Google Pub/Sub
        return res.status(200).json({ success: true });
    }
}

export default new SubscriptionController();
