import { Document, Types } from "mongoose";

export interface TicketMessage {
    sender: 'user' | 'admin';
    message: string;
    createdAt?: Date;
}

export interface SupportTicketInterface extends Document {
    user?: Types.ObjectId;
    email: string;
    category: string;
    subject: string;
    message: string;
    status: 'open' | 'in_progress' | 'resolved' | 'closed';
    adminReply?: string;
    userReply?: string;
    messages?: TicketMessage[];
    createdAt: Date;
    updatedAt: Date;
}
