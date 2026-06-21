import { Document, Types } from "mongoose"

export interface ReportInterface extends Document {
    reporter: Types.ObjectId;
    reportedUser?: Types.ObjectId;
    matchId?: Types.ObjectId;
    category: string[];
    message: string;
}
