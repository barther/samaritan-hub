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
        // Get last month data for narrative text
        const now = new Date();
        const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const startOfLastMonth = new Date(lastMonth.getFullYear(), lastMonth.getMonth(), 1);
        const endOfLastMonth = new Date(lastMonth.getFullYear(), lastMonth.getMonth() + 1, 0);
        const lastMonthName = lastMonth.toLocaleString('default', { month: 'long' });
        
        // Get current month data for live boxes
        const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const startOfCurrentMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
        const endOfCurrentMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);
        
        // Last month queries (for narrative text)
        const lastMonthStartStr = startOfLastMonth.toISOString().split('T')[0];
        const lastMonthEndStr = endOfLastMonth.toISOString().split('T')[0];
        const lastMonthStartTs = startOfLastMonth.toISOString();
        const lastMonthEndTs = endOfLastMonth.toISOString();

        // Current month queries (for live boxes)
        const currentMonthStartStr = startOfCurrentMonth.toISOString().split('T')[0];
        const currentMonthEndStr = endOfCurrentMonth.toISOString().split('T')[0];
        const currentMonthStartTs = startOfCurrentMonth.toISOString();
        const currentMonthEndTs = endOfCurrentMonth.toISOString();

        // Fetch last month data (for narrative) and current month data (for boxes)
        const [
          lastMonthDisbursements,
          lastMonthInteractions,
          currentMonthDisbursements,
          currentMonthInteractions
        ] = await Promise.all([
          // Last month data
          supabase
            .from('disbursements')
            .select('id, interaction_id')
            .gte('disbursement_date', lastMonthStartStr)
            .lte('disbursement_date', lastMonthEndStr),
          
          supabase
            .from('interactions')
            .select('id, summary, details')
            .gte('occurred_at', lastMonthStartTs)
            .lte('occurred_at', lastMonthEndTs),
            
          // Current month data
          supabase
            .from('disbursements')
            .select('id, interaction_id')
            .gte('disbursement_date', currentMonthStartStr)
            .lte('disbursement_date', currentMonthEndStr),
          
          supabase
            .from('interactions')
            .select('id, summary, details')
            .gte('occurred_at', currentMonthStartTs)
            .lte('occurred_at', currentMonthEndTs)
        ]);

        if (lastMonthDisbursements.error) throw lastMonthDisbursements.error;
        if (lastMonthInteractions.error) throw lastMonthInteractions.error;
        if (currentMonthDisbursements.error) throw currentMonthDisbursements.error;
        if (currentMonthInteractions.error) throw currentMonthInteractions.error;

        // Fetch all-time data
        const [allDisbursements, allInteractions] = await Promise.all([
          supabase.from('disbursements').select('id, interaction_id'),
          supabase.from('interactions').select('id, summary, details')
        ]);

        // Calculate last month stats (for narrative)
        const lastMonthDisbursedIds = new Set(
          (lastMonthDisbursements.data || [])
            .map((d: any) => d.interaction_id)
            .filter((id: string | null) => Boolean(id))
        );

        const lastMonthReferralCount = (lastMonthInteractions.data || []).filter((i: any) => {
          const hasReferralKeyword =
            (i.summary && i.summary.toLowerCase().includes('referral')) ||
            (i.details && i.details.toLowerCase().includes('refer'));
          const hasDisbursement = lastMonthDisbursedIds.has(i.id);
          return hasReferralKeyword && !hasDisbursement;
        }).length;

        const lastMonthFamilies = (lastMonthDisbursements.data?.length || 0) + lastMonthReferralCount;
        const lastMonthPeople = lastMonthInteractions.data?.length || 0;

        // Calculate current month stats (for live boxes)
        const currentMonthDisbursedIds = new Set(
          (currentMonthDisbursements.data || [])
            .map((d: any) => d.interaction_id)
            .filter((id: string | null) => Boolean(id))
        );

        const currentMonthReferralCount = (currentMonthInteractions.data || []).filter((i: any) => {
          const hasReferralKeyword =
            (i.summary && i.summary.toLowerCase().includes('referral')) ||
            (i.details && i.details.toLowerCase().includes('refer'));
          const hasDisbursement = currentMonthDisbursedIds.has(i.id);
          return hasReferralKeyword && !hasDisbursement;
        }).length;

        const currentMonthFamilies = (currentMonthDisbursements.data?.length || 0) + currentMonthReferralCount;
        const currentMonthPeople = currentMonthInteractions.data?.length || 0;

        // Calculate all-time stats
        let familiesAllTime = 0;
        let peopleAllTime = 0;

        if (allDisbursements.data && allInteractions.data) {
          const allDisbursedInteractionIds = new Set(
            allDisbursements.data
              .map((d: any) => d.interaction_id)
              .filter((id: string | null) => Boolean(id))
          );

          const allReferralOnlyCount = allInteractions.data.filter((i: any) => {
            const hasReferralKeyword =
              (i.summary && i.summary.toLowerCase().includes('referral')) ||
              (i.details && i.details.toLowerCase().includes('refer'));
            const hasDisbursement = allDisbursedInteractionIds.has(i.id);
            return hasReferralKeyword && !hasDisbursement;
          }).length;

          familiesAllTime = allDisbursements.data.length + allReferralOnlyCount;
          peopleAllTime = allInteractions.data.length;
        }

        setStats({
          familiesThisMonth: currentMonthFamilies,
          peopleThisMonth: currentMonthPeople,
          monthLabel: lastMonthName,
          lastMonthFamilies,
          lastMonthPeople,
          totals: { familiesAllTime, peopleAllTime },
          loading: false,
        });
      } catch (error) {
        console.error('Error fetching enhanced stats:', error);
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