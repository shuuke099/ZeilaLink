import React from 'react';
import { PieChart as RPieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface Props {
  data: Array<{ name: string; value: number }>;
  title?: string;
  variant?: 'light' | 'dark';
  className?: string;
  colors?: string[];
  showLegend?: boolean;
  innerRadius?: number;
  outerRadius?: number;
}

const DEFAULT_COLORS = ['#26e0a3', '#3b82f6', '#f59e0b', '#ef4444'];

export default function PieChart({
  data,
  title,
  variant = 'light',
  className,
  colors = DEFAULT_COLORS,
  showLegend = true,
  innerRadius = 50,
  outerRadius = 90,
}: Props) {
  const containerBase =
    variant === 'dark'
      ? 'rounded-xl border border-gray-200 bg-white p-6'
      : 'card';
  const containerClass = `${containerBase} ${className ?? ''}`.trim();

  return (
    <div className={containerClass}>
      {title && (
        <h3
          className={`mb-3 font-semibold ${
            variant === 'dark' ? 'text-primary-darker' : 'text-primary-darker'
          }`}
        >
          {title}
        </h3>
      )}
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <RPieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              outerRadius={outerRadius}
              innerRadius={innerRadius}
              label
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                background: '#fff',
                borderColor: '#e5e7eb',
                color: '#111827',
              }}
            />
            {showLegend && (
              <Legend wrapperStyle={{ color: '#111827' }} />
            )}
          </RPieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}


