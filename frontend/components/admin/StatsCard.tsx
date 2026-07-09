import React from 'react';

interface StatsCardProps {
  title: string;
  value: number | string;
  icon?: React.ReactNode;
  variant?: 'light' | 'dark';
}

export default function StatsCard({ title, value, icon, variant = 'light' }: StatsCardProps) {
  return (
    <div className={`rounded-xl p-6 text-center transition-shadow ${
      variant === 'dark' ? 'bg-white border border-gray-200 shadow-sm' : 'card'
    }`}>
      {icon && (
        <div className={`mx-auto mb-2 ${variant === 'dark' ? 'text-primary' : 'text-primary'}`}>{icon}</div>
      )}
      <div className={`text-3xl font-bold mb-1 ${variant === 'dark' ? 'text-primary-darker' : 'text-primary-darker'}`}>{value}</div>
      <p className={`${variant === 'dark' ? 'text-primary-darker/70' : 'text-primary-darker/70'} text-sm`}>{title}</p>
    </div>
  );
}


