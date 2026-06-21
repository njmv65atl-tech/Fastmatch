import React from 'react';
import { cn } from '../../utils/utils';

export const Card = ({ children, className, ...props }) => {
  return (
    <div 
      className={cn(
        'bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};

export const AuthCard = ({ children, className, ...props }) => {
  return (
    <div 
      className={cn(
        'rounded-[32px] border border-white/5 shadow-2xl overflow-hidden',
        className
      )}
      style={{
        background: 'linear-gradient(118.9deg, #121341 0.89%, #21134D 50.01%, #2F2D82 99.13%)'
      }}
      {...props}
    >
      {children}
    </div>
  );
};
