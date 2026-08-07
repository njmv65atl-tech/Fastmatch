import express, { Router } from 'express';
import StoryController from '@controllers/api/v1/story/index';
import { tryCatchMiddleware } from '@middlewares/async';
import { verifyToken } from '@middlewares/auth';
import { uploadProfilePicture } from '@middlewares/upload'; // Re-use upload middleware for now

import { cacheMiddleware } from '@middlewares/cache';

const router: Router = express();

router.post('/upload', verifyToken, uploadProfilePicture, tryCatchMiddleware(StoryController.uploadStory));
router.get('/', verifyToken, cacheMiddleware(300), tryCatchMiddleware(StoryController.getStories));

export default router;
