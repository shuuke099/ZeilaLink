import React from 'react';

interface Props {
  title: string;
  right?: React.ReactNode;
}

export default function Topbar({ title, right }: Props) {
  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 sm:mb-8 gap-4">
      <h1 className="text-2xl sm:text-3xl font-bold text-primary-darker">{title}</h1>
      {right}
    </div>
  );
}


