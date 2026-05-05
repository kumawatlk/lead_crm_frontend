import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Plus, Trash2, Pencil, Search, FileText, Filter, Upload, Download, X, Eye, MoreHorizontal, StickyNote } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { LEAD_STATUSES, type FreshLead, type LeadStatus } from '@/types/lead';
import StatusBadgeEditable from '@/components/leads/StatusBadgeEditable';
import TagsEditor from '@/components/leads/TagsEditor';
import LeadsPagination from '@/components/leads/LeadsPagination';
import BulkActionBar from '@/components/leads/BulkActionBar';
import { cn } from '@/lib/utils';
import Swal from 'sweetalert2';

const emptyForm = {
  name: '',
  sourceLocation: '',
  contactNo: '',
  leadStatus: 'New' as LeadStatus,
  tags: [] as string[],
  notes: '',
};

const FreshLeads: React.FC = () => {
  const { token } = useAuth();
  const [rows, setRows] = useState<FreshLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState<FreshLead | null>(null);
  const [viewing, setViewing] = useState<FreshLead | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [filters, setFilters] = useState<{
    name?: string;
    sourceLocation?: string;
    contactNo?: string;
    leadStatus?: string;
    tag?: string;
    notes?: string;
    lastUpdated?: string;
  }>({});
  const [filterOpen, setFilterOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [singleExportRow, setSingleExportRow] = useState<FreshLead | null>(null);
  const [importOpen, setImportOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);

  const loadRows = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const data = await api.getFreshLeads(token);
      setRows(data);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to load fresh leads');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadRows();
  }, [loadRows]);

  const filtered = useMemo(() => {
    return rows.filter((row) => {
      const s = search.toLowerCase();
      if (s) {
        const matchesSearch = [row.name, row.sourceLocation, row.contactNo, row.notes, ...row.tags]
          .join(' ')
          .toLowerCase()
          .includes(s);
        if (!matchesSearch) return false;
      }
      if (filters.leadStatus && row.leadStatus !== filters.leadStatus) return false;
      if (filters.name && !row.name.toLowerCase().includes(filters.name.toLowerCase())) return false;
      if (filters.tag && !row.tags.some((tag) => tag.toLowerCase().includes(filters.tag!.toLowerCase()))) return false;
      if (filters.sourceLocation && !row.sourceLocation.toLowerCase().includes(filters.sourceLocation.toLowerCase())) return false;
      if (filters.contactNo && !row.contactNo.toLowerCase().includes(filters.contactNo.toLowerCase())) return false;
      if (filters.notes && !row.notes.toLowerCase().includes(filters.notes.toLowerCase())) return false;
      if (filters.lastUpdated && !row.lastUpdated.toLowerCase().includes(filters.lastUpdated.toLowerCase())) return false;
      return true;
    });
  }, [rows, search, filters]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const paginated = filtered.slice((page - 1) * perPage, page * perPage);

  const selectedRows = useMemo(() => filtered.filter((row) => selected.has(row.id)), [filtered, selected]);
  const allSelected = paginated.length > 0 && paginated.every((row) => selected.has(row.id));

  const toggleAll = () => {
    if (allSelected) {
      setSelected(new Set());
      return;
    }
    setSelected(new Set(paginated.map((row) => row.id)));
  };

  const toggleOne = (id: string) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelected(next);
  };

  const updateStatus = async (id: string, status: LeadStatus) => {
    if (!token) return;
    try {
      const updated = await api.updateFreshLead(token, id, { leadStatus: status });
      setRows((prev) => prev.map((row) => (row.id === id ? updated : row)));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Status update failed');
    }
  };

  const updateTags = async (id: string, tags: string[]) => {
    if (!token) return;
    try {
      const updated = await api.updateFreshLead(token, id, { tags });
      setRows((prev) => prev.map((row) => (row.id === id ? updated : row)));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Tag update failed');
    }
  };

  const remove = async (id: string) => {
    if (!token) return;
    try {
      await api.deleteFreshLead(token, id);
      setRows((prev) => prev.filter((row) => row.id !== id));
      setSelected((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
      toast.success('Fresh lead deleted');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Delete failed');
    }
  };

  const bulkDelete = async () => {
    if (!token) return;
    const ids = Array.from(selected);
    if (ids.length === 0) return;
    try {
      await api.bulkDeleteFreshLeads(token, ids);
      setRows((prev) => prev.filter((row) => !ids.includes(row.id)));
      setSelected(new Set());
      toast.success(`${ids.length} fresh leads deleted`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Bulk delete failed');
    }
  };

  const bulkUpdateStatus = async (status: LeadStatus) => {
    if (!token) return;
    const ids = Array.from(selected);
    if (ids.length === 0) return;
    try {
      await api.bulkStatusFreshLeads(token, ids, status);
      await loadRows();
      setSelected(new Set());
      toast.success(`${ids.length} fresh leads updated`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Bulk status update failed');
    }
  };

  const bulkAddTag = async (tag: string) => {
    if (!token) return;
    const ids = Array.from(selected);
    if (ids.length === 0) return;
    try {
      await api.bulkTagFreshLeads(token, ids, tag, 'add');
      await loadRows();
      toast.success(`Tag "${tag}" added to ${ids.length} fresh leads`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Bulk add tag failed');
    }
  };

  const bulkRemoveTag = async (tag: string) => {
    if (!token) return;
    const ids = Array.from(selected);
    if (ids.length === 0) return;
    try {
      await api.bulkTagFreshLeads(token, ids, tag, 'remove');
      await loadRows();
      toast.success(`Tag "${tag}" removed from ${ids.length} fresh leads`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Bulk remove tag failed');
    }
  };

  const createLead = async (payload: Partial<FreshLead>) => {
    if (!token) return;
    try {
      const created = await api.createFreshLead(token, payload);
      setRows((prev) => [created, ...prev]);
      setCreateOpen(false);
      toast.success('Fresh lead created');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Create failed');
      throw error;
    }
  };

  const updateLead = async (payload: Partial<FreshLead>) => {
    if (!token || !editing) return;
    try {
      const updated = await api.updateFreshLead(token, editing.id, payload);
      setRows((prev) => prev.map((row) => (row.id === editing.id ? updated : row)));
      setEditing(null);
      toast.success('Fresh lead updated');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Update failed');
      throw error;
    }
  };

  const deleteAllFreshLeads = async () => {
    if (!token) return;
    const result = await Swal.fire({
      title: 'Delete all fresh leads?',
      text: 'This will permanently remove all fresh leads data.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, delete all',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#dc2626',
    });
    if (!result.isConfirmed) return;
    try {
      const response = await api.deleteAllFreshLeads(token);
      setRows([]);
      setSelected(new Set());
      setViewing(null);
      setEditing(null);
      toast.success(`${response.deleted} fresh leads deleted`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Delete all failed');
    }
  };

  const openGlobalExport = () => {
    setSingleExportRow(null);
    setExportOpen(true);
  };

  const openSingleExport = (row: FreshLead) => {
    setSingleExportRow(row);
    setExportOpen(true);
  };

  const quickExportRow = (row: FreshLead) => {
    const esc = (value: string) => {
      const n = value.replace(/"/g, '""');
      return /[",\n]/.test(n) ? `"${n}"` : n;
    };
    const content = [[
      row.name,
      row.sourceLocation,
      row.contactNo,
      row.leadStatus,
      row.tags.join(' | '),
      row.notes,
      row.lastUpdated,
    ].map((v) => esc(v || '')).join(',')];
    const csv = [freshCsvColumns.join(','), ...content].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `fresh-lead-${row.name || 'record'}-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Fresh lead exported');
  };

  const addNoteToRow = (row: FreshLead) => {
    setEditing(row);
    toast.info('Edit opened, add your note and save');
  };

  const handleDeleteRow = async (id: string) => {
    try {
      await remove(id);
    } catch {
      // noop
    }
  };

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex flex-wrap gap-3 items-center">
        <div className="flex items-center gap-2 bg-secondary rounded-xl px-3 py-2 flex-1 min-w-[220px] max-w-md">
          <Search className="w-4 h-4 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search fresh leads..."
            className="bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none w-full"
          />
        </div>
        <Button variant="outline" onClick={() => setFilterOpen((v) => !v)} className="gap-2">
          <Filter className="w-4 h-4" /> Filters
          {Object.keys(filters).length > 0 && (
            <span className="w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center">{Object.keys(filters).length}</span>
          )}
        </Button>
        <Button variant="outline" onClick={() => setImportOpen(true)} className="gap-2">
          <Upload className="w-4 h-4" /> Import CSV
        </Button>
        <Button variant="outline" onClick={openGlobalExport} className="gap-2">
          <Download className="w-4 h-4" /> Export
        </Button>
        <Button variant="destructive" onClick={deleteAllFreshLeads} className="gap-2">
          <Trash2 className="w-4 h-4" /> Delete All
        </Button>
        <Button onClick={() => setCreateOpen(true)} className="gap-2">
          <Plus className="w-4 h-4" /> Add Fresh Lead
        </Button>
      </div>

      {Object.keys(filters).length > 0 && (
        <div className="flex flex-wrap gap-2">
          {Object.entries(filters).map(([key, val]) => (
            <span key={key} className="inline-flex items-center gap-1 bg-primary/10 text-primary text-xs font-medium px-2.5 py-1 rounded-full">
              {key}: {val}
              <button onClick={() => {
                const next = { ...filters };
                delete next[key as keyof typeof filters];
                setFilters(next);
              }}>
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
          <button onClick={() => setFilters({})} className="text-xs text-muted-foreground hover:text-foreground">Clear all</button>
        </div>
      )}

      {filterOpen && <FreshLeadsFilterPanel filters={filters} onChange={(next) => { setFilters(next); setPage(1); }} onClose={() => setFilterOpen(false)} />}
      {selected.size > 0 && (
        <BulkActionBar
          count={selected.size}
          onUpdateStatus={bulkUpdateStatus}
          onAddTag={bulkAddTag}
          onRemoveTag={bulkRemoveTag}
          onExport={openGlobalExport}
          onDelete={bulkDelete}
          onClear={() => setSelected(new Set())}
        />
      )}

      <div className="bg-card rounded-2xl border border-border shadow-soft overflow-hidden">
        <div className="overflow-x-auto scrollbar-thin">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-secondary/70">
                <th className="px-4 py-3 w-10">
                  <input type="checkbox" checked={allSelected} onChange={toggleAll} className="rounded border-input accent-primary" />
                </th>
                {['Name', 'Source Location', 'Contact No.', 'Status', 'Tags', 'Updated', 'Actions'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left font-medium text-muted-foreground whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paginated.map((row) => (
                <tr key={row.id} className={cn('border-t border-border hover:bg-secondary/30 transition-colors', selected.has(row.id) ? 'bg-primary/5' : '')}>
                  <td className="px-4 py-3">
                    <input type="checkbox" checked={selected.has(row.id)} onChange={() => toggleOne(row.id)} className="rounded border-input accent-primary" />
                  </td>
                  <td className="px-4 py-3 font-medium">{row.name}</td>
                  <td className="px-4 py-3">{row.sourceLocation || '-'}</td>
                  <td className="px-4 py-3">{row.contactNo || '-'}</td>
                  <td className="px-4 py-3">
                    <StatusBadgeEditable status={row.leadStatus} onChange={(s) => updateStatus(row.id, s)} />
                  </td>
                  <td className="px-4 py-3">
                    <TagsEditor tags={row.tags || []} onChange={(tags) => updateTags(row.id, tags)} />
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{row.lastUpdated}</td>
                  <td className="px-4 py-3">
                    <FreshRowActions
                      onView={() => setViewing(row)}
                      onEdit={() => setEditing(row)}
                      onAddNote={() => addNoteToRow(row)}
                      onExport={() => openSingleExport(row)}
                      onQuickExport={() => quickExportRow(row)}
                      onDelete={() => handleDeleteRow(row.id)}
                    />
                  </td>
                </tr>
              ))}
              {!loading && filtered.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-16 text-center">
                    <FileText className="w-10 h-10 text-muted-foreground/40 mx-auto mb-2" />
                    <p className="text-muted-foreground">No fresh leads found</p>
                  </td>
                </tr>
              )}
              {loading && (
                <tr>
                  <td colSpan={8} className="px-4 py-16 text-center text-muted-foreground">Loading fresh leads...</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      <LeadsPagination
        page={page}
        totalPages={totalPages}
        total={filtered.length}
        perPage={perPage}
        onPageChange={setPage}
        onPerPageChange={(value) => { setPerPage(value); setPage(1); }}
      />

      {createOpen && <FreshLeadModal onClose={() => setCreateOpen(false)} onSave={createLead} />}
      {editing && <FreshLeadModal lead={editing} onClose={() => setEditing(null)} onSave={updateLead} />}
      {viewing && <FreshLeadDetailModal lead={viewing} onClose={() => setViewing(null)} />}
      {exportOpen && (
        <FreshLeadsExportPanel
          allRows={singleExportRow ? [singleExportRow] : rows}
          filteredRows={singleExportRow ? [singleExportRow] : filtered}
          selectedRows={singleExportRow ? [singleExportRow] : selectedRows}
          onClose={() => { setExportOpen(false); setSingleExportRow(null); }}
        />
      )}
      {importOpen && <FreshLeadsImportPanel onImport={(imported) => setRows((prev) => [...imported, ...prev])} onClose={() => setImportOpen(false)} />}
    </div>
  );
};

const freshCsvColumns = ['NAME', 'SOURCE LOCATION', 'CONTACT NO.', 'STATUS', 'TAGS', 'NOTES', 'LAST UPDATED'];

const FreshRowActions: React.FC<{
  onView: () => void;
  onEdit: () => void;
  onAddNote: () => void;
  onExport: () => void;
  onQuickExport: () => void;
  onDelete: () => void;
}> = ({ onView, onEdit, onAddNote, onExport, onQuickExport, onDelete }) => {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setOpen((v) => !v)}>
        <MoreHorizontal className="w-4 h-4" />
      </Button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-1 z-50 bg-popover border border-border rounded-xl shadow-soft-lg py-1 min-w-[140px]">
            {[
              { label: 'View', icon: Eye, action: onView, destructive: false },
              { label: 'Edit', icon: Pencil, action: onEdit, destructive: false },
              { label: 'Add Note', icon: StickyNote, action: onAddNote, destructive: false },
              { label: 'Export', icon: Download, action: onExport, destructive: false },
              { label: 'Quick Export CSV', icon: Download, action: onQuickExport, destructive: false },
              { label: 'Delete', icon: Trash2, action: onDelete, destructive: true },
            ].map((item) => (
              <button
                key={item.label}
                onClick={() => { item.action(); setOpen(false); }}
                className={cn(
                  'flex items-center gap-2 w-full px-3 py-2 text-sm transition-colors',
                  item.destructive
                    ? 'text-destructive hover:bg-destructive/10'
                    : 'text-foreground hover:bg-secondary',
                )}
              >
                <item.icon className="w-4 h-4" />
                {item.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

const FreshLeadsExportPanel: React.FC<{
  allRows: FreshLead[];
  filteredRows: FreshLead[];
  selectedRows: FreshLead[];
  onClose: () => void;
}> = ({ allRows, filteredRows, selectedRows, onClose }) => {
  const [exportType, setExportType] = useState<'all' | 'filtered' | 'selected'>('all');

  const getRows = () => {
    if (exportType === 'filtered') return filteredRows;
    if (exportType === 'selected') return selectedRows;
    return allRows;
  };

  const exportCsv = () => {
    const rows = getRows();
    if (rows.length === 0) {
      toast.error('No records found for selected export scope');
      return;
    }
    const esc = (value: string) => {
      const n = value.replace(/"/g, '""');
      return /[",\n]/.test(n) ? `"${n}"` : n;
    };
    const content = rows.map((row) => [
      row.name,
      row.sourceLocation,
      row.contactNo,
      row.leadStatus,
      row.tags.join(' | '),
      row.notes,
      row.lastUpdated,
    ].map((v) => esc(v || '')).join(','));

    const csv = [freshCsvColumns.join(','), ...content].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `fresh-leads-${exportType}-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`Exported ${rows.length} fresh leads`);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-foreground/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-card rounded-2xl border border-border shadow-soft-xl w-full max-w-md animate-fade-in">
        <div className="p-5 border-b border-border">
          <h3 className="font-semibold text-lg">Export Fresh Leads</h3>
        </div>
        <div className="p-5 space-y-2">
          {[
            { key: 'all', label: 'All', count: allRows.length },
            { key: 'filtered', label: 'Filtered', count: filteredRows.length },
            { key: 'selected', label: 'Selected', count: selectedRows.length },
          ].map((item) => (
            <label key={item.key} className="flex items-center gap-3 p-3 rounded-xl border border-border hover:bg-secondary/50 cursor-pointer transition-colors">
              <input type="radio" checked={exportType === item.key} onChange={() => setExportType(item.key as 'all' | 'filtered' | 'selected')} />
              <span className="text-sm flex-1">{item.label}</span>
              <span className="text-xs text-muted-foreground">{item.count} rows</span>
            </label>
          ))}
        </div>
        <div className="p-5 border-t border-border flex justify-end gap-3">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={exportCsv} className="gap-2"><Download className="w-4 h-4" /> Download CSV</Button>
        </div>
      </div>
    </div>
  );
};

const FreshLeadsImportPanel: React.FC<{
  onImport: (rows: FreshLead[]) => void;
  onClose: () => void;
}> = ({ onImport, onClose }) => {
  const { token } = useAuth();
  const [uploading, setUploading] = useState(false);

  const parseCsvLine = (line: string) => {
    const values: string[] = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i += 1) {
      const char = line[i];
      const next = line[i + 1];
      if (char === '"' && inQuotes && next === '"') {
        current += '"';
        i += 1;
        continue;
      }
      if (char === '"') {
        inQuotes = !inQuotes;
        continue;
      }
      if (char === ',' && !inQuotes) {
        values.push(current.trim());
        current = '';
        continue;
      }
      current += char;
    }
    values.push(current.trim());
    return values.map((v) => v.replace(/^"|"$/g, '').trim());
  };

  const findIndex = (headers: string[], aliases: string[]) => {
    const normalize = (v: string) => v.toLowerCase().replace(/[^a-z0-9]/g, '');
    const normHeaders = headers.map(normalize);
    for (const alias of aliases) {
      const n = normalize(alias);
      const idx = normHeaders.findIndex((h) => h === n || h.includes(n) || n.includes(h));
      if (idx >= 0) return idx;
    }
    return -1;
  };

  const splitTags = (value: string) => value.split(/[;,|]/g).map((tag) => tag.trim()).filter(Boolean);

  const parseSpreadsheetFile = async (file: File): Promise<string[][]> => {
    const lowerName = file.name.toLowerCase();
    if (lowerName.endsWith('.csv')) {
      const text = await file.text();
      const lines = text.split(/\r?\n/).filter((line) => line.trim().length > 0);
      return lines.map(parseCsvLine);
    }
    if (lowerName.endsWith('.xlsx')) {
      const XLSX = await import('xlsx');
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: 'array' });
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      const rows = XLSX.utils.sheet_to_json<(string | number | boolean | null)[]>(worksheet, {
        header: 1,
        raw: false,
        defval: '',
      });
      return rows
        .map((row) => row.map((cell) => String(cell ?? '').trim()))
        .filter((row) => row.some((cell) => cell.length > 0));
    }
    throw new Error('Only .csv and .xlsx files are supported');
  };

  const handleFile = async (file: File) => {
    if (!token) return;
    setUploading(true);
    try {
      const parsedRows = await parseSpreadsheetFile(file);
      if (parsedRows.length < 2) {
        toast.error('File has no data rows');
        return;
      }
      const headers = parsedRows[0];
      const tableRows = parsedRows.slice(1);

      const idx = {
        name: findIndex(headers, ['name', 'company', 'company name']),
        sourceLocation: findIndex(headers, ['SOURCE LOCATION', 'source location', 'source_location', 'location', 'city', 'source']),
        contactNo: findIndex(headers, ['contact no', 'contact', 'phone', 'mobile']),
        leadStatus: findIndex(headers, ['status', 'leadstatus', 'lead status']),
        tags: findIndex(headers, ['tags', 'tag']),
        notes: findIndex(headers, ['notes', 'note', 'remarks']),
      };
      const get = (row: string[], key: keyof typeof idx) => (idx[key] >= 0 ? (row[idx[key]] || '').trim() : '');

      const payload = tableRows
        .map((row) => ({
          name: get(row, 'name'),
          sourceLocation: get(row, 'sourceLocation'),
          contactNo: get(row, 'contactNo'),
          leadStatus: (LEAD_STATUSES.includes(get(row, 'leadStatus') as LeadStatus) ? get(row, 'leadStatus') : 'New') as LeadStatus,
          tags: get(row, 'tags') ? splitTags(get(row, 'tags')) : [],
          notes: get(row, 'notes'),
        }))
        .filter((row) => row.name.trim());

      if (payload.length === 0) {
        toast.error('No valid rows found (Name required)');
        return;
      }

      const result = await api.importFreshLeads(token, payload);
      onImport(result.rows);
      toast.success(`Imported ${result.imported} fresh leads`);
      if (result.skipped > 0 || result.failed > 0) {
        toast.info(`Skipped: ${result.skipped}, Failed: ${result.failed}`);
      }
      onClose();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Import failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-foreground/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-card rounded-2xl border border-border shadow-soft-xl w-full max-w-md animate-fade-in">
        <div className="p-5 border-b border-border">
          <h3 className="font-semibold text-lg">Import Fresh Leads CSV</h3>
        </div>
        <div className="p-5 space-y-3">
          <p className="text-sm text-muted-foreground">Supported columns: NAME, SOURCE LOCATION, CONTACT NO., STATUS, TAGS, NOTES (.csv/.xlsx)</p>
          <label className="block">
            <input
              type="file"
              accept=".csv,.xlsx"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFile(file);
              }}
            />
            <Button variant="outline" className="w-full gap-2" asChild>
              <span><Upload className="w-4 h-4" /> {uploading ? 'Importing...' : 'Choose CSV File'}</span>
            </Button>
          </label>
        </div>
        <div className="p-5 border-t border-border flex justify-end">
          <Button variant="outline" onClick={onClose}>Close</Button>
        </div>
      </div>
    </div>
  );
};

const FreshLeadsFilterPanel: React.FC<{
  filters: {
    name?: string;
    sourceLocation?: string;
    contactNo?: string;
    leadStatus?: string;
    tag?: string;
    notes?: string;
    lastUpdated?: string;
  };
  onChange: (filters: {
    name?: string;
    sourceLocation?: string;
    contactNo?: string;
    leadStatus?: string;
    tag?: string;
    notes?: string;
    lastUpdated?: string;
  }) => void;
  onClose: () => void;
}> = ({ filters, onChange, onClose }) => {
  const [local, setLocal] = useState(filters);
  return (
    <div className="bg-card rounded-2xl border border-border p-4 space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        <div>
          <label className="text-xs font-medium text-muted-foreground">Name</label>
          <input
            value={local.name || ''}
            onChange={(e) => setLocal((prev) => ({ ...prev, name: e.target.value || undefined }))}
            className="mt-1 w-full h-10 px-3 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            placeholder="Name"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground">Status</label>
          <select
            value={local.leadStatus || ''}
            onChange={(e) => setLocal((prev) => ({ ...prev, leadStatus: e.target.value || undefined }))}
            className="mt-1 w-full h-10 px-3 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="">All status</option>
            {LEAD_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground">Tag</label>
          <input
            value={local.tag || ''}
            onChange={(e) => setLocal((prev) => ({ ...prev, tag: e.target.value || undefined }))}
            className="mt-1 w-full h-10 px-3 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            placeholder="Tag name"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground">Source Location</label>
          <input
            value={local.sourceLocation || ''}
            onChange={(e) => setLocal((prev) => ({ ...prev, sourceLocation: e.target.value || undefined }))}
            className="mt-1 w-full h-10 px-3 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            placeholder="City/Area"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground">Contact No.</label>
          <input
            value={local.contactNo || ''}
            onChange={(e) => setLocal((prev) => ({ ...prev, contactNo: e.target.value || undefined }))}
            className="mt-1 w-full h-10 px-3 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            placeholder="Phone/Contact"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground">Notes</label>
          <input
            value={local.notes || ''}
            onChange={(e) => setLocal((prev) => ({ ...prev, notes: e.target.value || undefined }))}
            className="mt-1 w-full h-10 px-3 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            placeholder="Notes text"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground">Last Updated</label>
          <input
            value={local.lastUpdated || ''}
            onChange={(e) => setLocal((prev) => ({ ...prev, lastUpdated: e.target.value || undefined }))}
            className="mt-1 w-full h-10 px-3 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            placeholder="YYYY-MM-DD"
          />
        </div>
      </div>
      <div className="flex justify-end gap-3">
        <Button variant="outline" onClick={() => setLocal({})}>Reset</Button>
        <Button variant="outline" onClick={onClose}>Close</Button>
        <Button onClick={() => { onChange(local); onClose(); }}>Apply Filters</Button>
      </div>
    </div>
  );
};

const FreshLeadModal: React.FC<{
  lead?: FreshLead | null;
  onClose: () => void;
  onSave: (payload: Partial<FreshLead>) => Promise<void> | void;
}> = ({ lead, onClose, onSave }) => {
  const [form, setForm] = useState({
    ...emptyForm,
    ...(lead || {}),
  });
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    const name = form.name.trim();
    if (!name) return;
    setSaving(true);
    try {
      await onSave({
        name,
        sourceLocation: form.sourceLocation.trim(),
        contactNo: form.contactNo.trim(),
        leadStatus: form.leadStatus,
        tags: form.tags,
        notes: form.notes.trim(),
      });
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-foreground/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-card rounded-2xl border border-border shadow-soft-xl w-full max-w-lg max-h-[85vh] overflow-y-auto animate-fade-in">
        <div className="p-5 border-b border-border">
          <h3 className="font-semibold text-lg">{lead ? 'Edit Fresh Lead' : 'Add Fresh Lead'}</h3>
        </div>
        <div className="p-5 space-y-4">
          <Field label="Name">
            <input value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} className="mt-1 w-full h-10 px-3 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
          </Field>
          <Field label="Source Location">
            <input value={form.sourceLocation} onChange={(e) => setForm((p) => ({ ...p, sourceLocation: e.target.value }))} className="mt-1 w-full h-10 px-3 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
          </Field>
          <Field label="Contact No.">
            <input value={form.contactNo} onChange={(e) => setForm((p) => ({ ...p, contactNo: e.target.value }))} className="mt-1 w-full h-10 px-3 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
          </Field>
          <Field label="Status">
            <select value={form.leadStatus} onChange={(e) => setForm((p) => ({ ...p, leadStatus: e.target.value as LeadStatus }))} className="mt-1 w-full h-10 px-3 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring">
              {LEAD_STATUSES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </Field>
          <Field label="Notes">
            <textarea value={form.notes} onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))} className="mt-1 w-full min-h-[90px] px-3 py-2 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
          </Field>
        </div>
        <div className="p-5 border-t border-border flex justify-end gap-3">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={submit} disabled={saving || !form.name.trim()}>{saving ? 'Saving...' : 'Save'}</Button>
        </div>
      </div>
    </div>
  );
};

const Field: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div>
    <label className="text-xs font-medium text-muted-foreground">{label}</label>
    {children}
  </div>
);

