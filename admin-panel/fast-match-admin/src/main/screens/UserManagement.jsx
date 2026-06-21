import React, { useState, useEffect } from "react";
import { useUserManagement, useBanUser, useUnbanUser } from "../../reactQuery/hooks/userHook";
import {
  Ban,
  Search,
  ChevronDown,
  Eye,
  X,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { cn } from "../../utils/utils";
import { motion, AnimatePresence } from "motion/react";
import { Card } from "../../components/common/card";
import { Button } from "../../components/common/Button";
import { imageUrl } from "../../reactQuery/api/apiClient";

const UserProfileModal = ({ user, onClose }) => {
  if (!user) return null;

  return (
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
        <div className="p-8 space-y-8 max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900">
              User Profile Details
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          <div className="flex flex-col items-center gap-4">
            <div className="w-24 h-24 rounded-full bg-indigo-100 overflow-hidden ring-4 ring-indigo-50">
              {user.profilePicture ? (
                <img
                  src={imageUrl + user.profilePicture}
                  alt={user.fullName}
                  className="w-full h-full object-cover"
                  crossOrigin="anonymous"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-indigo-600 text-2xl font-bold">
                  {user.fullName?.charAt(0) || user.displayName?.charAt(0) || "?"}
                </div>
              )}
            </div>
            <div className="text-center">
              <h3 className="text-2xl font-bold text-gray-900">
                {user.fullName || "N/A"}
              </h3>
              <p className="text-gray-500">{user.email || "N/A"}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-1">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                Display Name
              </p>
              <p className="text-sm font-semibold text-gray-900">
                {user.displayName || "N/A"}
              </p>
            </div>

            <div className="space-y-1">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                Plan Type
              </p>
              <p className="text-sm font-semibold text-gray-900 capitalize">
                {user.isPremium || "Free"}
              </p>
            </div>

            <div className="space-y-1">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                Status
              </p>
              <p className="text-sm font-semibold text-gray-900">
                {user.status === "Active" ? "Verified" : user.status || "Inactive"}
              </p>
            </div>

            <div className="space-y-1">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                Gender
              </p>
              <p className="text-sm font-semibold text-gray-900">
                {user.gender?.charAt(0).toUpperCase() + user.gender?.slice(1) || "N/A"}
              </p>
            </div>

            <div className="col-span-2 space-y-2">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                Interests
              </p>
              <div className="flex flex-wrap gap-2">
                {user.interests?.map((interest, i) => (
                  <span
                    key={i}
                    className="px-3 py-1 bg-gray-100 rounded-full text-xs font-medium text-gray-600"
                  >
                    {interest}
                  </span>
                )) || (
                  <span className="text-gray-400 text-xs italic">
                    No interests listed
                  </span>
                )}
              </div>
            </div>

            <div className="space-y-1">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                Device
              </p>
              <p className="text-sm font-semibold text-gray-900">
                {user.deviceName || "N/A"}
              </p>
            </div>

            <div className="space-y-1">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                Last Active
              </p>
              <p className="text-sm font-semibold text-gray-900">
                {user.lastActive
                  ? new Date(user.lastActive).toLocaleString()
                  : "N/A"}
              </p>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

const getTimeAgo = (date) => {
  if (!date) return 'N/A';
  const seconds = Math.floor((new Date() - new Date(date)) / 1000);
  let interval = Math.floor(seconds / 86400);
  if (interval > 1) return interval + " day ago";
  if (interval === 1) return "1 day ago";
  interval = Math.floor(seconds / 3600);
  if (interval >= 1) return interval + "hr Ago";
  interval = Math.floor(seconds / 60);
  if (interval >= 1) return interval + " mins ago";
  return "Just now";
};

export const UserManagement = () => {
  const [selectedUser, setSelectedUser] = useState(null);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [type, setType] = useState("All");

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput);
      setPage(1); // Reset to first page on search
    }, 500);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const { data: response, isLoading } = useUserManagement({
    page,
    limit,
    search,
    type: type === "All" ? undefined : type.toLowerCase(),
  });

  const { mutate: banUserMutate } = useBanUser();
  const { mutate: unbanUserMutate } = useUnbanUser();

  const users = response?.data?.users || [];
  const pagination = response?.data?.pagination;
  const totalPages = pagination?.totalPages || 1;
  const totalCount = pagination?.total || 0;

  if (isLoading && page === 1)
    return (
      <div className="p-8 text-black font-medium text-center mt-20">
        Loading users...
      </div>
    );

  return (
    <div className="p-10 space-y-10 min-h-screen">
      <AnimatePresence>
        {selectedUser && (
          <UserProfileModal
            user={selectedUser}
            onClose={() => setSelectedUser(null)}
          />
        )}
      </AnimatePresence>

      <div className="space-y-3">
        <h1 className="text-4xl font-bold text-gray-900 tracking-tight">User Management</h1>
        <p className="text-gray-400 text-xl font-medium">View and manage user accounts</p>
      </div>

      <Card className="overflow-hidden bg-white rounded-[24px] shadow-sm border-none p-10 space-y-10">
        <div className="flex items-center justify-between gap-6">
          <div className="relative flex-1">
            <Search
              className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400"
              size={18}
            />
            <input
              type="text"
              placeholder="Search..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full pl-14 pr-6 py-4 bg-white border border-gray-100 rounded-2xl focus:ring-0 outline-none transition-all text-gray-900 font-medium placeholder:text-gray-300 shadow-sm"
            />
          </div>
          <div className="relative w-56">
            <select
              value={type}
              onChange={(e) => {
                setType(e.target.value);
                setPage(1);
              }}
              className="w-full appearance-none bg-white border border-gray-100 rounded-2xl px-8 py-4 pr-14 text-sm font-semibold text-gray-500 focus:ring-0 outline-none cursor-pointer shadow-sm"
            >
              <option>All</option>
              <option>Premium</option>
              <option>Free</option>
            </select>
            <ChevronDown
              className="absolute right-6 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
              size={20}
            />
          </div>
        </div>

        <div className="overflow-x-auto border border-gray-100 rounded-[18px]">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-[#eff6ff]">
                <th className="px-10 py-6 text-base font-bold text-gray-600 text-left">User</th>
                <th className="px-10 py-6 text-base font-bold text-gray-600 text-left">Email</th>
                <th className="px-10 py-6 text-base font-bold text-gray-600 text-center">Account Type</th>
                <th className="px-10 py-6 text-base font-bold text-gray-600 text-center">Status</th>
                <th className="px-10 py-6 text-base font-bold text-gray-600 text-center">Banned</th>
                <th className="px-10 py-6 text-base font-bold text-gray-600 text-center">Last Active</th>
                <th className="px-10 py-6 text-base font-bold text-gray-600 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {users.length > 0 ? (
                users.map((user) => (
                  <tr key={user._id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-10 py-8">
                      <span className="font-bold text-gray-700 text-base">{user.fullName || user.displayName || "N/A"}</span>
                    </td>
                    <td className="px-10 py-8">
                      <span className="text-gray-500 font-medium text-base">{user.email}</span>
                    </td>
                    <td className="px-10 py-8 text-center">
                      <span className={cn(
                        "inline-block min-w-[100px] py-2 rounded-xl text-sm font-bold",
                        user.isPremium === "premium" ? "bg-[#fef3c7] text-[#d97706]" : "bg-[#f3f4f6] text-[#4b5563]"
                      )}>
                        {user.isPremium || "Free"}
                      </span>
                    </td>
                    <td className="px-10 py-8 text-center">
                      <span className={cn(
                        "inline-block min-w-[100px] py-2 rounded-xl text-sm font-bold",
                        user.status === "Active" ? "bg-[#d1fae5] text-[#059669]" : "bg-[#fee2e2] text-[#dc2626]"
                      )}>
                        {user.status === "Active" ? "Verified" : user.status || "Inactive"}
                      </span>
                    </td>
                    <td className="px-10 py-8 text-center">
                      <span className={cn(
                        "inline-block min-w-[80px] py-2 rounded-xl text-sm font-bold",
                        user.isBanned ? "bg-[#fee2e2] text-[#dc2626]" : "bg-[#d1fae5] text-[#059669]"
                      )}>
                        {user.isBanned ? "Yes" : "No"}
                      </span>
                    </td>
                    <td className="px-10 py-8 text-center">
                      <span className="text-base font-medium text-gray-600">
                        {getTimeAgo(user.lastActive || user.updatedAt)}
                      </span>
                    </td>
                    <td className="px-10 py-8 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => setSelectedUser(user)}
                          className="px-6 py-2 border border-gray-200 text-gray-700 text-xs font-bold rounded-xl hover:bg-gray-50 transition-all flex items-center justify-center gap-2 shadow-sm active:scale-95"
                        >
                          <Eye size={16} />
                          View
                        </button>
                        {user.isBanned ? (
                          <button
                            onClick={() => {
                              if (window.confirm(`Unban ${user.fullName || user.displayName}?`)) {
                                unbanUserMutate(user._id);
                              }
                            }}
                            className="px-4 py-2 border border-green-200 text-green-700 text-xs font-bold rounded-xl hover:bg-green-50 transition-all flex items-center justify-center gap-2 shadow-sm active:scale-95"
                          >
                            <Ban size={14} />
                            Unban
                          </button>
                        ) : (
                          <button
                            onClick={() => {
                              if (window.confirm(`Ban ${user.fullName || user.displayName}?`)) {
                                banUserMutate(user._id);
                              }
                            }}
                            className="px-4 py-2 border border-red-200 text-red-700 text-xs font-bold rounded-xl hover:bg-red-50 transition-all flex items-center justify-center gap-2 shadow-sm active:scale-95"
                          >
                            <Ban size={14} />
                            Ban
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan="7"
                    className="px-8 py-10 text-center text-gray-400"
                  >
                    No users found matching your search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination bar */}
        {totalPages > 1 && (
          <div className="p-6 border-t border-gray-50 flex items-center justify-between">
            <p className="text-sm text-gray-500">
              Showing {(page - 1) * limit + 1} to{" "}
              {Math.min(page * limit, totalCount)} of {totalCount} users
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
                {/* Simple pagination logic to show current +/- 2 pages if many */}
                {[...Array(totalPages)].map((_, i) => {
                  const p = i + 1;
                  // Show current page, edges, and +/- 1 around current
                  if (
                    totalPages > 7 &&
                    p !== 1 &&
                    p !== totalPages &&
                    Math.abs(p - page) > 1
                  ) {
                    if (p === 2 || p === totalPages - 1)
                      return (
                        <span key={p} className="px-1 text-gray-400">
                          ...
                        </span>
                      );
                    return null;
                  }
                  return (
                    <Button
                      key={p}
                      variant={page === p ? "primary" : "ghost"}
                      size="sm"
                      onClick={() => setPage(p)}
                      className={cn(
                        "w-10 h-10",
                        page === p
                          ? "bg-indigo-600 text-white"
                          : "text-gray-600",
                      )}
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
