import { Schema } from 'mongoose';
import { ReportInterface } from './types';
import { refType, stringType } from '../../helpers/commonTypes';

export const ReportSchema = new Schema<ReportInterface>({
    reporter: {
        ...refType('users'),
        required: true
    },
    reportedUser: refType('users'),
    matchId: refType('matchHistories'),
    category: {
        type: [String],
        default: []
    },
    message: stringType(false),
}, {
    timestamps: true
});

ReportSchema.index({ reporter: 1 });
ReportSchema.index({ reportedUser: 1 });
ReportSchema.index({ matchId: 1 });
ReportSchema.index({ category: 1 });
ReportSchema.index({ createdAt: -1 });
