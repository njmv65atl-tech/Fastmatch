import React, { useState } from 'react';
import { Bell, Plus, Trash2, Users, Crown, Globe, X, Send, Megaphone, Clock } from 'lucide-react';
import { Card } from '../../components/common/card';
import { Button } from '../../components/common/Button';
import { cn } from '../../utils/utils';
import { useAnnouncements, useCreateAnnouncement, useDeleteAnnouncement } from '../../reactQuery/hooks/announcementHook';
import { motion, AnimatePresence } from 'motion/react';

const getRelativeTime = (date) => {
  if (!date) return 'Unknown';
  const seconds = Math.floor((new Date() - new Date(date)) / 1000);
  if (seconds < 60) return 'Just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days}d ago`;
  return new Date(date).toLocaleDateString();
};

const AUDIENCE_CONFIG = {
  all: { label: 'All Users', icon: Globe, bg: 'bg-emerald-50', text: 'text-emerald-700' },
  premium: { label: 'Premium Only', icon: Crown, bg: 'bg-purple-50', text: 'text-purple-700' },
  free: { label: 'Free Only', icon: Users, bg: 'bg-blue-50', text: 'text-blue-700' },
};

const SkeletonCard = () => (
  <Card className="p-8 rounded-[24px] border-none shadow-sm">
    <div className="flex gap-6 animate-pulse">
      <div className="w-14 h-14 bg-gray-200 rounded-2xl flex-shrink-0" />
      <div className="flex-1 space-y-3">
        <div className="h-5 bg-gray-200 rounded-lg w-48" />
        <div className="flex gap-2">
          <div className="h-5 bg-gray-200 rounded-md w-24" />
          <div className="h-5 bg-gray-200 rounded-md w-16" />
        </div>
        <div className="h-4 bg-gray-200 rounded-lg w-full" />
        <div className="h-4 bg-gray-200 rounded-lg w-3/4" />
      </div>
    </div>
  </Card>
);

