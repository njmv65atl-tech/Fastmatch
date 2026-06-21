import { NextFunction, Request, Response } from 'express';

export const tryCatchMiddleware = (fn: (req: Request, res: Response, next: NextFunction) => Promise<any>) => {
    return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            await fn(req, res, next);
        } catch (err) {
            next(err);
        }
    };
};