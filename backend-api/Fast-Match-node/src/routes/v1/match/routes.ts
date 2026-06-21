import express, { Router } from 'express';
import MatchController from '@controllers/api/v1/match/index';
import { tryCatchMiddleware } from '@middlewares/async';
import { verifyToken } from '@middlewares/auth';

const router: Router = express();

// ─── Match Routes (all require auth) ────────────────────────
router.get('/online-count', verifyToken, tryCatchMiddleware(MatchController.getOnlineUsersCount));
router.get('/history', verifyToken, tryCatchMiddleware(MatchController.getMatchHistory));
router.get('/active', verifyToken, tryCatchMiddleware(MatchController.getActiveMatch));
router.get('/:matchId', verifyToken, tryCatchMiddleware(MatchController.getMatchDetails));
router.post('/rate', verifyToken, tryCatchMiddleware(MatchController.submitRating));

export default router;
