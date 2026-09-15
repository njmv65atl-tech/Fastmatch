import { model } from 'mongoose';
import { CouponSchema } from './schema';
import { CouponInterface } from './types';

const Coupon = model<CouponInterface>('coupons', CouponSchema);

export default Coupon;
