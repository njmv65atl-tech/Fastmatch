import { Response } from 'express';
import { constants } from '@config/constant/index';
import { responseEncryptor } from '@config/decryptor';
import { activityLogger } from './logger';

const { successCode } = constants;

export class ResponseHandler {
    protected handleResponse(res: Response, message: string, data: any = null) {
        activityLogger.info(message, data);
        return res.status(successCode).send(responseEncryptor(res.req, true, message, data));
    }
}