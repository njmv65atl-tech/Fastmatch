import React from 'react';
import { LogOut } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '../../utils/utils';
import { NAVIGATION_ITEMS } from '../../routes';
import { Logo } from '../../components/common/Logo';

export const Sidebar = ({ onLogout }) => {
  const location = useLocation();

  return (
    <div className="w-64 h-screen bg-white flex flex-col fixed left-0 top-0 z-20 border-r border-gray-100">
      <div className="p-8">
        <Logo size="md" className="items-start" />
      </div>

      <nav className="flex-1 px-4 py-2 space-y-1.5">
        {NAVIGATION_ITEMS.map((item) => {
          const path = item.id === 'dashboard' ? '/dashboard' : 
                       item.id === 'users' ? '/users' : 
                       item.id === 'activity' ? '/activity' : 
                       item.id === 'analytics' ? '/analytics' : 
                       `/${item.id}`;
          
          const isActive = location.pathname.startsWith(path);

          return (
            <Link
              key={item.id}
              to={path}
              className={cn(
                "w-full flex items-center gap-3.5 px-5 py-3.5 rounded-2xl transition-all duration-200 cursor-pointer",
                isActive 
                  ? "bg-[#7C3AED] text-white shadow-md shadow-purple-200/50" 
                  : "text-gray-900 hover:bg-gray-50"
              )}
            >
              <item.icon size={20} strokeWidth={isActive ? 2.5 : 2} className={isActive ? "text-white" : "text-gray-900"} />
              <span className={cn("text-[14px] whitespace-nowrap tracking-wide", isActive ? "font-bold" : "font-semibold")}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-gray-100">
        <button 
          onClick={onLogout}
          className="w-full flex items-center gap-3.5 px-5 py-3.5 text-gray-900 hover:bg-gray-50 rounded-2xl transition-colors cursor-pointer"
        >
          <LogOut size={20} className="text-gray-900" />
          <span className="font-semibold text-[14px] tracking-wide">Logout</span>
        </button>
      </div>
    </div>
  );
};
