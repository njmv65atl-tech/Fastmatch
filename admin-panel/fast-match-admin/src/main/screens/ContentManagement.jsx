import React, { useState } from 'react';
import { MessageSquare, Plus, Edit2, Trash2 } from 'lucide-react';
import { Card } from '../../components/common/card';
import { Button } from '../../components/common/Button';
import { cn } from '../../utils/utils';
import { useIcebreakers, useCreateIcebreaker, useUpdateIcebreaker, useDeleteIcebreaker } from '../../reactQuery/hooks/contentHook';
import { motion } from 'framer-motion';

export const ContentManagement = () => {
  const [categoryFilter, setCategoryFilter] = useState("all");
  const { data: response, isLoading } = useIcebreakers();
  const { mutate: createIcebreaker, isPending: isCreating } = useCreateIcebreaker();
  const { mutate: updateIcebreaker, isPending: isUpdating } = useUpdateIcebreaker();
  const { mutate: deleteIcebreaker, isPending: isDeleting } = useDeleteIcebreaker();

  const icebreakers = response?.data || [];
  const filtered = categoryFilter === "all" ? icebreakers : icebreakers.filter(i => i.category === categoryFilter);

  const CATEGORIES = ['funny', 'romantic', 'intellectual', 'casual', 'bold'];

  const handleAdd = () => {
    const text = prompt("Enter icebreaker text:");
    if (!text) return;
    const category = prompt("Enter category (funny, romantic, intellectual, casual, bold):");
    if (!CATEGORIES.includes(category)) return alert("Invalid category");
    createIcebreaker({ text, category, isActive: true });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Content Management</h1>
          <p className="text-gray-500 mt-1">Manage AI Icebreakers</p>
        </div>
        <Button onClick={handleAdd} disabled={isCreating} className="bg-[#7C3AED] hover:bg-[#6D28D9]">
          <Plus className="w-4 h-4 mr-2" /> Add Icebreaker
        </Button>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2">
        <button
          onClick={() => setCategoryFilter("all")}
          className={cn("px-4 py-2 rounded-full text-sm font-medium transition-colors whitespace-nowrap", categoryFilter === "all" ? "bg-[#7C3AED] text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200")}
        >
          All
        </button>
        {CATEGORIES.map(cat => (
          <button
            key={cat}
            onClick={() => setCategoryFilter(cat)}
            className={cn("px-4 py-2 rounded-full text-sm font-medium transition-colors whitespace-nowrap capitalize", categoryFilter === cat ? "bg-[#7C3AED] text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200")}
          >
            {cat}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-gray-500">Loading icebreakers...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {filtered.map(item => (
            <motion.div key={item._id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <Card className="p-6 h-full flex flex-col hover:shadow-lg transition-shadow">
                <div className="flex justify-between items-start mb-4">
                  <span className="px-3 py-1 bg-purple-50 text-purple-700 text-xs font-semibold rounded-full capitalize">
                    {item.category}
                  </span>
                  <div className="flex gap-2">
                    <button className="p-1.5 text-gray-400 hover:text-[#7C3AED] hover:bg-purple-50 rounded-lg transition-colors">
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button onClick={() => deleteIcebreaker(item._id)} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <p className="text-gray-900 text-lg font-medium leading-relaxed flex-1">
                  "{item.text}"
                </p>
                <div className="mt-4 flex items-center justify-between text-sm">
                  <span className={cn("flex items-center gap-1.5", item.isActive ? "text-green-600" : "text-gray-400")}>
                    <span className={cn("w-2 h-2 rounded-full", item.isActive ? "bg-green-500" : "bg-gray-300")} />
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
