import React, { useState } from 'react';
import { X, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CSV_COLUMNS } from '@/types/lead';
import { toast } from 'sonner';
import type { Lead } from '@/types/lead';

interface Props {
  selectedCount: number;
  filteredCount: number;
  totalCount: number;
  allLeads: Lead[];
  filteredLeads: Lead[];
  selectedLeads: Lead[];
  onClose: () => void;
}

const columnToLeadKey: Record<string, keyof Lead> = {
  'Company Name': 'companyName',
  'Phone Number': 'phone',
  Email: 'email',
  Address: 'address',
  City: 'city',
  State: 'state',
  Pincode: 'pincode',
  Category: 'category',
  leadStatus: 'leadStatus',
  tags: 'tags',
  Notes: 'notes',
};

const escapeCsv = (value: string) => {
  const normalized = value.replace(/"/g, '""');
  return /[",\n]/.test(normalized) ? `"${normalized}"` : normalized;
};

const ExportPanel: React.FC<Props> = ({ selectedCount, filteredCount, totalCount, allLeads, filteredLeads, selectedLeads, onClose }) => {
  const [exportType, setExportType] = useState<'all' | 'filtered' | 'selected' | 'imported'>('all');
  type ExportType = 'all' | 'filtered' | 'selected' | 'imported';
  const importedLeads = allLeads.filter((lead) =>
    (lead.tags || []).some((tag) => tag.toLowerCase() === 'imported'),
  );
  const options: { key: ExportType; label: string; count: number }[] = [
    { key: 'all', label: 'All Leads', count: totalCount },
    { key: 'filtered', label: 'Filtered Leads', count: filteredCount },
    { key: 'selected', label: 'Selected Leads', count: selectedCount },
    { key: 'imported', label: 'Imported Leads', count: importedLeads.length },
  ];
  const [columns, setColumns] = useState<Set<string>>(new Set(CSV_COLUMNS));

  const toggleColumn = (col: string) => {
    const next = new Set(columns);
    if (next.has(col)) next.delete(col);
    else next.add(col);
    setColumns(next);
  };

  const leadsForExport = () => {
    switch (exportType) {
      case 'filtered':
        return filteredLeads;
      case 'selected':
        return selectedLeads;
      case 'imported':
        return importedLeads;
      default:
        return allLeads;
    }
  };

  const handleExport = () => {
    const cols = CSV_COLUMNS.filter((col) => columns.has(col));
    if (cols.length === 0) {
      toast.error('Select at least one column to export');
      return;
    }

    const rows = leadsForExport();
    if (rows.length === 0) {
      toast.error('No leads available for selected export scope');
      return;
    }

    const csvRows = rows.map((lead) =>
      cols.map((column) => {
        const key = columnToLeadKey[column];
        const value = lead[key];
        if (Array.isArray(value)) return escapeCsv(value.join(' | '));
        return escapeCsv(String(value ?? ''));
      }).join(','),
    );
    const csv = [cols.join(','), ...csvRows].join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `leads-${exportType}-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);

    toast.success(`Exported ${rows.length} leads`);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-foreground/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-card rounded-2xl border border-border shadow-soft-xl w-full max-w-md max-h-[85vh] overflow-y-auto animate-fade-in">
        <div className="flex items-center justify-between p-5 border-b border-border">
          <h3 className="font-semibold text-foreground text-lg">Export Leads</h3>
          <button onClick={onClose}><X className="w-5 h-5 text-muted-foreground" /></button>
        </div>
        <div className="p-5 space-y-5">
          <div className="space-y-2">
            <p className="text-sm font-medium text-foreground">Export scope</p>
            {options.map((opt) => (
              <label key={opt.key} className="flex items-center gap-3 p-3 rounded-xl border border-border hover:bg-secondary/50 cursor-pointer transition-colors">
                <input type="radio" name="exportType" checked={exportType === opt.key} onChange={() => setExportType(opt.key)} className="accent-primary" />
                <span className="text-sm text-foreground flex-1">{opt.label}</span>
                <span className="text-xs text-muted-foreground">{opt.count} leads</span>
              </label>
            ))}
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium text-foreground">Choose columns</p>
            <div className="grid grid-cols-2 gap-2">
              {CSV_COLUMNS.map((col) => (
                <label key={col} className="flex items-center gap-2 text-sm text-foreground cursor-pointer">
                  <input type="checkbox" checked={columns.has(col)} onChange={() => toggleColumn(col)} className="rounded accent-primary" />
                  {col}
                </label>
              ))}
            </div>
          </div>

          <p className="text-xs text-muted-foreground">Updated leadStatus and tags will be included in the export.</p>
        </div>
        <div className="p-5 border-t border-border flex justify-end gap-3">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleExport} className="gap-2">
            <Download className="w-4 h-4" /> Download CSV
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ExportPanel;
