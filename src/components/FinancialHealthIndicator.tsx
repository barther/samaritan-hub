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
        // Calculate 12-month rolling window
        const endDate = new Date();
        const startDate = new Date();
        startDate.setFullYear(endDate.getFullYear() - 1);

        const startDateStr = startDate.toISOString().split('T')[0];
        const endDateStr = endDate.toISOString().split('T')[0];

        // Fetch donations for the past 12 months
        const { data: donations, error: donationError } = await supabase
          .from('donations')
          .select('amount')
          .gte('donation_date', startDateStr)
          .lte('donation_date', endDateStr);

        if (donationError) throw donationError;

        // Fetch disbursements for the past 12 months
        const { data: disbursements, error: disbursementError } = await supabase
          .from('disbursements')
          .select('amount')
          .gte('disbursement_date', startDateStr)
          .lte('disbursement_date', endDateStr);

        if (disbursementError) throw disbursementError;

        // Calculate totals
        const totalDonations = donations?.reduce((sum, d) => sum + Number(d.amount), 0) || 0;
        const totalDisbursements = disbursements?.reduce((sum, d) => sum + Number(d.amount), 0) || 0;

        // Calculate health status
        let status: HealthStatus;
        let message: string;
        let description: string;

        if (totalDisbursements === 0) {
          // No disbursements yet
          status = 'healthy';
          message = 'Building reserves';
          description = 'We\'re preparing to help families in need';
        } else {
          const ratio = totalDonations / totalDisbursements;
          
          if (ratio >= 1.2) {
            status = 'healthy';
            message = 'Strong financial position';
            description = 'We\'re well-funded and ready to help families in need';
          } else if (ratio >= 1.0) {
            status = 'stable';
            message = 'Stable funding levels';
            description = 'We\'re maintaining a balanced approach to helping families';
          } else if (ratio >= 0.7) {
            status = 'concerning';
            message = 'Funding needs attention';
            description = 'Your donations help us continue serving our community';
          } else {
            status = 'critical';
            message = 'Urgent funding needed';
            description = 'Community support is essential to continue our mission';
          }
        }

        setHealthData({ status, message, description });
      } catch (error) {
        console.error('Error fetching financial health:', error);
        // Default to healthy if we can't fetch data
        setHealthData({
          status: 'healthy',
          message: 'Ready to serve',
          description: 'We\'re prepared to help families in their time of need'
        });
      } finally {
        setLoading(false);
      }
    };

    fetchFinancialHealth();
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