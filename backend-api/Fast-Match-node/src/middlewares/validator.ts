import { NextFunction, Request, Response } from 'express';
import { constants } from '../config/constant';
import { responseEncryptor } from '../config/decryptor';

export const validator = (schema: any) => async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        if (req.body.options && typeof req.body.options === 'string') {
            req.body.options = JSON.parse(req.body.options);  // Safely parse stringified JSON
        }

        await schema.validate({
            body: req.body,
            query: req.query,
            params: req.params,
        });

        next();
    } catch (err: any) {
        const message = err?.message?.replace('body.', '')?.replace('query.', '')?.replace('params.', '') || 'Validation error';
        res.status(constants.errorCode).send(responseEncryptor(req, false, message));
    }
};
