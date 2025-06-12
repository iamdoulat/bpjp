import type { ReactNode } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';

interface StatsCardProps {
  title: string;
  value: string;
  subtitle: string;
  icon?: ReactNode;
}

export function StatsCard({ title, value, subtitle, icon }: StatsCardProps) {
  return (
    <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium font-headline">{title}</CardTitle>
        {icon && <div className="text-accent">{icon}</div>}
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold font-headline">{value}</div>
        <p className="text-xs text-muted-foreground pt-1">{subtitle}</p>
      </CardContent>
    </Card>
  );
}