const FreshLeadDetailModal: React.FC<{ lead: FreshLead; onClose: () => void }> = ({ lead, onClose }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
    <div className="absolute inset-0 bg-foreground/40 backdrop-blur-sm" onClick={onClose} />
    <div className="relative bg-card rounded-2xl border border-border shadow-soft-xl w-full max-w-lg max-h-[85vh] overflow-y-auto animate-fade-in">
      <div className="p-5 border-b border-border flex items-center justify-between">
        <h3 className="font-semibold text-lg">Fresh Lead Details</h3>
        <button onClick={onClose}><X className="w-5 h-5 text-muted-foreground" /></button>
      </div>
      <div className="p-5 space-y-4">
        {[
          ['Name', lead.name],
          ['Source Location', lead.sourceLocation],
          ['Contact No.', lead.contactNo],
          ['Status', lead.leadStatus],
          ['Tags', lead.tags.join(', ') || '-'],
          ['Notes', lead.notes || '-'],
          ['Last Updated', lead.lastUpdated],
        ].map(([label, value]) => (
          <div key={label}>
            <label className="text-xs font-medium text-muted-foreground">{label}</label>
            <p className="text-sm text-foreground mt-0.5">{value || '-'}</p>
          </div>
        ))}
      </div>
      <div className="p-5 border-t border-border flex justify-end">
        <Button variant="outline" onClick={onClose}>Close</Button>
      </div>
    </div>
  </div>
);

export default FreshLeads;
