import React, { useState, useEffect } from 'react';
import { Crown, Search, ChevronDown, X, ChevronLeft, ChevronRight, DollarSign, CalendarDays, Users, TrendingUp, Shield } from 'lucide-react';
import { Card } from '../../components/common/card';
import { Button } from '../../components/common/Button';
import { cn } from '../../utils/utils';
import { useSubscribers, useGrantPremium, useRevokePremium } from '../../reactQuery/hooks/subscriptionHook';
import { motion, AnimatePresence } from 'motion/react';
import { imageUrl } from '../../reactQuery/api/apiClient';

const SkeletonRow = () => (
  <tr>
    {[...Array(5)].map((_, i) => (
      <td key={i} className="px-10 py-8">
        <div className="h-4 bg-gray-200 rounded-xl animate-pulse" style={{ width: i === 0 ? '60%' : '40%' }} />
      </td>
    ))}
  </tr>
);

const SkeletonStatCard = () => (
  <Card className="p-6 bg-white rounded-3xl shadow-sm border-none">
    <div className="flex items-center justify-between">
      <div className="space-y-3 flex-1">
        <div className="h-3 w-24 bg-gray-200 rounded-lg animate-pulse" />
        <div className="h-8 w-16 bg-gray-200 rounded-lg animate-pulse" />
        <div className="h-3 w-20 bg-gray-200 rounded-lg animate-pulse" />
      </div>
      <div className="w-14 h-14 bg-gray-200 rounded-full animate-pulse" />
    </div>
  </Card>
);

