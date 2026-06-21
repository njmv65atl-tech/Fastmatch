import express, { Router } from 'express';
import StoryController from '@controllers/api/v1/story/index';
import { tryCatchMiddleware } from '@middlewares/async';
import { verifyToken } from '@middlewares/auth';
import { uploadProfilePicture } from '@middlewares/upload'; // Re-use upload middleware for now

const router: Router = express();

router.post('/upload', verifyToken, uploadProfilePicture, tryCatchMiddleware(StoryController.uploadStory));
router.get('/', verifyToken, tryCatchMiddleware(StoryController.getStories));

export default router;
