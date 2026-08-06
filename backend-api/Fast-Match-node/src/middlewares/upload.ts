import multer, { FileFilterCallback } from 'multer';
import { Request } from 'express';
import path from 'path';
import fs from 'fs';

const storage = multer.diskStorage({
    destination: (_req: Request, _file: Express.Multer.File, cb) => {
        const uploadPath = path.join(process.cwd(), 'src/public/user');
        if (!fs.existsSync(uploadPath)) fs.mkdirSync(uploadPath, { recursive: true });
        cb(null, uploadPath);
    },
    filename: (_req: Request, file: Express.Multer.File, cb) => {
        const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(file.originalname)}`;
        cb(null, uniqueName);
    }
});

const fileFilter = (_req: Request, file: Express.Multer.File, cb: FileFilterCallback) => {
    const allowedTypes = /jpeg|jpg|png|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (extname && mimetype) cb(null, true);
    else cb(new Error('Only image files are allowed (jpeg, jpg, png, webp)'));
};

export const uploadProfilePicture = multer({
    storage,
    fileFilter,
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB max
}).single('profilePicture');

const chatStorage = multer.diskStorage({
    destination: (_req: Request, _file: Express.Multer.File, cb) => {
        const uploadPath = path.join(process.cwd(), 'src/public/chat');
        if (!fs.existsSync(uploadPath)) fs.mkdirSync(uploadPath, { recursive: true });
        cb(null, uploadPath);
    },
    filename: (_req: Request, file: Express.Multer.File, cb) => {
        const uniqueName = `chat-${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(file.originalname)}`;
        cb(null, uniqueName);
    }
});

export const uploadChatImage = multer({
    storage: chatStorage,
    fileFilter,
    limits: { fileSize: 10 * 1024 * 1024 } // 10MB max for chat
}).single('chatImage');
