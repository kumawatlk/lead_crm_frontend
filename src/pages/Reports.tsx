import React from 'react';
import { BarChart3 } from 'lucide-react';

const Reports: React.FC = () => (
  <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
    <h2 className="text-2xl font-bold text-foreground">Reports</h2>
    <div className="bg-card rounded-2xl border border-border p-12 shadow-soft text-center space-y-4">
      <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
        <BarChart3 className="w-7 h-7 text-primary" />
      </div>
      <h3 className="text-lg font-semibold text-foreground">Reports Coming Soon</h3>
      <p className="text-muted-foreground text-sm max-w-md mx-auto">
        Detailed analytics and reports for your leads pipeline, conversion rates, and team performance will be available here.
      </p>
    </div>
  </div>
);

export default Reports;
