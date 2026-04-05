import React, { useState, useRef, useEffect } from 'react';
import { Plus, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { AVAILABLE_TAGS } from '@/types/lead';

interface Props {
  tags: string[];
  onChange: (tags: string[]) => void;
}

const TagsEditor: React.FC<Props> = ({ tags, onChange }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    if (open) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const removeTag = (tag: string) => onChange(tags.filter((t) => t !== tag));
  const addTag = (tag: string) => {
    if (!tags.includes(tag)) onChange([...tags, tag]);
  };

  const availableToAdd = AVAILABLE_TAGS.filter((t) => !tags.includes(t));

  return (
    <div ref={ref} className="relative">
      <div className="flex items-center gap-1 flex-wrap max-w-[200px]">
        {tags.slice(0, 2).map((tag) => (
          <span key={tag} className="inline-flex items-center gap-1 bg-primary/10 text-primary text-xs font-medium px-2 py-0.5 rounded-md whitespace-nowrap">
            {tag}
            <button onClick={(e) => { e.stopPropagation(); removeTag(tag); }} className="hover:text-destructive">
              <X className="w-2.5 h-2.5" />
            </button>
          </span>
        ))}
        {tags.length > 2 && (
          <span className="text-xs text-muted-foreground">+{tags.length - 2}</span>
        )}
        <button
          onClick={() => setOpen(!open)}
          className="w-5 h-5 rounded-md bg-secondary hover:bg-primary/10 flex items-center justify-center text-muted-foreground hover:text-primary transition-colors"
        >
          <Plus className="w-3 h-3" />
        </button>
      </div>
      {open && (
        <div className="absolute left-0 top-full mt-1 z-50 bg-popover border border-border rounded-xl shadow-soft-lg p-3 min-w-[200px] max-w-[260px]">
          <p className="text-xs font-medium text-muted-foreground mb-2">Add tags</p>
          <div className="flex flex-wrap gap-1.5 max-h-[200px] overflow-y-auto">
            {availableToAdd.map((tag) => (
              <button
                key={tag}
                onClick={() => addTag(tag)}
                className="text-xs px-2 py-1 rounded-md bg-secondary text-foreground hover:bg-primary/10 hover:text-primary transition-colors"
              >
                + {tag}
              </button>
            ))}
            {availableToAdd.length === 0 && (
              <p className="text-xs text-muted-foreground">All tags applied</p>
            )}
          </div>
          {tags.length > 0 && (
            <>
              <hr className="my-2 border-border" />
              <p className="text-xs font-medium text-muted-foreground mb-1.5">Current tags</p>
              <div className="flex flex-wrap gap-1.5">
                {tags.map((tag) => (
                  <span key={tag} className="inline-flex items-center gap-1 bg-primary/10 text-primary text-xs font-medium px-2 py-0.5 rounded-md">
                    {tag}
                    <button onClick={() => removeTag(tag)}><X className="w-2.5 h-2.5" /></button>
                  </span>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default TagsEditor;
