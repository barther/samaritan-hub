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
        const currentMonth = now.getMonth() + 1; // JS months are 0-based
        const lastMonth = currentMonth === 1 ? 12 : currentMonth - 1;
        const lastMonthYear = currentMonth === 1 ? currentYear - 1 : currentYear;

        // Query public stats table - no auth required!
        const [currentMonthResult, lastMonthResult] = await Promise.all([
          supabase
            .from('monthly_public_stats')
            .select('*')
            .eq('year', currentYear)
            .eq('month', currentMonth)
            .maybeSingle(),
          
          supabase
            .from('monthly_public_stats')
            .select('*')
            .eq('year', lastMonthYear)
            .eq('month', lastMonth)
            .maybeSingle()
        ]);

        if (currentMonthResult.error && currentMonthResult.error.code !== 'PGRST116') {
          throw currentMonthResult.error;
        }
        if (lastMonthResult.error && lastMonthResult.error.code !== 'PGRST116') {
          throw lastMonthResult.error;
        }

        const currentData = currentMonthResult.data;
        const lastData = lastMonthResult.data;

        // Get the most recent all-time totals from either record
        const allTimeData = currentData || lastData;

        setStats({
          familiesThisMonth: currentData?.families_count || 0,
          peopleThisMonth: currentData?.people_count || 0,
          monthLabel: lastData?.month_label || new Date(lastMonthYear, lastMonth - 1).toLocaleString('default', { month: 'long' }),
          lastMonthFamilies: lastData?.families_count || 0,
          lastMonthPeople: lastData?.people_count || 0,
          totals: {
            familiesAllTime: allTimeData?.families_all_time || 0,
            peopleAllTime: allTimeData?.people_all_time || 0
          },
          loading: false,
        });

        console.log('Public stats loaded:', {
          currentMonth: currentData,
          lastMonth: lastData,
          allTime: allTimeData
        });

      } catch (error) {
        console.error('Error fetching public stats:', error);
        setStats(prev => ({ ...prev, loading: false }));
      }
    };

    fetchStats();
    
    // Auto-refresh every 30 seconds to pick up new data
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