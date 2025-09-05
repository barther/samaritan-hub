import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { 
  ArrowLeft, 
  User, 
  Phone, 
  Mail, 
  MapPin, 
  Calendar,
  DollarSign,
  MessageSquare,
  Plus,
  ClipboardCheck,
  FileText
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import TriageForm from "@/components/TriageForm";

interface Client {
  id: string;
  first_name: string;
  last_name: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  created_at: string;
}

interface Interaction {
  id: string;
  contact_name: string;
  channel: string;
  summary: string;
  details?: string;
  status: string;
  assistance_type?: string;
  requested_amount?: number;
  approved_amount?: number;
  occurred_at: string;
  created_at: string;
}

interface Disbursement {
  id: string;
  amount: number;
  assistance_type: string;
  recipient_name: string;
  disbursement_date: string;
  payment_method: string;
  check_number?: string;
  notes?: string;
  created_at: string;
}

interface AssistanceRequest {
  id: string;
  help_requested: string;
  circumstances?: string;
  triage_completed_at?: string;
  triaged_by_user_id?: string;
  created_at: string;
}

const ClientDetail = () => {
  const { clientId } = useParams<{ clientId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [client, setClient] = useState<Client | null>(null);
  const [interactions, setInteractions] = useState<Interaction[]>([]);
  const [disbursements, setDisbursements] = useState<Disbursement[]>([]);
  const [assistanceRequests, setAssistanceRequests] = useState<AssistanceRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [triageModalOpen, setTriageModalOpen] = useState(false);
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);

  useEffect(() => {
    if (clientId) {
      loadClientData();
    }
  }, [clientId]);

  const loadClientData = async () => {
    try {
      setIsLoading(true);
      
      // Load client info
      const { data: clientData, error: clientError } = await supabase
        .from('clients')
        .select('*')
        .eq('id', clientId)
        .single();

      if (clientError) throw clientError;
      setClient(clientData);

      // Load interactions
      const { data: interactionsData, error: interactionsError } = await supabase
        .from('interactions')
        .select('*')
        .eq('client_id', clientId)
        .order('occurred_at', { ascending: false });

      if (interactionsError) throw interactionsError;
      setInteractions(interactionsData || []);

      // Load disbursements
      const { data: disbursementsData, error: disbursementsError } = await supabase
        .from('disbursements')
        .select('*')
        .eq('client_id', clientId)
        .order('disbursement_date', { ascending: false });

      if (disbursementsError) throw disbursementsError;
      setDisbursements(disbursementsData || []);

      // Load assistance requests
      const { data: requestsData, error: requestsError } = await supabase
        .from('assistance_requests')
        .select('*')
        .eq('client_id', clientId)
        .order('created_at', { ascending: false });

      if (requestsError) throw requestsError;
      setAssistanceRequests(requestsData || []);

    } catch (error) {
      console.error('Error loading client data:', error);
      toast({
        title: "Error loading client data",
        description: "Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading client information...</p>
        </div>
      </div>
    );
  }

  if (!client) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Client Not Found</h2>
          <p className="text-muted-foreground mb-4">The requested client could not be found.</p>
          <Button onClick={() => navigate('/portal/dashboard')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  const totalDisbursed = disbursements.reduce((sum, d) => sum + d.amount, 0);
  const totalRequested = interactions.reduce((sum, i) => sum + (i.requested_amount || 0), 0);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-background/95 backdrop-blur">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/portal/dashboard')}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-foreground">
                  {client.first_name} {client.last_name}
                </h1>
                <p className="text-sm text-muted-foreground">Client Details</p>
              </div>
            </div>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Interaction
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Client Info Card */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Client Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">{client.first_name} {client.last_name}</span>
                </div>
                {client.email && (
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span>{client.email}</span>
                  </div>
                )}
                {client.phone && (
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span>{client.phone}</span>
                  </div>
                )}
              </div>
              
              {(client.address || client.city || client.state || client.zip_code) && (
                <div className="space-y-2">
                  <div className="flex items-start gap-2 text-sm">
                    <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <div>
                      {client.address && <div>{client.address}</div>}
                      <div>
                        {client.city && client.city}
                        {client.city && client.state && ', '}
                        {client.state && client.state}
                        {client.zip_code && ` ${client.zip_code}`}
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>Added: {new Date(client.created_at).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                  <span>Total Disbursed: ${totalDisbursed.toFixed(2)}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <MessageSquare className="h-4 w-4 text-muted-foreground" />
                  <span>Interactions: {interactions.length}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabs for Interactions, Disbursements, and Assistance Requests */}
        <Tabs defaultValue="requests" className="space-y-4">
          <TabsList>
            <TabsTrigger value="requests">
              Assistance Requests ({assistanceRequests.length})
            </TabsTrigger>
            <TabsTrigger value="interactions">
              Interactions ({interactions.length})
            </TabsTrigger>
            <TabsTrigger value="disbursements">
              Disbursements ({disbursements.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="requests">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Assistance Requests
                </CardTitle>
              </CardHeader>
              <CardContent>
                {assistanceRequests.length > 0 ? (
                  <div className="space-y-4">
                    {assistanceRequests.map((request) => (
                      <div key={request.id} className="border border-border rounded-lg p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <Badge 
                              variant={request.triage_completed_at ? "default" : "destructive"} 
                              className="text-xs"
                            >
                              {request.triage_completed_at ? "Triaged" : "Pending Triage"}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2">
                            {!request.triage_completed_at && (
                              <Button
                                size="sm"
                                onClick={() => {
                                  setSelectedRequestId(request.id);
                                  setTriageModalOpen(true);
                                }}
                              >
                                <ClipboardCheck className="h-4 w-4 mr-2" />
                                Start Triage
                              </Button>
                            )}
                            <span className="text-xs text-muted-foreground">
                              {new Date(request.created_at).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                        
                        <h4 className="font-medium mb-2">Help Requested:</h4>
                        <p className="text-sm text-muted-foreground mb-3">{request.help_requested}</p>
                        
                        {request.circumstances && (
                          <>
                            <h4 className="font-medium mb-2">Circumstances:</h4>
                            <p className="text-sm text-muted-foreground mb-3">{request.circumstances}</p>
                          </>
                        )}
                        
                        {request.triage_completed_at && (
                          <div className="text-xs text-muted-foreground border-t pt-2">
                            Triaged on: {new Date(request.triage_completed_at).toLocaleDateString()}
                            {request.triaged_by_user_id && (
                              <span> by User ID: {request.triaged_by_user_id}</span>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground py-8">
                    No assistance requests for this client.
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="interactions">
            <Card>
              <CardHeader>
                <CardTitle>Interaction History</CardTitle>
              </CardHeader>
              <CardContent>
                {interactions.length > 0 ? (
                  <div className="space-y-4">
                    {interactions.map((interaction) => (
                      <div key={interaction.id} className="border border-border rounded-lg p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">
                              {interaction.channel.replace('_', ' ')}
                            </Badge>
                            <Badge variant={interaction.status === 'new' ? 'destructive' : 'secondary'} className="text-xs">
                              {interaction.status}
                            </Badge>
                            {interaction.assistance_type && (
                              <Badge variant="default" className="text-xs">
                                {interaction.assistance_type}
                              </Badge>
                            )}
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {new Date(interaction.occurred_at).toLocaleDateString()}
                          </span>
                        </div>
                        
                        <h4 className="font-medium mb-1">{interaction.summary}</h4>
                        {interaction.details && (
                          <p className="text-sm text-muted-foreground mb-2">{interaction.details}</p>
                        )}
                        
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          {interaction.requested_amount && (
                            <span>Requested: ${interaction.requested_amount.toFixed(2)}</span>
                          )}
                          {interaction.approved_amount && (
                            <span>Approved: ${interaction.approved_amount.toFixed(2)}</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground py-8">
                    No interactions recorded for this client.
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="disbursements">
            <Card>
              <CardHeader>
                <CardTitle>Disbursement History</CardTitle>
              </CardHeader>
              <CardContent>
                {disbursements.length > 0 ? (
                  <div className="space-y-4">
                    {disbursements.map((disbursement) => (
                      <div key={disbursement.id} className="border border-border rounded-lg p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Badge variant="default" className="text-xs">
                              {disbursement.assistance_type}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {disbursement.payment_method}
                            </Badge>
                            {disbursement.check_number && (
                              <Badge variant="secondary" className="text-xs">
                                Check #{disbursement.check_number}
                              </Badge>
                            )}
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-bold text-success">
                              ${disbursement.amount.toFixed(2)}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {new Date(disbursement.disbursement_date).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                        
                        <div className="text-sm">
                          <p><strong>Recipient:</strong> {disbursement.recipient_name}</p>
                          {disbursement.notes && (
                            <p className="text-muted-foreground mt-1">{disbursement.notes}</p>
                          )}
                        </div>
                      </div>
                    ))}
                    
                    <div className="border-t pt-4">
                      <div className="text-right">
                        <span className="text-lg font-bold">
                          Total Disbursed: ${totalDisbursed.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground py-8">
                    No disbursements recorded for this client.
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Triage Modal */}
        <Dialog open={triageModalOpen} onOpenChange={setTriageModalOpen}>
          <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Complete Triage for {client.first_name} {client.last_name}</DialogTitle>
            </DialogHeader>
            {selectedRequestId && (
              <TriageForm
                assistanceRequestId={selectedRequestId}
                initialData={assistanceRequests.find(r => r.id === selectedRequestId)}
                onComplete={() => {
                  setTriageModalOpen(false);
                  setSelectedRequestId(null);
                  loadClientData(); // Reload to show updated status
                }}
                onCancel={() => {
                  setTriageModalOpen(false);
                  setSelectedRequestId(null);
                }}
              />
            )}
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
};

export default ClientDetail;