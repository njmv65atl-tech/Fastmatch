import CryptoJS from 'crypto-js';
import appConfig from '../config/config';

export interface cryptoManagerInterface {
    encryption(data: object): string,
    decryption(ciphertext: string): { [key: string]: string }
}

const passphrase = CryptoJS.enc.Utf8.parse(appConfig.cryptoSecret);
const payload = {
    mode: CryptoJS.mode.CBC,
    iv: passphrase,
    padding: CryptoJS.pad.Pkcs7,
}
export class cryptoManager implements cryptoManagerInterface {

    encryption(data: object) {
        return CryptoJS.AES.encrypt(JSON.stringify(data), passphrase, payload).toString();
    }

    decryption(ciphertext: string) {
        try {
            return JSON.parse(CryptoJS.AES.decrypt(ciphertext, passphrase, payload).toString(CryptoJS.enc.Utf8));
        } catch (err: any) {
            return {}
        }
    }
}