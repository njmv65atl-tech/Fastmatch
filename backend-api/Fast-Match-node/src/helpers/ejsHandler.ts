import { sendEmail } from "./email"
import ejs from 'ejs'

export const mailWithTemplate = (path: string, email: string, subject: string, data: any) => {
    console.log(`Starting to render EJS file: ${path} for ${email}`);
    ejs.renderFile(
        path,
        data,
        (err, htmlData) => {
            if (err) {
                console.error("EJS Template Render Error:", err);
            } else {
                console.log(`EJS rendered successfully, sending email...`);
                sendEmail(email, subject, htmlData);
            }
        }
    )
}