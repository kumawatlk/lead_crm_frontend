import type { FreshLead, Lead, LeadStatus } from '@/types/lead';

const API_BASE = import.meta.env.VITE_API_URL;

export type AuthUser = { id: string; name: string; email: string };

const INDIAN_STATES = [
  'Andhra Pradesh',
  'Arunachal Pradesh',
  'Assam',
  'Bihar',
  'Chhattisgarh',
  'Goa',
  'Gujarat',
  'Haryana',
  'Himachal Pradesh',
  'Jharkhand',
  'Karnataka',
  'Kerala',
  'Madhya Pradesh',
  'Maharashtra',
  'Manipur',
  'Meghalaya',
  'Mizoram',
  'Nagaland',
  'Odisha',
  'Punjab',
  'Rajasthan',
  'Sikkim',
  'Tamil Nadu',
  'Telangana',
  'Tripura',
  'Uttar Pradesh',
  'Uttarakhand',
  'West Bengal',
  'Delhi',
];

const enrichAddressFields = (payload: Partial<Lead>): Partial<Lead> => {
  const address = (payload.address || '').trim();
  if (!address) return payload;

  const pincode = payload.pincode?.trim() || address.match(/\b\d{6}\b/)?.[0] || '';
  const state =
    payload.state?.trim() ||
    INDIAN_STATES.find((s) => new RegExp(`\\b${s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i').test(address)) ||
    '';

  let city = payload.city?.trim() || '';
  if (!city) {
    const parts = address.split(',').map((p) => p.trim()).filter(Boolean);
    if (state) {
      const stateIndex = parts.findIndex((p) => p.toLowerCase().includes(state.toLowerCase()));
      if (stateIndex > 0) city = parts[stateIndex - 1].replace(/\b\d{6}\b/g, '').trim();
    }
    if (!city && parts.length >= 2) city = parts[parts.length - 2].replace(/\b\d{6}\b/g, '').trim();
  }

  return { ...payload, city, state, pincode };
};

const authHeaders = (token?: string) => ({
  'Content-Type': 'application/json',
  ...(token ? { Authorization: `Bearer ${token}` } : {}),
});

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, options);
  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({}));
    throw new Error(errorBody.message || 'Request failed');
  }
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

export const api = {
  login: (email: string, password: string) =>
    request<{ token: string; user: AuthUser }>('/auth/login', {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ email, password }),
    }),
  me: (token: string) =>
    request<AuthUser>('/auth/me', {
      headers: authHeaders(token),
    }),
  changePassword: (token: string, currentPassword: string, newPassword: string, confirmPassword: string) =>
    request<{ message: string }>('/auth/change-password', {
      method: 'POST',
      headers: authHeaders(token),
      body: JSON.stringify({ currentPassword, newPassword, confirmPassword }),
    }),
  getLeads: (token: string) =>
    request<Lead[]>('/leads', {
      headers: authHeaders(token),
    }),
  getStats: (token: string) =>
    request<{ total: number; contacted: number; converted: number; newLeads: number }>('/leads/stats', {
      headers: authHeaders(token),
    }),
  createLead: (token: string, payload: Partial<Lead>) =>
    request<Lead>('/leads', {
      method: 'POST',
      headers: authHeaders(token),
      body: JSON.stringify(enrichAddressFields(payload)),
    }),
  updateLead: (token: string, id: string, payload: Partial<Lead>) =>
    request<Lead>(`/leads/${id}`, {
      method: 'PUT',
      headers: authHeaders(token),
      body: JSON.stringify(enrichAddressFields(payload)),
    }),
  deleteLead: (token: string, id: string) =>
    request<void>(`/leads/${id}`, {
      method: 'DELETE',
      headers: authHeaders(token),
    }),
  bulkStatus: (token: string, ids: string[], status: LeadStatus) =>
    request<{ updated: number }>('/leads/bulk/status', {
      method: 'POST',
      headers: authHeaders(token),
      body: JSON.stringify({ ids, status }),
    }),
  bulkTag: (token: string, ids: string[], tag: string, mode: 'add' | 'remove') =>
    request<{ updated: number }>('/leads/bulk/tag', {
      method: 'POST',
      headers: authHeaders(token),
      body: JSON.stringify({ ids, tag, mode }),
    }),
  bulkDelete: (token: string, ids: string[]) =>
    request<{ deleted: number }>('/leads/bulk/delete', {
      method: 'POST',
      headers: authHeaders(token),
      body: JSON.stringify({ ids }),
    }),
  deleteAllLeads: (token: string) =>
    request<{ deleted: number }>('/leads/all', {
      method: 'DELETE',
      headers: authHeaders(token),
    }),
  importLeads: (token: string, rows: Partial<Lead>[]) =>
    request<{ imported: number; skipped: number; failed: number }>('/leads/import', {
      method: 'POST',
      headers: authHeaders(token),
      body: JSON.stringify({ rows: rows.map((row) => enrichAddressFields(row)) }),
    }),
  getFreshLeads: (token: string) =>
    request<FreshLead[]>('/fresh-leads', {
      headers: authHeaders(token),
    }),
  getFreshStats: (token: string) =>
    request<{ total: number; contacted: number; converted: number; newLeads: number }>('/fresh-leads/stats', {
      headers: authHeaders(token),
    }),
  createFreshLead: (token: string, payload: Partial<FreshLead>) =>
    request<FreshLead>('/fresh-leads', {
      method: 'POST',
      headers: authHeaders(token),
      body: JSON.stringify(payload),
    }),
  updateFreshLead: (token: string, id: string, payload: Partial<FreshLead>) =>
    request<FreshLead>(`/fresh-leads/${id}`, {
      method: 'PUT',
      headers: authHeaders(token),
      body: JSON.stringify(payload),
    }),
  deleteFreshLead: (token: string, id: string) =>
    request<void>(`/fresh-leads/${id}`, {
      method: 'DELETE',
      headers: authHeaders(token),
    }),
  importFreshLeads: (token: string, rows: Partial<FreshLead>[]) =>
    request<{ imported: number; skipped: number; failed: number; rows: FreshLead[] }>('/fresh-leads/import', {
      method: 'POST',
      headers: authHeaders(token),
      body: JSON.stringify({ rows }),
    }),
  bulkDeleteFreshLeads: (token: string, ids: string[]) =>
    request<{ deleted: number }>('/fresh-leads/bulk/delete', {
      method: 'POST',
      headers: authHeaders(token),
      body: JSON.stringify({ ids }),
    }),
  deleteAllFreshLeads: (token: string) =>
    request<{ deleted: number }>('/fresh-leads/all', {
      method: 'DELETE',
      headers: authHeaders(token),
    }),
  bulkStatusFreshLeads: (token: string, ids: string[], status: LeadStatus) =>
    request<{ updated: number }>('/fresh-leads/bulk/status', {
      method: 'POST',
      headers: authHeaders(token),
      body: JSON.stringify({ ids, status }),
    }),
  bulkTagFreshLeads: (token: string, ids: string[], tag: string, mode: 'add' | 'remove') =>
    request<{ updated: number }>('/fresh-leads/bulk/tag', {
      method: 'POST',
      headers: authHeaders(token),
      body: JSON.stringify({ ids, tag, mode }),
    }),
};
