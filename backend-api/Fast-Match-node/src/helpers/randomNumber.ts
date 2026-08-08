import appConfig from "@config/config";

export interface bcryptManagerInterface {
    otpGenerate(): number,
}

export class randomNumber {
    otpGenerate() {
        return Math.floor(10000 + Math.random() * 90000);
    }
}