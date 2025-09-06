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
        
        // Fetch disbursements (families helped) from last month
        const { data: disbursements, error: disbursementError } = await supabase
          .from('disbursements')
          .select('client_id')
          .gte('disbursement_date', startOfLastMonth.toISOString().split('T')[0])
          .lte('disbursement_date', endOfLastMonth.toISOString().split('T')[0]);

        if (disbursementError) throw disbursementError;

        // Count unique families helped
        const uniqueFamilies = new Set(disbursements?.map(d => d.client_id) || []).size;

        // Fetch interactions (people contacted) from last month
        const { data: interactions, error: interactionError } = await supabase
          .from('interactions')
          .select('id')
          .gte('occurred_at', startOfLastMonth.toISOString())
          .lte('occurred_at', endOfLastMonth.toISOString());

        if (interactionError) throw interactionError;

        setStats({
          familiesHelped: uniqueFamilies,
          peopleContacted: interactions?.length || 0,
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

  if (stats.familiesHelped === 0 && stats.peopleContacted === 0) {
    return null; // Don't show if no data
  }

  return (
    <div className="bg-primary/5 rounded-lg p-6 mb-8 border border-primary/10">
      <div className="flex items-center justify-center gap-8 flex-wrap">
        <div className="flex items-center gap-2 text-primary">
          <HandHeart className="h-5 w-5" />
          <span className="font-semibold text-lg">
            We helped {stats.familiesHelped} {stats.familiesHelped === 1 ? 'family' : 'families'}
          </span>
        </div>
        <div className="text-muted-foreground">•</div>
        <div className="flex items-center gap-2 text-primary">
          <Users className="h-5 w-5" />
          <span className="font-semibold text-lg">
            Spoke with {stats.peopleContacted} {stats.peopleContacted === 1 ? 'person' : 'people'}
          </span>
        </div>
        <div className="text-sm text-muted-foreground">
          in {stats.monthName}
        </div>
      </div>
    </div>
  );
};

export default MonthlyStats;