const AnnouncementModal = ({ isOpen, onClose, onSubmit, isPending }) => {
  const [formData, setFormData] = useState({ title: '', message: '', targetAudience: 'all' });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const handleClose = () => {
    setFormData({ title: '', message: '', targetAudience: 'all' });
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
          onClick={handleClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="bg-white rounded-[32px] w-full max-w-2xl overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-8 space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-purple-50 rounded-2xl flex items-center justify-center">
                    <Megaphone className="w-6 h-6 text-[#7C3AED]" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">New Announcement</h2>
                    <p className="text-sm text-gray-400">Send a notification to users</p>
                  </div>
                </div>
                <button onClick={handleClose} className="text-gray-400 hover:text-gray-600 transition-colors p-2 hover:bg-gray-50 rounded-xl">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-700">Title</label>
                    <input
                      type="text"
                      required
                      value={formData.title}
                      onChange={e => setFormData({ ...formData, title: e.target.value })}
                      className="w-full px-5 py-3.5 bg-white border border-gray-100 rounded-2xl focus:ring-2 focus:ring-[#7C3AED]/20 focus:border-[#7C3AED] outline-none transition-all text-gray-900 font-medium placeholder:text-gray-300 shadow-sm"
                      placeholder="e.g. Server Maintenance"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-700">Target Audience</label>
                    <select
                      value={formData.targetAudience}
                      onChange={e => setFormData({ ...formData, targetAudience: e.target.value })}
                      className="w-full appearance-none px-5 py-3.5 bg-white border border-gray-100 rounded-2xl focus:ring-2 focus:ring-[#7C3AED]/20 focus:border-[#7C3AED] outline-none cursor-pointer font-medium text-gray-700 shadow-sm"
                    >
                      <option value="all">All Users</option>
                      <option value="premium">Premium Only</option>
                      <option value="free">Free Only</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700">Message</label>
                  <textarea
                    required
                    rows="5"
                    value={formData.message}
                    onChange={e => setFormData({ ...formData, message: e.target.value })}
                    className="w-full px-5 py-3.5 bg-white border border-gray-100 rounded-2xl focus:ring-2 focus:ring-[#7C3AED]/20 focus:border-[#7C3AED] outline-none transition-all font-medium text-gray-700 placeholder:text-gray-300 shadow-sm resize-none"
                    placeholder="Type your announcement message..."
                  />
                </div>

                {/* Preview */}
                {formData.title && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="p-5 bg-gray-50 rounded-2xl space-y-2"
                  >
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Preview</p>
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center flex-shrink-0">
                        <Bell className="w-5 h-5 text-[#7C3AED]" />
                      </div>
                      <div>
                        <p className="font-bold text-gray-900">{formData.title}</p>
                        <p className="text-sm text-gray-500 mt-1">{formData.message || 'Your message here...'}</p>
                        <div className="flex items-center gap-2 mt-2">
                          {(() => {
                            const cfg = AUDIENCE_CONFIG[formData.targetAudience];
                            const Icon = cfg.icon;
                            return (
                              <span className={cn("flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-md", cfg.bg, cfg.text)}>
                                <Icon className="w-3 h-3" /> {cfg.label}
                              </span>
                            );
                          })()}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                <div className="flex justify-end gap-3 pt-2">
                  <Button type="button" variant="ghost" onClick={handleClose} className="px-6">Cancel</Button>
                  <Button type="submit" disabled={isPending} className="bg-[#7C3AED] hover:bg-[#6D28D9] px-8">
                    <Send className="w-4 h-4" />
                    {isPending ? 'Sending...' : 'Send Announcement'}
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

export const Announcements = () => {
  const [showModal, setShowModal] = useState(false);

  const { data: response, isLoading } = useAnnouncements();
  const { mutate: createAnnouncement, isPending: isCreating } = useCreateAnnouncement();
  const { mutate: deleteAnnouncement } = useDeleteAnnouncement();

  const announcements = response?.data?.announcements || response?.data || [];
  const announcementList = Array.isArray(announcements) ? announcements : [];

  // Stats
  const thisMonthCount = announcementList.filter(a => {
    const d = new Date(a.createdAt);
    const now = new Date();
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).length;

  const uniqueAudiences = [...new Set(announcementList.map(a => a.targetAudience))].length;

  const handleCreate = (data) => {
    createAnnouncement(data, {
      onSuccess: () => setShowModal(false),
    });
  };

  const handleDelete = (id, title) => {
    if (window.confirm(`Delete announcement "${title}"?`)) {
      deleteAnnouncement(id);
    }
  };

  const statCards = [
    { label: 'Total Announcements', value: announcementList.length, icon: Megaphone, color: 'bg-purple-50 text-purple-600' },
    { label: 'This Month', value: thisMonthCount, icon: Clock, color: 'bg-blue-50 text-blue-600' },
    { label: 'Active Audiences', value: uniqueAudiences || 0, icon: Users, color: 'bg-emerald-50 text-emerald-600' },
  ];

  return (
    <div className="p-10 space-y-10 min-h-screen">
      <AnnouncementModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onSubmit={handleCreate}
        isPending={isCreating}
      />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-3">
          <h1 className="text-4xl font-bold text-gray-900 tracking-tight">Announcements</h1>
          <p className="text-gray-400 text-xl font-medium">Send and manage notifications to users</p>
        </div>
        <Button onClick={() => setShowModal(true)} className="bg-[#7C3AED] hover:bg-[#6D28D9]">
          <Plus className="w-4 h-4" /> New Announcement
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {statCards.map((stat, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <Card className="p-6 bg-white rounded-3xl shadow-sm border-none hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm text-gray-400 font-medium">{stat.label}</p>
                  <h3 className="text-2xl font-bold text-gray-900">{isLoading ? '—' : stat.value}</h3>
                </div>
                <div className={cn("w-12 h-12 rounded-full flex items-center justify-center", stat.color)}>
                  <stat.icon size={22} />
                </div>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Announcement List */}
      {isLoading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : announcementList.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <div className="w-20 h-20 bg-purple-50 rounded-3xl flex items-center justify-center">
            <Megaphone className="w-10 h-10 text-purple-300" />
          </div>
          <p className="text-gray-400 font-medium text-lg">No announcements yet</p>
          <p className="text-gray-300 text-sm">Click &ldquo;New Announcement&rdquo; to send your first notification</p>
        </div>
      ) : (
        <div className="space-y-4">
          {announcementList.map((ann, index) => {
            const audienceCfg = AUDIENCE_CONFIG[ann.targetAudience] || AUDIENCE_CONFIG.all;
            const AudienceIcon = audienceCfg.icon;

            return (
              <motion.div
                key={ann._id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05, duration: 0.3 }}
              >
                <Card className="p-8 rounded-[24px] border-none shadow-sm hover:shadow-md hover:shadow-purple-500/5 transition-all group">
                  <div className="flex gap-6">
                    <div className="flex-shrink-0">
                      <div className="w-14 h-14 bg-purple-50 rounded-2xl flex items-center justify-center">
                        <Bell className="w-7 h-7 text-[#7C3AED]" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="text-lg font-bold text-gray-900">{ann.title}</h3>
                          <div className="flex items-center gap-3 mt-2">
                            <span className={cn(
                              "flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-lg capitalize",
                              audienceCfg.bg, audienceCfg.text
                            )}>
                              <AudienceIcon className="w-3.5 h-3.5" />
                              {audienceCfg.label}
                            </span>
                            <span className="text-xs text-gray-300">•</span>
                            <span className="text-xs text-gray-400 font-medium flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {getRelativeTime(ann.createdAt)}
                            </span>
                          </div>
                        </div>
                        <button
                          onClick={() => handleDelete(ann._id, ann.title)}
                          className="p-2.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                      <p className="mt-4 text-gray-500 leading-relaxed">{ann.message}</p>
                    </div>
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
};
