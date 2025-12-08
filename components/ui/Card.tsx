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

  return (
    <div className={`bg-zinc-900/40 backdrop-blur-md border ${borderColors[accent]} p-6 rounded-xl shadow-xl ${className}`}>
      {title && (
        <h3 className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold mb-4 font-mono flex items-center gap-2">
          {title}
        </h3>
      )}
      {children}
    </div>
  );
};