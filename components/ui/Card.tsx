import React from 'react';

interface CardProps {
  title?: string;
  children: React.ReactNode;
  className?: string;
  accent?: 'default' | 'danger' | 'success';
}

export const Card: React.FC<CardProps> = ({ title, children, className = '', accent = 'default' }) => {
  const borderColors = {
    default: 'border-zinc-800',
    danger: 'border-red-900/50',
    success: 'border-emerald-900/50'
  };

  return (
    <div className={`bg-zinc-900/50 border ${borderColors[accent]} p-6 ${className}`}>
      {title && (
        <h3 className="text-xs uppercase tracking-widest text-zinc-500 font-bold mb-4 font-mono">
          {title}
        </h3>
      )}
      {children}
    </div>
  );
};
