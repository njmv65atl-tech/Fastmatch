import React, { useState } from 'react';
import {
  LifeBuoy,
  Search,
  ChevronDown,
  X,
  Mail,
  Clock,
  CheckCircle,
  AlertCircle,
  MessageSquare,
  Send,
  User,
  Filter,
} from 'lucide-react';
import { Card } from '../../components/common/card';
import { Button } from '../../components/common/Button';
import { cn } from '../../utils/utils';
import { useSupportTickets, useUpdateSupportTicket } from '../../reactQuery/hooks/supportHook';
import { motion, AnimatePresence } from 'motion/react';
import { imageUrl } from '../../reactQuery/api/apiClient';

const ReplyModal = ({ isOpen, onClose, ticket, onUpdate, isPending }) => {
  const [status, setStatus] = useState(ticket?.status || 'in_progress');
  const [adminReply, setAdminReply] = useState(ticket?.adminReply || '');

  React.useEffect(() => {
    if (ticket) {
      setStatus(ticket.status || 'in_progress');
      setAdminReply(ticket.adminReply || '');
    }
  }, [ticket]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onUpdate({
      id: ticket._id,
      data: {
        status,
        adminReply: adminReply.trim(),
      },
    });
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && ticket && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 15 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 15 }}
            className="bg-white rounded-[32px] w-full max-w-xl overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-8 space-y-6">
              <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center">
                    <LifeBuoy className="w-6 h-6 text-amber-600" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">Manage Support Ticket</h2>
                    <p className="text-xs text-gray-400">ID: #{ticket._id.slice(-6)}</p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-50 rounded-xl"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Ticket Details */}
              <div className="bg-gray-50 p-4 rounded-2xl space-y-2 text-sm">
                <div className="flex justify-between items-center text-xs text-gray-400">
                  <span>From: <strong className="text-gray-700">{ticket.user?.displayName || ticket.email}</strong></span>
                  <span>{new Date(ticket.createdAt).toLocaleString()}</span>
                </div>
                <p className="font-bold text-gray-800 text-base">{ticket.subject}</p>
                <p className="text-gray-600 whitespace-pre-wrap">{ticket.message}</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-gray-700 uppercase tracking-wider block mb-1.5">
                    Ticket Status
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl outline-none text-gray-800 font-medium"
                  >
                    <option value="open">Open</option>
                    <option value="in_progress">In Progress</option>
                    <option value="resolved">Resolved</option>
                    <option value="closed">Closed</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-700 uppercase tracking-wider block mb-1.5">
                    Reply to User (Sent via Email)
                  </label>
                  <textarea
                    rows={4}
                    value={adminReply}
                    onChange={(e) => setAdminReply(e.target.value)}
                    placeholder="Type your response to the user here. This will be sent directly to their verified email..."
                    className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl outline-none text-gray-800 font-medium text-sm resize-none focus:border-amber-500"
                  />
                  <p className="text-xs text-gray-400 mt-1">
                    Powered by Amazon SES for high inbox deliverability.
                  </p>
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <Button type="button" variant="outline" onClick={onClose}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isPending} className="bg-amber-600 hover:bg-amber-700 text-white">
                    {isPending ? 'Sending...' : 'Save & Send Reply'}
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

