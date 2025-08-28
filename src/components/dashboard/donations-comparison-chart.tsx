// src/components/dashboard/donations-comparison-chart.tsx
"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { AreaChart as AreaChartIcon, ServerCrash, User } from "lucide-react";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from "recharts";
import { getPaymentTransactions, getPaymentTransactionsByUserId, type PaymentTransaction } from "@/services/paymentService";
import { Timestamp } from "firebase/firestore";
import { useAuth } from "@/contexts/AuthContext";

interface MonthlyDonationData {
  month: string; // e.g., "Jan '24"
  totalDonations: number;
  myDonations: number;
}

const chartConfig = {
  totalDonations: {
    label: "Platform Donations",
    color: "hsl(var(--chart-1))",
  },
  myDonations: {
    label: "My Donations",
    color: "hsl(var(--chart-2))",
    icon: User,
  },
};

function formatCurrencyForChart(value: number) {
    if (value >= 100000) return `${(value / 100000).toFixed(1)}L`; // Lakhs
    if (value >= 1000) return `${(value / 1000).toFixed(0)}k`; // Thousands
    return `${value}`;
}

export function DonationsComparisonChart() {
  const { user } = useAuth();
  const [chartData, setChartData] = React.useState<MonthlyDonationData[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!user) {
        setLoading(false);
        return;
    };
    
    async function fetchData() {
      setLoading(true);
      setError(null);
      try {
        const [allTransactions, userTransactions] = await Promise.all([
          getPaymentTransactions(),
          getPaymentTransactionsByUserId(user.uid),
        ]);

        const successfulTotalDonations = allTransactions.filter(tx => tx.status === 'Succeeded');
        const successfulUserDonations = userTransactions.filter(tx => tx.status === 'Succeeded');

        const monthlyMap: { [key: string]: { totalDonations: number; myDonations: number } } = {};
        
        // Initialize last 6 months
        const today = new Date();
        for (let i = 5; i >= 0; i--) {
            const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
            const monthKey = `${date.getFullYear()}-${date.getMonth()}`;
            monthlyMap[monthKey] = { totalDonations: 0, myDonations: 0 };
        }

        // Process total donations
        successfulTotalDonations.forEach(tx => {
          const date = tx.date instanceof Timestamp ? tx.date.toDate() : tx.date;
          const monthKey = `${date.getFullYear()}-${date.getMonth()}`;
          if (monthlyMap[monthKey]) {
            monthlyMap[monthKey].totalDonations += tx.amount;
          }
        });

        // Process user donations
        successfulUserDonations.forEach(tx => {
            const date = tx.date instanceof Timestamp ? tx.date.toDate() : tx.date;
            const monthKey = `${date.getFullYear()}-${date.getMonth()}`;
            if (monthlyMap[monthKey]) {
              monthlyMap[monthKey].myDonations += tx.amount;
            }
          });
        
        const formattedData = Object.keys(monthlyMap).map(key => {
            const [year, month] = key.split('-');
            const date = new Date(parseInt(year), parseInt(month));
             return {
                month: date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
                ...monthlyMap[key],
             };
        });

        setChartData(formattedData);

      } catch (e) {
        console.error("Failed to fetch donation summary data:", e);
        setError(e instanceof Error ? e.message : "Could not load donation data.");
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [user]);

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <div className="flex items-center gap-2">
            <AreaChartIcon className="h-5 w-5 text-green-600" />
            <CardTitle>My Donations vs. Platform Total</CardTitle>
        </div>
        <CardDescription>Your contribution over the last 6 months.</CardDescription>
      </CardHeader>
      <CardContent className="h-[250px] md:h-[300px] bg-card rounded-md p-0 pl-2 pr-1 pb-1">
        {loading && <Skeleton className="h-full w-full" />}
        {!loading && error && (
          <div className="flex items-center justify-center h-full">
            <Alert variant="destructive" className="w-auto">
              <ServerCrash className="h-4 w-4" />
              <AlertTitle>Chart Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          </div>
        )}
        {!loading && !error && (
          <ChartContainer config={chartConfig} className="h-full w-full">
            <AreaChart data={chartData} margin={{ top: 20, right: 10, left: -20, bottom: 5 }}>
              <CartesianGrid vertical={false} strokeDasharray="3 3" />
              <XAxis
                dataKey="month"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                fontSize={12}
              />
              <YAxis
                tickFormatter={(value) => formatCurrencyForChart(value as number)}
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                width={50}
              />
              <ChartTooltip
                cursor={false}
                content={<ChartTooltipContent
                    formatter={(value, name) => {
                       const itemConfig = chartConfig[name as keyof typeof chartConfig];
                       const formattedValue = (value as number).toLocaleString("en-US", { style: "currency", currency: "BDT" });
                       return (
                         <div className="flex min-w-[140px] items-center justify-between">
                            <div className="flex items-center gap-1.5">
                               {itemConfig.icon && <itemConfig.icon className="h-4 w-4 text-muted-foreground"/>}
                               <span className="text-muted-foreground">{itemConfig.label}</span>
                            </div>
                            <span>{formattedValue}</span>
                         </div>
                       );
                    }}
                    indicator="dot"
                />}
              />
               <ChartLegend content={<ChartLegendContent />} />
               <defs>
                 <linearGradient id="fillMyDonations" x1="0" y1="0" x2="0" y2="1">
                   <stop
                     offset="5%"
                     stopColor="var(--color-myDonations)"
                     stopOpacity={0.8}
                   />
                   <stop
                     offset="95%"
                     stopColor="var(--color-myDonations)"
                     stopOpacity={0.1}
                   />
                 </linearGradient>
                 <linearGradient id="fillTotalDonations" x1="0" y1="0" x2="0" y2="1">
                    <stop
                        offset="5%"
                        stopColor="var(--color-totalDonations)"
                        stopOpacity={0.8}
                    />
                    <stop
                        offset="95%"
                        stopColor="var(--color-totalDonations)"
                        stopOpacity={0.1}
                    />
                 </linearGradient>
               </defs>
              <Area dataKey="totalDonations" type="natural" fill="url(#fillTotalDonations)" stroke="var(--color-totalDonations)" stackId="a" />
              <Area dataKey="myDonations" type="natural" fill="url(#fillMyDonations)" stroke="var(--color-myDonations)" stackId="a" />
            </AreaChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}
