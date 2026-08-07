import { Router } from 'express';
import chatController from '@controllers/api/v1/chat';
import { verifyToken } from '@middlewares/auth';
import { tryCatchMiddleware } from '@middlewares/async';
import { uploadChatImage } from '@middlewares/upload';

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

router.post('/upload-image', verifyToken, (req, res) => {
    uploadChatImage(req, res, (err: any) => {
        if (err) {
            console.error('[upload-image] Multer error:', err.message || err);
            return res.status(400).json({ success: false, message: err.message || 'Upload failed' });
        }
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'No file uploaded' });
        }
        const imageUrl = `/public/chat/${req.file.filename}`;
        res.status(200).json({ success: true, url: imageUrl });
    });
});

export default router;
