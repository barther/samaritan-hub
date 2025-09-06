import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle, Users, DollarSign, TrendingUp, Bell } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { handleError } from "@/utils/errorHandler";

interface ClientAlert {
  id: string;
  client_id: string;
  alert_type: string;
  severity: string;
  message: string;
  is_active: boolean;
  created_at: string;
  metadata?: any;
  clients?: {
    first_name: string;
    last_name: string;
  };
}

interface AccountabilityStats {
  totalHighRiskClients: number;
  totalActiveAlerts: number;
  totalAssistanceThisMonth: number;
  averageAssistancePerClient: number;
  repeatClientPercentage: number;
}

export const AccountabilityDashboard = () => {
  const [alerts, setAlerts] = useState<ClientAlert[]>([]);
  const [stats, setStats] = useState<AccountabilityStats>({
    totalHighRiskClients: 0,
    totalActiveAlerts: 0,
    totalAssistanceThisMonth: 0,
    averageAssistancePerClient: 0,
    repeatClientPercentage: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAccountabilityData();
  }, []);

  const loadAccountabilityData = async () => {
    try {
      setLoading(true);

      // Load active alerts
      const { data: alertsData, error: alertsError } = await supabase
        .from('client_alerts')
        .select(`
          *,
          clients (first_name, last_name)
        `)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (alertsError) throw alertsError;
      setAlerts(alertsData || []);

      // Load accountability stats
      const [highRiskResult, assistanceResult, clientsResult] = await Promise.all([
        supabase
          .from('clients')
          .select('id')
          .eq('risk_level', 'high'),
        
        supabase
          .from('disbursements')
          .select('amount')
          .gte('disbursement_date', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()),
        
        supabase
          .from('clients')
          .select('assistance_count, total_assistance_received')
      ]);

      const highRiskCount = highRiskResult.data?.length || 0;
      const totalAssistance = assistanceResult.data?.reduce((sum, d) => sum + Number(d.amount), 0) || 0;
      const clients = clientsResult.data || [];
      const repeatClients = clients.filter(c => c.assistance_count > 1).length;
      const repeatPercentage = clients.length > 0 ? (repeatClients / clients.length) * 100 : 0;
      const averageAssistance = clients.length > 0 
        ? clients.reduce((sum, c) => sum + Number(c.total_assistance_received || 0), 0) / clients.length 
        : 0;

      setStats({
        totalHighRiskClients: highRiskCount,
        totalActiveAlerts: alertsData?.length || 0,
        totalAssistanceThisMonth: totalAssistance,
        averageAssistancePerClient: averageAssistance,
        repeatClientPercentage: repeatPercentage,
      });
    } catch (error) {
      handleError(error, 'load', 'Error loading accountability data');
    } finally {
      setLoading(false);
    }
  };

  const resolveAlert = async (alertId: string) => {
    try {
      const { error } = await supabase
        .from('client_alerts')
        .update({
          is_active: false,
          resolved_at: new Date().toISOString(),
          resolved_by: (await supabase.auth.getUser()).data.user?.id,
        })
        .eq('id', alertId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Alert resolved successfully",
      });

      loadAccountabilityData();
    } catch (error) {
      handleError(error, 'save', 'Error resolving alert');
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high':
      case 'critical':
        return 'destructive';
      case 'medium':
        return 'default';
      default:
        return 'secondary';
    }
  };

  if (loading) {
    return <div>Loading accountability dashboard...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">High Risk Clients</CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalHighRiskClients}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Alerts</CardTitle>
            <Bell className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalActiveAlerts}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Assistance</CardTitle>
            <DollarSign className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.totalAssistanceThisMonth.toFixed(2)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Repeat Clients</CardTitle>
            <TrendingUp className="h-4 w-4 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.repeatClientPercentage.toFixed(1)}%</div>
          </CardContent>
        </Card>
      </div>

      {/* Active Alerts */}
      <Card>
        <CardHeader>
          <CardTitle>Active Client Alerts</CardTitle>
        </CardHeader>
        <CardContent>
          {alerts.length === 0 ? (
            <Alert>
              <AlertDescription>No active alerts at this time.</AlertDescription>
            </Alert>
          ) : (
            <div className="space-y-4">
              {alerts.map((alert) => (
                <Alert key={alert.id}>
                  <AlertTriangle className="h-4 w-4" />
                  <div className="flex items-start justify-between w-full">
                    <div className="flex-1">
                      <AlertDescription>
                        <div className="flex items-center gap-2 mb-1">
                          <strong>
                            {alert.clients?.first_name} {alert.clients?.last_name}
                          </strong>
                          <Badge variant={getSeverityColor(alert.severity) as any}>
                            {alert.severity}
                          </Badge>
                        </div>
                        <div>{alert.message}</div>
                        <div className="text-sm text-muted-foreground mt-1">
                          {new Date(alert.created_at).toLocaleDateString()}
                        </div>
                      </AlertDescription>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => resolveAlert(alert.id)}
                    >
                      Resolve
                    </Button>
                  </div>
                </Alert>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};