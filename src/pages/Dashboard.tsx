import React, { useEffect, useMemo, useState } from 'react';
import { Users, UserPlus, Phone, CheckCircle2, Download, TrendingUp, Database, UserCheck } from 'lucide-react';
import StatCard from '@/components/dashboard/StatCard';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';

const Dashboard: React.FC = () => {
  const { token, user } = useAuth();
  const [statsData, setStatsData] = useState({ total: 0, contacted: 0, converted: 0, newLeads: 0 });
  const [freshStatsData, setFreshStatsData] = useState({ total: 0, contacted: 0, converted: 0, newLeads: 0 });

  useEffect(() => {
    async function load() {
      if (!token) return;
      const [leadStats, freshStats] = await Promise.all([
        api.getStats(token),
        api.getFreshStats(token),
      ]);
      setStatsData(leadStats);
      setFreshStatsData(freshStats);
    }
    load();
  }, [token]);

  const stats = useMemo(
    () => [
      { label: 'Total Leads', value: String(statsData.total), icon: Users, trend: 'Live', trendUp: true },
      { label: 'Imported Leads', value: String(statsData.total), icon: Download, trend: 'Live', trendUp: true },
      { label: 'New Leads', value: String(statsData.newLeads), icon: UserPlus, trend: 'Live', trendUp: true },
      { label: 'Contacted', value: String(statsData.contacted), icon: Phone, trend: 'Live', trendUp: true },
      { label: 'Converted', value: String(statsData.converted), icon: CheckCircle2, trend: 'Live', trendUp: true },
      { label: 'Export Count', value: '0', icon: TrendingUp, trend: 'Demo', trendUp: false },
      { label: 'Fresh Data Total', value: String(freshStatsData.total), icon: Database, trend: 'Live', trendUp: true },
      { label: 'Fresh Data New', value: String(freshStatsData.newLeads), icon: UserPlus, trend: 'Live', trendUp: true },
      { label: 'Fresh Data Contacted', value: String(freshStatsData.contacted), icon: UserCheck, trend: 'Live', trendUp: true },
    ],
    [statsData, freshStatsData],
  );

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Welcome back, {user?.name || 'User'}</h2>
        <p className="text-muted-foreground mt-1">Here's what's happening with your leads today.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {stats.map((s) => (
          <StatCard key={s.label} {...s} />
        ))}
      </div>

      {/* Recent Activity placeholder */}
      <div className="bg-card rounded-2xl border border-border p-6 shadow-soft">
        <h3 className="text-lg font-semibold text-foreground mb-4">Recent Activity</h3>
        <div className="space-y-4">
          {[
            { text: 'Imported 245 leads from leads_march.csv', time: '2 hours ago' },
            { text: 'Updated status of 12 leads to "Contacted"', time: '4 hours ago' },
            { text: 'Exported 89 filtered leads', time: 'Yesterday' },
            { text: 'Bulk tagged 34 leads as "Hot Lead"', time: 'Yesterday' },
            { text: 'Imported 180 leads from partners_q1.csv', time: '2 days ago' },
          ].map((a, i) => (
            <div key={i} className="flex items-center gap-3 text-sm">
              <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0" />
              <span className="text-foreground">{a.text}</span>
              <span className="text-muted-foreground ml-auto text-xs whitespace-nowrap">{a.time}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
