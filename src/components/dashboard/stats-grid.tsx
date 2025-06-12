import { StatsCard } from './stats-card';
import { DollarSign, Target, CalendarClock, UsersRound, Landmark, ListChecks } from 'lucide-react';

const statsData = [
  { title: "Your Total Donations", value: "$275", subtitle: "Thank you for your generosity!", icon: <DollarSign className="h-5 w-5" /> },
  { title: "Campaigns You Support", value: "3", subtitle: "Actively making a difference.", icon: <Target className="h-5 w-5" /> },
  { title: "Your Upcoming Events", value: "2", subtitle: "Get ready to participate!", icon: <CalendarClock className="h-5 w-5" /> },
  { title: "Platform Users", value: "1,250", subtitle: "Growing community support.", icon: <UsersRound className="h-5 w-5" /> },
  { title: "Platform Donations", value: "$75,800", subtitle: "Total funds raised for causes.", icon: <Landmark className="h-5 w-5" /> },
  { title: "Active Campaigns (Platform)", value: "15", subtitle: "Opportunities to make an impact.", icon: <ListChecks className="h-5 w-5" /> },
];

export function StatsGrid() {
  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {statsData.map((stat) => (
        <StatsCard
          key={stat.title}
          title={stat.title}
          value={stat.value}
          subtitle={stat.subtitle}
          icon={stat.icon}
        />
      ))}
    </div>
  );
}