export const SupportDesk = () => {
  const [statusFilter, setStatusFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [search, setSearch] = useState('');
  const [selectedTicket, setSelectedTicket] = useState(null);

  const { data: ticketsRes, isLoading } = useSupportTickets({
    status: statusFilter || undefined,
    category: categoryFilter || undefined,
  });

  const { mutate: updateTicket, isPending: isUpdating } = useUpdateSupportTicket();

  const tickets = ticketsRes?.data || [];

  const filteredTickets = tickets.filter((t) => {
    if (!search) return true;
    const query = search.toLowerCase();
    return (
      t.subject?.toLowerCase().includes(query) ||
      t.message?.toLowerCase().includes(query) ||
      t.email?.toLowerCase().includes(query) ||
      t.user?.displayName?.toLowerCase().includes(query)
    );
  });

  const stats = {
    total: tickets.length,
    open: tickets.filter((t) => t.status === 'open').length,
    inProgress: tickets.filter((t) => t.status === 'in_progress').length,
    resolved: tickets.filter((t) => t.status === 'resolved').length,
  };

  return (
    <div className="p-10 space-y-10 min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-3">
          <h1 className="text-4xl font-bold text-gray-900 tracking-tight">Support Desk</h1>
          <p className="text-gray-400 text-xl font-medium">
            Manage user inquiries, billing questions, and safety tickets with automated SES replies
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-5 bg-white rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Total Tickets</p>
            <p className="text-2xl font-black text-gray-900 mt-1">{stats.total}</p>
          </div>
          <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center">
            <MessageSquare className="w-6 h-6 text-blue-600" />
          </div>
        </Card>

        <Card className="p-5 bg-white rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Open</p>
            <p className="text-2xl font-black text-amber-600 mt-1">{stats.open}</p>
          </div>
          <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center">
            <AlertCircle className="w-6 h-6 text-amber-600" />
          </div>
        </Card>

        <Card className="p-5 bg-white rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">In Progress</p>
            <p className="text-2xl font-black text-purple-600 mt-1">{stats.inProgress}</p>
          </div>
          <div className="w-12 h-12 bg-purple-50 rounded-2xl flex items-center justify-center">
            <Clock className="w-6 h-6 text-purple-600" />
          </div>
        </Card>

        <Card className="p-5 bg-white rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Resolved</p>
            <p className="text-2xl font-black text-emerald-600 mt-1">{stats.resolved}</p>
          </div>
          <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center">
            <CheckCircle className="w-6 h-6 text-emerald-600" />
          </div>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card className="p-4 bg-white rounded-2xl shadow-sm border border-gray-100 space-y-4">
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-center">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search by subject, email, user..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-100 rounded-xl text-sm font-medium outline-none focus:border-amber-500 focus:bg-white transition-all"
            />
          </div>

          <div className="flex gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3.5 py-2 bg-gray-50 border border-gray-100 rounded-xl text-xs font-bold text-gray-700 outline-none"
            >
              <option value="">All Statuses</option>
              <option value="open">Open</option>
              <option value="in_progress">In Progress</option>
              <option value="resolved">Resolved</option>
              <option value="closed">Closed</option>
            </select>

            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3.5 py-2 bg-gray-50 border border-gray-100 rounded-xl text-xs font-bold text-gray-700 outline-none"
            >
              <option value="">All Categories</option>
              <option value="account">Account</option>
              <option value="billing">Billing / IAP</option>
              <option value="technical">Technical</option>
              <option value="safety">Safety</option>
              <option value="other">Other</option>
            </select>
          </div>
        </div>

        {/* Tickets Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-gray-100 text-xs font-bold text-gray-400 uppercase tracking-wider">
                <th className="py-3 px-4">User</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Subject & Message</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 text-sm">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-gray-400 font-medium">
                    Loading support tickets...
                  </td>
                </tr>
              ) : filteredTickets.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-gray-400 font-medium">
                    No tickets found.
                  </td>
                </tr>
              ) : (
                filteredTickets.map((ticket) => (
                  <tr key={ticket._id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-gray-100 overflow-hidden flex items-center justify-center text-gray-500 font-bold">
                          {ticket.user?.profilePicture ? (
                            <img
                              src={ticket.user.profilePicture?.startsWith('http') ? ticket.user.profilePicture : `${imageUrl}${ticket.user.profilePicture}`}
                              alt=""
                              className="w-full h-full object-cover"
                              crossOrigin="anonymous"
                            />
                          ) : (
                            ticket.user?.displayName?.charAt(0) || ticket.email?.charAt(0) || 'U'
                          )}
                        </div>
                        <div>
                          <p className="font-bold text-gray-900 text-sm">
                            {ticket.user?.displayName || 'Guest User'}
                          </p>
                          <p className="text-xs text-gray-400">{ticket.email}</p>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="px-2.5 py-1 bg-gray-100 text-gray-700 rounded-lg text-xs font-bold capitalize">
                        {ticket.category}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 max-w-xs">
                      <p className="font-bold text-gray-900 text-sm truncate">{ticket.subject}</p>
                      <p className="text-xs text-gray-400 truncate">{ticket.message}</p>
                    </td>

                    <td className="py-3.5 px-4">
                      <span
                        className={cn(
                          'px-2.5 py-1 rounded-lg text-xs font-bold',
                          ticket.status === 'open' && 'bg-amber-50 text-amber-600',
                          ticket.status === 'in_progress' && 'bg-purple-50 text-purple-600',
                          ticket.status === 'resolved' && 'bg-emerald-50 text-emerald-600',
                          ticket.status === 'closed' && 'bg-gray-100 text-gray-500'
                        )}
                      >
                        {ticket.status.replace('_', ' ').toUpperCase()}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-xs text-gray-400">
                      {new Date(ticket.createdAt).toLocaleDateString()}
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setSelectedTicket(ticket)}
                        className="text-xs font-bold"
                      >
                        Manage
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <ReplyModal
        isOpen={!!selectedTicket}
        onClose={() => setSelectedTicket(null)}
        ticket={selectedTicket}
        onUpdate={updateTicket}
        isPending={isUpdating}
      />
    </div>
  );
};
export default SupportDesk;
