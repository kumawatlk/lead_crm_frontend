import React, { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { STATUS_COLORS, LEAD_STATUSES } from '@/types/lead';
import type { LeadStatus } from '@/types/lead';
import { ChevronDown } from 'lucide-react';

interface Props {
  status: LeadStatus;
  onChange: (status: LeadStatus) => void;
}

const StatusBadgeEditable: React.FC<Props> = ({ status, onChange }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    if (open) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const colors = STATUS_COLORS[status];

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className={cn(
          "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-all whitespace-nowrap",
          colors.bg, colors.text,
          "hover:ring-2 hover:ring-offset-1 hover:ring-current/20"
        )}
      >
        <span className={cn("w-1.5 h-1.5 rounded-full", colors.dot)} />
        {status}
        <ChevronDown className="w-3 h-3 opacity-60" />
      </button>
      {open && (
        <div className="absolute left-0 top-full mt-1 z-50 bg-popover border border-border rounded-xl shadow-soft-lg py-1 min-w-[150px]">
          {LEAD_STATUSES.map((s) => {
            const c = STATUS_COLORS[s];
            return (
              <button
                key={s}
                onClick={() => { onChange(s); setOpen(false); }}
                className={cn(
                  "flex items-center gap-2 w-full px-3 py-2 text-xs font-medium transition-colors hover:bg-secondary",
                  s === status && "bg-secondary"
                )}
              >
                <span className={cn("w-2 h-2 rounded-full", c.dot)} />
                <span className={c.text}>{s}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default StatusBadgeEditable;
