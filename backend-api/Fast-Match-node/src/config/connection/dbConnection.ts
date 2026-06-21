import mongoose from 'mongoose';
import appConfig from '../config';
const mongoUrl = appConfig.mongoUrl;

export const dbConnection = async () => {
    if (mongoUrl) {
        mongoose.set('strictQuery', true);
        try {
            await mongoose.connect(mongoUrl);
            console.log(`Successfully connected to the database.`);
        } catch (err: any) {
            console.log(`Database not connected`, err.message);
            process.exit();
        }
    } else console.log('DB connection url not found.')
}
