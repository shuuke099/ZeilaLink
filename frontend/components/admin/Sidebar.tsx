import React from 'react';

interface Item {
  id: string;
  label: string;
  icon?: React.ReactNode;
}

interface Props {
  items: Item[];
  activeId: string;
  onSelect: (id: string) => void;
}

export default function Sidebar({ items, activeId, onSelect }: Props) {
  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <nav className="space-y-2">
        {items.map((item) => (
          <button
            key={item.id}
            onClick={() => onSelect(item.id)}
            className={`flex items-center space-x-3 p-3 rounded-lg transition-colors w-full ${
              activeId === item.id ? 'bg-primary-light text-primary font-semibold' : 'text-primary-darker hover:bg-primary-light'
            }`}
          >
            {item.icon && <span>{item.icon}</span>}
            <span>{item.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}


