import React from 'react';
import { BarChart as RBarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

interface Props {
  data: Array<{ name: string; value: number }>;
  title?: string;
  className?: string;
  accentColor?: string;
  gridColor?: string;
  axisColor?: string;
  hideGrid?: boolean;
  barRadius?: [number, number, number, number];
}

export default function BarChart({
  data,
  title,
  className,
  accentColor,
  gridColor,
  axisColor,
  hideGrid = false,
  barRadius,
}: Props) {
  const containerClass = className ? className : 'card';
  const resolvedGrid = gridColor ?? '#e5e7eb';
  const resolvedAxis = axisColor ?? '#374151';
  const resolvedAccent = accentColor ?? '#16a34a';
  const resolvedRadius = barRadius ?? [4, 4, 0, 0];

  return (
    <div className={containerClass}>
      {title && <h3 className="mb-3 font-semibold text-primary-darker">{title}</h3>}
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <RBarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            {!hideGrid && <CartesianGrid strokeDasharray="3 3" stroke={resolvedGrid} />}
            <XAxis dataKey="name" tick={{ fontSize: 12, fill: resolvedAxis }} />
            <YAxis tick={{ fontSize: 12, fill: resolvedAxis }} />
            <Tooltip
              contentStyle={{
                background: '#fff',
                borderColor: resolvedGrid,
                color: '#111827',
              }}
            />
            <Bar dataKey="value" fill={resolvedAccent} radius={resolvedRadius} />
          </RBarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}


