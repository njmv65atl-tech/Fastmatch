import React, { useState, useEffect } from "react";
import { useGetReports, useBanUser, useUnbanUser } from "../../reactQuery/hooks/userHook";
import {
  Ban,
  Search,
  ChevronLeft,
  ChevronRight,
  ShieldAlert,
  User,
  Eye
} from "lucide-react";
import { cn } from "../../utils/utils";
import { motion, AnimatePresence } from "motion/react";
import { Card } from "../../components/common/card";
import { Button } from "../../components/common/Button";
import { imageUrl } from "../../reactQuery/api/apiClient";

const getTimeAgo = (date) => {
  if (!date) return 'N/A';
  const seconds = Math.floor((new Date() - new Date(date)) / 1000);
  let interval = Math.floor(seconds / 86400);
  if (interval > 1) return interval + " days ago";
  if (interval === 1) return "1 day ago";
  interval = Math.floor(seconds / 3600);
  if (interval >= 1) return interval + " hr ago";
  interval = Math.floor(seconds / 60);
  if (interval >= 1) return interval + " mins ago";
  return "Just now";
};

export const UserReports = () => {
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput);
      setPage(1); // Reset to first page on search
    }, 500);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const { data: response, isLoading } = useGetReports({
    page,
    limit,
    search,
  });

  const { mutate: banUserMutate } = useBanUser();
  const { mutate: unbanUserMutate } = useUnbanUser();

  const reports = response?.data?.reports || [];
  const pagination = response?.data?.pagination;
  const totalPages = pagination?.totalPages || 1;
  const totalCount = pagination?.total || 0;

  return (
    <div className="p-10 space-y-10 min-h-screen">
      <div className="space-y-3">
        <h1 className="text-4xl font-bold text-gray-900 tracking-tight flex items-center gap-3">
          <div className="p-2 bg-rose-100 text-rose-600 rounded-xl">
            <ShieldAlert size={28} />
          </div>
          User Reports Queue
        </h1>
        <p className="text-gray-400 text-xl font-medium">Review reported users and take moderation actions</p>
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
              placeholder="Search reports..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full pl-14 pr-6 py-4 bg-white border border-gray-100 rounded-2xl focus:ring-0 outline-none transition-all text-gray-900 font-medium placeholder:text-gray-300 shadow-sm"
            />
          </div>
        </div>

        <div className="overflow-x-auto border border-gray-100 rounded-[18px]">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-[#fff1f2]">
                <th className="px-10 py-6 text-base font-bold text-rose-800 text-left">Reported User</th>
                <th className="px-10 py-6 text-base font-bold text-rose-800 text-left">Reporter</th>
                <th className="px-10 py-6 text-base font-bold text-rose-800 text-left">Category</th>
                <th className="px-10 py-6 text-base font-bold text-rose-800 text-left">Message</th>
                <th className="px-10 py-6 text-base font-bold text-rose-800 text-center">Status</th>
                <th className="px-10 py-6 text-base font-bold text-rose-800 text-center">Time</th>
                <th className="px-10 py-6 text-base font-bold text-rose-800 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                <tr>
                  <td colSpan="7" className="px-8 py-10 text-center text-gray-400 font-bold">
                    Loading reports...
                  </td>
                </tr>
              ) : reports.length > 0 ? (
                reports.map((report) => (
                  <tr key={report._id} className="hover:bg-rose-50/30 transition-colors">
                    <td className="px-10 py-8">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-rose-100 overflow-hidden shrink-0">
                          {report.reportedUser?.profilePicture ? (
                             <img src={imageUrl + report.reportedUser.profilePicture} alt="" className="w-full h-full object-cover" crossOrigin="anonymous"/>
                          ) : (
                             <User className="w-full h-full p-2 text-rose-400" />
                          )}
                        </div>
                        <div className="flex flex-col">
                          <span className="font-bold text-gray-900 text-base">{report.reportedUser?.fullName || report.reportedUser?.email || "Unknown"}</span>
                          <span className="text-xs text-gray-500 font-bold">{report.reportedUser?.email}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-10 py-8">
                      <div className="flex flex-col">
                        <span className="font-bold text-gray-600 text-sm">{report.reporter?.fullName || report.reporter?.email || "Unknown"}</span>
                      </div>
                    </td>
                    <td className="px-10 py-8">
                      <span className="inline-block px-3 py-1 bg-amber-50 text-amber-700 rounded-lg text-sm font-bold uppercase tracking-wider">
                        {report.category || "General"}
                      </span>
                    </td>
                    <td className="px-10 py-8">
                      <span className="text-gray-600 text-sm font-medium max-w-[200px] truncate block" title={report.message}>
                        {report.message || "-"}
                      </span>
                    </td>
                    <td className="px-10 py-8 text-center">
                      <span className={cn(
                        "inline-block px-4 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider border",
                        report.reportedUser?.isBanned ? "bg-rose-50 text-rose-600 border-rose-200" : "bg-emerald-50 text-emerald-600 border-emerald-200"
                      )}>
                        {report.reportedUser?.isBanned ? "Banned" : "Active"}
                      </span>
                    </td>
                    <td className="px-10 py-8 text-center text-sm font-bold text-gray-500">
                      {getTimeAgo(report.createdAt)}
                    </td>
                    <td className="px-10 py-8 text-center">
                      <div className="flex items-center justify-center gap-2">
                        {report.reportedUser?.isBanned ? (
                          <button
                            onClick={() => {
                              if (window.confirm(`Unban ${report.reportedUser?.fullName || report.reportedUser?.email}?`)) {
                                unbanUserMutate(report.reportedUser?._id);
                              }
                            }}
                            className="px-4 py-2 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-xl hover:bg-emerald-100 transition-all flex items-center justify-center gap-2 shadow-sm active:scale-95"
                          >
                            <ShieldAlert size={14} />
                            Unban
                          </button>
                        ) : (
                          <button
                            onClick={() => {
                              if (window.confirm(`Ban ${report.reportedUser?.fullName || report.reportedUser?.email}?`)) {
                                banUserMutate(report.reportedUser?._id);
                              }
                            }}
                            className="px-4 py-2 bg-rose-50 text-rose-700 text-xs font-bold rounded-xl hover:bg-rose-100 transition-all flex items-center justify-center gap-2 shadow-sm active:scale-95"
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
                    className="px-8 py-14 text-center text-gray-400 font-bold"
                  >
                    No reports found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination bar */}
        {totalPages > 1 && (
          <div className="p-6 border-t border-gray-50 flex items-center justify-between">
            <p className="text-sm text-gray-500 font-bold uppercase tracking-wider">
              Showing {(page - 1) * limit + 1} to{" "}
              {Math.min(page * limit, totalCount)} of {totalCount}
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
                      variant={page === p ? "primary" : "ghost"}
                      size="sm"
                      onClick={() => setPage(p)}
                      className={cn(
                        "w-10 h-10",
                        page === p
                          ? "bg-rose-600 text-white"
                          : "text-gray-600 font-bold hover:bg-gray-100",
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
