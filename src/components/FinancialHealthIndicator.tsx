import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Shield, Scale, AlertTriangle, AlertCircle } from "lucide-react";

type HealthStatus = 'healthy' | 'stable' | 'concerning' | 'critical';

interface HealthData {
  status: HealthStatus;
  message: string;
  description: string;
}

const FinancialHealthIndicator = () => {
  const [healthData, setHealthData] = useState<HealthData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFinancialHealth = async () => {
      try {
        const twelveMonthsAgo = new Date();
        twelveMonthsAgo.setFullYear(twelveMonthsAgo.getFullYear() - 1);
        
        const [donationsResult, disbursementsResult] = await Promise.all([
          supabase
            .from('donations')
            .select('amount')
            .gte('donation_date', twelveMonthsAgo.toISOString().split('T')[0]),
          supabase
            .from('disbursements')
            .select('amount')
            .gte('disbursement_date', twelveMonthsAgo.toISOString().split('T')[0])
        ]);

        const totalDonations = donationsResult.data?.reduce((sum, d) => sum + d.amount, 0) || 0;
        const totalDisbursements = disbursementsResult.data?.reduce((sum, d) => sum + d.amount, 0) || 0;
        
        const ratio = totalDonations > 0 ? totalDonations / totalDisbursements : 0;
        
        let status: HealthStatus;
        let message: string;
        let description: string;
        
        if (ratio >= 2.0) {
          status = 'healthy';
          message = 'Financial Health: Excellent';
          description = 'Building strong reserves';
        } else if (ratio >= 1.2) {
          status = 'stable';
          message = 'Financial Health: Stable'; 
          description = 'Maintaining balance';
        } else if (ratio >= 0.8) {
          status = 'concerning';
          message = 'Financial Health: Concerning';
          description = 'Monitor funding closely';
        } else {
          status = 'critical';
          message = 'Financial Health: Critical';
          description = 'Urgent funding needed';
        }

        setHealthData({ status, message, description });
      } catch (error) {
        console.error('Error fetching financial health:', error);
        // Default to healthy state on error
        setHealthData({
          status: 'healthy',
          message: 'Financial Health: Available',
          description: 'Based on donations received vs. assistance provided'
        });
      } finally {
        setLoading(false);
      }
    };

    fetchFinancialHealth();
    
    // Auto-refresh every 30 seconds to pick up new data
    const interval = setInterval(fetchFinancialHealth, 30000);
    
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="bg-muted/30 rounded-lg p-4 mb-8 border border-border">
        <div className="flex items-center justify-center gap-3">
          <div className="animate-pulse">
            <div className="h-4 bg-muted rounded w-64"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!healthData) return null;

  const getStatusIcon = (status: HealthStatus) => {
    switch (status) {
      case 'healthy':
        return <Shield className="h-5 w-5 text-green-600" />;
      case 'stable':
        return <Scale className="h-5 w-5 text-blue-600" />;
      case 'concerning':
        return <AlertTriangle className="h-5 w-5 text-orange-600" />;
      case 'critical':
        return <AlertCircle className="h-5 w-5 text-red-600" />;
    }
  };

  const getStatusStyles = (status: HealthStatus) => {
    switch (status) {
      case 'healthy':
        return 'bg-green-50 border-green-200 dark:bg-green-950/30 dark:border-green-800';
      case 'stable':
        return 'bg-blue-50 border-blue-200 dark:bg-blue-950/30 dark:border-blue-800';
      case 'concerning':
        return 'bg-orange-50 border-orange-200 dark:bg-orange-950/30 dark:border-orange-800';
      case 'critical':
        return 'bg-red-50 border-red-200 dark:bg-red-950/30 dark:border-red-800';
    }
  };

  return (
    <div className={`rounded-lg p-4 mb-8 border ${getStatusStyles(healthData.status)}`}>
      <div className="text-center mb-3">
        <p className="text-sm font-medium text-muted-foreground">
          Financial Health Status
        </p>
        <p className="text-xs text-muted-foreground">
          Based on donations received vs. assistance provided
        </p>
      </div>
      <div className="flex items-center justify-center gap-3">
        {getStatusIcon(healthData.status)}
        <div className="text-center">
          <p className="font-medium text-foreground">
            {healthData.message}
          </p>
          <p className="text-sm text-muted-foreground">
            {healthData.description}
          </p>
        </div>
      </div>
    </div>
  );
};

export default FinancialHealthIndicator;