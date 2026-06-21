import dotenv from "dotenv";
import path from "path";
dotenv.config({ path: __dirname + `/../../.env` });

const appConfig = {
    port: process.env.PORT as string,
    mongoUrl: process.env.MONGO_URL as string,
    cryptoSecret: process.env.CRYPTO_SECRET as string,
    jwtSecret: process.env.JWT_SECRET as string,
    jwtRefreshSecert: process.env.JWT_REFRESH_SECRET as string,
    adminEmail: process.env.ADMIN_EMAIL as string,
    adminPassword: process.env.ADMIN_PASSWORD as string,
    smtpUser: process.env.SMTP_USER as string,
    smtpPassword: process.env.SMTP_PASSWORD as string,
    webUrl: process.env.WEB_URL as string,
    serverUrl: process.env.SERVER_URL as string,
    encryptionAllowed: false,
    useHttps: false,
    sslKeyPath: '/var/www/html/ssl/privkey.pem',
    sslCertPath: '/var/www/html/ssl/fullchain.pem',
    defaultLogger: {
        maxLoggerFileSize: 10485760 // 10 MB
    },
    defaultOffset: 0,
    defaultLimit: 10,
    live: false,
    pushNotification: false,
    resetPasswordSubject: 'Reset Password',
    otpSubject: 'OTP Verification.',
    publicFolder: 'src/public',
    folders: ['src/public/user'],
    appName: 'Fast-Match',
    streamApiKey: process.env.STREAM_API_KEY as string,
    streamApiSecret: process.env.STREAM_API_SECRET as string,

    // In-App Purchase / Subscription
    appleSharedSecret: process.env.APPLE_SHARED_SECRET as string,
    googlePackageName: (process.env.GOOGLE_PACKAGE_NAME || 'com.fastmatch.app') as string,
    googleServiceAccountKeyPath: process.env.GOOGLE_SERVICE_ACCOUNT_JSON_PATH ? path.join(process.cwd(), process.env.GOOGLE_SERVICE_ACCOUNT_JSON_PATH) : '',
};

export default appConfig;