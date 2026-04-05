import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Search, Filter, Upload, Download, Plus, MoreHorizontal, Eye, Pencil, Trash2, FileText, StickyNote, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { Lead, LeadStatus } from '@/types/lead';
import { useNavigate } from 'react-router-dom';
import StatusBadgeEditable from '@/components/leads/StatusBadgeEditable';
import TagsEditor from '@/components/leads/TagsEditor';
import BulkActionBar from '@/components/leads/BulkActionBar';
import FilterPanel from '@/components/leads/FilterPanel';
import LeadsPagination from '@/components/leads/LeadsPagination';
import LeadDetailModal from '@/components/leads/LeadDetailModal';
import ExportPanel from '@/components/leads/ExportPanel';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import Swal from 'sweetalert2';

const Leads: React.FC = () => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState('');
  const [filterOpen, setFilterOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [detailLead, setDetailLead] = useState<Lead | null>(null);
  const [editLead, setEditLead] = useState<Lead | null>(null);
  const [createLeadOpen, setCreateLeadOpen] = useState(false);
  const [singleExportLead, setSingleExportLead] = useState<Lead | null>(null);
  const [filters, setFilters] = useState<Record<string, string>>({});
  const navigate = useNavigate();
  const { token } = useAuth();

  const loadLeads = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const data = await api.getLeads(token);
      setLeads(data);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to load leads');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadLeads();
  }, [loadLeads]);

  const filtered = useMemo(() => {
    return leads.filter((l) => {
      if (search) {
        const s = search.toLowerCase();
        if (![l.companyName, l.phone, l.email, l.address, l.city, l.state, l.pincode, l.category]
          .some((f) => f.toLowerCase().includes(s))) return false;
      }
      if (filters.leadStatus && l.leadStatus !== filters.leadStatus) return false;
      if (filters.city && !l.city.toLowerCase().includes(filters.city.toLowerCase())) return false;
      if (filters.state && !l.state.toLowerCase().includes(filters.state.toLowerCase())) return false;
      if (filters.category && !l.category.toLowerCase().includes(filters.category.toLowerCase())) return false;
      if (filters.tag && !l.tags.some((t) => t.toLowerCase().includes(filters.tag!.toLowerCase()))) return false;
      return true;
    });
  }, [leads, search, filters]);

  const totalPages = Math.ceil(filtered.length / perPage);
  const paginated = filtered.slice((page - 1) * perPage, page * perPage);

  const allSelected = paginated.length > 0 && paginated.every((l) => selected.has(l.id));
  const toggleAll = () => {
    if (allSelected) {
      setSelected(new Set());
    } else {
      setSelected(new Set(paginated.map((l) => l.id)));
    }
  };
  const toggleOne = (id: string) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelected(next);
  };

  const updateLeadStatus = async (id: string, status: LeadStatus) => {
    if (!token) return;
    try {
      const updated = await api.updateLead(token, id, { leadStatus: status });
      setLeads((prev) => prev.map((l) => (l.id === id ? updated : l)));
      toast.success(`Status updated to "${status}"`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update status');
    }
  };

  const updateLeadTags = async (id: string, tags: string[]) => {
    if (!token) return;
    try {
      const updated = await api.updateLead(token, id, { tags });
      setLeads((prev) => prev.map((l) => (l.id === id ? updated : l)));
      toast.success('Tags updated');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update tags');
    }
  };

  const bulkUpdateStatus = async (status: LeadStatus) => {
    if (!token) return;
    const ids = Array.from(selected);
    try {
      await api.bulkStatus(token, ids, status);
      await loadLeads();
      toast.success(`${ids.length} leads updated to "${status}"`);
      setSelected(new Set());
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Bulk update failed');
    }
  };

  const bulkAddTag = async (tag: string) => {
    if (!token) return;
    const ids = Array.from(selected);
    try {
      await api.bulkTag(token, ids, tag, 'add');
      await loadLeads();
      toast.success(`Tag "${tag}" added to ${ids.length} leads`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Bulk tag failed');
    }
  };

  const bulkRemoveTag = async (tag: string) => {
    if (!token) return;
    const ids = Array.from(selected);
    try {
      await api.bulkTag(token, ids, tag, 'remove');
      await loadLeads();
      toast.success(`Tag "${tag}" removed from ${ids.length} leads`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Bulk tag remove failed');
    }
  };

  const deleteLead = async (id: string) => {
    if (!token) return;
    try {
      await api.deleteLead(token, id);
      setLeads((prev) => prev.filter((l) => l.id !== id));
      toast.success('Lead deleted');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Delete failed');
    }
  };

  const bulkDelete = async () => {
    if (!token) return;
    const ids = Array.from(selected);
    try {
      await api.bulkDelete(token, ids);
      await loadLeads();
      toast.success(`${ids.length} leads deleted`);
      setSelected(new Set());
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Bulk delete failed');
    }
  };

  const handleCreateLead = async (payload: Partial<Lead>) => {
    if (!token) return;
    try {
      const created = await api.createLead(token, payload);
      setLeads((prev) => [created, ...prev]);
      setCreateLeadOpen(false);
      toast.success('Lead created');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Create lead failed');
      throw error;
    }
  };

  const handleEditLead = async (payload: Partial<Lead>) => {
    if (!token || !editLead) return;
    try {
      const updated = await api.updateLead(token, editLead.id, payload);
      setLeads((prev) => prev.map((lead) => (lead.id === editLead.id ? updated : lead)));
      setEditLead(null);
      toast.success('Lead updated');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Update lead failed');
      throw error;
    }
  };

  const exportSingleLead = (lead: Lead) => {
    const toCsv = (value: string) => {
      const normalized = value.replace(/"/g, '""');
      return /[",\n]/.test(normalized) ? `"${normalized}"` : normalized;
    };
    const row = [
      lead.companyName,
      lead.phone,
      lead.email,
      lead.address,
      lead.city,
      lead.state,
      lead.pincode,
      lead.category,
      lead.leadStatus,
      lead.tags.join(' | '),
      lead.notes,
    ].map((value) => toCsv(value || ''));
    const headers = ['Company Name', 'Phone Number', 'Email', 'Address', 'City', 'State', 'Pincode', 'Category', 'leadStatus', 'tags', 'Notes'];
    const csv = [headers.join(','), row.join(',')].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `lead-${lead.companyName || 'record'}-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success('Lead exported');
  };

  const selectedLeads = useMemo(
    () => filtered.filter((lead) => selected.has(lead.id)),
    [filtered, selected],
  );

  const leadsForPanel = singleExportLead ? [singleExportLead] : leads;
  const filteredForPanel = singleExportLead ? [singleExportLead] : filtered;
  const selectedForPanel = singleExportLead ? [singleExportLead] : selectedLeads;

  const closeExportPanel = () => {
    setExportOpen(false);
    setSingleExportLead(null);
  };

  const openSingleExportPanel = (lead: Lead) => {
    setSingleExportLead(lead);
    setExportOpen(true);
  };

  const openGlobalExportPanel = () => {
    setSingleExportLead(null);
    setExportOpen(true);
  };

  const openAddLeadModal = () => {
    setCreateLeadOpen(true);
  };

  const handleDeleteLead = async (id: string) => {
    await deleteLead(id);
    if (editLead?.id === id) setEditLead(null);
    if (detailLead?.id === id) setDetailLead(null);
  };

  const handleRowExport = (lead: Lead) => {
    openSingleExportPanel(lead);
  };

  const handleQuickRowExport = (lead: Lead) => {
    exportSingleLead(lead);
  };

  const handleGlobalExport = () => {
    openGlobalExportPanel();
  };

  const handleAddLeadClick = () => {
    openAddLeadModal();
  };

  const handleDeleteAndCloseMenu = async (id: string) => {
    try {
      await handleDeleteLead(id);
    } catch {
      // noop
    }
  };

  const deleteAllLeads = async () => {
    if (!token) return;
    const result = await Swal.fire({
      title: 'Delete all leads?',
      text: 'This will permanently remove all leads data.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, delete all',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#dc2626',
    });
    if (!result.isConfirmed) return;
    try {
      const response = await api.deleteAllLeads(token);
      setLeads([]);
      setSelected(new Set());
      setDetailLead(null);
      setEditLead(null);
      toast.success(`${response.deleted} leads deleted`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Delete all failed');
    }
  };

  return (
    <div className="space-y-4 max-w-full animate-fade-in">
      {/* Top action bar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 bg-secondary rounded-xl px-3 py-2 flex-1 min-w-[200px] max-w-md">
          <Search className="w-4 h-4 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search leads..."
            className="bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none w-full"
          />
        </div>
        <Button variant="outline" onClick={() => setFilterOpen(!filterOpen)} className="gap-2">
          <Filter className="w-4 h-4" /> Filters
          {Object.keys(filters).length > 0 && (
            <span className="w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center">{Object.keys(filters).length}</span>
          )}
        </Button>
        <Button variant="outline" onClick={() => navigate('/import')} className="gap-2">
          <Upload className="w-4 h-4" /> Import CSV
        </Button>
        <Button variant="outline" onClick={handleGlobalExport} className="gap-2">
          <Download className="w-4 h-4" /> Export
        </Button>
        <Button variant="destructive" onClick={deleteAllLeads} className="gap-2">
          <Trash2 className="w-4 h-4" /> Delete All
        </Button>
        <Button className="gap-2" onClick={handleAddLeadClick}>
          <Plus className="w-4 h-4" /> Add Lead
        </Button>
      </div>

      {/* Filter chips */}
      {Object.keys(filters).length > 0 && (
        <div className="flex flex-wrap gap-2">
          {Object.entries(filters).map(([key, val]) => (
            <span key={key} className="inline-flex items-center gap-1 bg-primary/10 text-primary text-xs font-medium px-2.5 py-1 rounded-full">
              {key}: {val}
              <button onClick={() => { const f = { ...filters }; delete f[key]; setFilters(f); }}>
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
          <button onClick={() => setFilters({})} className="text-xs text-muted-foreground hover:text-foreground">Clear all</button>
        </div>
      )}

      {/* Filter panel */}
      {filterOpen && (
        <FilterPanel filters={filters} onChange={(f) => { setFilters(f); setPage(1); }} onClose={() => setFilterOpen(false)} />
      )}

      {/* Bulk actions */}
      {selected.size > 0 && (
        <BulkActionBar
          count={selected.size}
          onUpdateStatus={bulkUpdateStatus}
          onAddTag={bulkAddTag}
          onRemoveTag={bulkRemoveTag}
          onExport={handleGlobalExport}
          onDelete={bulkDelete}
          onClear={() => setSelected(new Set())}
        />
      )}

      {/* Table */}
      <div className="bg-card rounded-2xl border border-border shadow-soft overflow-hidden">
        <div className="overflow-x-auto scrollbar-thin">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-secondary/70">
                <th className="px-4 py-3 w-10">
                  <input type="checkbox" checked={allSelected} onChange={toggleAll} className="rounded border-input accent-primary" />
                </th>
                {['Company', 'Phone', 'Address', 'City', 'State', 'Pincode', 'Category', 'Status', 'Tags', 'Updated', 'Actions'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left font-medium text-muted-foreground whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paginated.map((lead) => (
                <tr key={lead.id} className={cn("border-t border-border transition-colors", selected.has(lead.id) ? "bg-primary/5" : "hover:bg-secondary/30")}>
                  <td className="px-4 py-3">
                    <input type="checkbox" checked={selected.has(lead.id)} onChange={() => toggleOne(lead.id)} className="rounded border-input accent-primary" />
                  </td>
                  <td className="px-4 py-3 font-medium text-foreground whitespace-nowrap">{lead.companyName}</td>
                  <td className="px-4 py-3 text-foreground whitespace-nowrap">{lead.phone}</td>
                  <td className="px-4 py-3 text-foreground whitespace-nowrap max-w-[240px] truncate" title={lead.address}>{lead.address}</td>
                  <td className="px-4 py-3 text-foreground whitespace-nowrap">{lead.city}</td>
                  <td className="px-4 py-3 text-foreground whitespace-nowrap">{lead.state}</td>
                  <td className="px-4 py-3 text-foreground whitespace-nowrap">{lead.pincode}</td>
                  <td className="px-4 py-3 text-foreground whitespace-nowrap">{lead.category}</td>
                  <td className="px-4 py-3">
                    <StatusBadgeEditable status={lead.leadStatus} onChange={(s) => updateLeadStatus(lead.id, s)} />
                  </td>
                  <td className="px-4 py-3">
                    <TagsEditor tags={lead.tags} onChange={(t) => updateLeadTags(lead.id, t)} />
                  </td>
                  <td className="px-4 py-3 text-muted-foreground whitespace-nowrap text-xs">{lead.lastUpdated}</td>
                  <td className="px-4 py-3">
                    <RowActions
                      onView={() => setDetailLead(lead)}
                      onEdit={() => setEditLead(lead)}
                      onDelete={() => handleDeleteAndCloseMenu(lead.id)}
                      onExport={() => handleRowExport(lead)}
                      onQuickExport={() => handleQuickRowExport(lead)}
                    />
                  </td>
                </tr>
              ))}
              {!loading && paginated.length === 0 && (
                <tr>
                  <td colSpan={12} className="px-4 py-16 text-center">
                    <div className="space-y-2">
                      <FileText className="w-10 h-10 text-muted-foreground/40 mx-auto" />
                      <p className="text-muted-foreground font-medium">No leads found</p>
                      <p className="text-sm text-muted-foreground">Try adjusting your search or filters.</p>
                    </div>
                  </td>
                </tr>
              )}
              {loading && (
                <tr>
                  <td colSpan={12} className="px-4 py-16 text-center text-muted-foreground">
                    Loading leads...
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      <LeadsPagination
        page={page}
        totalPages={totalPages}
        total={filtered.length}
        perPage={perPage}
        onPageChange={setPage}
        onPerPageChange={(v) => { setPerPage(v); setPage(1); }}
      />

      {/* Modals */}
      {detailLead && <LeadDetailModal lead={detailLead} onClose={() => setDetailLead(null)} />}
      {editLead && <LeadDetailModal lead={editLead} onClose={() => setEditLead(null)} editing onSave={handleEditLead} />}
      {createLeadOpen && <LeadDetailModal onClose={() => setCreateLeadOpen(false)} editing onSave={handleCreateLead} />}
      {exportOpen && (
        <ExportPanel
          selectedCount={selectedForPanel.length}
          filteredCount={filteredForPanel.length}
          totalCount={leadsForPanel.length}
          allLeads={leadsForPanel}
          filteredLeads={filteredForPanel}
          selectedLeads={selectedForPanel}
          onClose={closeExportPanel}
        />
      )}
    </div>
  );
};

// Row actions dropdown
const RowActions: React.FC<{
  onView: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onExport: () => void;
  onQuickExport: () => void;
}> = ({ onView, onEdit, onDelete, onExport, onQuickExport }) => {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setOpen(!open)}>
        <MoreHorizontal className="w-4 h-4" />
      </Button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-1 z-50 bg-popover border border-border rounded-xl shadow-soft-lg py-1 min-w-[140px]">
            {[
              { label: 'View', icon: Eye, action: onView, destructive: false },
              { label: 'Edit', icon: Pencil, action: onEdit, destructive: false },
              { label: 'Add Note', icon: StickyNote, action: () => toast.info('Note editor opened'), destructive: false },
              { label: 'Export', icon: Download, action: onExport, destructive: false },
              { label: 'Quick Export CSV', icon: Download, action: onQuickExport, destructive: false },
              { label: 'Delete', icon: Trash2, action: onDelete, destructive: true },
            ].map((item) => (
              <button
                key={item.label}
                onClick={() => { item.action(); setOpen(false); }}
                className={cn(
                  "flex items-center gap-2 w-full px-3 py-2 text-sm transition-colors",
                  item.destructive
                    ? "text-destructive hover:bg-destructive/10"
                    : "text-foreground hover:bg-secondary"
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

export default Leads;
