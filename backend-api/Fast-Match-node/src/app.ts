import appConfig from "./config/config";
import './config/serverValidator';
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from "helmet";
import logger from 'morgan';
import fs from 'fs';
import http from 'http';
import https from 'https';
import path from 'path';
import { dbConnection } from './config/connection/dbConnection';
import { constants } from './config/constant';
import { limiter } from "./config/rateLimit";
import v1Routes from './routes/v1';
import { UserInterface } from "./models/user";
import { requestDecryptor, responseEncryptor } from "./config/decryptor";
import { errorLogger } from "./config/logger";
import { Types } from "mongoose";
import './helpers/prototype';
import { serverSetupManager } from "./config/connection/serverSetup";
import { GracefulShutdownManager } from "@config/cleanUps";
import { clientEvents, initializeSocket, serverEvents } from "./config/socket";
import { seedAdmin } from "./helpers/seeder";
import { Server } from "socket.io";

// Declare global extensions
declare global {
    namespace Express {
        interface Request {
            user: UserInterface;
        }
    }
    interface String {
        parseToObjectId(id: string): Types.ObjectId;
    }
    interface Array<T> {
        parseToString(): Array<T>;
        parseToObjectId(): Array<T>;
    }
}

const PORT = appConfig.port;
const app: any = express();

// Enable 'trust proxy' so express-rate-limit can correctly identify the real IP
// when the app is behind a proxy (e.g., Nginx, Ngrok, AWS ELB, etc.)
app.set('trust proxy', 1);

/**
 * ─── MIDDLEWARE SETUP ──────────────────────────────────────────
 */

// 1. Logs & CORS
app.use(logger('dev'));
app.use(cors({ origin: true, credentials: true }));

// 2. Socket.IO Bypass & Security (Bypass Socket calls from standard Express security/parsers)
app.use((req: Request, res: Response, next: NextFunction) => {
    if (req.originalUrl.includes('/socket.io')) return next();

    // Apply Helmet & Rate Limiter only to standard REST APIs
    helmet()(req, res, () => {
        limiter(req, res, next);
    });
});

// 3. Body Parsers
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// 4. Static Assets
app.use('/public', express.static(path.join(process.cwd(), 'src/public')));
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

/**
 * ─── SERVER INITIALIZATION ─────────────────────────────────────
 */

(async () => {
    try {
        await dbConnection();
        await seedAdmin();
        serverSetupManager();

        let server: http.Server | https.Server;

        if (appConfig.useHttps) {
            const sslOptions = {
                key: fs.readFileSync(appConfig.sslKeyPath),
                cert: fs.readFileSync(appConfig.sslCertPath),
            };
            server = https.createServer(sslOptions, app);
        } else {
            server = http.createServer(app);
        }
        const io = new Server<serverEvents, clientEvents>(server, {
            pingTimeout: 60000,
            cors: { methods: ['GET', 'POST'], origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => callback(null, true), credentials: true },
            path: '/socket.io/',
            transports: ['websocket', 'polling']
        })
        // io.adapter(createAdapter(app));
        // socketHandler(io);

        app.use(requestDecryptor);
        app.use((req: any, res: Response, next: NextFunction) => {
            req.io = io
            next()
        })

        // Initialize Socket.IO Handler
        initializeSocket(io);

        // 5. App Routes
        app.use('/api/v1', v1Routes);

        // 6. Global Error Handler
        app.use((err: any, req: Request, res: Response, next: NextFunction) => {
            if (err) {
                console.error('SERVER_ERROR:', err);
                errorLogger.error('Error', { error: err?.message, ip: req.ip, url: req?.url });
                const status = err.status || constants.errorCode;
                return res.status(status).send(responseEncryptor(req, false, err?.message, err?.data));
            }
            next();
        });

        // 7. Catch-all 404 Handler
        app.use((req: Request, res: Response) => {
            if (req.originalUrl.includes('/socket.io')) return;
            return res.status(404).json({ success: false, message: constants.notFound });
        });

        // 8. Start Listening
        server.listen(PORT, () => {
            console.log(`🚀 Fast-Match Server running on ${appConfig.useHttps ? 'HTTPS' : 'HTTP'} at port ${PORT}`);
            new GracefulShutdownManager(server).initiate();
        });

    } catch (err: any) {
        console.error('FATAL_STARTUP_ERROR:', err);
        errorLogger.error('Internal server error', { error: err?.message });
        process.exit(1);
    }
})();