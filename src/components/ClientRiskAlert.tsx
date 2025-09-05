import { useState, useEffect } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface ClientRiskAlertProps {
  clientId: string;
  className?: string;
}

interface ClientAlert {
  id: string;
  alert_type: string;
  severity: string;
  message: string;
  metadata?: any;
}

export const ClientRiskAlert = ({ clientId, className }: ClientRiskAlertProps) => {
  const [alerts, setAlerts] = useState<ClientAlert[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (clientId) {
      loadClientAlerts();
    }
  }, [clientId]);

  const loadClientAlerts = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('client_alerts')
        .select('*')
        .eq('client_id', clientId)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAlerts(data || []);
    } catch (error) {
      console.error('Error loading client alerts:', error);
    } finally {
      setLoading(false);
    }
  };

  const dismissAlert = async (alertId: string) => {
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
        title: "Alert dismissed",
        description: "The alert has been marked as resolved.",
      });

      loadClientAlerts();
    } catch (error) {
      console.error('Error dismissing alert:', error);
      toast({
        title: "Error",
        description: "Failed to dismiss alert",
        variant: "destructive",
      });
    }
  };

  const getSeverityVariant = (severity: string) => {
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

  if (loading) return null;
  if (alerts.length === 0) return null;

  return (
    <div className={`space-y-2 ${className}`}>
      {alerts.map((alert) => (
        <Alert key={alert.id} className="relative">
          <AlertTriangle className="h-4 w-4" />
          <div className="flex items-start justify-between w-full">
            <div className="flex-1 pr-8">
              <div className="flex items-center gap-2 mb-1">
                <Badge variant={getSeverityVariant(alert.severity) as any}>
                  {alert.severity.toUpperCase()}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  {alert.alert_type.replace('_', ' ').toUpperCase()}
                </span>
              </div>
              <AlertDescription>{alert.message}</AlertDescription>
              {alert.metadata && (
                <div className="text-xs text-muted-foreground mt-2">
                  {alert.metadata.total_amount && (
                    <span>Total received: ${alert.metadata.total_amount} • </span>
                  )}
                  {alert.metadata.assistance_count && (
                    <span>Requests: {alert.metadata.assistance_count} • </span>
                  )}
                  {alert.metadata.last_assistance && (
                    <span>Last assistance: {new Date(alert.metadata.last_assistance).toLocaleDateString()}</span>
                  )}
                </div>
              )}
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="absolute top-2 right-2 h-6 w-6 p-0"
              onClick={() => dismissAlert(alert.id)}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        </Alert>
      ))}
    </div>
  );
};