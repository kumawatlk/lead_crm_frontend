export type LeadStatus = 'New' | 'Contacted' | 'Follow-up' | 'Qualified' | 'Converted' | 'Closed' | 'Not Interested';

export interface Lead {
  id: string;
  companyName: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  category: string;
  leadStatus: LeadStatus;
  tags: string[];
  notes: string;
  lastUpdated: string;
}

export interface FreshLead {
  id: string;
  name: string;
  sourceLocation: string;
  contactNo: string;
  leadStatus: LeadStatus;
  tags: string[];
  notes: string;
  lastUpdated: string;
}

export const LEAD_STATUSES: LeadStatus[] = ['New', 'Contacted', 'Follow-up', 'Qualified', 'Converted', 'Closed', 'Not Interested'];

export const AVAILABLE_TAGS = [
  'Hot Lead',
  'Warm Lead',
  'Follow-up',
  'VIP',
  'High Priority',
  'Callback',
  'Interested',
  'Demo Scheduled',
  'Referral',
  'Enterprise',
];

export const STATUS_COLORS: Record<LeadStatus, { bg: string; text: string; dot: string }> = {
  New: { bg: 'bg-blue-50', text: 'text-blue-700', dot: 'bg-blue-500' },
  Contacted: { bg: 'bg-amber-50', text: 'text-amber-700', dot: 'bg-amber-500' },
  'Follow-up': { bg: 'bg-purple-50', text: 'text-purple-700', dot: 'bg-purple-500' },
  Qualified: { bg: 'bg-cyan-50', text: 'text-cyan-700', dot: 'bg-cyan-500' },
  Converted: { bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500' },
  Closed: { bg: 'bg-gray-50', text: 'text-gray-700', dot: 'bg-gray-500' },
  'Not Interested': { bg: 'bg-red-50', text: 'text-red-700', dot: 'bg-red-500' },
};

export const CSV_COLUMNS = [
  'Company Name',
  'Phone Number',
  'Email',
  'Address',
  'City',
  'State',
  'Pincode',
  'Category',
  'leadStatus',
  'tags',
  'Notes',
];
