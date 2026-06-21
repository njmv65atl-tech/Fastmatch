import React from 'react';
import { Users, UserPlus, Crown, UserCheck, ShieldAlert } from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  AreaChart,
  Area,
  Cell
} from 'recharts';
import { cn } from '../../utils/utils';
import { Card } from '../../components/common/card';
import { useDashboardStats } from '../../reactQuery/hooks/dashboardHook';

export const DashboardOverview = () => {
  const { data: response, isLoading } = useDashboardStats();
  
  // The API response structure matches response.data.metrics etc.
  const metrics = response?.data?.metrics;
  const userGrowth = response?.data?.userGrowth || [];
  const monthlyActivity = response?.data?.monthlyActivity || [];

  if (isLoading) return <div className="p-8 text-white font-medium">Loading dashboard statistics...</div>;

  const stats = [
    { 
      label: 'Total Users', 
      value: metrics?.totalUsers?.count?.toLocaleString() || '0', 
      growth: metrics?.totalUsers?.growth > 0 ? `+${metrics.totalUsers.growth}%` : `${metrics?.totalUsers?.growth || 0}%`, 
      icon: Users, 
      color: 'bg-blue-50 text-blue-600' 
    },
    { 
      label: 'Active users', 
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
    /*
    { 
      label: 'Free User', 
      value: metrics?.freeUsers?.count?.toLocaleString() || '0', 
      growth: metrics?.freeUsers?.growth > 0 ? `+${metrics.freeUsers.growth}%` : `${metrics?.freeUsers?.growth || 0}%`, 
      icon: UserPlus, 
      color: 'bg-indigo-50 text-indigo-600' 
    },
    { 
      label: 'Premium User', 
      value: metrics?.premiumUsers?.count?.toLocaleString() || '0', 
      growth: metrics?.premiumUsers?.growth > 0 ? `+${metrics.premiumUsers.growth}%` : `${metrics?.premiumUsers?.growth || 0}%`, 
      icon: Crown, 
      color: 'bg-pink-50 text-pink-600' 
    },
    */
  ];

  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-4xl font-bold text-gray-900">Dashboard Overview</h1>
        <p className="text-gray-500 mt-2 text-lg">Monitor your platform&apos;s key metrics</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {stats.map((stat, i) => (
          <Card key={i} className="p-6 flex items-center justify-between bg-white rounded-3xl shadow-sm border-none">
            <div className="space-y-2">
              <p className="text-sm text-gray-400 font-medium">{stat.label}</p>
              <h3 className="text-3xl font-bold text-gray-900">{stat.value}</h3>
              <p className={cn(
                "text-xs font-semibold flex items-center gap-1",
                stat.growth?.startsWith('+') ? "text-emerald-500" : "text-rose-500"
              )}>
                <span className="text-[10px]">{stat.growth?.startsWith('+') ? '↗' : '↘'}</span>
                {stat.growth}
              </p>
            </div>
            <div className={cn("w-14 h-14 rounded-full flex items-center justify-center", stat.color)}>
              <stat.icon size={28} />
            </div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
      </div>
    </div>
  );
};
