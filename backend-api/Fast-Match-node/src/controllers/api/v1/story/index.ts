import { Request, Response } from 'express';
import { ResponseHandler } from '@config/responseHandler';
import { Story } from '@models/story';
import { Types } from 'mongoose';
import { responseEncryptor } from '@config/decryptor';

class StoryController extends ResponseHandler {

    constructor() {
        super();
        this.uploadStory = this.uploadStory.bind(this);
        this.getStories = this.getStories.bind(this);
    }

    async uploadStory(req: Request, res: Response) {
        try {
            const userId = req.user._id as Types.ObjectId;
            const { mediaType } = req.body;
            let mediaUrl = '';
            if (req.file) {
                mediaUrl = `/uploads/${req.file.filename}`;
            }

            if (!mediaUrl) {
                throw new Error("Media is required for story");
            }

            const expiresAt = new Date();
            expiresAt.setHours(expiresAt.getHours() + 24); // 24-hour highlight

            const story = await Story.create({
                userId,
                mediaUrl,
                mediaType: mediaType || 'image',
                expiresAt
            });

            return this.handleResponse(res, "Story uploaded successfully", story);
        } catch (error: any) {
            return res.status(500).send(responseEncryptor(req, false, error.message));
        }
    }

    async getStories(req: Request, res: Response) {
        try {
            const stories = await Story.find({ expiresAt: { $gt: new Date() } })
                .populate('userId', 'displayName profilePicture isPremium isVerified isOnline')
                .sort({ createdAt: -1 });

            // Group by user
            const grouped: Record<string, any> = {};
            for (const s of stories) {
                const uid = s.userId._id.toString();
                if (!grouped[uid]) {
                    grouped[uid] = {
                        user: s.userId,
                        stories: []
                    };
                }
                grouped[uid].stories.push({
                    _id: s._id,
                    mediaUrl: s.mediaUrl,
                    mediaType: s.mediaType,
                    createdAt: s.createdAt,
                    expiresAt: s.expiresAt
                });
            }

            return this.handleResponse(res, "Stories fetched", Object.values(grouped));
        } catch (error: any) {
            return res.status(500).send(responseEncryptor(req, false, error.message));
        }
    }
}

export default new StoryController();
