import { model } from 'mongoose';
import { PricingSchema } from './schema';
import { PricingInterface } from './types';

const Pricing = model<PricingInterface>('pricings', PricingSchema);

export default Pricing;
