import React from 'react';

interface CardProps {
  title?: string;
  children: React.ReactNode;
  className?: string;
  accent?: 'default' | 'danger' | 'success';
}

export const Card: React.FC<CardProps> = ({ title, children, className = '', accent = 'default' }) => {
  const borderColors = {
    default: 'border-white/5',
    danger: 'border-red-500/20',
    success: 'border-emerald-500/20'
  };
  
  const glowEffects = {
    default: '',
    danger: 'shadow-[0_0_20px_rgba(220,38,38,0.15)]',
    success: 'shadow-[0_0_20px_rgba(16,185,129,0.15)]'
  };

  return (
    <div className={`glass rounded-xl shadow-glass p-6 ${borderColors[accent]} ${glowEffects[accent]} ${className}`}>
      {title && (
        <h3 className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold mb-4 font-mono flex items-center gap-2">
          {title}
        </h3>
      )}
      {children}
    </div>
  );
};