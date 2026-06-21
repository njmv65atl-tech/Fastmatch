import jwt from 'jsonwebtoken';
import appConfig from '../config/config';

export interface jwtManagerInterface {
    generateToken(data: string | object): string,
    generateRefreshToken(data: string | object): string
    decryptToken(token: string): any
    decryptRefreshToken(token: string): any
}

export class jwtManager implements jwtManagerInterface {
    jwtSecret: string = '';
    jwtRefreshSecret: string = '';

    constructor() {
        this.jwtSecret = appConfig.jwtSecret;
        this.jwtRefreshSecret = appConfig.jwtRefreshSecert
    }

    generateToken(data: string | object, forgotPass: boolean = false) {
        return jwt.sign(data, this.jwtSecret, { expiresIn: forgotPass ? '10m' : '30d' });
    }

    generateRefreshToken(data: string | object) {
        return jwt.sign(data, this.jwtRefreshSecret, { expiresIn: '30d' });
    }

    decryptToken(token: string) {
        try {
            const payload: any = jwt.verify(token, this.jwtSecret);
            return { success: true, payload }
        } catch (error: any) {
            return { success: false, error }
        }

    }

    decryptRefreshToken(token: string) {
        try {
            const payload = jwt.verify(token, this.jwtRefreshSecret);
            return { success: true, payload }
        } catch (error: any) {
            return { success: false, error }
        }
    }
}