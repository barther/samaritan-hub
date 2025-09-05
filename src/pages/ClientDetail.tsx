import { useState, useEffect } from "react";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { 
  User, 
  Phone, 
  Mail, 
  MapPin, 
  Calendar,
  DollarSign,
  FileText,
  Edit,
  Plus,
  Users,
  MessageSquare,
  Activity,
  ArrowLeft
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { NewInteractionModal } from "@/components/modals/NewInteractionModal";
import { DisbursementModal } from "@/components/modals/DisbursementModal";
import { TriageForm } from "@/components/TriageForm";

const ClientDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [client, setClient] = useState<any>(null);
  const [interactions, setInteractions] = useState<any[]>([]);
  const [disbursements, setDisbursements] = useState<any[]>([]);
  const [assistanceRequests, setAssistanceRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewInteraction, setShowNewInteraction] = useState(false);
  const [showDisbursement, setShowDisbursement] = useState(false);
  const [showTriage, setShowTriage] = useState(false);
  const [selectedAssistanceRequest, setSelectedAssistanceRequest] = useState<any>(null);

  const fetchClientDetails = async () => {
    if (!id) return;
    
    try {
      setLoading(true);
      
      // Fetch client data
      const { data: clientData, error: clientError } = await supabase
        .from('clients')
        .select('*')
        .eq('id', id)
        .single();

      if (clientError) throw clientError;
      setClient(clientData);

      // Fetch interactions
      const { data: interactionsData, error: interactionsError } = await supabase
        .from('interactions')
        .select('*')
        .eq('client_id', id)
        .order('occurred_at', { ascending: false });

      if (interactionsError) throw interactionsError;
      setInteractions(interactionsData || []);

      // Fetch disbursements
      const { data: disbursementsData, error: disbursementsError } = await supabase
        .from('disbursements')
        .select('*')
        .eq('client_id', id)
        .order('disbursement_date', { ascending: false });

      if (disbursementsError) throw disbursementsError;
      setDisbursements(disbursementsData || []);

      // Fetch assistance requests
      const { data: requestsData, error: requestsError } = await supabase
        .from('assistance_requests')
        .select('*')
        .eq('client_id', id)
        .order('created_at', { ascending: false });

      if (requestsError) throw requestsError;
      setAssistanceRequests(requestsData || []);

    } catch (error) {
      console.error('Error fetching client details:', error);
      toast({
        title: "Error",
        description: "Failed to load client details",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchClientDetails();
    }
  }, [id]);

  useEffect(() => {
    // Check if we should auto-start triage from query param
    const startTriageId = searchParams.get('startTriage');
    if (startTriageId && assistanceRequests.length > 0) {
      const requestToTriage = assistanceRequests.find(req => req.id === startTriageId);
      if (requestToTriage) {
        setSelectedAssistanceRequest(requestToTriage);
        setShowTriage(true);
      }
    }
  }, [searchParams, assistanceRequests]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!client) {
    return (
      <div className="text-center py-8">
        <p>Client not found</p>
        <Button onClick={() => navigate('/portal/dashboard')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Button>
      </div>
    );
  }

  const totalRequested = assistanceRequests.reduce((sum, req) => sum + (req.requested_amount || 0), 0);
  const totalApproved = assistanceRequests.reduce((sum, req) => sum + (req.approved_amount || 0), 0);
  const totalDisbursed = disbursements.reduce((sum, d) => sum + d.amount, 0);

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
            <div className="flex items-center space-x-2">
              <Button 
                onClick={() => setShowNewInteraction(true)}
                size="sm"
              >
                <Plus className="h-4 w-4 mr-2" />
                New Interaction
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Client Info Card */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="flex items-center space-x-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{client.email || 'No email'}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{client.phone || 'No phone'}</span>
              </div>
              <div className="flex items-center space-x-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{client.city}, {client.state} {client.zip_code}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">Client since {formatDistanceToNow(new Date(client.created_at))} ago</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Financial Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold">${totalRequested.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">Total Requested</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-warning">${totalApproved.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">Total Approved</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-success">${totalDisbursed.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">Total Disbursed</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="interactions" className="space-y-4">
          <TabsList>
            <TabsTrigger value="interactions">Interactions</TabsTrigger>
            <TabsTrigger value="assistance">Assistance Requests</TabsTrigger>
            <TabsTrigger value="disbursements">Disbursements</TabsTrigger>
          </TabsList>

          <TabsContent value="interactions">
            <Card>
              <CardHeader>
                <CardTitle>Recent Interactions</CardTitle>
              </CardHeader>
              <CardContent>
                {interactions.length === 0 ? (
                  <p className="text-center text-muted-foreground py-4">No interactions found</p>
                ) : (
                  <div className="space-y-2">
                    {interactions.map((interaction) => (
                      <div key={interaction.id} className="border rounded p-3">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-medium">{interaction.summary}</h4>
                            <p className="text-sm text-muted-foreground">{interaction.details}</p>
                          </div>
                          <Badge variant="outline">{interaction.status}</Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="assistance">
            <Card>
              <CardHeader>
                <CardTitle>Assistance Requests</CardTitle>
              </CardHeader>
              <CardContent>
                {assistanceRequests.length === 0 ? (
                  <p className="text-center text-muted-foreground py-4">No assistance requests found</p>
                ) : (
                  <div className="space-y-2">
                    {assistanceRequests.map((request) => (
                      <div key={request.id} className="border rounded p-3">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-medium">{request.help_requested}</h4>
                            <p className="text-sm text-muted-foreground">
                              Requested: ${request.requested_amount || 0}
                            </p>
                          </div>
                          {!request.triage_completed_at && (
                            <Button
                              size="sm"
                              onClick={() => {
                                setSelectedAssistanceRequest(request);
                                setShowTriage(true);
                              }}
                            >
                              Start Triage
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="disbursements">
            <Card>
              <CardHeader>
                <CardTitle>Disbursements</CardTitle>
              </CardHeader>
              <CardContent>
                {disbursements.length === 0 ? (
                  <p className="text-center text-muted-foreground py-4">No disbursements found</p>
                ) : (
                  <div className="space-y-2">
                    {disbursements.map((disbursement) => (
                      <div key={disbursement.id} className="border rounded p-3">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-medium">${disbursement.amount}</h4>
                            <p className="text-sm text-muted-foreground">
                              {disbursement.assistance_type} - {disbursement.payment_method}
                            </p>
                          </div>
                          <span className="text-sm text-muted-foreground">
                            {formatDistanceToNow(new Date(disbursement.disbursement_date))} ago
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      {/* Modals */}
      {showNewInteraction && (
        <NewInteractionModal
          open={showNewInteraction}
          onOpenChange={setShowNewInteraction}
          onSuccess={() => {
            setShowNewInteraction(false);
            fetchClientDetails();
          }}
          clientId={id}
        />
      )}

      {showTriage && selectedAssistanceRequest && (
        <TriageForm
          assistanceRequestId={selectedAssistanceRequest.id}
          initialData={selectedAssistanceRequest}
          onComplete={() => {
            setShowTriage(false);
            setSelectedAssistanceRequest(null);
            fetchClientDetails();
          }}
          onCancel={() => {
            setShowTriage(false);
            setSelectedAssistanceRequest(null);
          }}
        />
      )}
    </div>
  );
};

export default ClientDetail;