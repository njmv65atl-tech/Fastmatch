import bcrypt from 'bcryptjs';

export interface bcryptManagerInterface {
    hashPassword(password: string): string,
    comparePassword(password: string, hashPassword: string): boolean
}

export class bcryptManager implements bcryptManagerInterface {

    hashPassword(password: string) {
        return bcrypt.hashSync(password, 9)
    }

    comparePassword(password: string, hashPassword: string) {
        return bcrypt.compareSync(password, hashPassword);
    }
}