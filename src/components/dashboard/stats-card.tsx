// src/components/dashboard/stats-card.tsx
import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/card';

type CardColor = 'blue' | 'green' | 'purple' | 'orange' | 'red';

interface StatsCardProps {
  title: string;
  value: string | ReactNode;
  subtitle: string;
  icon?: ReactNode;
  color?: CardColor;
}

const colorClasses: Record<CardColor, string> = {
  blue: 'bg-blue-500',
  green: 'bg-green-500',
  purple: 'bg-purple-500',
  orange: 'bg-orange-500',
  red: 'bg-red-500',
};

// If using custom colors from globals.css, the mapping would be:
const customColorClasses: Record<CardColor, string> = {
  blue: 'bg-[hsl(var(--stats-card-blue))]',
  green: 'bg-[hsl(var(--stats-card-green))]',
  purple: 'bg-[hsl(var(--stats-card-purple))]',
  orange: 'bg-[hsl(var(--stats-card-orange))]',
  red: 'bg-[hsl(var(--stats-card-red))]',
};


export function StatsCard({ title, value, subtitle, icon, color = 'blue' }: StatsCardProps) {
  return (
    <Card className={cn("p-5 text-white shadow-lg flex justify-between items-center transition-transform hover:scale-105", customColorClasses[color])}>
      <div className="flex flex-col">
        <p className="text-sm font-medium text-white/90">{title}</p>
        <p className="text-3xl font-bold">{value}</p>
        <p className="text-xs text-white/80 mt-1">{subtitle}</p>
      </div>
      {icon && (
        <div className="p-3 bg-black/20 rounded-lg">
          {icon}
        </div>
      )}
    </Card>
  );
}
