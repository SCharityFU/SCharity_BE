import { Router } from 'express';
import authRoute from './auth.route';
import adminRoute from './admin.route';
import campaignRoute from './campaign.route';
import donationRoute from './donation.route';
import userRoute from './user.route';
import withdrawRoute from './withdraw.route';

const router = Router();

router.use('/auth', authRoute);
router.use('/admin', adminRoute);
router.use('/campaigns', campaignRoute);
router.use('/donations', donationRoute);
router.use('/users', userRoute);
router.use('/withdrawals', withdrawRoute);

export default router;
