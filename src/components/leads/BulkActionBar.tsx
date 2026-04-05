import React, { useState } from 'react';
import { X, Download, Trash2, Tag, ArrowUpDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { LEAD_STATUSES, AVAILABLE_TAGS } from '@/types/lead';
import type { LeadStatus } from '@/types/lead';
import { cn } from '@/lib/utils';

interface Props {
  count: number;
  onUpdateStatus: (status: LeadStatus) => void;
  onAddTag: (tag: string) => void;
  onRemoveTag: (tag: string) => void;
  onExport: () => void;
  onDelete: () => void;
  onClear: () => void;
}

const BulkActionBar: React.FC<Props> = ({ count, onUpdateStatus, onAddTag, onRemoveTag, onExport, onDelete, onClear }) => {
  const [statusOpen, setStatusOpen] = useState(false);
  const [tagOpen, setTagOpen] = useState(false);

  return (
    <div className="sticky top-16 z-20 bg-primary text-primary-foreground rounded-2xl p-3 px-5 flex flex-wrap items-center gap-3 shadow-soft-lg animate-fade-in">
      <span className="text-sm font-medium">{count} selected</span>
      <div className="h-5 w-px bg-primary-foreground/20" />

      {/* Bulk status */}
      <div className="relative">
        <Button variant="secondary" size="sm" onClick={() => { setStatusOpen(!statusOpen); setTagOpen(false); }} className="gap-1.5 h-8 text-xs">
          <ArrowUpDown className="w-3.5 h-3.5" /> Update Status
        </Button>
        {statusOpen && (
          <div className="absolute left-0 top-full mt-1 bg-popover border border-border rounded-xl shadow-soft-lg py-1 min-w-[150px] z-50">
            {LEAD_STATUSES.map((s) => (
              <button key={s} onClick={() => { onUpdateStatus(s); setStatusOpen(false); }} className="flex w-full px-3 py-2 text-xs text-foreground hover:bg-secondary">{s}</button>
            ))}
          </div>
        )}
      </div>

      {/* Bulk tags */}
      <div className="relative">
        <Button variant="secondary" size="sm" onClick={() => { setTagOpen(!tagOpen); setStatusOpen(false); }} className="gap-1.5 h-8 text-xs">
          <Tag className="w-3.5 h-3.5" /> Manage Tags
        </Button>
        {tagOpen && (
          <div className="absolute left-0 top-full mt-1 bg-popover border border-border rounded-xl shadow-soft-lg p-3 min-w-[200px] z-50">
            <p className="text-xs font-medium text-muted-foreground mb-2">Add tag to selected</p>
            <div className="flex flex-wrap gap-1.5 max-h-[160px] overflow-y-auto">
              {AVAILABLE_TAGS.map((t) => (
                <button key={t} onClick={() => onAddTag(t)} className="text-xs px-2 py-1 rounded-md bg-secondary text-foreground hover:bg-primary/10 hover:text-primary">+ {t}</button>
              ))}
            </div>
            <hr className="my-2 border-border" />
            <p className="text-xs font-medium text-muted-foreground mb-2">Remove tag from selected</p>
            <div className="flex flex-wrap gap-1.5">
              {AVAILABLE_TAGS.slice(0, 5).map((t) => (
                <button key={t} onClick={() => onRemoveTag(t)} className="text-xs px-2 py-1 rounded-md bg-destructive/10 text-destructive hover:bg-destructive/20">× {t}</button>
              ))}
            </div>
          </div>
        )}
      </div>

      <Button variant="secondary" size="sm" onClick={onExport} className="gap-1.5 h-8 text-xs">
        <Download className="w-3.5 h-3.5" /> Export
      </Button>
      <Button variant="secondary" size="sm" onClick={onDelete} className="gap-1.5 h-8 text-xs text-destructive hover:text-destructive">
        <Trash2 className="w-3.5 h-3.5" /> Delete
      </Button>

      <div className="flex-1" />
      <button onClick={onClear} className="text-xs text-primary-foreground/70 hover:text-primary-foreground flex items-center gap-1">
        <X className="w-3.5 h-3.5" /> Clear
      </button>
    </div>
  );
};

export default BulkActionBar;
