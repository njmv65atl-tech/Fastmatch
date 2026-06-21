import React from 'react';
import { cn } from '../../utils/utils';
import logo2 from '../../assets/fastmatch.svg';

export const Logo = ({ 
  className, 
  size = 'md'
}) => {
  const sizes = {
    sm: 'h-8',
    md: 'h-16',
    lg: 'h-20',
  };

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <img 
        src={logo2} 
        alt="FastMatch Logo" 
        className={cn(sizes[size], 'w-auto')}
        referrerPolicy="no-referrer"
      />
    </div>
  );
};