const GrantPremiumModal = ({ isOpen, onClose, onGrant, isPending }) => {
  const [email, setEmail] = useState('');
  const [plan, setPlan] = useState('monthly');
  const [duration, setDuration] = useState(1);

  const handleSubmit = (e) => {
    e.preventDefault();
    onGrant({ email, plan, duration });
    setEmail('');
    setPlan('monthly');
    setDuration(1);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="bg-white rounded-[32px] w-full max-w-lg overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-8 space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-purple-50 rounded-2xl flex items-center justify-center">
                    <Crown className="w-6 h-6 text-[#7C3AED]" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">Grant Premium</h2>
                    <p className="text-sm text-gray-400">Upgrade a user to premium</p>
                  </div>
                </div>
                <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors p-2 hover:bg-gray-50 rounded-xl">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700">User Email</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-5 py-3.5 bg-white border border-gray-100 rounded-2xl focus:ring-2 focus:ring-[#7C3AED]/20 focus:border-[#7C3AED] outline-none transition-all text-gray-900 font-medium placeholder:text-gray-300 shadow-sm"
                    placeholder="user@example.com"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-700">Plan Type</label>
                    <div className="relative">
                      <select
                        value={plan}
                        onChange={(e) => setPlan(e.target.value)}
                        className="w-full appearance-none px-5 py-3.5 bg-white border border-gray-100 rounded-2xl focus:ring-2 focus:ring-[#7C3AED]/20 focus:border-[#7C3AED] outline-none cursor-pointer font-medium text-gray-700 shadow-sm pr-12"
                      >
                        <option value="monthly">Monthly</option>
                        <option value="yearly">Yearly</option>
                      </select>
                      <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={18} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-700">Duration</label>
                    <input
                      type="number"
                      min="1"
                      max="24"
                      value={duration}
                      onChange={(e) => setDuration(Number(e.target.value))}
                      className="w-full px-5 py-3.5 bg-white border border-gray-100 rounded-2xl focus:ring-2 focus:ring-[#7C3AED]/20 focus:border-[#7C3AED] outline-none font-medium text-gray-700 shadow-sm"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <Button type="button" variant="ghost" onClick={onClose} className="px-6">Cancel</Button>
                  <Button type="submit" disabled={isPending} className="bg-[#7C3AED] hover:bg-[#6D28D9] px-8">
                    <Crown className="w-4 h-4" />
                    {isPending ? 'Granting...' : 'Grant Premium'}
                  </Button>
                </div>
              </form>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export const SubscriptionManagement = () => {
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [planFilter, setPlanFilter] = useState('All');
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [showGrantModal, setShowGrantModal] = useState(false);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const { data: response, isLoading } = useSubscribers({
    page,
    limit,
    search,
    plan: planFilter === 'All' ? undefined : planFilter.toLowerCase(),
  });
  const { mutate: grantPremium, isPending: isGranting } = useGrantPremium();
  const { mutate: revokePremium, isPending: isRevoking } = useRevokePremium();

  const subscribers = response?.data?.subscribers || response?.data?.users || response?.data || [];
  const subscriberList = Array.isArray(subscribers) ? subscribers : [];
  const pagination = response?.data?.pagination;
  const totalPages = pagination?.totalPages || 1;
  const totalCount = pagination?.total || subscriberList.length;

  const apiStats = response?.data?.stats;
  const stats = [
    {
      label: 'Total Subscribers',
      value: apiStats?.total ?? totalCount,
      growth: apiStats?.totalGrowth || '+12%',
      icon: Users,
      color: 'bg-purple-50 text-purple-600',
      iconBg: 'bg-purple-100',
    },
    {
      label: 'Monthly Plan',
      value: apiStats?.monthly ?? subscriberList.filter(s => s.subscriptionPlan === 'monthly').length,
      growth: apiStats?.monthlyGrowth || '+8%',
      icon: CalendarDays,
      color: 'bg-blue-50 text-blue-600',
      iconBg: 'bg-blue-100',
    },
    {
      label: 'Yearly Plan',
      value: apiStats?.yearly ?? subscriberList.filter(s => s.subscriptionPlan === 'yearly').length,
      growth: apiStats?.yearlyGrowth || '+15%',
      icon: Shield,
      color: 'bg-amber-50 text-amber-600',
      iconBg: 'bg-amber-100',
    },
    {
      label: 'Revenue',
      value: apiStats?.revenue || '$0',
      growth: apiStats?.revenueGrowth || '+22%',
      icon: DollarSign,
      color: 'bg-emerald-50 text-emerald-600',
      iconBg: 'bg-emerald-100',
    },
  ];

  const handleGrantPremium = (data) => {
    grantPremium(data, {
      onSuccess: () => setShowGrantModal(false),
    });
  };

  return (
    <div className="p-10 space-y-10 min-h-screen">
      <GrantPremiumModal
        isOpen={showGrantModal}
        onClose={() => setShowGrantModal(false)}
        onGrant={handleGrantPremium}
        isPending={isGranting}
      />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-3">
          <h1 className="text-4xl font-bold text-gray-900 tracking-tight">Subscription Management</h1>
          <p className="text-gray-400 text-xl font-medium">Manage premium users and subscription plans</p>
        </div>
        <Button onClick={() => setShowGrantModal(true)} className="bg-[#7C3AED] hover:bg-[#6D28D9]">
          <Crown className="w-4 h-4" /> Grant Premium
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {isLoading
          ? [...Array(4)].map((_, i) => <SkeletonStatCard key={i} />)
          : stats.map((stat, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1, duration: 0.4 }}
              >
                <Card className="p-6 bg-white rounded-3xl shadow-sm border-none hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between">
                    <div className="space-y-2">
                      <p className="text-sm text-gray-400 font-medium">{stat.label}</p>
                      <h3 className="text-3xl font-bold text-gray-900">
                        {typeof stat.value === 'number' ? stat.value.toLocaleString() : stat.value}
                      </h3>
                      <p className={cn(
                        "text-xs font-semibold flex items-center gap-1",
                        String(stat.growth).startsWith('+') ? "text-emerald-500" : "text-rose-500"
                      )}>
                        <span className="text-[10px]">{String(stat.growth).startsWith('+') ? '↗' : '↘'}</span>
                        {stat.growth}
                      </p>
                    </div>
                    <div className={cn("w-14 h-14 rounded-full flex items-center justify-center", stat.color)}>
                      <stat.icon size={28} />
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
      </div>

      {/* Table */}
      <Card className="overflow-hidden bg-white rounded-[24px] shadow-sm border-none p-10 space-y-10">
        {/* Search + Filter */}
        <div className="flex items-center justify-between gap-6">
          <div className="relative flex-1">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search subscribers..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full pl-14 pr-6 py-4 bg-white border border-gray-100 rounded-2xl focus:ring-0 outline-none transition-all text-gray-900 font-medium placeholder:text-gray-300 shadow-sm"
            />
          </div>
          <div className="relative w-56">
            <select
              value={planFilter}
              onChange={(e) => { setPlanFilter(e.target.value); setPage(1); }}
              className="w-full appearance-none bg-white border border-gray-100 rounded-2xl px-8 py-4 pr-14 text-sm font-semibold text-gray-500 focus:ring-0 outline-none cursor-pointer shadow-sm"
            >
              <option>All</option>
              <option>Monthly</option>
              <option>Yearly</option>
            </select>
            <ChevronDown className="absolute right-6 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={20} />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto border border-gray-100 rounded-[18px]">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-[#eff6ff]">
                <th className="px-10 py-6 text-base font-bold text-gray-600 text-left">User</th>
                <th className="px-10 py-6 text-base font-bold text-gray-600 text-center">Plan</th>
                <th className="px-10 py-6 text-base font-bold text-gray-600 text-center">Status</th>
                <th className="px-10 py-6 text-base font-bold text-gray-600 text-center">Expires</th>
                <th className="px-10 py-6 text-base font-bold text-gray-600 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                [...Array(5)].map((_, i) => <SkeletonRow key={i} />)
              ) : subscriberList.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-8 py-16 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-16 h-16 bg-purple-50 rounded-2xl flex items-center justify-center">
                        <Crown className="w-8 h-8 text-purple-300" />
                      </div>
                      <p className="text-gray-400 font-medium text-lg">No subscribers found</p>
                      <p className="text-gray-300 text-sm">Try adjusting your search or filters</p>
                    </div>
                  </td>
                </tr>
              ) : (
                subscriberList.map((user, idx) => (
                  <motion.tr
                    key={user._id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.03 }}
                    className="hover:bg-gray-50/50 transition-colors"
                  >
                    <td className="px-10 py-8">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-purple-100 overflow-hidden ring-2 ring-purple-50 flex-shrink-0">
                          {user.profilePicture ? (
                            <img
                              src={imageUrl + user.profilePicture}
                              alt={user.fullName || user.name}
                              className="w-full h-full object-cover"
                              crossOrigin="anonymous"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-purple-600 text-sm font-bold">
                              {(user.fullName || user.name || 'U').charAt(0)}
                            </div>
                          )}
                        </div>
                        <div>
                          <span className="font-bold text-gray-700 text-base">{user.fullName || user.name || 'Anonymous'}</span>
                          <p className="text-sm text-gray-400">{user.email || user.phoneNumber || 'N/A'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-10 py-8 text-center">
                      <span className={cn(
                        "inline-block min-w-[100px] py-2 rounded-xl text-sm font-bold capitalize",
                        user.subscriptionPlan === 'yearly' ? "bg-[#fef3c7] text-[#d97706]" : "bg-[#dbeafe] text-[#2563eb]"
                      )}>
                        {user.subscriptionPlan || 'Premium'}
                      </span>
                    </td>
                    <td className="px-10 py-8 text-center">
                      <span className={cn(
                        "inline-block min-w-[100px] py-2 rounded-xl text-sm font-bold",
                        (!user.subscriptionExpiresAt || new Date(user.subscriptionExpiresAt) > new Date())
                          ? "bg-[#d1fae5] text-[#059669]"
                          : "bg-[#fee2e2] text-[#dc2626]"
                      )}>
                        {(!user.subscriptionExpiresAt || new Date(user.subscriptionExpiresAt) > new Date()) ? 'Active' : 'Expired'}
                      </span>
                    </td>
                    <td className="px-10 py-8 text-center">
                      <span className="text-base font-medium text-gray-600">
                        {user.subscriptionExpiresAt ? new Date(user.subscriptionExpiresAt).toLocaleDateString() : 'Lifetime'}
                      </span>
                    </td>
                    <td className="px-10 py-8 text-center">
                      <button
                        onClick={() => {
                          if (window.confirm(`Revoke premium from ${user.fullName || user.name}?`)) {
                            revokePremium(user._id);
                          }
                        }}
                        disabled={isRevoking}
                        className="px-5 py-2 border border-red-200 text-red-700 text-xs font-bold rounded-xl hover:bg-red-50 transition-all flex items-center justify-center gap-2 shadow-sm active:scale-95 mx-auto"
                      >
                        <Shield size={14} />
                        Revoke
                      </button>
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="p-6 border-t border-gray-50 flex items-center justify-between">
            <p className="text-sm text-gray-500">
              Showing {(page - 1) * limit + 1} to {Math.min(page * limit, totalCount)} of {totalCount} subscribers
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page === 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="p-2"
              >
                <ChevronLeft size={20} />
              </Button>
              <div className="flex items-center gap-1">
                {[...Array(totalPages)].map((_, i) => {
                  const p = i + 1;
                  if (totalPages > 7 && p !== 1 && p !== totalPages && Math.abs(p - page) > 1) {
                    if (p === 2 || p === totalPages - 1) return <span key={p} className="px-1 text-gray-400">...</span>;
                    return null;
                  }
                  return (
                    <Button
                      key={p}
                      variant={page === p ? 'primary' : 'ghost'}
                      size="sm"
                      onClick={() => setPage(p)}
                      className={cn("w-10 h-10", page === p ? "bg-indigo-600 text-white" : "text-gray-600")}
                    >
                      {p}
                    </Button>
                  );
                })}
              </div>
              <Button
                variant="outline"
                size="sm"
                disabled={page === totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="p-2"
              >
                <ChevronRight size={20} />
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};
