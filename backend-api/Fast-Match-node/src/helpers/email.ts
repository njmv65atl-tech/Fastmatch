import nodemailer from 'nodemailer'
import appConfig from '@config/config'
import { emailLogger } from '../config/logger'

export const sendEmail = (to: string, subject: string, html: string) => {

    const mailTransporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: appConfig.smtpUser,
            pass: appConfig.smtpPassword
        }
    })
    const mailDetails = {
        from: `Fast-Match<${appConfig.smtpUser}>`,
        to,
        subject,
        html
    }
    mailTransporter.sendMail(mailDetails, (err, data) => {
        if (err) emailLogger.error('Mail error', { err })
        else emailLogger.info('Mail Sent successfully', { data })
    })
}