import { model } from 'mongoose';
import { SupportTicketSchema } from './schema';
import { SupportTicketInterface } from './types';

const SupportTicket = model<SupportTicketInterface>('supportTickets', SupportTicketSchema);

export default SupportTicket;
