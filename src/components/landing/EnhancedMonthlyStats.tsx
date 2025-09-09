import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import ImpactStrip from "./ImpactStrip";

const EnhancedMonthlyStats = () => {
  const [stats, setStats] = useState<{
    familiesThisMonth: number;
    peopleThisMonth: number;
    monthLabel: string;
    lastMonthFamilies?: number;
    lastMonthPeople?: number;
    totals?: { familiesAllTime?: number; peopleAllTime?: number };
    loading: boolean;
  }>({
    familiesThisMonth: 0,
    peopleThisMonth: 0,
    monthLabel: "",
    loading: true,
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const now = new Date();
        const currentYear = now.getFullYear();
        const currentMonth = now.getMonth() + 1; // 1-12

        const last = new Date(currentYear, currentMonth - 2, 1); // previous month
        const lastYear = last.getFullYear();
        const lastMonth = last.getMonth() + 1;
        const lastMonthName = last.toLocaleString('default', { month: 'long' });

        const [currentRes, lastRes, latestTotals] = await Promise.all([
          supabase
            .from('monthly_public_stats')
            .select('families_count, people_count')
            .eq('year', currentYear)
            .eq('month', currentMonth)
            .maybeSingle(),
          supabase
            .from('monthly_public_stats')
            .select('families_count, people_count, month_label')
            .eq('year', lastYear)
            .eq('month', lastMonth)
            .maybeSingle(),
          supabase
            .from('monthly_public_stats')
            .select('families_all_time, people_all_time, year, month')
            .order('year', { ascending: false })
            .order('month', { ascending: false })
            .limit(1)
            .maybeSingle()
        ]);

        if (currentRes.error) throw currentRes.error;
        if (lastRes.error) throw lastRes.error;
        if (latestTotals.error) throw latestTotals.error;

        setStats({
          familiesThisMonth: currentRes.data?.families_count || 0,
          peopleThisMonth: currentRes.data?.people_count || 0,
          monthLabel: lastRes.data?.month_label || lastMonthName,
          lastMonthFamilies: lastRes.data?.families_count || 0,
          lastMonthPeople: lastRes.data?.people_count || 0,
          totals: {
            familiesAllTime: latestTotals.data?.families_all_time || 0,
            peopleAllTime: latestTotals.data?.people_all_time || 0
          },
          loading: false,
        });
      } catch (error) {
        console.error('Error fetching public stats:', error);
        setStats(prev => ({ ...prev, loading: false }));
      }
    };

    fetchStats();
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, []);

  if (stats.loading) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white/70 backdrop-blur p-4 sm:p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-slate-200 rounded w-3/4 mx-auto mb-4"></div>
          <div className="grid grid-cols-2 gap-4">
            <div className="h-16 bg-slate-100 rounded"></div>
            <div className="h-16 bg-slate-100 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <ImpactStrip
      monthLabel={stats.monthLabel || "Last month"}
      familiesThisMonth={stats.familiesThisMonth}
      peopleThisMonth={stats.peopleThisMonth}
      lastMonthFamilies={stats.lastMonthFamilies}
      lastMonthPeople={stats.lastMonthPeople}
      totals={stats.totals}
    />
  );
};

export default EnhancedMonthlyStats;