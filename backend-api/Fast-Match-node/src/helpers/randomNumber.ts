import appConfig from "@config/config";

export interface bcryptManagerInterface {
    otpGenerate(): number,
}

export class randomNumber {
    otpGenerate() {
        if (appConfig.live) return Math.floor(10000 + Math.random() * 90000);
        else return 12345;
    }
}