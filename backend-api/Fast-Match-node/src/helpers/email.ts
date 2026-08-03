import nodemailer from 'nodemailer'
import appConfig from '@config/config'
import { emailLogger } from '../config/logger'

export const sendEmail = (to: string, subject: string, html: string) => {

    const mailTransporter = nodemailer.createTransport(
        appConfig.smtpHost ? {
            host: appConfig.smtpHost,
            port: Number(appConfig.smtpPort) || 587,
            secure: false, // true for 465, false for other ports
            auth: {
                user: appConfig.smtpUser,
                pass: appConfig.smtpPassword
            }
        } : {
            service: 'gmail',
            auth: {
                user: appConfig.smtpUser,
                pass: appConfig.smtpPassword
            }
        }
    )
    const mailDetails = {
        from: `Fast-Match<${appConfig.smtpUser}>`,
        to,
        subject,
        html
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