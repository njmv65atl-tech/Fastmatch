import React from 'react';
import { 
  Users, 
  MousePointer2, 
  Clock, 
  TrendingUp,
  Crown,
  UserPlus,
  DollarSign
} from 'lucide-react';
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  AreaChart,
  Area,
  CartesianGrid
} from 'recharts';
import { cn } from '../../utils/utils';
import { Card } from '../../components/common/card';
import { useAnalytics } from '../../reactQuery/hooks/analyticsHook';

export const Analytics = () => {
  const { data: response, isLoading } = useAnalytics();
  
  // The API response structure.
  const analyticsData = response?.data;
  const metrics = analyticsData?.metrics;
  const userGrowth = analyticsData?.userGrowth || [];
  
  const revenueData = analyticsData?.revenue || (userGrowth.length > 0 ? userGrowth.map((d, index) => ({
    month: d.month,
    value: Math.floor((d.value * 15.5) * (1 + (index * 0.12))) 
  })) : [
    { month: 'Jan', value: 2400 },
    { month: 'Feb', value: 3200 },
    { month: 'Mar', value: 3800 },
    { month: 'Apr', value: 4500 },
    { month: 'May', value: 5200 },
    { month: 'Jun', value: 6100 },
  ]);

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };
  
  // Map platformDistribution object to array for PieChart and Legend
  const dist = analyticsData?.platformDistribution || {};
  const platformDistribution = [
    { name: 'iOS', value: dist.ios || 0, color: '#4F46E5' },
    { name: 'Android', value: dist.android || 0, color: '#F97316' },
    // { name: 'Web', value: dist.web || 0, color: '#94A3B8' },
  ];

  const featureUsage = analyticsData?.featureUsage || [];

  if (isLoading) return <div className="p-8 text-white font-medium text-lg text-center mt-20">Loading platform analytics...</div>;

  const stats = [
    { 
      label: 'Premium users', 
      value: metrics?.premiumUsers?.value?.toLocaleString() || '0', 
      growth: metrics?.premiumUsers?.growth > 0 ? `+${metrics.premiumUsers.growth}%` : `${metrics?.premiumUsers?.growth || 0}%`, 
      icon: Crown, 
      color: 'text-indigo-600' 
    },
    { 
      label: 'free users', 
      value: metrics?.freeUsers?.value?.toLocaleString() || '0', 
      growth: metrics?.freeUsers?.growth > 0 ? `+${metrics.freeUsers.growth}%` : `${metrics?.freeUsers?.growth || 0}%`, 
      icon: UserPlus, 
      color: 'text-blue-600' 
    },
    { 
      label: 'daily active users', 
      value: metrics?.dailyActiveUsers?.value?.toLocaleString() || '0', 
      growth: metrics?.dailyActiveUsers?.growth > 0 ? `+${metrics.dailyActiveUsers.growth}%` : `${metrics?.dailyActiveUsers?.growth || 0}%`, 
      icon: Users, 
      color: 'text-indigo-900' 
    },
    /*
    { 
      label: 'Daily Active Users', 
      value: metrics?.dailyActiveUsers?.value?.toLocaleString() || '0', 
      growth: metrics?.dailyActiveUsers?.growth > 0 ? `+${metrics.dailyActiveUsers.growth}%` : `${metrics?.dailyActiveUsers.growth || 0}%`, 
      icon: Users, 
      color: 'text-blue-600' 
    },
    { 
      label: 'Engagement Rate', 
      value: metrics?.engagementRate?.value || '0%', 
      growth: metrics?.engagementRate?.growth > 0 ? `+${metrics.engagementRate.growth}%` : `${metrics?.engagementRate?.growth || 0}%`, 
      icon: MousePointer2, 
      color: 'text-indigo-600' 
    },
    { 
      label: 'Avg. Session', 
      value: metrics?.avgSession?.value || '0m', 
      growth: metrics?.avgSession?.growth > 0 ? `+${metrics.avgSession.growth}%` : `${metrics?.avgSession?.growth || 0}%`, 
      icon: Clock, 
      color: 'text-indigo-900' 
    },
    { 
      label: 'Growth Rate', 
      value: metrics?.growthRate?.value || '0%', 
      growth: metrics?.growthRate?.growth > 0 ? `+${metrics.growthRate.growth}%` : `${metrics?.growthRate?.growth || 0}%`, 
      icon: TrendingUp, 
      color: 'text-blue-900' 
    },
    */
  ];

  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-4xl font-bold text-gray-900">Analytics & Insights</h1>
        <p className="text-gray-500 mt-2 text-lg">Detailed platform statistics and trends</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {stats.map((stat, i) => (
          <Card key={i} className="p-8 space-y-4 bg-white rounded-3xl shadow-sm border-none">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-gray-400 uppercase tracking-wider">{stat.label}</span>
              <stat.icon size={24} className={stat.color} />
            </div>
            <div className="space-y-2">
              <h3 className="text-3xl font-bold text-gray-900">{stat.value}</h3>
              <p className={cn(
                "text-xs font-bold flex items-center gap-1",
                stat.growth?.startsWith('+') ? "text-emerald-500" : "text-rose-500"
              )}>
                <TrendingUp size={12} className={cn(stat.growth?.startsWith('-') && "rotate-180")} />
                {stat.growth}
              </p>
            </div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 p-10 space-y-10 bg-white rounded-3xl shadow-sm border-none">
          <div>
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

        <Card className="p-10 space-y-10 flex flex-col bg-white rounded-3xl shadow-sm border-none">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold text-gray-900">Platform Distribution</h3>
            <span className="px-2 py-0.5 bg-blue-50 text-blue-600 text-[10px] font-bold rounded tracking-wider">LIVE</span>
          </div>
          
          <div className="flex-1 flex items-center justify-center relative">
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-4xl font-bold text-gray-900">
                {platformDistribution[0]?.value || 0}%
              </span>
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">Mobile Core</span>
            </div>
            <div className="h-64 w-full relative overflow-hidden">
              <ResponsiveContainer width="99%" height={256} debounce={50}>
                <PieChart>


                  <Pie
                    data={platformDistribution}
                    innerRadius={80}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {platformDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {platformDistribution.map((item) => (
              <div key={item.name} className="text-center space-y-1">
                <div className="flex items-center justify-center gap-1.5">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">{item.name}</span>
                </div>
                <p className="text-lg font-bold text-gray-900">{item.value}%</p>
              </div>
            ))}
          </div>
        </Card>

        <Card className="lg:col-span-3 p-10 space-y-10 bg-white rounded-3xl shadow-sm border-none">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h3 className="text-xl font-bold text-gray-900">Revenue Growth</h3>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-emerald-500 bg-emerald-50 px-2 py-0.5 rounded-lg flex items-center gap-1">
                  <TrendingUp size={12} />
                  +12.5%
                </span>
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">vs last period</span>
              </div>
            </div>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
              <DollarSign size={20} />
            </div>
          </div>
          <div className="h-80 min-w-0 relative overflow-hidden">
            <ResponsiveContainer width="99%" height={320} debounce={50}>
              <AreaChart data={revenueData} margin={{ top: 20, right: 0, left: 10, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#F1F5F9" />
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
                  tick={{ fill: '#94A3B8', fontSize: 10, fontWeight: 700 }}
                  tickFormatter={(value) => `$${value}`}
                />
                <Tooltip 
                  cursor={{ stroke: '#10B981', strokeWidth: 2 }}
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)' }}
                  labelStyle={{ fontWeight: 800, color: '#1E293B' }}
                  formatter={(value) => [formatCurrency(value), 'Revenue']}
                />
                <Area 
                  type="monotone" 
                  dataKey="value" 
                  stroke="#10B981" 
                  strokeWidth={3}
                  fillOpacity={1} 
                  fill="url(#colorRevenue)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* <Card className="p-10 space-y-10 bg-white rounded-3xl shadow-sm border-none">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-bold text-gray-900">Feature Usage Breakdown</h3>
          <span className="text-sm font-bold text-gray-400 uppercase tracking-wider">Last 30 Days</span>
        </div>

        <div className="space-y-12">
          {featureUsage.map((feature) => (
            <div key={feature.label} className="space-y-4">
              <div className="flex justify-between text-sm font-bold">
                <span className="text-gray-900">{feature.label}</span>
                <span className="text-gray-400">{feature.value}%</span>
              </div>
              <div className="h-3 bg-gray-50 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-[#7C3AED] rounded-full transition-all duration-1000" 
                  style={{ width: `${feature.value}%` }} 
                />
              </div>
            </div>
          ))}
        </div>
      </Card> */}
    </div>
  );
};
