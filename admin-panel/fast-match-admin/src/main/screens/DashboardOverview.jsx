import React from 'react';
import { Users, UserPlus, Crown, UserCheck, ShieldAlert, Heart, TrendingUp, Bell, Ban, Zap, AlertTriangle, ArrowUpRight } from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area,
  Cell
} from 'recharts';
import { cn } from '../../utils/utils';
import { Card } from '../../components/common/card';
import { useDashboardStats } from '../../reactQuery/hooks/dashboardHook';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';

const fallbackReports = [
  { reporter: 'Sarah K.', reported: 'Mike T.', category: 'Inappropriate', time: '2h ago' },
  { reporter: 'John D.', reported: 'Lisa M.', category: 'Spam', time: '5h ago' },
  { reporter: 'Amy R.', reported: 'Dave S.', category: 'Fake Profile', time: '1d ago' },
  { reporter: 'Tom W.', reported: 'Jane B.', category: 'Harassment', time: '1d ago' },
  { reporter: 'Kate L.', reported: 'Chris P.', category: 'Inappropriate', time: '2d ago' },
];

const REPORT_CATEGORY_COLORS = {
  'Inappropriate': 'bg-red-50 text-red-700',
  'Spam': 'bg-amber-50 text-amber-700',
  'Fake Profile': 'bg-blue-50 text-blue-700',
  'Harassment': 'bg-rose-50 text-rose-700',
};

const SkeletonStatCard = () => (
  <Card className="p-6 bg-white rounded-3xl shadow-sm border-none">
    <div className="flex items-center justify-between animate-pulse">
      <div className="space-y-3">
        <div className="h-3 w-20 bg-gray-200 rounded-lg" />
        <div className="h-8 w-14 bg-gray-200 rounded-lg" />
        <div className="h-3 w-16 bg-gray-200 rounded-lg" />
      </div>
      <div className="w-14 h-14 bg-gray-200 rounded-full" />
    </div>
  </Card>
);

