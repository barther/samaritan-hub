import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Undo2, DollarSign } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface RecentDisbursement {
  id: string;
  amount: number;
  assistance_type: string;
  recipient_name: string;
  disbursement_date: string;
  payment_method: string;
  created_at: string;
  clients: {
    first_name: string;
    last_name: string;
  } | null;
}

interface RecentDisbursementsProps {
  onRefresh?: () => void;
}

export const RecentDisbursements = ({ onRefresh }: RecentDisbursementsProps) => {
  const [disbursements, setDisbursements] = useState<RecentDisbursement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const loadRecentDisbursements = async () => {
    try {
      const { data, error } = await supabase
        .from('disbursements')
        .select(`
          id,
          amount,
          assistance_type,
          recipient_name,
          disbursement_date,
          payment_method,
          created_at,
          clients(first_name, last_name)
        `)
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) throw error;
      setDisbursements(data || []);
    } catch (error) {
      console.error('Error loading recent disbursements:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadRecentDisbursements();
  }, []);

  const handleUndo = async (disbursementId: string) => {
    try {
      const { error } = await supabase
        .from('disbursements')
        .delete()
        .eq('id', disbursementId);

      if (error) throw error;

      toast({
        title: "Disbursement removed",
        description: "The disbursement has been successfully removed."
      });

      loadRecentDisbursements();
      onRefresh?.();
    } catch (error) {
      console.error('Error removing disbursement:', error);
      toast({
        title: "Error removing disbursement",
        description: "Please try again or contact an administrator.",
        variant: "destructive"
      });
    }
  };

  const getAssistanceTypeLabel = (type: string) => {
    const labels = {
      rent: "Rent",
      utilities: "Utilities",
      food: "Food",
      medical: "Medical",
      transportation: "Transport",
      other: "Other"
    };
    return labels[type as keyof typeof labels] || type;
  };

  const getTimeSinceCreated = (createdAt: string) => {
    const minutes = Math.floor((new Date().getTime() - new Date(createdAt).getTime()) / (1000 * 60));
    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Recent Disbursements
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-12 bg-muted animate-pulse rounded" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="h-5 w-5" />
          Recent Disbursements
        </CardTitle>
      </CardHeader>
      <CardContent>
        {disbursements.length === 0 ? (
          <div className="text-center text-muted-foreground py-4">
            No recent disbursements
          </div>
        ) : (
          <div className="space-y-3">
            {disbursements.map((disbursement) => (
              <div key={disbursement.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium">${disbursement.amount.toFixed(2)}</span>
                    <Badge variant="outline" className="text-xs">
                      {getAssistanceTypeLabel(disbursement.assistance_type)}
                    </Badge>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    To: {disbursement.recipient_name}
                    {disbursement.clients && (
                      <span className="ml-2">
                        for {disbursement.clients.first_name} {disbursement.clients.last_name}
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {getTimeSinceCreated(disbursement.created_at)}
                  </div>
                </div>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleUndo(disbursement.id)}
                  className="text-destructive hover:text-destructive hover:bg-destructive/10"
                >
                  <Undo2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};