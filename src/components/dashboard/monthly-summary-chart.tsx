// src/components/dashboard/monthly-summary-chart.tsx
"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { BarChart as BarChartIcon, ServerCrash } from "lucide-react";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from "recharts";
import { getPaymentTransactions, type PaymentTransaction } from "@/services/paymentService";
import { getExpenses, type ExpenseData } from "@/services/expenseService";
import { Timestamp } from "firebase/firestore";

interface MonthlyData {
  month: string; // e.g., "Jan '24"
  donations: number;
  expenses: number;
}

const chartConfig = {
  donations: {
    label: "Donations",
    color: "hsl(var(--chart-1))",
  },
  expenses: {
    label: "Expenses",
    color: "hsl(var(--chart-2))",
  },
};

function formatCurrencyForChart(value: number) {
    if (value >= 100000) return `${(value / 100000).toFixed(1)}L`; // Lakhs
    if (value >= 1000) return `${(value / 1000).toFixed(0)}k`; // Thousands
    return `${value}`;
}

export function MonthlySummaryChart() {
  const [chartData, setChartData] = React.useState<MonthlyData[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    async function fetchData() {
      setLoading(true);
      setError(null);
      try {
        const [transactions, expenses] = await Promise.all([
          getPaymentTransactions(),
          getExpenses(),
        ]);

        const successfulDonations = transactions.filter(tx => tx.status === 'Succeeded');

        const monthlyMap: { [key: string]: { donations: number; expenses: number } } = {};
        
        // Initialize last 12 months
        const today = new Date();
        for (let i = 11; i >= 0; i--) {
            const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
            const monthKey = `${date.getFullYear()}-${date.getMonth()}`;
            monthlyMap[monthKey] = { donations: 0, expenses: 0 };
        }

        // Process donations
        successfulDonations.forEach(tx => {
          const date = tx.date instanceof Timestamp ? tx.date.toDate() : tx.date;
          const monthKey = `${date.getFullYear()}-${date.getMonth()}`;
          if (monthlyMap[monthKey]) {
            monthlyMap[monthKey].donations += tx.amount;
          }
        });

        // Process expenses
        expenses.forEach(exp => {
          const date = exp.createdAt instanceof Timestamp ? exp.createdAt.toDate() : exp.createdAt;
          const monthKey = `${date.getFullYear()}-${date.getMonth()}`;
          if (monthlyMap[monthKey]) {
            monthlyMap[monthKey].expenses += exp.amount;
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
        console.error("Failed to fetch financial summary data:", e);
        setError(e instanceof Error ? e.message : "Could not load financial data.");
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <div className="flex items-center gap-2">
            <BarChartIcon className="h-5 w-5 text-green-600" />
            <CardTitle>Monthly Financial Summary</CardTitle>
        </div>
        <CardDescription>Donations vs. Expenses for the last 12 months.</CardDescription>
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
            <BarChart data={chartData} margin={{ top: 20, right: 10, left: -20, bottom: 5 }}>
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
                       const label = name === 'donations' ? 'Donations' : name === 'expenses' ? 'Expenses' : name;
                       const formattedValue = (value as number).toLocaleString("en-US", { style: "currency", currency: "BDT" });
                       return (
                         <div className="flex min-w-[120px] items-center justify-between">
                            <span className="text-muted-foreground">{label}</span>
                            <span>{formattedValue}</span>
                         </div>
                       );
                    }}
                    indicator="dot"
                />}
              />
               <ChartLegend content={<ChartLegendContent />} />
              <Bar dataKey="donations" fill="var(--color-donations)" radius={4} />
              <Bar dataKey="expenses" fill="var(--color-expenses)" radius={4} />
            </BarChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}
