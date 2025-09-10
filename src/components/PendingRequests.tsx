import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { CheckCircle, XCircle, Clock, DollarSign, User, Calendar, AlertTriangle } from "lucide-react";

interface AssistanceRequest {
  id: string;
  requested_amount: number;
  help_requested: string;
  circumstances: string;
  created_at: string;
  client_id: string;
  interaction_id: string;
  clients?: {
    first_name: string;
    last_name: string;
    phone?: string;
  };
  interactions?: {
    contact_name: string;
    summary: string;
  };
}

interface PendingRequestsProps {
  onRequestProcessed?: () => void;
}

export const PendingRequests = ({ onRequestProcessed }: PendingRequestsProps) => {
  const [requests, setRequests] = useState<AssistanceRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [processingRequest, setProcessingRequest] = useState<string | null>(null);
  const [approvalAmounts, setApprovalAmounts] = useState<Record<string, string>>({});
  const [denialReasons, setDenialReasons] = useState<Record<string, string>>({});
  const { toast } = useToast();

  useEffect(() => {
    loadPendingRequests();
  }, []);

  const loadPendingRequests = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('assistance_requests')
        .select(`
          id,
          requested_amount,
          help_requested,
          circumstances,
          created_at,
          client_id,
          interaction_id,
          clients!inner(first_name, last_name, phone),
          interactions(contact_name, summary)
        `)
        .is('approved_amount', null)
        .not('requested_amount', 'is', null)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setRequests(data || []);
      
      // Initialize approval amounts with requested amounts
      const amounts: Record<string, string> = {};
      data?.forEach(request => {
        amounts[request.id] = request.requested_amount?.toString() || '';
      });
      setApprovalAmounts(amounts);
    } catch (error) {
      console.error('Error loading pending requests:', error);
      toast({
        title: "Error loading requests",
        description: "Failed to load pending assistance requests.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprove = async (requestId: string, clientId: string, interactionId: string) => {
    const amount = approvalAmounts[requestId];
    if (!amount || parseFloat(amount) <= 0) {
      toast({
        title: "Invalid amount",
        description: "Please enter a valid approval amount.",
        variant: "destructive"
      });
      return;
    }

    setProcessingRequest(requestId);
    try {
      const request = requests.find(r => r.id === requestId);
      
      // Update the assistance request with approved amount
      const { error: updateError } = await supabase
        .from('assistance_requests')
        .update({ approved_amount: parseFloat(amount) })
        .eq('id', requestId);

      if (updateError) throw updateError;

      // Create disbursement record
      const { error: disbursementError } = await supabase
        .from('disbursements')
        .insert({
          amount: parseFloat(amount),
          assistance_type: 'other',
          recipient_name: request?.clients ? 
            `${request.clients.first_name} ${request.clients.last_name}` : 
            request?.interactions?.contact_name || 'Unknown',
          client_id: clientId,
          interaction_id: interactionId,
          assistance_request_id: requestId,
          payment_method: 'check',
          notes: `Approved via assistance request queue: ${request?.help_requested}`
        });

      if (disbursementError) throw disbursementError;

      toast({
        title: "Request approved",
        description: `Approved $${amount} for ${request?.help_requested}`,
      });

      loadPendingRequests();
      onRequestProcessed?.();
    } catch (error) {
      console.error('Error approving request:', error);
      toast({
        title: "Error approving request",
        description: "Please try again.",
        variant: "destructive"
      });
    } finally {
      setProcessingRequest(null);
    }
  };

  const handleDeny = async (requestId: string) => {
    const reason = denialReasons[requestId];
    if (!reason?.trim()) {
      toast({
        title: "Reason required",
        description: "Please provide a reason for denial.",
        variant: "destructive"
      });
      return;
    }

    setProcessingRequest(requestId);
    try {
      // Update the assistance request with denial (set approved_amount to 0)
      const { error: updateError } = await supabase
        .from('assistance_requests')
        .update({ 
          approved_amount: 0,
          outcome_category: 'denied',
          circumstances: (requests.find(r => r.id === requestId)?.circumstances || '') + 
                        `\n\nDENIED: ${reason}`
        })
        .eq('id', requestId);

      if (updateError) throw updateError;

      const request = requests.find(r => r.id === requestId);
      toast({
        title: "Request denied",
        description: `Denied request for ${request?.help_requested}`,
      });

      loadPendingRequests();
      onRequestProcessed?.();
    } catch (error) {
      console.error('Error denying request:', error);
      toast({
        title: "Error denying request",
        description: "Please try again.",
        variant: "destructive"
      });
    } finally {
      setProcessingRequest(null);
    }
  };

  const updateApprovalAmount = (requestId: string, value: string) => {
    // Only allow numbers and decimals
    const cleanValue = value.replace(/[^0-9.]/g, '');
    const parts = cleanValue.split('.');
    if (parts.length > 2) return; // Prevent multiple decimal points
    if (parts[1] && parts[1].length > 2) return; // Limit to 2 decimal places
    
    setApprovalAmounts(prev => ({ ...prev, [requestId]: cleanValue }));
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Pending Approval Requests
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">Loading pending requests...</div>
        </CardContent>
      </Card>
    );
  }

  if (requests.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Pending Approval Requests
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4 text-muted-foreground">
            No pending assistance requests
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Pending Approval Requests
          <Badge variant="secondary">{requests.length}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {requests.map((request) => (
          <Card key={request.id} className="border-l-4 border-l-yellow-500">
            <CardContent className="pt-4">
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">
                        {request.clients ? 
                          `${request.clients.first_name} ${request.clients.last_name}` :
                          request.interactions?.contact_name || 'Unknown'
                        }
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      {new Date(request.created_at).toLocaleDateString()}
                      {request.clients?.phone && (
                        <>
                          <span>•</span>
                          <span>{request.clients.phone}</span>
                        </>
                      )}
                    </div>
                  </div>
                  <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                    <DollarSign className="h-3 w-3 mr-1" />
                    ${request.requested_amount?.toFixed(2) || '0.00'}
                  </Badge>
                </div>

                <div className="space-y-2">
                  <p className="font-medium text-sm">{request.help_requested}</p>
                  {request.circumstances && (
                    <p className="text-sm text-muted-foreground bg-muted/30 rounded p-2">
                      {request.circumstances}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t">
                  <div className="space-y-3">
                    <div>
                      <Label htmlFor={`amount-${request.id}`} className="text-sm font-medium">
                        Approval Amount
                      </Label>
                      <Input
                        id={`amount-${request.id}`}
                        type="text"
                        inputMode="decimal"
                        placeholder="0.00"
                        value={approvalAmounts[request.id] || ''}
                        onChange={(e) => updateApprovalAmount(request.id, e.target.value)}
                        className="mt-1"
                      />
                    </div>
                    
                    <Button 
                      onClick={() => handleApprove(request.id, request.client_id, request.interaction_id)}
                      disabled={processingRequest === request.id || !approvalAmounts[request.id]}
                      className="w-full bg-green-600 hover:bg-green-700"
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      {processingRequest === request.id ? 'Approving...' : 'Approve'}
                    </Button>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <Label htmlFor={`reason-${request.id}`} className="text-sm font-medium">
                        Denial Reason
                      </Label>
                      <Textarea
                        id={`reason-${request.id}`}
                        placeholder="Reason for denial..."
                        value={denialReasons[request.id] || ''}
                        onChange={(e) => setDenialReasons(prev => ({ 
                          ...prev, 
                          [request.id]: e.target.value 
                        }))}
                        rows={2}
                        className="mt-1"
                      />
                    </div>
                    
                    <Button 
                      variant="destructive"
                      onClick={() => handleDeny(request.id)}
                      disabled={processingRequest === request.id || !denialReasons[request.id]?.trim()}
                      className="w-full"
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      {processingRequest === request.id ? 'Denying...' : 'Deny'}
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </CardContent>
    </Card>
  );
};