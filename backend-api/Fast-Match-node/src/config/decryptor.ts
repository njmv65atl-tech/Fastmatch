import { NextFunction, Response, Request } from "express";
import { cryptoManager } from "../helpers/crypto"
import { escapeSpecialCharacter } from "../helpers/utils";
import appConfig from "./config";
import { requestLogger } from "./logger";
const cryptoInstance = new cryptoManager();

export const requestDecryptor = (req: Request, res: Response, next: NextFunction) => {
    // Skip Socket.IO requests — they are handled by Socket.IO server directly
    if (req.path.startsWith('/socket.io')) return next();

    if (appConfig.encryptionAllowed) {
        const requestObject = Object.assign({});
        if (req?.body?.payload) requestObject['payload'] = req?.body?.payload
        if (req?.body?.payload) {
            req.body = cryptoInstance.decryption(req?.body?.payload)
        }
    }

    if (typeof req?.body === "object") {
        if (req.body?.offset) req.body.offset = !isNaN(parseInt(req.body.offset)) ? parseInt(req.body.offset) : appConfig.defaultOffset
        if (req.body?.limit) req.body.limit = !isNaN(parseInt(req.body.limit)) ? parseInt(req.body.limit) : appConfig.defaultLimit
        if (req.body?.search && req.body?.search != '') req.body.search = escapeSpecialCharacter(req.body.search)
    }

    requestLogger.info(`Request ${req.url}`, {
        body: req.body && typeof req.body === 'object'
            ? { ...req.body, ...(req.body.password && { password: '*'.repeat(req.body.password.length) }) }
            : req.body,
        headers: req.headers, url: req.url, baseUrl: req.baseUrl
    })

    next();
}

export const responseEncryptor = (req: Request, success: boolean, message: string, data?: any,) => {
    const body = { ...req.body };
    if (body?.password) delete body['password']

    if (appConfig.encryptionAllowed) return cryptoInstance.encryption({ success, message, data });
    else return { success, message, data }
}