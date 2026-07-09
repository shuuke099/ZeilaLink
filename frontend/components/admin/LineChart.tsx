import React from 'react';
import { LineChart as RLineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

interface Props {
  data: Array<{ name: string; value: number }>;
  title?: string;
  variant?: 'light' | 'dark';
  className?: string;
  accentColor?: string;
  gridColor?: string;
  axisColor?: string;
  showDots?: boolean;
}

export default function LineChart({
  data,
  title,
  variant = 'light',
  className,
  accentColor,
  gridColor,
  axisColor,
  showDots = false,
}: Props) {
  const containerBase =
    variant === 'dark'
      ? 'rounded-xl border border-gray-200 bg-white p-6'
      : 'card';
  const containerClass = `${containerBase} ${className ?? ''}`.trim();

  const resolvedGrid = gridColor ?? '#e5e7eb';
  const resolvedAxis = axisColor ?? '#374151';
  const resolvedAccent = accentColor ?? '#26e0a3';

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
          <RLineChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={resolvedGrid} />
            <XAxis dataKey="name" tick={{ fontSize: 12, fill: resolvedAxis }} />
            <YAxis tick={{ fontSize: 12, fill: resolvedAxis }} />
            <Tooltip
              contentStyle={{
                background: '#fff',
                borderColor: resolvedGrid,
                color: '#111827',
              }}
            />
            <Line
              type="monotone"
              dataKey="value"
              stroke={resolvedAccent}
              strokeWidth={2}
              dot={showDots}
            />
          </RLineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}


