import { Document, Types } from "mongoose";

export interface SupportTicketInterface extends Document {
    user?: Types.ObjectId;
    email: string;
    category: string;
    subject: string;
    message: string;
    status: 'open' | 'in_progress' | 'resolved' | 'closed';
    adminReply?: string;
    createdAt: Date;
    updatedAt: Date;
}
