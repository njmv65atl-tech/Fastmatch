import React, { useState } from 'react';
import { Bell, Plus, Trash2, Users, Crown, Globe } from 'lucide-react';
import { Card } from '../../components/common/card';
import { Button } from '../../components/common/Button';
import { cn } from '../../utils/utils';
import { useAnnouncements, useCreateAnnouncement, useDeleteAnnouncement } from '../../reactQuery/hooks/announcementHook';
import { motion } from 'framer-motion';

export const Announcements = () => {
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ title: '', message: '', targetAudience: 'all' });
  
  const { data: response, isLoading } = useAnnouncements();
  const { mutate: createAnnouncement, isPending: isCreating } = useCreateAnnouncement();
  const { mutate: deleteAnnouncement, isPending: isDeleting } = useDeleteAnnouncement();

  const announcements = response?.data || [];

  const handleSubmit = (e) => {
    e.preventDefault();
    createAnnouncement(formData, {
      onSuccess: () => {
        setShowForm(false);
        setFormData({ title: '', message: '', targetAudience: 'all' });
      }
    });
  };

  const AudienceIcon = ({ type }) => {
    switch(type) {
      case 'premium': return <Crown className="w-4 h-4 text-purple-500" />;
      case 'free': return <Users className="w-4 h-4 text-blue-500" />;
      default: return <Globe className="w-4 h-4 text-green-500" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Announcements</h1>
          <p className="text-gray-500 mt-1">Send notifications to users</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)} className="bg-[#7C3AED] hover:bg-[#6D28D9]">
          <Plus className="w-4 h-4 mr-2" /> New Announcement
        </Button>
      </div>

      {showForm && (
        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}>
          <Card className="p-6 border border-[#7C3AED]/20 shadow-lg shadow-purple-500/5">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Create Announcement</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Title</label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={e => setFormData({...formData, title: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#7C3AED]/20 focus:border-[#7C3AED]"
                    placeholder="e.g. Server Maintenance"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Target Audience</label>
                  <select
                    value={formData.targetAudience}
                    onChange={e => setFormData({...formData, targetAudience: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#7C3AED]/20 focus:border-[#7C3AED]"
                  >
                    <option value="all">All Users</option>
                    <option value="premium">Premium Only</option>
                    <option value="free">Free Only</option>
                  </select>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Message</label>
                <textarea
                  required
                  rows="4"
                  value={formData.message}
                  onChange={e => setFormData({...formData, message: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#7C3AED]/20 focus:border-[#7C3AED] resize-none"
                  placeholder="Type your message here..."
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
                <Button type="submit" disabled={isCreating} className="bg-[#7C3AED] hover:bg-[#6D28D9]">
                  {isCreating ? 'Sending...' : 'Send Announcement'}
                </Button>
              </div>
            </form>
          </Card>
        </motion.div>
      )}

      {isLoading ? (
        <div className="text-center py-12 text-gray-500">Loading announcements...</div>
      ) : (
        <div className="space-y-4">
          {announcements.map((ann) => (
            <motion.div key={ann._id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
              <Card className="p-6 flex gap-6 hover:shadow-md transition-shadow group">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-purple-50 rounded-2xl flex items-center justify-center">
                    <Bell className="w-6 h-6 text-[#7C3AED]" />
                  </div>
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{ann.title}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-md bg-gray-100 text-gray-600 capitalize">
                          <AudienceIcon type={ann.targetAudience} />
                          {ann.targetAudience}
                        </span>
                        <span className="text-xs text-gray-400">•</span>
                        <span className="text-xs text-gray-500">{new Date(ann.createdAt).toLocaleString()}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => deleteAnnouncement(ann._id)}
                      className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                  <p className="mt-3 text-gray-600 leading-relaxed">{ann.message}</p>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};
