import React, { useState } from 'react';
import { MessageSquare, Plus, Edit2, Trash2, X, Sparkles, Search, Zap } from 'lucide-react';
import { Card } from '../../components/common/card';
import { Button } from '../../components/common/Button';
import { cn } from '../../utils/utils';
import { useIcebreakers, useCreateIcebreaker, useUpdateIcebreaker, useDeleteIcebreaker } from '../../reactQuery/hooks/contentHook';
import { motion, AnimatePresence } from 'motion/react';

const CATEGORIES = ['funny', 'romantic', 'intellectual', 'casual', 'bold'];

const CATEGORY_STYLES = {
  funny: { bg: 'bg-amber-50', text: 'text-amber-700', dot: 'bg-amber-400' },
  romantic: { bg: 'bg-pink-50', text: 'text-pink-700', dot: 'bg-pink-400' },
  intellectual: { bg: 'bg-blue-50', text: 'text-blue-700', dot: 'bg-blue-400' },
  casual: { bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-400' },
  bold: { bg: 'bg-orange-50', text: 'text-orange-700', dot: 'bg-orange-400' },
};

const SkeletonCard = () => (
  <Card className="p-6 rounded-[24px] border-none shadow-sm">
    <div className="space-y-4 animate-pulse">
      <div className="flex justify-between">
        <div className="h-6 w-20 bg-gray-200 rounded-full" />
        <div className="flex gap-2">
          <div className="h-8 w-8 bg-gray-200 rounded-lg" />
          <div className="h-8 w-8 bg-gray-200 rounded-lg" />
        </div>
      </div>
      <div className="space-y-2">
        <div className="h-4 bg-gray-200 rounded-lg w-full" />
        <div className="h-4 bg-gray-200 rounded-lg w-3/4" />
      </div>
      <div className="h-3 w-16 bg-gray-200 rounded-lg" />
    </div>
  </Card>
);

const IcebreakerModal = ({ isOpen, onClose, onSubmit, isPending, editData }) => {
  const [category, setCategory] = useState(editData?.category || 'funny');
  const [text, setText] = useState(editData?.text || '');
  const [isActive, setIsActive] = useState(editData?.isActive ?? true);

  // Reset form when editData changes
  React.useEffect(() => {
    if (editData) {
      setCategory(editData.category || 'funny');
      setText(editData.text || '');
      setIsActive(editData.isActive ?? true);
    } else {
      setCategory('funny');
      setText('');
      setIsActive(true);
    }
  }, [editData, isOpen]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({ category, text, isActive, ...(editData?._id ? { id: editData._id } : {}) });
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
                    <Sparkles className="w-6 h-6 text-[#7C3AED]" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">
                      {editData ? 'Edit Icebreaker' : 'Add Icebreaker'}
                    </h2>
                    <p className="text-sm text-gray-400">Create a conversation starter</p>
                  </div>
                </div>
                <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors p-2 hover:bg-gray-50 rounded-xl">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full appearance-none px-5 py-3.5 bg-white border border-gray-100 rounded-2xl focus:ring-2 focus:ring-[#7C3AED]/20 focus:border-[#7C3AED] outline-none cursor-pointer font-medium text-gray-700 shadow-sm capitalize"
                  >
                    {CATEGORIES.map(cat => (
                      <option key={cat} value={cat} className="capitalize">{cat.charAt(0).toUpperCase() + cat.slice(1)}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700">Icebreaker Text</label>
                  <textarea
                    required
                    rows="4"
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    className="w-full px-5 py-3.5 bg-white border border-gray-100 rounded-2xl focus:ring-2 focus:ring-[#7C3AED]/20 focus:border-[#7C3AED] outline-none transition-all font-medium text-gray-700 placeholder:text-gray-300 shadow-sm resize-none"
                    placeholder="Type an icebreaker question..."
                  />
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl">
                  <div>
                    <p className="text-sm font-bold text-gray-700">Active Status</p>
                    <p className="text-xs text-gray-400">Make this icebreaker visible to users</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsActive(!isActive)}
                    className={cn(
                      "relative w-12 h-7 rounded-full transition-colors",
                      isActive ? "bg-[#7C3AED]" : "bg-gray-300"
                    )}
                  >
                    <span className={cn(
                      "absolute top-0.5 w-6 h-6 bg-white rounded-full shadow transition-transform",
                      isActive ? "left-[22px]" : "left-0.5"
                    )} />
                  </button>
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <Button type="button" variant="ghost" onClick={onClose} className="px-6">Cancel</Button>
                  <Button type="submit" disabled={isPending} className="bg-[#7C3AED] hover:bg-[#6D28D9] px-8">
                    <Sparkles className="w-4 h-4" />
                    {isPending ? 'Saving...' : editData ? 'Update' : 'Create'}
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

export const ContentManagement = () => {
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState(null);

  const { data: response, isLoading } = useIcebreakers();
  const { mutate: createIcebreaker, isPending: isCreating } = useCreateIcebreaker();
  const { mutate: updateIcebreaker, isPending: isUpdating } = useUpdateIcebreaker();
  const { mutate: deleteIcebreaker } = useDeleteIcebreaker();

  const icebreakers = response?.data?.icebreakers || response?.data || [];
  const icebreakerList = Array.isArray(icebreakers) ? icebreakers : [];
  const filtered = categoryFilter === 'all' ? icebreakerList : icebreakerList.filter(i => i.category === categoryFilter);
  const activeCount = icebreakerList.filter(i => i.isActive).length;

  const handleOpenAdd = () => {
    setEditItem(null);
    setShowModal(true);
  };

  const handleOpenEdit = (item) => {
    setEditItem(item);
    setShowModal(true);
  };

  const handleSubmit = (data) => {
    if (data.id) {
      const { id, ...rest } = data;
      updateIcebreaker({ id, data: rest }, {
        onSuccess: () => setShowModal(false),
      });
    } else {
      createIcebreaker(data, {
        onSuccess: () => setShowModal(false),
      });
    }
  };

  const handleDelete = (id, text) => {
    if (window.confirm(`Delete this icebreaker?\n"${text?.substring(0, 50)}..."`)) {
      deleteIcebreaker(id);
    }
  };

  const statCards = [
    { label: 'Total Icebreakers', value: icebreakerList.length, icon: MessageSquare, color: 'bg-purple-50 text-purple-600' },
    { label: 'Active', value: activeCount, icon: Zap, color: 'bg-emerald-50 text-emerald-600' },
    { label: 'Categories', value: 5, icon: Sparkles, color: 'bg-amber-50 text-amber-600' },
  ];

  return (
    <div className="p-10 space-y-10 min-h-screen">
      <IcebreakerModal
        isOpen={showModal}
        onClose={() => { setShowModal(false); setEditItem(null); }}
        onSubmit={handleSubmit}
        isPending={isCreating || isUpdating}
        editData={editItem}
      />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-3">
          <h1 className="text-4xl font-bold text-gray-900 tracking-tight">Content Management</h1>
          <p className="text-gray-400 text-xl font-medium">Manage AI icebreakers and conversation starters</p>
        </div>
        <Button onClick={handleOpenAdd} className="bg-[#7C3AED] hover:bg-[#6D28D9]">
          <Plus className="w-4 h-4" /> Add Icebreaker
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
            <Card className="p-5 bg-white rounded-3xl shadow-sm border-none hover:shadow-md transition-shadow">
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

      {/* Category Filter */}
      <div className="flex gap-3 overflow-x-auto pb-2">
        <button
          onClick={() => setCategoryFilter('all')}
          className={cn(
            "px-5 py-2.5 rounded-2xl text-sm font-bold whitespace-nowrap transition-all",
            categoryFilter === 'all'
              ? "bg-[#7C3AED] text-white shadow-md shadow-purple-200/50"
              : "bg-white text-gray-600 border border-gray-100 hover:bg-gray-50"
          )}
        >
          All
        </button>
        {CATEGORIES.map(cat => {
          const style = CATEGORY_STYLES[cat];
          return (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={cn(
                "px-5 py-2.5 rounded-2xl text-sm font-bold whitespace-nowrap capitalize transition-all flex items-center gap-2",
                categoryFilter === cat
                  ? "bg-[#7C3AED] text-white shadow-md shadow-purple-200/50"
                  : "bg-white text-gray-600 border border-gray-100 hover:bg-gray-50"
              )}
            >
              <span className={cn("w-2 h-2 rounded-full", categoryFilter === cat ? "bg-white" : style.dot)} />
              {cat}
            </button>
          );
        })}
      </div>

      {/* Cards Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <div className="w-20 h-20 bg-purple-50 rounded-3xl flex items-center justify-center">
            <MessageSquare className="w-10 h-10 text-purple-300" />
          </div>
          <p className="text-gray-400 font-medium text-lg">No icebreakers found</p>
          <p className="text-gray-300 text-sm">
            {categoryFilter !== 'all' ? 'Try selecting a different category' : 'Click "Add Icebreaker" to get started'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((item, index) => (
            <motion.div
              key={item._id}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ delay: index * 0.05, duration: 0.3 }}
            >
              <Card className="p-6 h-full flex flex-col rounded-[24px] border-none shadow-sm hover:shadow-lg hover:shadow-purple-500/5 transition-all duration-300 group">
                <div className="flex justify-between items-start mb-4">
                  <span className={cn(
                    "px-3.5 py-1.5 text-xs font-bold rounded-full capitalize",
                    CATEGORY_STYLES[item.category]?.bg || 'bg-gray-50',
                    CATEGORY_STYLES[item.category]?.text || 'text-gray-700'
                  )}>
                    {item.category}
                  </span>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => handleOpenEdit(item)}
                      className="p-2 text-gray-400 hover:text-[#7C3AED] hover:bg-purple-50 rounded-xl transition-colors"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(item._id, item.text)}
                      className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <p className="text-gray-700 text-[15px] leading-relaxed flex-1 font-medium">
                  &ldquo;{item.text}&rdquo;
                </p>

                <div className="mt-5 pt-4 border-t border-gray-50 flex items-center justify-between text-sm">
                  <span className={cn("flex items-center gap-2 font-medium", item.isActive ? "text-emerald-600" : "text-gray-400")}>
                    <span className={cn("w-2 h-2 rounded-full", item.isActive ? "bg-emerald-500" : "bg-gray-300")} />
                    {item.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};
