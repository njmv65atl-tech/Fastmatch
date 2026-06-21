import { sendEmail } from "./email"
import ejs from 'ejs'

export const mailWithTemplate = (path: string, email: string, subject: string, data: any) => ejs.renderFile(
    path,
    data,
    (err, data) => {
        if (err) console.log(err)
        else sendEmail(email, subject, data)
    })