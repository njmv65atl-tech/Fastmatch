import React, { useState } from "react";
import {
  useActivitySessions,
  useActivityLogs,
} from "../../reactQuery/hooks/activityMonitoringHook";
import {
  Smartphone,
  Laptop,
  Clock,
  MapPin,
  History,
  Zap,
  Globe,
  User,
  Shield,
  AlertCircle,
  Info,
  Key,
  ChevronLeft,
  ChevronRight,
  Monitor,
} from "lucide-react";
import { cn } from "../../utils/utils";
import { Card } from "../../components/common/card";
import { Button } from "../../components/common/Button";
import { imageUrl } from "../../reactQuery/api/apiClient";

export const ActivityMonitoring = () => {
  const [page, setPage] = useState(1);
  const [limit] = useState(10);

  const { data: logsResponse, isLoading: isLoadingLogs } = useActivityLogs({
    page,
    limit,
  });
  const { data: sessionsResponse, isLoading: isLoadingSessions } = useActivitySessions();

  const logs = logsResponse?.data?.logs || [];
  const pagination = logsResponse?.data?.pagination;

  const totalPages = pagination?.totalPages || 1;
  const totalCount = pagination?.total || 0;

  const sessions = sessionsResponse?.data?.sessions || [];

  const getTypeStyles = (tag) => {
    switch (tag?.toUpperCase()) {
      case "CRITICAL":
        return "bg-rose-50 text-rose-600 border-rose-100";
      case "WARNING":
        return "bg-amber-50 text-amber-600 border-amber-100";
      case "SYSTEM INFO":
        return "bg-sky-50 text-sky-600 border-sky-100";
      case "SECURITY":
        return "bg-indigo-50 text-indigo-600 border-indigo-100";
      default:
        return "bg-gray-50 text-gray-600 border-gray-100";
    }
  };

  const getLogIcon = (action) => {
    const act = action?.toLowerCase();
    if (act?.includes("login")) return Key;
    if (act?.includes("profile")) return User;
    if (act?.includes("security")) return Shield;
    if (act?.includes("admin")) return Shield;
    if (act?.includes("error")) return AlertCircle;
    return Info;
  };

  const getDeviceIcon = (device, platform) => {
    const dev = device?.toLowerCase() || "";
    const plat = platform?.toLowerCase() || "";
    if (plat.includes("android")) return Smartphone;
    if (plat.includes("ios") || plat.includes("iphone") || dev.includes("iphone")) return Smartphone;
    if (plat.includes("windows")) return Monitor;
    if (plat.includes("mac") || dev.includes("mac")) return Laptop;
    return Monitor;
  };

  return (
    <div className="p-8 space-y-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-black text-gray-900 tracking-tight">
            Activity Monitoring
          </h1>
          <p className="text-gray-500 mt-2 text-lg font-medium">
            Real-time track of user activity and system sessions
          </p>
        </div>
        <div className="flex items-center gap-3 bg-white p-2 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 rounded-xl">
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
            <span className="text-xs font-bold uppercase tracking-wider">
              {sessions.length} Active Sessions
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-14">
        {/* Live Active Sessions Section - NOW ON TOP */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-2xl font-black text-gray-900 flex items-center gap-3">
              <div className="p-2 bg-emerald-500 rounded-xl text-white">
                <Zap size={24} />
              </div>
              Live Active Sessions
            </h3>
          </div>

          {isLoadingSessions ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="h-48 bg-gray-100 rounded-[32px] animate-pulse"
                />
              ))}
            </div>
          ) : sessions.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {sessions.map((session) => {
                const DeviceIcon = getDeviceIcon(session.deviceName, session.platform);
                return (
                  <Card
                    key={session._id}
                    className="p-6 bg-white rounded-[32px] border-none shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 relative overflow-hidden group"
                  >
                    {/* Background decorative element */}
                    <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-50 rounded-full -mr-12 -mt-12 group-hover:scale-150 transition-transform duration-500" />

                    <div className="relative space-y-6">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600 border border-emerald-100 ring-4 ring-emerald-50/50 overflow-hidden">
                            {session.profilePicture ? (
                              <img
                                src={imageUrl + session.profilePicture}
                                className="w-full h-full object-cover"
                                crossOrigin="anonymous"
                                alt=""
                              />
                            ) : (
                              <User size={24} />
                            )}
                          </div>
                          <div className="flex flex-col">
                            <span className="font-bold text-gray-900 text-lg leading-tight truncate max-w-[120px]">
                              {session.fullName ||
                                session.email?.split("@")[0] ||
                                "Active User"}
                            </span>
                            <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">
                              {session.status}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-2xl border border-gray-100/50">
                          <div className="p-2 bg-white rounded-xl shadow-sm text-gray-400">
                            <DeviceIcon size={16} />
                          </div>
                          <div className="flex flex-col">
                            <span className="text-xs font-bold text-gray-700">
                              {session.deviceName || "Unknown Device"}
                            </span>
                            <span className="text-[10px] font-bold text-gray-400">
                              {session.platform || "Unknown Platform"}
                            </span>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div className="flex items-center gap-2 text-[11px] font-bold text-gray-500 truncate">
                            <Globe size={14} className="text-indigo-400" />
                            {session.ip || "Unknown IP"}
                          </div>
                          <div className="flex items-center gap-2 text-[11px] font-bold text-gray-500 truncate">
                            <MapPin size={14} className="text-rose-400" />
                            {session.location || "Unknown Location"}
                          </div>
                        </div>

                        <div className="pt-2 flex items-center justify-between border-t border-gray-50">
                          <div className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-widest">
                            <Clock size={14} />
                            Active Since
                          </div>
                          <span className="text-xs font-black text-gray-900">
                            {session.updatedAt
                              ? new Date(session.updatedAt).toLocaleTimeString(
                                  [],
                                  { hour: "2-digit", minute: "2-digit" },
                                )
                              : "N/A"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          ) : (
            <div className="p-20 bg-white rounded-[32px] text-center border-2 border-dashed border-gray-100">
              <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <Zap size={32} className="text-gray-200" />
              </div>
              <p className="text-gray-400 font-bold">
                No active sessions at the moment.
              </p>
            </div>
          )}
        </div>

        {/* System Activity Logs Table Section */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-2xl font-black text-gray-900 flex items-center gap-3">
              <div className="p-2 bg-indigo-600 rounded-xl text-white">
                <History size={24} />
              </div>
              System Activity Logs
            </h3>
          </div>

          <Card className="overflow-hidden bg-white rounded-[32px] shadow-sm border-none">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-gray-50/50">
                    <th className="px-8 py-6 text-xs font-bold text-gray-400 uppercase tracking-widest">
                      User Details
                    </th>
                    <th className="px-8 py-6 text-xs font-bold text-gray-400 uppercase tracking-widest">
                      Action & Detail
                    </th>
                    <th className="px-8 py-6 text-xs font-bold text-gray-400 uppercase tracking-widest">
                      Source & Device
                    </th>
                    <th className="px-8 py-6 text-xs font-bold text-gray-400 uppercase tracking-widest">
                      Type
                    </th>
                    <th className="px-8 py-6 text-xs font-bold text-gray-400 uppercase tracking-widest text-right">
                      Timestamp
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {isLoadingLogs ? (
                    <tr>
                      <td colSpan="5" className="px-8 py-20 text-center">
                        <div className="flex flex-col items-center gap-4">
                          <div className="w-12 h-12 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin" />
                          <p className="text-gray-400 font-bold">
                            Fetching logs...
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : logs.length > 0 ? (
                    logs.map((log) => {
                      const ActionIcon = getLogIcon(log.action);
                      const DeviceIcon = getDeviceIcon(log.deviceName, log.platform);
                      return (
                        <tr
                          key={log._id}
                          className="hover:bg-gray-50/80 transition-colors group"
                        >
                          <td className="px-8 py-6">
                            <div className="flex items-center gap-4">
                              <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center shrink-0 overflow-hidden border-2 border-white shadow-sm ring-1 ring-indigo-100">
                                {log.user?.profilePicture ? (
                                  <img
                                    src={imageUrl + log.user.profilePicture}
                                    className="w-full h-full object-cover"
                                    crossOrigin="anonymous"
                                    alt=""
                                  />
                                ) : (
                                  <User className="text-indigo-300" size={24} />
                                )}
                              </div>
                              <div className="flex flex-col">
                                <span className="font-bold text-gray-900">
                                  {log.user?.fullName ||
                                    log.user?.email ||
                                    "System"}
                                </span>
                                <span className="text-xs text-gray-400 font-medium">
                                  {log.user?.email || "internal@system.com"}
                                </span>
                              </div>
                            </div>
                          </td>
                          <td className="px-8 py-6">
                            <div className="flex items-start gap-3">
                              <div className="mt-1 p-1.5 bg-gray-100 rounded-lg text-gray-500 group-hover:bg-indigo-100 group-hover:text-indigo-600 transition-colors">
                                <ActionIcon size={16} />
                              </div>
                              <div className="flex flex-col">
                                <span className="font-bold text-gray-900">
                                  {log.action}
                                </span>
                                <span className="text-sm text-gray-500 max-w-[300px] truncate">
                                  {log.detail}
                                </span>
                              </div>
                            </div>
                          </td>
                          <td className="px-8 py-6">
                            <div className="space-y-2">
                              <div className="flex items-center gap-2 text-sm font-bold text-gray-700">
                                <Globe size={14} className="text-gray-400" />
                                {log.ip || "Unknown IP"}
                              </div>
                              <div className="flex items-center gap-2 text-xs font-bold text-gray-400">
                                <DeviceIcon size={14} />
                                {log.deviceName || "Unknown Device"} •{" "}
                                {log.platform || "Unknown Platform"}
                              </div>
                            </div>
                          </td>
                          <td className="px-8 py-6">

                            <span
                              className={cn(
                                "px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border",
                                getTypeStyles(log.tag),
                              )}
                            >
                              {log.tag}
                            </span>
                          </td>
                          <td className="px-8 py-6 text-right">
                            <div className="flex flex-col items-end">
                              <span className="font-bold text-gray-900">
                                {new Date(
                                  log.createdAt || Date.now(),
                                ).toLocaleDateString()}
                              </span>
                              <span className="text-xs text-gray-400 font-bold uppercase tracking-tighter">
                                {new Date(
                                  log.createdAt || Date.now(),
                                ).toLocaleTimeString([], {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </span>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td
                        colSpan="5"
                        className="px-8 py-20 text-center text-gray-400 font-bold"
                      >
                        No activity logs found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Table Pagination */}
            {totalPages > 1 && (
              <div className="p-8 border-t border-gray-50 flex items-center justify-between bg-gray-50/30">
                <p className="text-sm font-bold text-gray-500 uppercase tracking-widest">
                  Showing <span className="text-indigo-600">{(page - 1) * limit + 1}</span> - <span className="text-indigo-600">{Math.min(page * limit, totalCount)}</span> of <span className="text-indigo-600">{totalCount}</span> Logs
                </p>
                <div className="flex items-center gap-3">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page === 1}
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    className="w-12 h-12 p-0 rounded-2xl border-2 border-gray-200"
                  >
                    <ChevronLeft size={20} />
                  </Button>
                  <div className="flex items-center gap-2">
                    {[...Array(totalPages)].map((_, i) => (
                      <Button
                        key={i + 1}
                        variant={page === i + 1 ? "primary" : "ghost"}
                        size="sm"
                        onClick={() => setPage(i + 1)}
                        className={cn(
                          "w-12 h-12 rounded-2xl text-sm font-black transition-all",
                          page === i + 1 ? "bg-indigo-600 text-white shadow-lg shadow-indigo-100 scale-110" : "text-gray-400 hover:bg-white hover:text-gray-600"
                        )}
                      >
                        {i + 1}
                      </Button>
                    ))}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page === totalPages}
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    className="w-12 h-12 p-0 rounded-2xl border-2 border-gray-200"
                  >
                    <ChevronRight size={20} />
                  </Button>
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>

    </div>
  );
};

