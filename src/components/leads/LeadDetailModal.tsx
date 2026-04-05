import React, { useEffect, useMemo, useState } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { Lead, LeadStatus } from '@/types/lead';
import { LEAD_STATUSES, STATUS_COLORS } from '@/types/lead';
import { cn } from '@/lib/utils';

interface Props {
  lead?: Lead | null;
  onClose: () => void;
  editing?: boolean;
  onSave?: (payload: Partial<Lead>) => Promise<void> | void;
}

const emptyLeadForm = {
  companyName: '',
  phone: '',
  email: '',
  address: '',
  city: '',
  state: '',
  pincode: '',
  category: '',
  notes: '',
  leadStatus: 'New' as LeadStatus,
};

const LeadDetailModal: React.FC<Props> = ({ lead, onClose, editing, onSave }) => {
  const [form, setForm] = useState(emptyLeadForm);
  const [saving, setSaving] = useState(false);

  const isEditMode = Boolean(editing);
  const isCreateMode = isEditMode && !lead;

  useEffect(() => {
    if (!lead) {
      setForm(emptyLeadForm);
      return;
    }
    setForm({
      companyName: lead.companyName || '',
      phone: lead.phone || '',
      email: lead.email || '',
      address: lead.address || '',
      city: lead.city || '',
      state: lead.state || '',
      pincode: lead.pincode || '',
      category: lead.category || '',
      notes: lead.notes || '',
      leadStatus: lead.leadStatus || 'New',
    });
  }, [lead]);

  const detailItems = useMemo(
    () => [
      { key: 'companyName', label: 'Company Name' },
      { key: 'phone', label: 'Phone' },
      { key: 'email', label: 'Email' },
      { key: 'address', label: 'Address' },
      { key: 'city', label: 'City' },
      { key: 'state', label: 'State' },
      { key: 'pincode', label: 'Pincode' },
      { key: 'category', label: 'Category' },
      { key: 'notes', label: 'Notes' },
    ] as const,
    [],
  );

  const handleSave = async () => {
    if (!onSave) return;
    const companyName = form.companyName.trim();
    if (!companyName) return;
    setSaving(true);
    try {
      await onSave({
        companyName,
        phone: form.phone.trim(),
        email: form.email.trim(),
        address: form.address.trim(),
        city: form.city.trim(),
        state: form.state.trim(),
        pincode: form.pincode.trim(),
        category: form.category.trim(),
        notes: form.notes.trim(),
        leadStatus: form.leadStatus,
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
        <div className="flex items-center justify-between p-5 border-b border-border">
          <h3 className="font-semibold text-foreground text-lg">
            {isCreateMode ? 'Add Lead' : isEditMode ? 'Edit Lead' : 'Lead Details'}
          </h3>
          <button onClick={onClose}><X className="w-5 h-5 text-muted-foreground" /></button>
        </div>
        <div className="p-5 space-y-4">
          {detailItems.map((item) => (
            <div key={item.key}>
              <label className="text-xs font-medium text-muted-foreground">{item.label}</label>
              {isEditMode ? (
                item.key === 'notes' ? (
                  <textarea
                    value={form[item.key]}
                    onChange={(e) => setForm((prev) => ({ ...prev, [item.key]: e.target.value }))}
                    className="mt-1 w-full min-h-[90px] px-3 py-2 rounded-xl border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                ) : (
                  <input
                    value={form[item.key]}
                    onChange={(e) => setForm((prev) => ({ ...prev, [item.key]: e.target.value }))}
                    className="mt-1 w-full h-10 px-3 rounded-xl border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                )
              ) : (
                <p className="text-sm text-foreground mt-0.5">{lead?.[item.key] || '-'}</p>
              )}
            </div>
          ))}
          <div>
            <label className="text-xs font-medium text-muted-foreground">Status</label>
            {isEditMode ? (
              <select
                value={form.leadStatus}
                onChange={(e) => setForm((prev) => ({ ...prev, leadStatus: e.target.value as LeadStatus }))}
                className="mt-1 w-full h-10 px-3 rounded-xl border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                {LEAD_STATUSES.map((status) => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
            ) : (
              <div className="mt-1">
                <span className={cn("inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium", STATUS_COLORS[lead!.leadStatus].bg, STATUS_COLORS[lead!.leadStatus].text)}>
                  <span className={cn("w-1.5 h-1.5 rounded-full", STATUS_COLORS[lead!.leadStatus].dot)} />
                  {lead!.leadStatus}
                </span>
              </div>
            )}
          </div>
          {!isEditMode && (
            <div>
            <label className="text-xs font-medium text-muted-foreground">Tags</label>
            <div className="flex flex-wrap gap-1.5 mt-1">
              {(lead?.tags || []).map((t) => (
                <span key={t} className="bg-primary/10 text-primary text-xs font-medium px-2 py-0.5 rounded-md">{t}</span>
              ))}
              {(!lead?.tags || lead.tags.length === 0) && <span className="text-xs text-muted-foreground">No tags</span>}
            </div>
            </div>
          )}
        </div>
        <div className="p-5 border-t border-border flex justify-end gap-3">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          {isEditMode && (
            <Button disabled={saving || !form.companyName.trim()} onClick={handleSave}>
              {saving ? 'Saving...' : isCreateMode ? 'Create Lead' : 'Save Changes'}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default LeadDetailModal;
