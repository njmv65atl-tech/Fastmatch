import { NextFunction, Request, Response } from "express"
import { constants, authConstant, userConstant } from "@config/constant"
import { responseEncryptor } from "@config/decryptor"
import { jwtManager } from "@helpers/jwt"
import { User } from "@models/user"

const { unauthorized, forbidden } = constants;
const message = { ...userConstant.user, ...authConstant.auth };

export const verifyAdminToken = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
    if (!req.headers["x-access-token"]) return res.status(forbidden).send(responseEncryptor(req, false, message.noAuth));

    let token: string = req.headers["x-access-token"] as string;

    if (!token.startsWith("Bearer ")) return res.status(forbidden).send(responseEncryptor(req, false, message.noAuth));

    token = token.split(" ")[1];

    try {
        const jwtInstance = new jwtManager();
        const tokenDetails: any = jwtInstance.decryptToken(token);

        if (!tokenDetails?.success) return res.status(forbidden).send(responseEncryptor(req, false, message.noAuth));

        const payload = tokenDetails.payload;
        let userDetails = await User.findOne({ _id: payload._id }) as any;

        if (!userDetails) return res.status(unauthorized).send(responseEncryptor(req, false, message.noAccount));

        if (userDetails.role !== 'admin') {
            return res.status(unauthorized).send(responseEncryptor(req, false, message.notAuthorized));
        }

        if (userDetails.deletedAt) return res.status(unauthorized).send(responseEncryptor(req, false, message.ownAccountDelete));

        req.user = userDetails;
        next();

    } catch (error) {
        return res.status(forbidden).send(responseEncryptor(req, false, message.noAuth, { error }));
    }
};
