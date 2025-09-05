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
  MessageSquare,
  PlayCircle
} from "lucide-react";
import { useNavigate } from "react-router-dom";
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
  const navigate = useNavigate();
  const [requests, setRequests] = useState<IntakeRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<IntakeRequest | null>(null);
  const [processingNotes, setProcessingNotes] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [potentialClients, setPotentialClients] = useState<any[]>([]);
  const [showClientMatching, setShowClientMatching] = useState(false);
  const [selectedClient, setSelectedClient] = useState<any | null>(null);

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

  const searchPotentialClients = async (request: IntakeRequest) => {
    try {
      const { data, error } = await supabase
        .from('clients')
        .select('id, first_name, last_name, email, phone, address, city, state')
        .or(`first_name.ilike.%${request.first_name}%,last_name.ilike.%${request.last_name}%,email.ilike.%${request.email}%,phone.ilike.%${request.phone}%`);

      if (error) throw error;

      // Calculate similarity scores for better matching
      const scoredClients = data?.map(client => {
        let score = 0;
        
        // Name matching (case insensitive)
        if (client.first_name.toLowerCase() === request.first_name.toLowerCase()) score += 30;
        if (client.last_name.toLowerCase() === request.last_name.toLowerCase()) score += 30;
        
        // Email matching
        if (client.email.toLowerCase() === request.email.toLowerCase()) score += 25;
        
        // Phone matching (normalize phone numbers)
        const normalizePhone = (phone: string) => phone.replace(/\D/g, '');
        if (normalizePhone(client.phone) === normalizePhone(request.phone)) score += 20;
        
        // Address similarity
        if (client.address?.toLowerCase().includes(request.address.toLowerCase()) || 
            request.address.toLowerCase().includes(client.address?.toLowerCase() || '')) score += 10;
        if (client.city?.toLowerCase() === request.city.toLowerCase()) score += 5;
        
        return { ...client, matchScore: score };
      }).filter(client => client.matchScore > 20) // Only show matches with significant similarity
       .sort((a, b) => b.matchScore - a.matchScore) || [];

      setPotentialClients(scoredClients);
      return scoredClients;
    } catch (error) {
      console.error('Error searching clients:', error);
      return [];
    }
  };

  const handleApproveClick = async () => {
    if (!selectedRequest) return;
    
    // Search for potential client matches first
    const matches = await searchPotentialClients(selectedRequest);
    
    if (matches.length > 0) {
      setShowClientMatching(true);
    } else {
      // No matches found, proceed with creating new client
      processRequest('approve');
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
      setShowClientMatching(false);
      setPotentialClients([]);
      setSelectedClient(null);
      
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

  const processRequestWithExistingClient = async () => {
    if (!selectedRequest || !selectedClient) return;

    setIsProcessing(true);
    
    try {
      // Create interaction linked to existing client
      const { data: interaction, error: interactionError } = await supabase
        .from('interactions')
        .insert({
          client_id: selectedClient.id,
          contact_name: `${selectedRequest.first_name} ${selectedRequest.last_name}`,
          summary: `Public intake (linked): ${selectedRequest.help_needed.substring(0, 100)}...`,
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
          client_id: selectedClient.id,
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
          notes: processingNotes + `\n\nLinked to existing client: ${selectedClient.first_name} ${selectedClient.last_name}`,
          client_id: selectedClient.id,
          interaction_id: interaction.id,
        })
        .eq('id', selectedRequest.id);

      if (updateError) throw updateError;

      toast({
        title: "Request Approved & Linked",
        description: `Successfully linked to existing client: ${selectedClient.first_name} ${selectedClient.last_name}`,
      });

      // Refresh requests and close modal
      await fetchRequests();
      setSelectedRequest(null);
      setProcessingNotes("");
      setShowClientMatching(false);
      setPotentialClients([]);
      setSelectedClient(null);
      
    } catch (error) {
      console.error('Error processing request with existing client:', error);
      toast({
        title: "Processing Error",
        description: "Failed to link the request to existing client. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleStartTriage = async (request: IntakeRequest) => {
    try {
      // Search for potential client matches first
      const matches = await searchPotentialClients(request);
      
      let clientId: string;
      
      if (matches.length > 0) {
        // Use the best match (highest score)
        clientId = matches[0].id;
        
        toast({
          title: "Client Matched",
          description: `Linked to existing client: ${matches[0].first_name} ${matches[0].last_name}`,
        });
      } else {
        // Create new client
        const { data: newClient, error: clientError } = await supabase
          .from('clients')
          .insert({
            first_name: request.first_name,
            last_name: request.last_name,
            email: request.email.toLowerCase(),
            phone: request.phone,
            address: request.address,
            city: request.city,
            state: request.state,
            zip_code: request.zip_code,
            county: request.county,
          })
          .select('id')
          .single();

        if (clientError) throw clientError;
        clientId = newClient.id;
      }

      // Create interaction
      const { data: interaction, error: interactionError } = await supabase
        .from('interactions')
        .insert({
          client_id: clientId,
          contact_name: `${request.first_name} ${request.last_name}`,
          summary: `Public intake triage: ${request.help_needed.substring(0, 100)}...`,
          details: request.help_needed,
          channel: 'public_form',
          status: 'new',
        })
        .select('id')
        .single();

      if (interactionError) throw interactionError;

      // Create assistance request with triage status
      const { data: assistanceRequest, error: requestError } = await supabase
        .from('assistance_requests')
        .insert({
          client_id: clientId,
          interaction_id: interaction.id,
          help_requested: request.help_needed,
          circumstances: `Public intake submission: ${request.help_needed}`,
        })
        .select('id')
        .single();

      if (requestError) throw requestError;

      // Update intake request as processing
      await supabase
        .from('public_intake')
        .update({
          status: 'processing',
          client_id: clientId,
          interaction_id: interaction.id,
          assistance_request_id: assistanceRequest.id,
        })
        .eq('id', request.id);

      // Navigate to client detail page to start triage
      navigate(`/portal/clients/${clientId}?startTriage=${assistanceRequest.id}`);
      
    } catch (error) {
      console.error('Error starting triage:', error);
      toast({
        title: "Error",
        description: "Failed to start triage. Please try again.",
        variant: "destructive"
      });
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
    <div className="min-h-screen bg-background">
      {/* SEO Meta - No Index */}
      <meta name="robots" content="noindex" />
      
      {/* Header */}
      <header className="border-b border-border bg-background/95 backdrop-blur">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Intake Requests</h1>
              <p className="text-sm text-muted-foreground">Review and process assistance requests from the public form</p>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="outline" size="sm" onClick={() => navigate('/portal/dashboard')}>
                Dashboard
              </Button>
              <Button variant="outline" size="sm" onClick={() => navigate('/portal/reports')}>
                Reports
              </Button>
              <Button variant="outline" size="sm" onClick={() => navigate('/portal/settings')}>
                Settings
              </Button>
              <Button variant="ghost" size="sm" onClick={async () => {
                await supabase.auth.signOut();
                navigate("/portal", { replace: true });
              }}>
                Log Out
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">

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
                  <div className="space-y-2 flex-1">
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
                  
                  <div className="flex items-center space-x-2">
                    <Button
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleStartTriage(request);
                      }}
                      className="flex items-center space-x-1"
                    >
                      <PlayCircle className="h-4 w-4" />
                      <span>Start Triage</span>
                    </Button>
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
              {selectedRequest.status === 'pending' && !showClientMatching && (
                <div className="flex gap-2 pt-4">
                  <Button
                    onClick={handleApproveClick}
                    disabled={isProcessing}
                    className="flex-1"
                  >
                    {isProcessing ? "Processing..." : "Approve & Process"}
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

              {/* Client Matching Section */}
              {showClientMatching && (
                <div className="border-t pt-4 space-y-4">
                  <div>
                    <h3 className="font-medium text-lg mb-2">Potential Client Matches Found</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      We found {potentialClients.length} potential matches. Please select an existing client or create a new one.
                    </p>
                  </div>

                  <div className="space-y-3 max-h-60 overflow-y-auto">
                    {potentialClients.map((client) => (
                      <div
                        key={client.id}
                        className={`border rounded-lg p-3 cursor-pointer transition-colors ${
                          selectedClient?.id === client.id 
                            ? 'border-primary bg-primary/5' 
                            : 'border-border hover:bg-accent/30'
                        }`}
                        onClick={() => setSelectedClient(client)}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">
                              {client.first_name} {client.last_name}
                            </p>
                            <div className="text-sm text-muted-foreground space-y-1">
                              <p>{client.email}</p>
                              <p>{client.phone}</p>
                              <p>{client.address}, {client.city}, {client.state}</p>
                            </div>
                          </div>
                          <Badge variant="outline">
                            {client.matchScore}% match
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="flex gap-2 pt-4">
                    <Button
                      onClick={() => processRequestWithExistingClient()}
                      disabled={!selectedClient || isProcessing}
                      className="flex-1"
                    >
                      {isProcessing ? "Processing..." : "Link to Selected Client"}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => processRequest('approve')}
                      disabled={isProcessing}
                      className="flex-1"
                    >
                      {isProcessing ? "Processing..." : "Create New Client"}
                    </Button>
                    <Button
                      variant="ghost"
                      onClick={() => {
                        setShowClientMatching(false);
                        setPotentialClients([]);
                        setSelectedClient(null);
                      }}
                      disabled={isProcessing}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
        </div>
      </main>
    </div>
  );
};

export default IntakeRequests;
