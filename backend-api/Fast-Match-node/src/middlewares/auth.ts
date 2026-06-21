import { NextFunction, Request, Response } from "express"
import { constants, authConstant, userConstant } from "@config/constant"
import { responseEncryptor } from "@config/decryptor"
import { jwtManager } from "@helpers/jwt"
import { User, UserInterface } from "@models/user"

const { unauthorized, forbidden } = constants;
const message = { ...userConstant.user, ...authConstant.auth };

export const verifyToken = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
    // Check if the authorization header exists
    if (!req.headers["x-access-token"]) return res.status(forbidden).send(responseEncryptor(req, false, message.noAuth));

    let token: string = req.headers["x-access-token"] as string;

    // Ensure token starts with "Bearer "
    if (!token.startsWith("Bearer ")) return res.status(forbidden).send(responseEncryptor(req, false, message.noAuth));

    token = token.split(" ")[1];  // Extract the actual token part

    try {
        // Decrypt and validate the token
        const jwtInstance = new jwtManager();
        const tokenDetails: any = jwtInstance.decryptToken(token);

        if (!tokenDetails?.success) return res.status(forbidden).send(responseEncryptor(req, false, message.noAuth));

        const payload = tokenDetails.payload;

        // Find user by payload._id
        let userDetails = await User.findOne({ _id: payload._id }) as any;

        if (!userDetails) return res.status(unauthorized).send(responseEncryptor(req, false, message.noAccount));


        // Check if the account is banned
        if (userDetails.isBanned) return res.status(unauthorized).send(responseEncryptor(req, false, message.ownAccountBlock));


        // Check if the account is deleted
        if (userDetails.deletedAt) return res.status(unauthorized).send(responseEncryptor(req, false, message.ownAccountDelete));


        // Check if the session matches the one in DB (Single Session Enforcement)
        if (userDetails.loginSessionId && payload.loginSessionId && userDetails.loginSessionId !== payload.loginSessionId) {
            return res.status(constants.diffDevice || 402).send(responseEncryptor(req, false, message.loggedInAnotherDevice));
        }

        req.user = userDetails;
        next();

    } catch (error) {
        return res.status(forbidden).send(responseEncryptor(req, false, message.noAuth, { error }));
    }
};

