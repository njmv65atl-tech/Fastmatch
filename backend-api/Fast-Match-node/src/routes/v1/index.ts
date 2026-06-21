import express, { Router } from 'express';

import UserRoute from './user/routes';
import MatchRoute from './match/routes';
import ChatRoute from './chat/routes';
import ReportRoute from './report/routes';
import AdminRoute from './admin/routes';
import SubscriptionRoute from './subscription/routes';
import StoryRoute from './story/routes';

const v1Routes: Router = express();

v1Routes.use('/user', UserRoute)
v1Routes.use('/match', MatchRoute)
v1Routes.use('/chat', ChatRoute)
v1Routes.use('/report', ReportRoute)
v1Routes.use('/admin', AdminRoute)
v1Routes.use('/subscription', SubscriptionRoute)
v1Routes.use('/story', StoryRoute)

export default v1Routes;