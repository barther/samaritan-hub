import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Users, HandHeart } from "lucide-react";

const MonthlyStats = () => {
  const [stats, setStats] = useState<{
    familiesHelped: number;
    peopleContacted: number;
    monthName: string;
    loading: boolean;
  }>({
    familiesHelped: 0,
    peopleContacted: 0,
    monthName: "",
    loading: true,
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Get previous month's date range
        const now = new Date();
        const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const startOfLastMonth = new Date(lastMonth.getFullYear(), lastMonth.getMonth(), 1);
        const endOfLastMonth = new Date(lastMonth.getFullYear(), lastMonth.getMonth() + 1, 0);
        
        const monthName = lastMonth.toLocaleString('default', { month: 'long' });
        
        // Fetch disbursements (count of assistance given) from last month
        const startDateStr = startOfLastMonth.toISOString().split('T')[0];
        const endDateStr = endOfLastMonth.toISOString().split('T')[0];
        const startTs = startOfLastMonth.toISOString();
        const endTs = endOfLastMonth.toISOString();

        const { data: disbursements, error: disbursementError } = await supabase
          .from('disbursements')
          .select('id, interaction_id')
          .gte('disbursement_date', startDateStr)
          .lte('disbursement_date', endDateStr);

        if (disbursementError) throw disbursementError;

        // Fetch interactions from last month
        const { data: interactions, error: interactionError } = await supabase
          .from('interactions')
          .select('id, summary, details')
          .gte('occurred_at', startTs)
          .lte('occurred_at', endTs);

        if (interactionError) throw interactionError;

        // Build a set of interaction IDs that resulted in a disbursement this month
        const disbursedInteractionIds = new Set(
          (disbursements || [])
            .map((d: any) => d.interaction_id)
            .filter((id: string | null) => Boolean(id))
        );

        // Count referrals-only interactions (contain 'referral' and have no disbursement)
        const referralOnlyCount = (interactions || []).filter((i: any) => {
          const hasReferralKeyword =
            (i.summary && i.summary.toLowerCase().includes('referral')) ||
            (i.details && i.details.toLowerCase().includes('refer'));
          const hasDisbursement = disbursedInteractionIds.has(i.id);
          return hasReferralKeyword && !hasDisbursement;
        }).length;

        const rawFamiliesCount = (disbursements?.length || 0) + referralOnlyCount;
        const peopleContactedCount = interactions?.length || 0;
        
        // Ensure families helped never exceeds people contacted (logical constraint)
        const familiesCount = Math.min(rawFamiliesCount, peopleContactedCount);

        setStats({
          familiesHelped: familiesCount,
          peopleContacted: peopleContactedCount,
          monthName,
          loading: false,
        });
      } catch (error) {
        console.error('Error fetching monthly stats:', error);
        setStats(prev => ({ ...prev, loading: false }));
      }
    };

    fetchStats();
  }, []);

  if (stats.loading) {
    return (
      <div className="bg-primary/5 rounded-lg p-6 mb-8 border border-primary/10">
        <div className="flex items-center justify-center gap-8">
          <div className="animate-pulse">
            <div className="h-4 bg-primary/20 rounded w-48"></div>
          </div>
        </div>
      </div>
    );
  }

  // Always show the component, even with zero stats for previous month
  return (
    <div className="bg-primary/5 rounded-lg p-6 mb-8 border border-primary/10">
      <div className="text-center">
        <p className="text-lg text-foreground">
          In <span className="font-semibold text-primary">{stats.monthName}</span>, we helped{' '}
          <span className="font-semibold text-primary">
            {stats.familiesHelped} {stats.familiesHelped === 1 ? 'family' : 'families'}
          </span>{' '}
          and spoke with{' '}
          <span className="font-semibold text-primary">
            {stats.peopleContacted} {stats.peopleContacted === 1 ? 'person' : 'people'}
          </span>.
        </p>
      </div>
    </div>
  );
};

export default MonthlyStats;