import { useState, useEffect } from "react";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
  ArrowLeft,
  Save,
  X
} from "lucide-react";
import { ClientRiskBadge } from "@/components/ClientRiskBadge";
import { formatDistanceToNow } from "date-fns";
import { NewInteractionModal } from "@/components/modals/NewInteractionModal";
import { DisbursementModal } from "@/components/modals/DisbursementModal";
import { TriageForm } from "@/components/TriageForm";

const ClientDetail = () => {
  const { clientId } = useParams<{ clientId: string }>();
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
  const [isEditing, setIsEditing] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [editForm, setEditForm] = useState({
    first_name: '',
    last_name: '',
    preferred_name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zip_code: '',
    county: '',
    notes: ''
  });

  const fetchClientDetails = async () => {
    if (!clientId) {
      console.log('No client ID provided');
      setLoading(false);
      return;
    }
    
    console.log('Fetching client details for ID:', clientId);
    
    try {
      setLoading(true);
      
      // Fetch client data
      console.log('Fetching client data...');
      const { data: clientData, error: clientError } = await supabase
        .from('clients')
        .select('*, risk_level, assistance_count, total_assistance_received, flagged_for_review, review_reason')
        .eq('id', clientId)
        .maybeSingle();

      console.log('Client data result:', { clientData, clientError });

      if (clientError) throw clientError;
      
      if (!clientData) {
        console.log('No client found with ID:', clientId);
        setClient(null);
        setLoading(false);
        return;
      }
      
      setClient(clientData);
      
      // Initialize edit form with client data
      setEditForm({
        first_name: clientData.first_name || '',
        last_name: clientData.last_name || '',
        preferred_name: clientData.preferred_name || '',
        email: clientData.email || '',
        phone: clientData.phone || '',
        address: clientData.address || '',
        city: clientData.city || '',
        state: clientData.state || 'GA',
        zip_code: clientData.zip_code || '',
        county: clientData.county || '',
        notes: clientData.notes || ''
      });

      // Fetch interactions
      console.log('Fetching interactions...');
      const { data: interactionsData, error: interactionsError } = await supabase
        .from('interactions')
        .select('*')
        .eq('client_id', clientId)
        .order('occurred_at', { ascending: false });

      console.log('Interactions result:', { interactionsData, interactionsError });
      if (interactionsError) throw interactionsError;
      setInteractions(interactionsData || []);

      // Fetch disbursements
      console.log('Fetching disbursements...');
      const { data: disbursementsData, error: disbursementsError } = await supabase
        .from('disbursements')
        .select('*')
        .eq('client_id', clientId)
        .order('disbursement_date', { ascending: false });

      console.log('Disbursements result:', { disbursementsData, disbursementsError });
      if (disbursementsError) throw disbursementsError;
      setDisbursements(disbursementsData || []);

      // Fetch assistance requests
      console.log('Fetching assistance requests...');
      const { data: requestsData, error: requestsError } = await supabase
        .from('assistance_requests')
        .select('*')
        .eq('client_id', clientId)
        .order('created_at', { ascending: false });

      console.log('Assistance requests result:', { requestsData, requestsError });
      if (requestsError) throw requestsError;
      setAssistanceRequests(requestsData || []);

      console.log('All data fetched successfully');

    } catch (error) {
      console.error('Error fetching client details:', error);
      toast({
        title: "Error",
        description: `Failed to load client details: ${error.message || 'Unknown error'}`,
        variant: "destructive"
      });
    } finally {
      console.log('Setting loading to false');
      setLoading(false);
    }
  };

  useEffect(() => {
    if (clientId) {
      fetchClientDetails();
    }
  }, [clientId]);

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

  const handleEditToggle = () => {
    if (isEditing) {
      // Reset form to original values when canceling
      setEditForm({
        first_name: client.first_name || '',
        last_name: client.last_name || '',
        preferred_name: client.preferred_name || '',
        email: client.email || '',
        phone: client.phone || '',
        address: client.address || '',
        city: client.city || '',
        state: client.state || 'GA',
        zip_code: client.zip_code || '',
        county: client.county || '',
        notes: client.notes || ''
      });
    }
    setIsEditing(!isEditing);
  };

  const handleSaveChanges = async () => {
    if (!client?.id) return;
    
    setIsUpdating(true);
    try {
      const { error } = await supabase
        .from('clients')
        .update({
          first_name: editForm.first_name,
          last_name: editForm.last_name,
          preferred_name: editForm.preferred_name || null,
          email: editForm.email || null,
          phone: editForm.phone || null,
          address: editForm.address || null,
          city: editForm.city || null,
          state: editForm.state,
          zip_code: editForm.zip_code || null,
          county: editForm.county || null,
          notes: editForm.notes || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', client.id);

      if (error) throw error;

      toast({
        title: "Client Updated",
        description: "Client information has been successfully updated.",
      });

      setIsEditing(false);
      fetchClientDetails(); // Refresh the client data
    } catch (error) {
      console.error('Error updating client:', error);
      toast({
        title: "Error",
        description: "Failed to update client information. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsUpdating(false);
    }
  };

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
                {client.risk_level && (
                  <ClientRiskBadge 
                    riskLevel={client.risk_level}
                    assistanceCount={client.assistance_count}
                    totalReceived={client.total_assistance_received}
                    className="mt-2"
                  />
                )}
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {isEditing ? (
                <>
                  <Button 
                    onClick={handleSaveChanges}
                    disabled={isUpdating}
                    size="sm"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {isUpdating ? "Saving..." : "Save Changes"}
                  </Button>
                  <Button 
                    onClick={handleEditToggle}
                    variant="outline"
                    size="sm"
                  >
                    <X className="h-4 w-4 mr-2" />
                    Cancel
                  </Button>
                </>
              ) : (
                <>
                  <Button 
                    onClick={handleEditToggle}
                    variant="outline"
                    size="sm"
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Details
                  </Button>
                  <Button 
                    onClick={() => setShowNewInteraction(true)}
                    size="sm"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    New Interaction
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Client Info Card */}
        <Card className="mb-6">
          <CardContent className="p-6">
            {isEditing ? (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="first_name">First Name *</Label>
                    <Input
                      id="first_name"
                      value={editForm.first_name}
                      onChange={(e) => setEditForm(prev => ({ ...prev, first_name: e.target.value }))}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="last_name">Last Name *</Label>
                    <Input
                      id="last_name"
                      value={editForm.last_name}
                      onChange={(e) => setEditForm(prev => ({ ...prev, last_name: e.target.value }))}
                      required
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="preferred_name">Preferred Name</Label>
                  <Input
                    id="preferred_name"
                    value={editForm.preferred_name}
                    onChange={(e) => setEditForm(prev => ({ ...prev, preferred_name: e.target.value }))}
                    placeholder="Enter preferred name (optional)"
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={editForm.email}
                      onChange={(e) => setEditForm(prev => ({ ...prev, email: e.target.value }))}
                      placeholder="Enter email address"
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      value={editForm.phone}
                      onChange={(e) => setEditForm(prev => ({ ...prev, phone: e.target.value }))}
                      placeholder="Enter phone number"
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="address">Address</Label>
                  <Input
                    id="address"
                    value={editForm.address}
                    onChange={(e) => setEditForm(prev => ({ ...prev, address: e.target.value }))}
                    placeholder="Enter street address"
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="city">City</Label>
                    <Input
                      id="city"
                      value={editForm.city}
                      onChange={(e) => setEditForm(prev => ({ ...prev, city: e.target.value }))}
                      placeholder="Enter city"
                    />
                  </div>
                  <div>
                    <Label htmlFor="state">State</Label>
                    <Input
                      id="state"
                      value={editForm.state}
                      onChange={(e) => setEditForm(prev => ({ ...prev, state: e.target.value }))}
                      placeholder="GA"
                    />
                  </div>
                  <div>
                    <Label htmlFor="zip_code">Zip Code</Label>
                    <Input
                      id="zip_code"
                      value={editForm.zip_code}
                      onChange={(e) => setEditForm(prev => ({ ...prev, zip_code: e.target.value }))}
                      placeholder="Enter zip code"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="county">County</Label>
                    <Input
                      id="county"
                      value={editForm.county}
                      onChange={(e) => setEditForm(prev => ({ ...prev, county: e.target.value }))}
                      placeholder="Enter county"
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    value={editForm.notes}
                    onChange={(e) => setEditForm(prev => ({ ...prev, notes: e.target.value }))}
                    placeholder="Enter any additional notes about this client"
                    rows={3}
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-4">
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
                    <span className="text-sm">{client.address || 'No address'}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">Client since {formatDistanceToNow(new Date(client.created_at))} ago</span>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="flex items-center space-x-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{client.city}, {client.state} {client.zip_code}</span>
                  </div>
                  {client.county && (
                    <div className="flex items-center space-x-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{client.county} County</span>
                    </div>
                  )}
                </div>
                
                {client.notes && (
                  <div className="mt-4 p-3 bg-muted/50 rounded-lg">
                    <Label className="text-sm font-medium">Notes:</Label>
                    <p className="text-sm text-muted-foreground mt-1">{client.notes}</p>
                  </div>
                )}
              </div>
            )}
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
          clientId={clientId}
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