import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import ImpactStrip from "./ImpactStrip";

const EnhancedMonthlyStats = () => {
  const [stats, setStats] = useState<{
    familiesThisMonth: number;
    peopleThisMonth: number;
    monthLabel: string;
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
        // Get current month data (previous month logic from original)
        const now = new Date();
        const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const startOfLastMonth = new Date(lastMonth.getFullYear(), lastMonth.getMonth(), 1);
        const endOfLastMonth = new Date(lastMonth.getFullYear(), lastMonth.getMonth() + 1, 0);
        
        const monthName = lastMonth.toLocaleString('default', { month: 'long' });
        
        // Current month queries
        const startDateStr = startOfLastMonth.toISOString().split('T')[0];
        const endDateStr = endOfLastMonth.toISOString().split('T')[0];
        const startTs = startOfLastMonth.toISOString();
        const endTs = endOfLastMonth.toISOString();

        // Fetch monthly data
        const [disbursementsResult, interactionsResult] = await Promise.all([
          supabase
            .from('disbursements')
            .select('id, interaction_id')
            .gte('disbursement_date', startDateStr)
            .lte('disbursement_date', endDateStr),
          
          supabase
            .from('interactions')
            .select('id, summary, details')
            .gte('occurred_at', startTs)
            .lte('occurred_at', endTs)
        ]);

        if (disbursementsResult.error) throw disbursementsResult.error;
        if (interactionsResult.error) throw interactionsResult.error;

        // Fetch all-time data
        const [allDisbursements, allInteractions] = await Promise.all([
          supabase.from('disbursements').select('id, interaction_id'),
          supabase.from('interactions').select('id, summary, details')
        ]);

        // Calculate monthly stats (same logic as original)
        const disbursedInteractionIds = new Set(
          (disbursementsResult.data || [])
            .map((d: any) => d.interaction_id)
            .filter((id: string | null) => Boolean(id))
        );

        const referralOnlyCount = (interactionsResult.data || []).filter((i: any) => {
          const hasReferralKeyword =
            (i.summary && i.summary.toLowerCase().includes('referral')) ||
            (i.details && i.details.toLowerCase().includes('refer'));
          const hasDisbursement = disbursedInteractionIds.has(i.id);
          return hasReferralKeyword && !hasDisbursement;
        }).length;

        const familiesThisMonth = (disbursementsResult.data?.length || 0) + referralOnlyCount;
        const peopleThisMonth = interactionsResult.data?.length || 0;

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
          familiesThisMonth,
          peopleThisMonth,
          monthLabel: monthName,
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
      monthLabel={stats.monthLabel || "This month"}
      familiesThisMonth={stats.familiesThisMonth}
      peopleThisMonth={stats.peopleThisMonth}
      totals={stats.totals}
    />
  );
};

export default EnhancedMonthlyStats;