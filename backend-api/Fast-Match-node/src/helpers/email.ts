import nodemailer from 'nodemailer'
import appConfig from '@config/config'
import { emailLogger } from '../config/logger'

export const sendEmail = (to: string, subject: string, html: string) => {

    const mailTransporter = nodemailer.createTransport(
        appConfig.smtpHost ? {
            host: appConfig.smtpHost,
            port: Number(appConfig.smtpPort) || 587,
            secure: Number(appConfig.smtpPort) === 465, // true for 465, false for 587
            auth: {
                user: appConfig.smtpUser,
                pass: appConfig.smtpPassword
            },
            tls: {
                rejectUnauthorized: false
            }
        } : {
            service: 'gmail',
            auth: {
                user: appConfig.smtpUser,
                pass: appConfig.smtpPassword
            }
        }
    )
    const plainText = html.replace(/<[^>]*>?/gm, ' ').replace(/\s+/g, ' ').trim();
    const mailDetails = {
        from: appConfig.smtpFrom || `Fastmatch <noreply@fastmatch.app>`,
        to,
        subject,
        text: plainText,
        html,
        replyTo: 'support@fastmatch.app',
        headers: {
            'X-Mailer': 'Fastmatch Mailer',
            'X-Priority': '1'
        }
    }
    mailTransporter.sendMail(mailDetails, (err, data) => {
        if (err) {
            console.error('Mail error in sendMail:', err);
            emailLogger.error('Mail error', { err });
        } else {
            console.log('Mail Sent successfully:', data);
            emailLogger.info('Mail Sent successfully', { data });
            if (appConfig.smtpHost === 'smtp.ethereal.email') {
                console.log('Ethereal Email Preview URL: %s', nodemailer.getTestMessageUrl(data));
            }
        }
    })
}