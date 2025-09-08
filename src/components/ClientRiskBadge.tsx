import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Shield, Users } from "lucide-react";

interface ClientRiskBadgeProps {
  riskLevel: string;
  assistanceCount?: number;
  totalReceived?: number;
  totalRequested?: number;
  className?: string;
}


export const ClientRiskBadge = ({ 
  riskLevel, 
  assistanceCount = 0, 
  totalReceived = 0, 
  totalRequested = 0,
  className 
}: ClientRiskBadgeProps) => {
  const getRiskConfig = (level: string) => {
    switch (level) {
      case 'high':
        return {
          variant: 'destructive' as const,
          icon: AlertTriangle,
          label: 'High Risk',
        };
      case 'medium':
        return {
          variant: 'secondary' as const,
          icon: Users,
          label: 'Medium Risk',
        };
      default:
        return {
          variant: 'outline' as const,
          icon: Shield,
          label: 'Low Risk',
        };
    }
  };

  const config = getRiskConfig(riskLevel);
  const Icon = config.icon;

  return (
    <Badge variant={config.variant} className={className}>
      <Icon className="h-3 w-3 mr-1" />
      {config.label}
      {assistanceCount > 0 && (
        <span className="ml-1">
          ({assistanceCount} payments, ${totalReceived.toFixed(0)} disbursed{typeof totalRequested === 'number' ? `, net $${(totalReceived - totalRequested).toFixed(0)}` : ''})
        </span>
      )}
    </Badge>
  );
};