import express, { Router } from 'express';
import reportController from '@controllers/api/v1/report/index';
import { tryCatchMiddleware } from '@middlewares/async';
import { verifyToken } from '@middlewares/auth';

const router: Router = express();

// ─── Report Routes (all require auth) ────────────────────────
router.post('/', verifyToken, tryCatchMiddleware(reportController.submitReport));
router.get('/my', verifyToken, tryCatchMiddleware(reportController.getMyReports));
router.post('/report-block', verifyToken, tryCatchMiddleware(reportController.reportAndBlockUser));

export default router;
