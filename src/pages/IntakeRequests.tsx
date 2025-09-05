import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { 
  Inbox, 
  Clock, 
  CheckCircle, 
  User, 
  MapPin, 
  Phone, 
  Mail, 
  Calendar,
  FileText,
  UserPlus,
  MessageSquare
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface IntakeRequest {
  id: string;
  created_at: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zip_code: string;
  county: string;
  help_needed: string;
  status: string;
  processed_by: string | null;
  processed_at: string | null;
  notes: string | null;
  client_id: string | null;
  interaction_id: string | null;
  assistance_request_id: string | null;
}

const IntakeRequests = () => {
  const { toast } = useToast();
  const [requests, setRequests] = useState<IntakeRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<IntakeRequest | null>(null);
  const [processingNotes, setProcessingNotes] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  const fetchRequests = async () => {
    try {
      const { data, error } = await supabase
        .from('public_intake')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRequests(data || []);
    } catch (error) {
      console.error('Error fetching intake requests:', error);
      toast({
        title: "Error",
        description: "Failed to load intake requests",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-500';
      case 'processing': return 'bg-blue-500';
      case 'completed': return 'bg-green-500';
      case 'rejected': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const processRequest = async (action: 'approve' | 'reject') => {
    if (!selectedRequest) return;

    setIsProcessing(true);
    
    try {
      if (action === 'approve') {
        // Create client record
        const { data: newClient, error: clientError } = await supabase
          .from('clients')
          .insert({
            first_name: selectedRequest.first_name,
            last_name: selectedRequest.last_name,
            email: selectedRequest.email.toLowerCase(),
            phone: selectedRequest.phone,
            address: selectedRequest.address,
            city: selectedRequest.city,
            state: selectedRequest.state,
            zip_code: selectedRequest.zip_code,
            county: selectedRequest.county,
          })
          .select('id')
          .single();

        if (clientError) throw clientError;

        // Create interaction
        const { data: interaction, error: interactionError } = await supabase
          .from('interactions')
          .insert({
            client_id: newClient.id,
            contact_name: `${selectedRequest.first_name} ${selectedRequest.last_name}`,
            summary: `Public intake: ${selectedRequest.help_needed.substring(0, 100)}...`,
            details: selectedRequest.help_needed,
            channel: 'public_form',
            status: 'new',
          })
          .select('id')
          .single();

        if (interactionError) throw interactionError;

        // Create assistance request
        const { error: requestError } = await supabase
          .from('assistance_requests')
          .insert({
            client_id: newClient.id,
            interaction_id: interaction.id,
            help_requested: selectedRequest.help_needed,
          });

        if (requestError) throw requestError;

        // Update intake request as processed
        const { error: updateError } = await supabase
          .from('public_intake')
          .update({
            status: 'completed',
            processed_at: new Date().toISOString(),
            notes: processingNotes,
            client_id: newClient.id,
            interaction_id: interaction.id,
          })
          .eq('id', selectedRequest.id);

        if (updateError) throw updateError;

        toast({
          title: "Request Approved",
          description: "Client and assistance request have been created successfully.",
        });
      } else {
        // Reject request
        const { error: updateError } = await supabase
          .from('public_intake')
          .update({
            status: 'rejected',
            processed_at: new Date().toISOString(),
            notes: processingNotes,
          })
          .eq('id', selectedRequest.id);

        if (updateError) throw updateError;

        toast({
          title: "Request Rejected",
          description: "The intake request has been marked as rejected.",
        });
      }

      // Refresh requests and close modal
      await fetchRequests();
      setSelectedRequest(null);
      setProcessingNotes("");
      
    } catch (error) {
      console.error('Error processing request:', error);
      toast({
        title: "Processing Error",
        description: "Failed to process the request. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const pendingRequests = requests.filter(r => r.status === 'pending');
  const processedRequests = requests.filter(r => r.status !== 'pending');

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Intake Requests</h2>
        <p className="text-muted-foreground">
          Review and process assistance requests from the public form
        </p>
      </div>

      {/* Pending Requests */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Inbox className="h-5 w-5" />
            Pending Requests ({pendingRequests.length})
          </CardTitle>
          <CardDescription>
            New requests waiting for review
          </CardDescription>
        </CardHeader>
        <CardContent>
          {pendingRequests.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No pending requests
            </p>
          ) : (
            <div className="space-y-4">
              {pendingRequests.map((request) => (
                <div
                  key={request.id}
                  className="border rounded-lg p-4 hover:bg-accent/50 transition-colors cursor-pointer"
                  onClick={() => setSelectedRequest(request)}
                >
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">
                          {request.first_name} {request.last_name}
                        </span>
                        <Badge className={getStatusColor(request.status)}>
                          {request.status}
                        </Badge>
                      </div>
                      
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          {request.email}
                        </div>
                        <div className="flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          {request.phone}
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {formatDistanceToNow(new Date(request.created_at))} ago
                        </div>
                      </div>
                      
                      <p className="text-sm line-clamp-2">{request.help_needed}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Processed Requests */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5" />
            Processed Requests ({processedRequests.length})
          </CardTitle>
          <CardDescription>
            Previously reviewed requests
          </CardDescription>
        </CardHeader>
        <CardContent>
          {processedRequests.length === 0 ? (
            <p className="text-center text-muted-foreground py-4">
              No processed requests
            </p>
          ) : (
            <div className="space-y-2">
              {processedRequests.slice(0, 10).map((request) => (
                <div
                  key={request.id}
                  className="flex items-center justify-between p-2 border rounded hover:bg-accent/30 transition-colors cursor-pointer"
                  onClick={() => setSelectedRequest(request)}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">
                      {request.first_name} {request.last_name}
                    </span>
                    <Badge variant="outline" className={getStatusColor(request.status)}>
                      {request.status}
                    </Badge>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(request.processed_at || request.created_at))} ago
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detail Modal */}
      {selectedRequest && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Request Details</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedRequest(null)}
                >
                  ✕
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Contact Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Name</Label>
                  <p>{selectedRequest.first_name} {selectedRequest.last_name}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Email</Label>
                  <p>{selectedRequest.email}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Phone</Label>
                  <p>{selectedRequest.phone}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Submitted</Label>
                  <p>{formatDistanceToNow(new Date(selectedRequest.created_at))} ago</p>
                </div>
              </div>

              {/* Address */}
              <div>
                <Label className="text-sm font-medium">Address</Label>
                <p>{selectedRequest.address}</p>
                <p>{selectedRequest.city}, {selectedRequest.state} {selectedRequest.zip_code}</p>
                {selectedRequest.county && <p>County: {selectedRequest.county}</p>}
              </div>

              {/* Help Needed */}
              <div>
                <Label className="text-sm font-medium">Help Requested</Label>
                <p className="whitespace-pre-wrap">{selectedRequest.help_needed}</p>
              </div>

              {/* Status */}
              <div className="flex items-center gap-2">
                <Label className="text-sm font-medium">Status:</Label>
                <Badge className={getStatusColor(selectedRequest.status)}>
                  {selectedRequest.status}
                </Badge>
              </div>

              {/* Processing Notes */}
              {selectedRequest.status === 'pending' && (
                <div>
                  <Label htmlFor="notes">Processing Notes</Label>
                  <Textarea
                    id="notes"
                    value={processingNotes}
                    onChange={(e) => setProcessingNotes(e.target.value)}
                    placeholder="Add notes about this request..."
                    rows={3}
                    className="mt-1"
                  />
                </div>
              )}

              {/* Existing Notes */}
              {selectedRequest.notes && (
                <div>
                  <Label className="text-sm font-medium">Notes</Label>
                  <p className="whitespace-pre-wrap">{selectedRequest.notes}</p>
                </div>
              )}

              {/* Actions */}
              {selectedRequest.status === 'pending' && (
                <div className="flex gap-2 pt-4">
                  <Button
                    onClick={() => processRequest('approve')}
                    disabled={isProcessing}
                    className="flex-1"
                  >
                    {isProcessing ? "Processing..." : "Approve & Create Client"}
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => processRequest('reject')}
                    disabled={isProcessing}
                    className="flex-1"
                  >
                    {isProcessing ? "Processing..." : "Reject Request"}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default IntakeRequests;
