import React from 'react';
import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react';

interface StatCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  trend?: string;
  trendUp?: boolean;
  accent?: string;
}

const StatCard: React.FC<StatCardProps> = ({ label, value, icon: Icon, trend, trendUp, accent = 'primary' }) => {
  return (
    <div className="bg-card rounded-2xl border border-border p-5 shadow-soft stat-card-gradient animate-fade-in">
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground font-medium">{label}</p>
          <p className="text-2xl font-bold text-foreground tracking-tight">{value}</p>
          {trend && (
            <span className={cn(
              "inline-flex items-center text-xs font-medium px-2 py-0.5 rounded-full",
              trendUp ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"
            )}>
              {trendUp ? '↑' : '↓'} {trend}
            </span>
          )}
        </div>
        <div className={cn(
          "w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0",
          "bg-primary/10 text-primary"
        )}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </div>
  );
};

export default StatCard;
