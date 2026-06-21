import { MOCK_USERS, MOCK_ACTIVITY, MOCK_SESSIONS } from './constants';

export const api = {
  getUsers: async () => {
    await new Promise(resolve => setTimeout(resolve, 500));
    return MOCK_USERS;
  },
  getActivityLogs: async () => {
    await new Promise(resolve => setTimeout(resolve, 500));
    return MOCK_ACTIVITY;
  },
  getSessions: async () => {
    await new Promise(resolve => setTimeout(resolve, 500));
    return MOCK_SESSIONS;
  },
  getAnalytics: async () => {
    await new Promise(resolve => setTimeout(resolve, 500));
    return {
      dailyActiveUsers: { value: '12.5k', growth: '+5.2%' },
      engagementRate: { value: '64.2%', growth: '+1.8%' },
      avgSession: { value: '18m 24s', growth: '-0.4%' },
      growthRate: { value: '+12.4%', growth: '+2.1%' },
      userGrowth: [
        { month: 'JAN', value: 4000 },
        { month: 'FEB', value: 5000 },
        { month: 'MAR', value: 3800 },
        { month: 'APR', value: 9000 },
        { month: 'MAY', value: 5500 },
        { month: 'JUN', value: 3000 },
        { month: 'JUL', value: 4500 },
        { month: 'AUG', value: 6000 },
        { month: 'SEP', value: 7500 },
        { month: 'OCT', value: 8500 },
        { month: 'NOV', value: 9500 },
        { month: 'DEC', value: 11000 },
      ],
      platformDistribution: [
        { name: 'iOS', value: 45, color: '#4F46E5' },
        { name: 'Android', value: 40, color: '#F97316' },
        { name: 'Web', value: 15, color: '#94A3B8' },
      ],
      featureUsage: [
        { name: 'Search Functionality', value: 92 },
        { name: 'Media Uploads', value: 78 },
        { name: 'Real-time Chat', value: 64 },
        { name: 'Profile Customization', value: 45 },
      ]
    };
  }
};
