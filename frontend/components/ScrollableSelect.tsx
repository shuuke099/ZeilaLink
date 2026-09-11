'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { ChevronDown } from 'lucide-react';

type Props = {
  value: string;
  onChange: (value: string) => void;
  label: string;
  options: { value: string; label: string }[];
  className?: string;
};

export default function ScrollableSelect({ value, onChange, label, options, className = '' }: Props) {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const list = useRef<HTMLSelectElement>(null);
  const id = useId();

  useEffect(() => {
    if (!open) return;
    list.current?.focus();
    const closeOutside = (event: PointerEvent) => {
      if (!root.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener('pointerdown', closeOutside);
    return () => document.removeEventListener('pointerdown', closeOutside);
  }, [open]);

  const close = () => { setOpen(false); trigger.current?.focus(); };

  return <div ref={root} className="relative min-w-0" onBlur={(event) => {
    if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false);
  }}>
    <button ref={trigger} type="button" aria-label={label} aria-haspopup="listbox" aria-expanded={open} aria-controls={open ? id : undefined}
      onClick={() => setOpen(!open)} onKeyDown={(event) => {
        if (event.key === 'ArrowDown' || event.key === 'ArrowUp') { event.preventDefault(); setOpen(true); }
      }}
      className={`flex h-10 w-full min-w-0 items-center justify-between gap-2 rounded-lg border border-slate-200 bg-white px-3 text-left text-[11px] font-semibold text-slate-600 outline-none focus-visible:ring-2 focus-visible:ring-violet-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 ${className}`}>
      <span className="truncate">{options.find((option) => option.value === value)?.label || label}</span><ChevronDown size={14} className="shrink-0" />
    </button>
    {open && <select ref={list} id={id} aria-label={label} size={Math.min(5, options.length)} value={value}
      onChange={(event) => onChange(event.target.value)}
      onClick={(event) => { if ((event.target as HTMLElement).tagName === 'OPTION') close(); }}
      onKeyDown={(event) => { if (event.key === 'Escape' || event.key === 'Enter' || event.key === ' ') { event.preventDefault(); close(); } }}
      className="absolute left-0 top-full z-50 mt-1 w-full min-w-0 overflow-y-auto rounded-lg border border-slate-200 bg-white text-[11px] text-slate-700 shadow-lg outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200">
      {options.map((option) => <option key={option.value} value={option.value} className="h-9 px-3 py-2">{option.label}</option>)}
    </select>}
  </div>;
}
