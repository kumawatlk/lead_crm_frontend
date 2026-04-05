import React from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { LEAD_STATUSES } from '@/types/lead';

interface Props {
  filters: Record<string, string>;
  onChange: (filters: Record<string, string>) => void;
  onClose: () => void;
}

const FilterPanel: React.FC<Props> = ({ filters, onChange, onClose }) => {
  const update = (key: string, value: string) => {
    const next = { ...filters };
    if (value) next[key] = value;
    else delete next[key];
    onChange(next);
  };

  return (
    <div className="bg-card rounded-2xl border border-border shadow-soft p-5 animate-fade-in">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-foreground">Advanced Filters</h3>
        <button onClick={onClose}><X className="w-4 h-4 text-muted-foreground" /></button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { key: 'city', label: 'City', type: 'text' },
          { key: 'state', label: 'State', type: 'text' },
          { key: 'category', label: 'Category', type: 'text' },
          { key: 'tag', label: 'Tag', type: 'text' },
        ].map((f) => (
          <div key={f.key} className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">{f.label}</label>
            <input
              value={filters[f.key] || ''}
              onChange={(e) => update(f.key, e.target.value)}
              placeholder={`Filter by ${f.label.toLowerCase()}...`}
              className="w-full h-10 px-3 rounded-xl border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
        ))}
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-foreground">Lead Status</label>
          <select
            value={filters.leadStatus || ''}
            onChange={(e) => update('leadStatus', e.target.value)}
            className="w-full h-10 px-3 rounded-xl border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="">All statuses</option>
            {LEAD_STATUSES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
      </div>
      <div className="flex gap-3 mt-4">
        <Button size="sm" onClick={onClose}>Apply Filters</Button>
        <Button size="sm" variant="outline" onClick={() => onChange({})}>Reset Filters</Button>
      </div>
    </div>
  );
};

export default FilterPanel;
