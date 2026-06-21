import { Router } from 'express';
import chatController from '@controllers/api/v1/chat';
import { verifyToken } from '@middlewares/auth';
import { tryCatchMiddleware } from '@middlewares/async';

const router = Router();

router.get('/conversations', verifyToken, tryCatchMiddleware(chatController.getConversationList));
router.get('/history/:otherUserId', verifyToken, tryCatchMiddleware(chatController.getChatHistory));
router.get('/unread-count', verifyToken, tryCatchMiddleware(chatController.getTotalUnreadCount));
router.post('/mark-as-read', verifyToken, tryCatchMiddleware(chatController.markMessagesAsRead));
router.post('/clear-history', verifyToken, tryCatchMiddleware(chatController.clearChatHistory));
router.post('/delete-messages', verifyToken, tryCatchMiddleware(chatController.deleteMessages));
router.post('/edit-message', verifyToken, tryCatchMiddleware(chatController.editMessage));
router.post('/block-user', verifyToken, tryCatchMiddleware(chatController.blockUser));
router.post('/unblock-user', verifyToken, tryCatchMiddleware(chatController.unblockUser));
router.post('/block-calls', verifyToken, tryCatchMiddleware(chatController.blockCalls));
router.post('/unblock-calls', verifyToken, tryCatchMiddleware(chatController.unblockCalls));

export default router;