export const DashboardOverview = () => {
  const { data: response, isLoading } = useDashboardStats();
  const navigate = useNavigate();
  
  const metrics = response?.data?.metrics;
  const userGrowth = response?.data?.userGrowth || [];
  const monthlyActivity = response?.data?.monthlyActivity || [];
  const recentReports = response?.data?.recentReports || fallbackReports;

  const stats = [
    { 
      label: 'Total Users', 
      value: metrics?.totalUsers?.count?.toLocaleString() || '0', 
      growth: metrics?.totalUsers?.growth > 0 ? `+${metrics.totalUsers.growth}%` : `${metrics?.totalUsers?.growth || 0}%`, 
      icon: Users, 
      color: 'bg-blue-50 text-blue-600' 
    },
    { 
      label: 'Active Users', 
      value: metrics?.activeUsers?.count?.toLocaleString() || '0', 
      growth: metrics?.activeUsers?.growth > 0 ? `+${metrics.activeUsers.growth}%` : `${metrics?.activeUsers?.growth || 0}%`, 
      icon: UserCheck, 
      color: 'bg-emerald-50 text-emerald-600' 
    },
    { 
      label: 'Flagged Accounts', 
      value: metrics?.flaggedAccounts?.count?.toLocaleString() || '0', 
      growth: metrics?.flaggedAccounts?.growth > 0 ? `+${metrics.flaggedAccounts.growth}%` : `${metrics?.flaggedAccounts?.growth || 0}%`, 
      icon: ShieldAlert, 
      color: 'bg-rose-50 text-rose-600' 
    },
    { 
      label: 'New Users Today', 
      value: metrics?.newUsersToday?.count?.toLocaleString() || '0', 
      growth: metrics?.newUsersToday?.growth > 0 ? `+${metrics.newUsersToday.growth}%` : `${metrics?.newUsersToday?.growth || 0}%`, 
      icon: UserPlus, 
      color: 'bg-indigo-50 text-indigo-600' 
    },
    { 
      label: 'Total Matches', 
      value: metrics?.totalMatches?.count?.toLocaleString() || '0', 
      growth: metrics?.totalMatches?.growth > 0 ? `+${metrics.totalMatches.growth}%` : `${metrics?.totalMatches?.growth || 0}%`, 
      icon: Heart, 
      color: 'bg-pink-50 text-pink-600' 
    },
  ];

  const quickActions = [
    {
      label: 'Grant Premium',
      desc: 'Upgrade a user',
      icon: Crown,
      path: '/subscriptions',
      gradient: 'bg-gradient-to-br from-purple-500 to-purple-700',
    },
    {
      label: 'Ban User',
      desc: 'Restrict access',
      icon: Ban,
      path: '/users',
      gradient: 'bg-gradient-to-br from-red-400 to-red-600',
    },
    {
      label: 'Send Announcement',
      desc: 'Notify all users',
      icon: Bell,
      path: '/announcements',
      gradient: 'bg-gradient-to-br from-blue-400 to-blue-600',
    },
    {
      label: 'View Analytics',
      desc: 'Platform insights',
      icon: TrendingUp,
      path: '/analytics',
      gradient: 'bg-gradient-to-br from-emerald-400 to-emerald-600',
    },
  ];

  if (isLoading) {
    return (
      <div className="p-8 space-y-8">
        <div>
          <div className="h-10 w-64 bg-gray-200 rounded-xl animate-pulse" />
          <div className="h-5 w-48 bg-gray-200 rounded-lg animate-pulse mt-3" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
          {[...Array(5)].map((_, i) => <SkeletonStatCard key={i} />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="p-8 bg-white rounded-3xl shadow-sm border-none h-96 animate-pulse" />
          <Card className="p-8 bg-white rounded-3xl shadow-sm border-none h-96 animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold text-gray-900">Dashboard Overview</h1>
        <p className="text-gray-500 mt-2 text-lg">Monitor your platform&apos;s key metrics</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
        {stats.map((stat, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08, duration: 0.4 }}
          >
            <Card className="p-6 flex items-center justify-between bg-white rounded-3xl shadow-sm border-none hover:shadow-md transition-shadow">
              <div className="space-y-2">
                <p className="text-sm text-gray-400 font-medium">{stat.label}</p>
                <h3 className="text-3xl font-bold text-gray-900">{stat.value}</h3>
                <p className={cn(
                  "text-xs font-semibold flex items-center gap-1",
                  stat.growth?.startsWith('+') ? "text-emerald-500" : "text-rose-500"
                )}>
                  <ArrowUpRight
                    size={12}
                    className={cn(
                      "transition-transform",
                      !stat.growth?.startsWith('+') && "rotate-90"
                    )}
                  />
                  {stat.growth}
                </p>
              </div>
              <div className={cn("w-14 h-14 rounded-full flex items-center justify-center", stat.color)}>
                <stat.icon size={28} />
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="p-8 space-y-8 bg-white rounded-3xl shadow-sm border-none">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold text-gray-900">User Growth</h3>
            </div>
            <div className="h-80 min-w-0 relative overflow-hidden">
              <ResponsiveContainer width="99%" height={320} debounce={50}>
                <BarChart data={userGrowth} margin={{ top: 20, right: 0, left: 0, bottom: 0 }}>
                  <XAxis 
                    dataKey="month" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#94A3B8', fontSize: 10, fontWeight: 700 }} 
                    dy={10}
                    padding={{ left: 10, right: 10 }}
                  />
                  <Tooltip 
                    cursor={{ fill: '#F8FAFC' }}
                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)' }}
                    labelStyle={{ fontWeight: 800, color: '#1E293B' }}
                  />
                  <Bar dataKey="value" radius={[6, 6, 0, 0]} barSize={60}>
                    {userGrowth.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill="#EC5B13" 
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="p-8 space-y-8 bg-white rounded-3xl shadow-sm border-none">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold text-gray-900">Monthly Activity</h3>
            </div>
            <div className="h-80 min-w-0 relative overflow-hidden">
              <ResponsiveContainer width="99%" height={320} debounce={50}>
                <AreaChart data={monthlyActivity} margin={{ top: 20, right: 0, left: 10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorActivity" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#F97316" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#F97316" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid vertical={false} stroke="#F1F5F9" strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="month" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#94A3B8', fontSize: 10, fontWeight: 700 }} 
                    dy={10}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#94A3B8', fontSize: 12 }} 
                  />
                  <Tooltip 
                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)' }}
                    labelStyle={{ fontWeight: 800, color: '#1E293B' }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="value" 
                    stroke="#F97316" 
                    strokeWidth={3} 
                    fillOpacity={1} 
                    fill="url(#colorActivity)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </motion.div>
      </div>

      {/* Recent Reports + Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Reports */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card className="p-8 bg-white rounded-3xl shadow-sm border-none">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-rose-50 rounded-xl flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-rose-500" />
                </div>
                <h3 className="text-xl font-bold text-gray-900">Recent Reports</h3>
              </div>
              <button
                onClick={() => navigate('/activity')}
                className="text-sm font-semibold text-[#7C3AED] hover:text-[#6D28D9] transition-colors"
              >
                View All →
              </button>
            </div>
            <div className="space-y-0">
              {recentReports.slice(0, 5).map((report, i) => (
                <div
                  key={i}
                  className={cn(
                    "flex items-center justify-between py-4 hover:bg-gray-50/50 -mx-3 px-3 rounded-xl transition-colors",
                    i < 4 && "border-b border-gray-50"
                  )}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-9 h-9 bg-gray-100 rounded-full flex items-center justify-center text-xs font-bold text-gray-600">
                      {(report.reporter || report.reporterName || '?').charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">
                        {report.reporter || report.reporterName} → {report.reported || report.reportedName}
                      </p>
                      <span className={cn(
                        "inline-block text-[11px] font-bold px-2 py-0.5 rounded-md mt-1",
                        REPORT_CATEGORY_COLORS[report.category] || 'bg-gray-100 text-gray-600'
                      )}>
                        {report.category}
                      </span>
                    </div>
                  </div>
                  <span className="text-xs text-gray-400 font-medium whitespace-nowrap">{report.time || report.createdAt}</span>
                </div>
              ))}
            </div>
          </Card>
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <Card className="p-8 bg-white rounded-3xl shadow-sm border-none">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center">
                <Zap className="w-5 h-5 text-amber-500" />
              </div>
              <h3 className="text-xl font-bold text-gray-900">Quick Actions</h3>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {quickActions.map((action, i) => (
                <motion.button
                  key={i}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => navigate(action.path)}
                  className={cn(
                    "p-5 rounded-2xl text-white text-left transition-all",
                    action.gradient
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                      <action.icon className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-bold text-sm">{action.label}</p>
                      <p className="text-[11px] text-white/70 mt-0.5">{action.desc}</p>
                    </div>
                  </div>
                </motion.button>
              ))}
            </div>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};
