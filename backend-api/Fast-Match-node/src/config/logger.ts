import { createLogger, transports, config, format } from 'winston';
import appConfig from './config';
const { combine, timestamp, json } = format;


const createCustomLogger = (module: string, serviceBusLevel: string) => {
    return createLogger({
        levels: config.syslog.levels,
        format: combine(
            timestamp({
                format: 'YYYY-MM-DD HH:mm:ss'
            }),
            json()
        ),
        transports: [
            new transports.File({
                filename: `logs/${module}.log`,
                maxsize: appConfig.defaultLogger.maxLoggerFileSize
            })
        ]
    });
};

export const errorLogger = createCustomLogger('error', 'error');
export const activityLogger = createCustomLogger('activity', 'info');
export const notificationLogger = createCustomLogger('notification', 'info');
export const socketLogger = createCustomLogger('socket', 'info');
export const uploadFileLogger = createCustomLogger('upload', 'info');
export const requestLogger = createCustomLogger('request', 'info');
export const emailLogger = createCustomLogger('email', 'info');