import React, { useState, useEffect } from 'react';
import { 
  Crown, 
  Search, 
  ChevronDown, 
  X, 
  ChevronLeft, 
  ChevronRight, 
  DollarSign, 
  CalendarDays, 
  Users, 
  TrendingUp, 
  Shield, 
  Plus, 
  Trash2, 
  Tag, 
  Percent, 
  Coins, 
  Save, 
  CheckCircle2, 
  AlertCircle,
  Copy,
  Calendar,
  Sparkles,
  Layers,
  ArrowRight
} from 'lucide-react';
import { Card } from '../../components/common/card';
import { Button } from '../../components/common/Button';
import { cn } from '../../utils/utils';
import { 
  useSubscribers, 
  useGrantPremium, 
  useRevokePremium,
  useCoupons,
  useCreateCoupon,
  useDeleteCoupon,
  usePricing,
  useUpdatePricing
} from '../../reactQuery/hooks/subscriptionHook';
import { motion, AnimatePresence } from 'motion/react';
import { imageUrl } from '../../reactQuery/api/apiClient';
import { toast } from 'react-toastify';

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
                    <label className="text-sm font-bold text-gray-700">Duration (Months)</label>
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

const CreateCouponModal = ({ isOpen, onClose, onCreate, isPending }) => {
  const [code, setCode] = useState('');
  const [discountPercent, setDiscountPercent] = useState(20);
  const [applicablePlan, setApplicablePlan] = useState('all');
  const [expiresAt, setExpiresAt] = useState('');
  const [maxUses, setMaxUses] = useState(100);

  const handleSubmit = (e) => {
    e.preventDefault();
    onCreate({
      code: code.trim().toUpperCase(),
      discountPercent: Number(discountPercent),
      applicablePlan,
      expiresAt: expiresAt ? new Date(expiresAt).toISOString() : undefined,
      maxUses: maxUses ? Number(maxUses) : undefined,
    });
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
                    <Tag className="w-6 h-6 text-[#7C3AED]" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">Create Promo Code</h2>
                    <p className="text-sm text-gray-400">Generate discount coupon for users</p>
                  </div>
                </div>
                <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors p-2 hover:bg-gray-50 rounded-xl">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700">Coupon Code</label>
                  <input
                    type="text"
                    required
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                    className="w-full px-5 py-3.5 bg-white border border-gray-100 rounded-2xl focus:ring-2 focus:ring-[#7C3AED]/20 focus:border-[#7C3AED] outline-none transition-all text-gray-900 font-bold uppercase tracking-wider placeholder:text-gray-300 shadow-sm"
                    placeholder="e.g. SUMMER50"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-700">Discount (%)</label>
                    <input
                      type="number"
                      required
                      min="1"
                      max="100"
                      value={discountPercent}
                      onChange={(e) => setDiscountPercent(e.target.value)}
                      className="w-full px-5 py-3.5 bg-white border border-gray-100 rounded-2xl focus:ring-2 focus:ring-[#7C3AED]/20 focus:border-[#7C3AED] outline-none font-medium text-gray-700 shadow-sm"
                      placeholder="20"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-700">Applicable Plan</label>
                    <div className="relative">
                      <select
                        value={applicablePlan}
                        onChange={(e) => setApplicablePlan(e.target.value)}
                        className="w-full appearance-none px-5 py-3.5 bg-white border border-gray-100 rounded-2xl focus:ring-2 focus:ring-[#7C3AED]/20 focus:border-[#7C3AED] outline-none cursor-pointer font-medium text-gray-700 shadow-sm pr-10"
                      >
                        <option value="all">All Plans</option>
                        <option value="monthly">Monthly Only</option>
                        <option value="yearly">Yearly Only</option>
                      </select>
                      <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={18} />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-700">Expiry Date (Optional)</label>
                    <input
                      type="date"
                      value={expiresAt}
                      onChange={(e) => setExpiresAt(e.target.value)}
                      className="w-full px-5 py-3.5 bg-white border border-gray-100 rounded-2xl focus:ring-2 focus:ring-[#7C3AED]/20 focus:border-[#7C3AED] outline-none font-medium text-gray-700 shadow-sm"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-700">Max Usages</label>
                    <input
                      type="number"
                      min="1"
                      value={maxUses}
                      onChange={(e) => setMaxUses(e.target.value)}
                      className="w-full px-5 py-3.5 bg-white border border-gray-100 rounded-2xl focus:ring-2 focus:ring-[#7C3AED]/20 focus:border-[#7C3AED] outline-none font-medium text-gray-700 shadow-sm"
                      placeholder="e.g. 100"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <Button type="button" variant="ghost" onClick={onClose} className="px-6">Cancel</Button>
                  <Button type="submit" disabled={isPending} className="bg-[#7C3AED] hover:bg-[#6D28D9] px-8 text-white">
                    <Tag className="w-4 h-4 mr-1.5" />
                    {isPending ? 'Creating...' : 'Create Coupon'}
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
  const [activeTab, setActiveTab] = useState('subscribers'); // 'subscribers' | 'pricing' | 'coupons'

  // --- Subscribers State ---
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
    },
    {
      label: 'Monthly Plan ($9.00/mo)',
      value: apiStats?.monthly ?? subscriberList.filter(s => s.subscriptionPlan === 'monthly').length,
      growth: apiStats?.monthlyGrowth || '+8%',
      icon: CalendarDays,
      color: 'bg-blue-50 text-blue-600',
    },
    {
      label: 'Yearly Plan ($90.00/yr)',
      value: apiStats?.yearly ?? subscriberList.filter(s => s.subscriptionPlan === 'yearly').length,
      growth: apiStats?.yearlyGrowth || '+15%',
      icon: Shield,
      color: 'bg-amber-50 text-amber-600',
    },
    {
      label: 'Estimated Revenue',
      value: apiStats?.revenue || '$' + ((subscriberList.filter(s => s.subscriptionPlan === 'monthly').length * 9) + (subscriberList.filter(s => s.subscriptionPlan === 'yearly').length * 90)),
      growth: apiStats?.revenueGrowth || '+22%',
      icon: DollarSign,
      color: 'bg-emerald-50 text-emerald-600',
    },
  ];

  // --- Dynamic Pricing State ---
  const { data: pricingRes, isLoading: isPricingLoading } = usePricing();
  const { mutate: updatePricing, isPending: isUpdatingPricing } = useUpdatePricing();

  const [monthlyPrice, setMonthlyPrice] = useState(9.00);
  const [yearlyPrice, setYearlyPrice] = useState(90.00);
  const [coinPackages, setCoinPackages] = useState([
    { id: 'com.fastmatch.coins_100', amount: 100, price: 0.99, bonus: 0 },
    { id: 'com.fastmatch.coins_500', amount: 500, price: 4.99, bonus: 50 },
    { id: 'com.fastmatch.coins_1000', amount: 1000, price: 9.99, bonus: 200 },
  ]);

  useEffect(() => {
    if (pricingRes?.data) {
      if (pricingRes.data.monthlyPrice !== undefined) setMonthlyPrice(pricingRes.data.monthlyPrice);
      if (pricingRes.data.yearlyPrice !== undefined) setYearlyPrice(pricingRes.data.yearlyPrice);
      if (Array.isArray(pricingRes.data.coinPackages) && pricingRes.data.coinPackages.length > 0) {
        setCoinPackages(pricingRes.data.coinPackages);
      }
    }
  }, [pricingRes]);

  const handleSavePricing = (e) => {
    e.preventDefault();
    updatePricing({
      monthlyPrice: Number(monthlyPrice),
      yearlyPrice: Number(yearlyPrice),
      coinPackages: coinPackages.map(pkg => ({
        ...pkg,
        amount: Number(pkg.amount),
        price: Number(pkg.price),
        bonus: Number(pkg.bonus || 0),
      }))
    });
  };

  const handleAddCoinPackage = () => {
    const nextAmount = (coinPackages.length + 1) * 1000;
    setCoinPackages([
      ...coinPackages,
      {
        id: `com.fastmatch.coins_${nextAmount}`,
        amount: nextAmount,
        price: Number((nextAmount * 0.0099).toFixed(2)),
        bonus: 0
      }
    ]);
  };

  const handleRemoveCoinPackage = (index) => {
    setCoinPackages(coinPackages.filter((_, i) => i !== index));
  };

  const handleUpdateCoinPackage = (index, field, value) => {
    const updated = [...coinPackages];
    updated[index] = { ...updated[index], [field]: value };
    setCoinPackages(updated);
  };

  // --- Coupons State ---
  const [couponSearch, setCouponSearch] = useState('');
  const [showCreateCouponModal, setShowCreateCouponModal] = useState(false);
  const { data: couponsRes, isLoading: isCouponsLoading } = useCoupons();
  const { mutate: createCoupon, isPending: isCreatingCoupon } = useCreateCoupon();
  const { mutate: deleteCoupon, isPending: isDeletingCoupon } = useDeleteCoupon();

  const couponsList = Array.isArray(couponsRes?.data) ? couponsRes.data : [];
  const filteredCoupons = couponsList.filter(c => 
    !couponSearch || c.code?.toLowerCase().includes(couponSearch.toLowerCase())
  );

  const handleCreateCouponSubmit = (couponData) => {
    createCoupon(couponData, {
      onSuccess: () => setShowCreateCouponModal(false),
    });
  };

  const handleCopyCode = (code) => {
    navigator.clipboard.writeText(code);
    toast.info(`Copied "${code}" to clipboard!`);
  };

  return (
    <div className="p-10 space-y-10 min-h-screen">
      <GrantPremiumModal
        isOpen={showGrantModal}
        onClose={() => setShowGrantModal(false)}
        onGrant={(data) => grantPremium(data, { onSuccess: () => setShowGrantModal(false) })}
        isPending={isGranting}
      />

      <CreateCouponModal
        isOpen={showCreateCouponModal}
        onClose={() => setShowCreateCouponModal(false)}
        onCreate={handleCreateCouponSubmit}
        isPending={isCreatingCoupon}
      />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-3">
          <h1 className="text-4xl font-bold text-gray-900 tracking-tight">Subscriptions & Monetization</h1>
          <p className="text-gray-400 text-xl font-medium">
            Manage premium subscribers, app store pricing models, and coupon campaigns
          </p>
        </div>
        <div className="flex items-center gap-3">
          {activeTab === 'subscribers' && (
            <Button onClick={() => setShowGrantModal(true)} className="bg-[#7C3AED] hover:bg-[#6D28D9] text-white">
              <Crown className="w-4 h-4 mr-2" /> Grant Premium
            </Button>
          )}
          {activeTab === 'coupons' && (
            <Button onClick={() => setShowCreateCouponModal(true)} className="bg-[#7C3AED] hover:bg-[#6D28D9] text-white">
              <Plus className="w-4 h-4 mr-2" /> Create Promo Code
            </Button>
          )}
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-gray-200">
        <button
          onClick={() => setActiveTab('subscribers')}
          className={cn(
            "flex items-center gap-2.5 px-6 py-4 font-bold text-base border-b-2 transition-all cursor-pointer",
            activeTab === 'subscribers'
              ? "border-[#7C3AED] text-[#7C3AED]"
              : "border-transparent text-gray-500 hover:text-gray-800"
          )}
        >
          <Users size={18} />
          <span>Active Subscribers</span>
          <span className="ml-1.5 px-2 py-0.5 rounded-full text-xs bg-purple-100 text-purple-700 font-extrabold">
            {totalCount}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('pricing')}
          className={cn(
            "flex items-center gap-2.5 px-6 py-4 font-bold text-base border-b-2 transition-all cursor-pointer",
            activeTab === 'pricing'
              ? "border-[#7C3AED] text-[#7C3AED]"
              : "border-transparent text-gray-500 hover:text-gray-800"
          )}
        >
          <DollarSign size={18} />
          <span>Plans & Coin Pricing</span>
          <span className="ml-1.5 px-2 py-0.5 rounded-full text-xs bg-emerald-100 text-emerald-700 font-extrabold">
            Live
          </span>
        </button>

        <button
          onClick={() => setActiveTab('coupons')}
          className={cn(
            "flex items-center gap-2.5 px-6 py-4 font-bold text-base border-b-2 transition-all cursor-pointer",
            activeTab === 'coupons'
              ? "border-[#7C3AED] text-[#7C3AED]"
              : "border-transparent text-gray-500 hover:text-gray-800"
          )}
        >
          <Tag size={18} />
          <span>Promo Codes & Coupons</span>
          <span className="ml-1.5 px-2 py-0.5 rounded-full text-xs bg-amber-100 text-amber-700 font-extrabold">
            {couponsList.length}
          </span>
        </button>
      </div>

      {/* TAB 1: SUBSCRIBERS */}
      {activeTab === 'subscribers' && (
        <div className="space-y-10">
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

          {/* Table Card */}
          <Card className="overflow-hidden bg-white rounded-[24px] shadow-sm border-none p-10 space-y-10">
            {/* Search + Filter */}
            <div className="flex items-center justify-between gap-6">
              <div className="relative flex-1">
                <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="text"
                  placeholder="Search subscribers by name or email..."
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

            {/* Subscribers Table */}
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
                                  src={user.profilePicture.startsWith('http') ? user.profilePicture : `${imageUrl}${user.profilePicture}`}
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
                            className="px-5 py-2 border border-red-200 text-red-700 text-xs font-bold rounded-xl hover:bg-red-50 transition-all flex items-center justify-center gap-2 shadow-sm active:scale-95 mx-auto cursor-pointer"
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
      )}

      {/* TAB 2: PLANS & PRICING */}
      {activeTab === 'pricing' && (
        <form onSubmit={handleSavePricing} className="space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Monthly Plan Card */}
            <Card className="p-8 bg-white rounded-3xl shadow-sm border border-gray-100 space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center font-bold">
                    <CalendarDays size={24} />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">Monthly VIP Subscription</h3>
                    <p className="text-sm text-gray-400">SKU: com.fastmatch.premium.monthly</p>
                  </div>
                </div>
                <span className="px-3 py-1 bg-blue-50 text-blue-700 text-xs font-bold rounded-full">
                  App Store & Google Play
                </span>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700">Monthly Price (USD)</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-lg">$</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0.99"
                    required
                    value={monthlyPrice}
                    onChange={(e) => setMonthlyPrice(e.target.value)}
                    className="w-full pl-10 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl text-xl font-black text-gray-900 focus:bg-white focus:border-[#7C3AED] outline-none transition-all"
                  />
                </div>
                <p className="text-xs text-gray-400">
                  Equivalent to ${(Number(monthlyPrice) / 30).toFixed(2)}/day for unlimited matching & filters.
                </p>
              </div>

              <div className="p-4 bg-gray-50 rounded-2xl space-y-2">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Features Included</p>
                <ul className="text-xs text-gray-600 space-y-1.5 font-medium">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 size={14} className="text-emerald-500 flex-shrink-0" /> Unlimited video chat connections
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 size={14} className="text-emerald-500 flex-shrink-0" /> Direct country & gender filter bypass
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 size={14} className="text-emerald-500 flex-shrink-0" /> Priority match queue placement
                  </li>
                </ul>
              </div>
            </Card>

            {/* Yearly Plan Card */}
            <Card className="p-8 bg-white rounded-3xl shadow-sm border border-gray-100 space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center font-bold">
                    <Crown size={24} />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">Yearly VIP Subscription</h3>
                    <p className="text-sm text-gray-400">SKU: com.fastmatch.premium.yearly</p>
                  </div>
                </div>
                <span className="px-3 py-1 bg-amber-50 text-amber-700 text-xs font-bold rounded-full">
                  Save {Math.max(0, Math.round((1 - (Number(yearlyPrice) / (Number(monthlyPrice) * 12))) * 100))}%
                </span>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700">Yearly Price (USD)</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-lg">$</span>
                  <input
                    type="number"
                    step="0.01"
                    min="4.99"
                    required
                    value={yearlyPrice}
                    onChange={(e) => setYearlyPrice(e.target.value)}
                    className="w-full pl-10 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl text-xl font-black text-gray-900 focus:bg-white focus:border-[#7C3AED] outline-none transition-all"
                  />
                </div>
                <p className="text-xs text-gray-400">
                  Equivalent to ${(Number(yearlyPrice) / 12).toFixed(2)}/mo billed annually.
                </p>
              </div>

              <div className="p-4 bg-amber-50/50 border border-amber-100 rounded-2xl space-y-2">
                <p className="text-xs font-bold text-amber-800 uppercase tracking-wider">Top Value Conversion</p>
                <p className="text-xs text-amber-900 leading-relaxed font-medium">
                  Yearly plan delivers over 2.4x higher Lifetime Value (LTV). Mobile app displays this plan with the VIP Gold highlight badge.
                </p>
              </div>
            </Card>
          </div>

          {/* Coin Packs Card */}
          <Card className="p-8 bg-white rounded-3xl shadow-sm border border-gray-100 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center">
                  <Coins size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Virtual Coin Bundles</h3>
                  <p className="text-sm text-gray-400">
                    Configured for Apple In-App Purchase and Google Play Billing
                  </p>
                </div>
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={handleAddCoinPackage}
                className="text-[#7C3AED] border-purple-200 hover:bg-purple-50"
              >
                <Plus size={16} className="mr-1.5" /> Add Coin Pack
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {coinPackages.map((pkg, idx) => (
                <div key={idx} className="p-5 bg-gray-50 rounded-2xl border border-gray-100 space-y-4 relative">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold text-gray-400">{pkg.id}</span>
                    {coinPackages.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveCoinPackage(idx)}
                        className="text-red-400 hover:text-red-600 p-1 rounded-lg hover:bg-red-50"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>

                  <div className="space-y-3">
                    <div>
                      <label className="text-xs font-bold text-gray-500 uppercase">Coins</label>
                      <input
                        type="number"
                        min="10"
                        value={pkg.amount}
                        onChange={(e) => handleUpdateCoinPackage(idx, 'amount', e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl font-bold text-gray-800 text-sm outline-none focus:border-[#7C3AED]"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-gray-500 uppercase">Bonus Coins</label>
                      <input
                        type="number"
                        min="0"
                        value={pkg.bonus || 0}
                        onChange={(e) => handleUpdateCoinPackage(idx, 'bonus', e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl font-bold text-emerald-600 text-sm outline-none focus:border-emerald-500"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-gray-500 uppercase">Price (USD)</label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold">$</span>
                        <input
                          type="number"
                          step="0.01"
                          min="0.49"
                          value={pkg.price}
                          onChange={(e) => handleUpdateCoinPackage(idx, 'price', e.target.value)}
                          className="w-full pl-7 pr-3 py-2 bg-white border border-gray-200 rounded-xl font-bold text-gray-900 text-sm outline-none focus:border-[#7C3AED]"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-end pt-4 border-t border-gray-100">
              <Button
                type="submit"
                disabled={isUpdatingPricing}
                className="bg-[#7C3AED] hover:bg-[#6D28D9] text-white px-8 py-3.5 text-base font-bold shadow-lg shadow-purple-200"
              >
                <Save size={18} className="mr-2" />
                {isUpdatingPricing ? 'Saving Changes...' : 'Save Pricing Configuration'}
              </Button>
            </div>
          </Card>
        </form>
      )}

      {/* TAB 3: PROMO CODES & COUPONS */}
      {activeTab === 'coupons' && (
        <div className="space-y-8">
          <Card className="p-8 bg-white rounded-3xl shadow-sm border border-gray-100 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="text"
                  placeholder="Filter coupons by promo code..."
                  value={couponSearch}
                  onChange={(e) => setCouponSearch(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm font-medium outline-none focus:bg-white focus:border-[#7C3AED] transition-all"
                />
              </div>

              <div className="flex items-center gap-3">
                <Button onClick={() => setShowCreateCouponModal(true)} className="bg-[#7C3AED] hover:bg-[#6D28D9] text-white">
                  <Plus size={16} className="mr-1.5" /> Add New Coupon
                </Button>
              </div>
            </div>

            <div className="overflow-x-auto border border-gray-100 rounded-2xl">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100 text-xs font-bold text-gray-500 uppercase tracking-wider">
                    <th className="py-4 px-6">Promo Code</th>
                    <th className="py-4 px-6">Discount</th>
                    <th className="py-4 px-6">Plan Scope</th>
                    <th className="py-4 px-6">Usage</th>
                    <th className="py-4 px-6">Expires</th>
                    <th className="py-4 px-6">Status</th>
                    <th className="py-4 px-6 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-sm">
                  {isCouponsLoading ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-gray-400 font-medium">
                        Loading coupons...
                      </td>
                    </tr>
                  ) : filteredCoupons.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-16 text-center text-gray-400 font-medium">
                        <div className="flex flex-col items-center gap-3">
                          <Tag className="w-10 h-10 text-gray-300" />
                          <p className="text-gray-500 font-bold">No coupons found</p>
                          <p className="text-xs text-gray-400">Create a discount code to start a promotional campaign</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredCoupons.map((coupon) => {
                      const isExpired = coupon.expiresAt && new Date(coupon.expiresAt) < new Date();
                      const isLimitReached = coupon.maxUses && coupon.usedCount >= coupon.maxUses;
                      const isActive = coupon.isActive && !isExpired && !isLimitReached;

                      return (
                        <tr key={coupon._id} className="hover:bg-gray-50/50 transition-colors">
                          <td className="py-4 px-6">
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-black text-purple-700 bg-purple-50 px-3 py-1 rounded-xl text-sm border border-purple-100">
                                {coupon.code}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleCopyCode(coupon.code)}
                                className="text-gray-400 hover:text-purple-600 p-1 rounded-lg cursor-pointer"
                                title="Copy Code"
                              >
                                <Copy size={14} />
                              </button>
                            </div>
                          </td>

                          <td className="py-4 px-6 font-extrabold text-emerald-600 text-base">
                            {coupon.discountPercent}% OFF
                          </td>

                          <td className="py-4 px-6">
                            <span className="capitalize px-2.5 py-1 bg-gray-100 text-gray-700 rounded-lg text-xs font-bold">
                              {coupon.applicablePlan === 'all' ? 'All Plans' : `${coupon.applicablePlan} only`}
                            </span>
                          </td>

                          <td className="py-4 px-6 text-gray-600 font-medium">
                            {coupon.usedCount || 0} / {coupon.maxUses || '∞'}
                          </td>

                          <td className="py-4 px-6 text-xs text-gray-500 font-medium">
                            {coupon.expiresAt ? new Date(coupon.expiresAt).toLocaleDateString() : 'Never'}
                          </td>

                          <td className="py-4 px-6">
                            <span className={cn(
                              "px-2.5 py-1 rounded-full text-xs font-bold",
                              isActive
                                ? "bg-emerald-50 text-emerald-600"
                                : "bg-rose-50 text-rose-600"
                            )}>
                              {isActive ? 'Active' : isExpired ? 'Expired' : 'Maxed Out'}
                            </span>
                          </td>

                          <td className="py-4 px-6 text-right">
                            <button
                              type="button"
                              onClick={() => {
                                if (window.confirm(`Are you sure you want to delete coupon "${coupon.code}"?`)) {
                                  deleteCoupon(coupon._id);
                                }
                              }}
                              disabled={isDeletingCoupon}
                              className="text-red-500 hover:text-red-700 p-2 hover:bg-red-50 rounded-xl transition-all cursor-pointer"
                              title="Delete Coupon"
                            >
                              <Trash2 size={16} />
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

