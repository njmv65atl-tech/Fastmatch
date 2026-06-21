import { model } from 'mongoose';
import { AnnouncementSchema } from './schema';
import { AnnouncementInterface } from './types';

export const Announcement = model<AnnouncementInterface>('announcements', AnnouncementSchema);
export { AnnouncementInterface };
