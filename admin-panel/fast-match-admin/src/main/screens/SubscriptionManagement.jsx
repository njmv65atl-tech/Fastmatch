import React, { useState } from 'react';
import { Crown, Search, CheckCircle, XCircle } from 'lucide-react';
import { Card } from '../../components/common/card';
import { Button } from '../../components/common/Button';
import { cn } from '../../utils/utils';
import { useSubscribers, useGrantPremium, useRevokePremium } from '../../reactQuery/hooks/subscriptionHook';
import { motion } from 'framer-motion';

export const SubscriptionManagement = () => {
  const [search, setSearch] = useState("");
  const { data: response, isLoading } = useSubscribers({ search });
  const { mutate: grantPremium, isPending: isGranting } = useGrantPremium();
  const { mutate: revokePremium, isPending: isRevoking } = useRevokePremium();

  const subscribers = response?.data || [];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Subscriptions</h1>
          <p className="text-gray-500 mt-1">Manage premium users and plans</p>
        </div>
        <Button onClick={() => alert("Open Grant Premium Modal")} className="bg-[#7C3AED] hover:bg-[#6D28D9]">
          <Crown className="w-4 h-4 mr-2" /> Grant Premium
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="p-6">
          <p className="text-sm font-medium text-gray-500">Total Subscribers</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{subscribers.length}</p>
        </Card>
      </div>

      <Card className="overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search users..."
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/20 focus:border-[#7C3AED]"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/50">
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">User</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Plan</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Expires</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                <tr><td colSpan="4" className="text-center py-8 text-gray-500">Loading...</td></tr>
              ) : subscribers.length === 0 ? (
                <tr><td colSpan="4" className="text-center py-8 text-gray-500">No subscribers found</td></tr>
              ) : (
                subscribers.map((user) => (
                  <motion.tr key={user._id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <img src={user.profilePicture || "https://via.placeholder.com/40"} alt="" className="w-10 h-10 rounded-full object-cover" />
                        <div>
                          <div className="font-medium text-gray-900">{user.name || "Anonymous"}</div>
                          <div className="text-sm text-gray-500">{user.email || user.phoneNumber}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-700">
                        {user.subscriptionPlan || "Premium"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {user.subscriptionExpiresAt ? new Date(user.subscriptionExpiresAt).toLocaleDateString() : "Lifetime"}
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => revokePremium(user._id)}
                        disabled={isRevoking}
                        className="text-red-600 hover:bg-red-50 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
                      >
                        Revoke
                      </button>
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};
