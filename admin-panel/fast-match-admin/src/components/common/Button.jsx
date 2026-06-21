import React from 'react';
import { cn } from '../../utils/utils';

export const Button = ({ 
  children, 
  className, 
  variant = 'primary', 
  size = 'md', 
  ...props 
}) => {
  const variants = {
    primary: 'bg-[#7C3AED] hover:bg-[#6D28D9] text-white shadow-[0_10px_20px_rgba(124,58,237,0.3)]',
    secondary: 'border border-[#7C3AED] text-[#7C3AED] hover:bg-violet-50',
    ghost: 'text-gray-500 hover:bg-gray-50 hover:text-indigo-600',
    danger: 'text-gray-500 hover:bg-red-50 hover:text-red-600',
  };

  const sizes = {
    sm: 'px-4 py-2 text-xs',
    md: 'px-6 py-2.5 text-sm',
    lg: 'px-8 py-3 text-base',
    full: 'w-full py-4 text-base',
  };

  return (
    <button 
      className={cn(
        'font-bold rounded-xl transition-all active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2',
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
};
