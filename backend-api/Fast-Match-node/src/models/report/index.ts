import { model } from 'mongoose';
import { ReportSchema } from './schema';
import { ReportInterface } from './types';

const Report = model<ReportInterface>('reports', ReportSchema);
export { Report, ReportInterface };
