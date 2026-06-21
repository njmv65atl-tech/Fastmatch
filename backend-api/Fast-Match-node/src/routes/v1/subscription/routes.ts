import express, { Router } from 'express';
import subscriptionController from '@controllers/api/v1/subscription/index';
import { tryCatchMiddleware } from '@middlewares/async';
import { verifyToken } from '@middlewares/auth';

const router: Router = express();

// ── Authenticated Routes (App calls these) ──
router.post('/verify', verifyToken, tryCatchMiddleware(subscriptionController.verifyPurchase));
router.get('/status', verifyToken, tryCatchMiddleware(subscriptionController.getStatus));

// ── Public Webhook Routes (Apple/Google call these — NO AUTH) ──
router.post('/webhook/apple', tryCatchMiddleware(subscriptionController.handleAppleWebhook));
router.post('/webhook/google', tryCatchMiddleware(subscriptionController.handleGoogleWebhook));

export default router;
