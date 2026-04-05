import React from 'react';
import { Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

const ExportData: React.FC = () => {
  const navigate = useNavigate();
  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      <h2 className="text-2xl font-bold text-foreground">Export Data</h2>
      <div className="bg-card rounded-2xl border border-border p-8 shadow-soft space-y-6">
        <p className="text-muted-foreground">
          Export your leads data with all updated statuses and tags. Go to the Leads page for advanced export options including filters and column selection.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[
            { label: 'Export All Leads', desc: '2,847 leads', action: () => {} },
            { label: 'Export Imported Leads', desc: '1,234 leads', action: () => {} },
            { label: 'Export with Filters', desc: 'Customize export', action: () => navigate('/leads') },
            { label: 'Export Selected', desc: 'From leads table', action: () => navigate('/leads') },
          ].map((item) => (
            <button
              key={item.label}
              onClick={item.action}
              className="p-5 rounded-2xl border border-border bg-secondary/30 hover:bg-secondary text-left transition-colors"
            >
              <div className="flex items-center gap-3">
                <Download className="w-5 h-5 text-primary" />
                <div>
                  <p className="font-medium text-foreground text-sm">{item.label}</p>
                  <p className="text-xs text-muted-foreground">{item.desc}</p>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ExportData;
