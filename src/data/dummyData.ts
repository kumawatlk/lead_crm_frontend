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
  selected?: boolean;
}

export const LEAD_STATUSES: LeadStatus[] = ['New', 'Contacted', 'Follow-up', 'Qualified', 'Converted', 'Closed', 'Not Interested'];

export const AVAILABLE_TAGS = [
  'Hot Lead', 'Warm Lead', 'Follow-up', 'VIP', 'High Priority',
  'Callback', 'Interested', 'Demo Scheduled', 'Referral', 'Enterprise'
];

export const STATUS_COLORS: Record<LeadStatus, { bg: string; text: string; dot: string }> = {
  'New': { bg: 'bg-blue-50', text: 'text-blue-700', dot: 'bg-blue-500' },
  'Contacted': { bg: 'bg-amber-50', text: 'text-amber-700', dot: 'bg-amber-500' },
  'Follow-up': { bg: 'bg-purple-50', text: 'text-purple-700', dot: 'bg-purple-500' },
  'Qualified': { bg: 'bg-cyan-50', text: 'text-cyan-700', dot: 'bg-cyan-500' },
  'Converted': { bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500' },
  'Closed': { bg: 'bg-gray-50', text: 'text-gray-700', dot: 'bg-gray-500' },
  'Not Interested': { bg: 'bg-red-50', text: 'text-red-700', dot: 'bg-red-500' },
};

export const dummyLeads: Lead[] = [
  { id: '1', companyName: 'Acme Corp', phone: '+1 555-0101', email: 'info@acme.com', address: '123 Main St', city: 'New York', state: 'NY', pincode: '10001', category: 'Technology', leadStatus: 'New', tags: ['Hot Lead', 'VIP'], notes: 'Interested in enterprise plan', lastUpdated: '2026-03-28' },
  { id: '2', companyName: 'GlobalTech Solutions', phone: '+1 555-0102', email: 'sales@globaltech.com', address: '456 Oak Ave', city: 'San Francisco', state: 'CA', pincode: '94102', category: 'Software', leadStatus: 'Contacted', tags: ['Warm Lead'], notes: 'Demo scheduled next week', lastUpdated: '2026-03-27' },
  { id: '3', companyName: 'Sunrise Healthcare', phone: '+1 555-0103', email: 'admin@sunrise.com', address: '789 Pine Rd', city: 'Chicago', state: 'IL', pincode: '60601', category: 'Healthcare', leadStatus: 'Qualified', tags: ['High Priority', 'Enterprise'], notes: 'Ready for proposal', lastUpdated: '2026-03-26' },
  { id: '4', companyName: 'Metro Logistics', phone: '+1 555-0104', email: 'ops@metro.com', address: '321 Elm Blvd', city: 'Houston', state: 'TX', pincode: '77001', category: 'Logistics', leadStatus: 'Follow-up', tags: ['Callback'], notes: 'Follow up on Friday', lastUpdated: '2026-03-25' },
  { id: '5', companyName: 'Peak Fitness', phone: '+1 555-0105', email: 'hello@peak.com', address: '654 Maple Dr', city: 'Phoenix', state: 'AZ', pincode: '85001', category: 'Fitness', leadStatus: 'Converted', tags: ['VIP', 'Demo Scheduled'], notes: 'Signed annual contract', lastUpdated: '2026-03-24' },
  { id: '6', companyName: 'Bright Education', phone: '+1 555-0106', email: 'info@bright.edu', address: '987 Cedar Ln', city: 'Seattle', state: 'WA', pincode: '98101', category: 'Education', leadStatus: 'New', tags: ['Interested'], notes: 'Wants product demo', lastUpdated: '2026-03-23' },
  { id: '7', companyName: 'Ocean Ventures', phone: '+1 555-0107', email: 'biz@ocean.com', address: '147 Harbor Way', city: 'Miami', state: 'FL', pincode: '33101', category: 'Shipping', leadStatus: 'Not Interested', tags: [], notes: 'Budget constraints', lastUpdated: '2026-03-22' },
  { id: '8', companyName: 'Alpine Retail', phone: '+1 555-0108', email: 'shop@alpine.com', address: '258 Summit Rd', city: 'Denver', state: 'CO', pincode: '80201', category: 'Retail', leadStatus: 'Contacted', tags: ['Warm Lead', 'Follow-up'], notes: 'Interested in premium tier', lastUpdated: '2026-03-21' },
  { id: '9', companyName: 'Nexus Financial', phone: '+1 555-0109', email: 'finance@nexus.com', address: '369 Wall St', city: 'Boston', state: 'MA', pincode: '02101', category: 'Finance', leadStatus: 'Qualified', tags: ['Hot Lead', 'High Priority'], notes: 'Enterprise client potential', lastUpdated: '2026-03-20' },
  { id: '10', companyName: 'Verde Agriculture', phone: '+1 555-0110', email: 'grow@verde.com', address: '741 Field Ave', city: 'Portland', state: 'OR', pincode: '97201', category: 'Agriculture', leadStatus: 'New', tags: ['Referral'], notes: 'Referred by Acme Corp', lastUpdated: '2026-03-19' },
  { id: '11', companyName: 'Stellar Media', phone: '+1 555-0111', email: 'media@stellar.com', address: '852 Studio Blvd', city: 'Los Angeles', state: 'CA', pincode: '90001', category: 'Media', leadStatus: 'Follow-up', tags: ['Warm Lead'], notes: 'Needs custom solution', lastUpdated: '2026-03-18' },
  { id: '12', companyName: 'Iron Construction', phone: '+1 555-0112', email: 'build@iron.com', address: '963 Steel Rd', city: 'Dallas', state: 'TX', pincode: '75201', category: 'Construction', leadStatus: 'Closed', tags: [], notes: 'Project completed', lastUpdated: '2026-03-17' },
];

export const CSV_COLUMNS = [
  'Company Name', 'Phone Number', 'Email', 'Address',
  'City', 'State', 'Pincode', 'Category', 'leadStatus', 'tags', 'Notes'
];

export const csvPreviewData = [
  ['Acme Corp', '+1 555-0101', 'info@acme.com', '123 Main St', 'New York', 'NY', '10001', 'Technology', 'New', 'Hot Lead;VIP', 'Interested in enterprise'],
  ['GlobalTech', '+1 555-0102', 'sales@globaltech.com', '456 Oak Ave', 'San Francisco', 'CA', '94102', 'Software', 'Contacted', 'Warm Lead', 'Demo scheduled'],
  ['Sunrise HC', '+1 555-0103', 'admin@sunrise.com', '789 Pine Rd', 'Chicago', 'IL', '60601', 'Healthcare', 'Qualified', 'High Priority', 'Ready for proposal'],
  ['Metro Log', '+1 555-0104', 'ops@metro.com', '321 Elm Blvd', 'Houston', 'TX', '77001', 'Logistics', 'Follow-up', 'Callback', 'Follow up Friday'],
  ['Peak Fit', '+1 555-0105', 'hello@peak.com', '654 Maple Dr', 'Phoenix', 'AZ', '85001', 'Fitness', 'Converted', 'VIP', 'Signed contract'],
];
