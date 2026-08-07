import express, { Router } from 'express';
import MatchController from '@controllers/api/v1/match/index';
import { tryCatchMiddleware } from '@middlewares/async';
import { verifyToken } from '@middlewares/auth';

import { cacheMiddleware } from '@middlewares/cache';

const router: Router = express();

// ─── Match Routes (all require auth) ────────────────────────
router.get('/online-count', verifyToken, cacheMiddleware(60), tryCatchMiddleware(MatchController.getOnlineUsersCount));
router.get('/history', verifyToken, tryCatchMiddleware(MatchController.getMatchHistory));
router.get('/active', verifyToken, tryCatchMiddleware(MatchController.getActiveMatch));
router.get('/:matchId', verifyToken, tryCatchMiddleware(MatchController.getMatchDetails));
router.post('/rate', verifyToken, tryCatchMiddleware(MatchController.submitRating));

export default router;
