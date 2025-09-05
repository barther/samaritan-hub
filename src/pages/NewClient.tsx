import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  ArrowLeft, 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  FileText,
  AlertTriangle,
  CheckCircle,
  ClipboardCheck
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { TriageForm } from "@/components/TriageForm";

interface PotentialClient {
  id: string;
  first_name: string;
  last_name: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  matchScore: number;
}

const NewClient = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Get data passed from dashboard
  const { 
    interactionId, 
    contactName = "", 
    summary = "",
    email: passedEmail = "",
    phone: passedPhone = "",
    helpNeeded = "",
    type = ""
  } = location.state || {};

  // Form state
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("GA");
  const [zipCode, setZipCode] = useState("");
  const [county, setCounty] = useState("");

  // Workflow state
  const [potentialMatches, setPotentialMatches] = useState<PotentialClient[]>([]);
  const [showMatches, setShowMatches] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState<PotentialClient | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [showTriage, setShowTriage] = useState(false);
  const [newClientId, setNewClientId] = useState<string | null>(null);
  const [assistanceRequestId, setAssistanceRequestId] = useState<string | null>(null);

  // Parse contact name and populate fields on component mount
  useEffect(() => {
    if (contactName) {
      const nameParts = contactName.split(' ');
      setFirstName(nameParts[0] || '');
      setLastName(nameParts.slice(1).join(' ') || '');
    }
    if (passedEmail) setEmail(passedEmail);
    if (passedPhone) setPhone(passedPhone);
  }, [contactName, passedEmail, passedPhone]);

  // Auto-search for matches when form data changes
  useEffect(() => {
    if (firstName.length > 2 || email.length > 5 || phone.length > 9) {
      searchForMatches();
    }
  }, [firstName, lastName, email, phone]);

  const searchForMatches = async () => {
    if (!firstName && !email && !phone) return;
    
    setIsSearching(true);
    try {
      const conditions = [];
      if (firstName.length > 2) conditions.push(`first_name.ilike.%${firstName}%`);
      if (lastName.length > 2) conditions.push(`last_name.ilike.%${lastName}%`);
      if (email.length > 5) conditions.push(`email.ilike.%${email}%`);
      if (phone.length > 9) conditions.push(`phone.ilike.%${phone}%`);

      const { data, error } = await supabase
        .from('clients')
        .select('id, first_name, last_name, email, phone, address, city, state')
        .or(conditions.join(','));

      if (error) throw error;

      // Calculate match scores
      const scoredMatches = data?.map(client => {
        let score = 0;
        
        if (client.first_name.toLowerCase() === firstName.toLowerCase()) score += 30;
        if (client.last_name.toLowerCase() === lastName.toLowerCase()) score += 30;
        if (client.email?.toLowerCase() === email.toLowerCase()) score += 25;
        
        const normalizePhone = (phone: string) => phone.replace(/\D/g, '');
        if (normalizePhone(client.phone || '') === normalizePhone(phone)) score += 20;
        
        return { ...client, matchScore: score };
      }).filter(client => client.matchScore > 20)
       .sort((a, b) => b.matchScore - a.matchScore) || [];

      setPotentialMatches(scoredMatches);
      setShowMatches(scoredMatches.length > 0);
    } catch (error) {
      console.error('Error searching for matches:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const linkToExistingClient = async () => {
    if (!selectedMatch || !interactionId) return;

    setIsCreating(true);
    try {
        if (type === 'public_intake') {
          // For public intake, update the public_intake table
          const { error: updateError } = await supabase
            .from('public_intake')
            .update({ client_id: selectedMatch.id })
            .eq('id', interactionId);

          if (updateError) throw updateError;
        } else {
          // For staff interactions, update the interactions table
          const { error: updateError } = await supabase
            .from('interactions')
            .update({ client_id: selectedMatch.id })
            .eq('id', interactionId);

          if (updateError) throw updateError;
        }

        // Create assistance request
        const { error: requestError } = await supabase
          .from('assistance_requests')
          .insert({
            client_id: selectedMatch.id,
            interaction_id: interactionId,
            help_requested: helpNeeded || summary,
          });

      if (requestError) throw requestError;

      toast({
        title: "Client Linked Successfully",
        description: `Interaction linked to ${selectedMatch.first_name} ${selectedMatch.last_name}`,
      });

      // Navigate to client detail page
      navigate(`/portal/clients/${selectedMatch.id}`);
    } catch (error: any) {
      console.error('Error linking to existing client:', error);
      toast({
        title: "Error",
        description: `Failed to link to existing client: ${error?.message || 'Unknown error'}`,
        variant: "destructive"
      });
    } finally {
      setIsCreating(false);
    }
  };

  const createNewClient = async () => {
    if (!firstName || !lastName) {
      toast({
        title: "Required Fields Missing",
        description: "First name and last name are required.",
        variant: "destructive"
      });
      return;
    }

    setIsCreating(true);
    console.log('Creating client with data:', { firstName, lastName, email, phone, address, city, state, zipCode, county });
    console.log('Interaction info:', { interactionId, type, helpNeeded, summary });
    
    try {
      // Create new client
      const { data: newClient, error: clientError } = await supabase
        .from('clients')
        .insert({
          first_name: firstName,
          last_name: lastName,
          email: email || null,
          phone: phone || null,
          address: address || null,
          city: city || null,
          state: state,
          zip_code: zipCode || null,
          county: county || null,
        })
        .select('id')
        .single();

      if (clientError) throw clientError;

      // Update interaction to link to new client (handle both interaction types)
      if (interactionId) {
        if (type === 'public_intake') {
          // For public intake, update the public_intake table
          const { error: updateError } = await supabase
            .from('public_intake')
            .update({ client_id: newClient.id })
            .eq('id', interactionId);

          if (updateError) throw updateError;
        } else {
          // For staff interactions, update the interactions table
          const { error: updateError } = await supabase
            .from('interactions')
            .update({ client_id: newClient.id })
            .eq('id', interactionId);

          if (updateError) throw updateError;
        }

        // Create assistance request
        const { data: assistanceRequest, error: requestError } = await supabase
          .from('assistance_requests')
          .insert({
            client_id: newClient.id,
            interaction_id: interactionId,
            help_requested: helpNeeded || summary,
          })
          .select('id')
          .single();

        if (requestError) throw requestError;

        setAssistanceRequestId(assistanceRequest.id);
      }

      setNewClientId(newClient.id);
      setShowTriage(true);

      toast({
        title: "Client Created Successfully",
        description: "Now complete the triage assessment.",
      });

    } catch (error: any) {
      console.error('Error creating client:', error);
      console.error('Error details:', error.message, error.details, error.hint);
      toast({
        title: "Error",
        description: `Failed to create client: ${error.message}`,
        variant: "destructive"
      });
    } finally {
      setIsCreating(false);
    }
  };

  const handleTriageComplete = () => {
    toast({
      title: "Triage Completed",
      description: "Client setup is now complete.",
    });
    
    // Navigate to the new client's detail page
    if (newClientId) {
      navigate(`/portal/clients/${newClientId}`);
    } else {
      navigate('/portal/dashboard');
    }
  };

  if (showTriage && newClientId && assistanceRequestId) {
    return (
      <div className="min-h-screen bg-background">
        <header className="border-b border-border bg-background/95 backdrop-blur">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex h-16 items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-foreground">Complete Triage Assessment</h1>
                <p className="text-sm text-muted-foreground">Tier 2 triage for new client</p>
              </div>
            </div>
          </div>
        </header>
        
        <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <TriageForm 
            assistanceRequestId={assistanceRequestId}
            onComplete={handleTriageComplete}
            onCancel={() => navigate('/portal/dashboard')}
          />
        </main>
      </div>
    );
  }

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
                <h1 className="text-2xl font-bold text-foreground">Add New Client</h1>
                <p className="text-sm text-muted-foreground">Create client record and complete triage</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Client Form */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Client Information
                </CardTitle>
                <CardDescription>
                  {interactionId ? "Pre-filled from interaction" : "Enter client details"}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="firstName">First Name *</Label>
                    <Input
                      id="firstName"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder="Enter first name"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="lastName">Last Name *</Label>
                    <Input
                      id="lastName"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      placeholder="Enter last name"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter email address"
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="Enter phone number"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="address">Address</Label>
                  <Input
                    id="address"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Enter street address"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="city">City</Label>
                    <Input
                      id="city"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="Enter city"
                    />
                  </div>
                  <div>
                    <Label htmlFor="state">State</Label>
                    <Input
                      id="state"
                      value={state}
                      onChange={(e) => setState(e.target.value)}
                      placeholder="GA"
                    />
                  </div>
                  <div>
                    <Label htmlFor="zipCode">Zip Code</Label>
                    <Input
                      id="zipCode"
                      value={zipCode}
                      onChange={(e) => setZipCode(e.target.value)}
                      placeholder="Enter zip code"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="county">County</Label>
                  <Input
                    id="county"
                    value={county}
                    onChange={(e) => setCounty(e.target.value)}
                    placeholder="Enter county"
                  />
                </div>

                {summary && (
                  <div>
                    <Label>Interaction Summary</Label>
                    <Textarea
                      value={helpNeeded || summary}
                      readOnly
                      className="bg-muted"
                      rows={3}
                    />
                  </div>
                )}

                <div className="flex gap-2 pt-4">
                  <Button
                    onClick={createNewClient}
                    disabled={isCreating || !firstName || !lastName}
                    className="flex-1"
                  >
                    {isCreating ? "Creating..." : "Create New Client & Start Triage"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Potential Matches Sidebar */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-amber-500" />
                  Potential Matches
                  {isSearching && (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary ml-2"></div>
                  )}
                </CardTitle>
                <CardDescription>
                  Checking for existing clients...
                </CardDescription>
              </CardHeader>
              <CardContent>
                {potentialMatches.length === 0 ? (
                  <div className="text-center py-6">
                    <CheckCircle className="h-8 w-8 text-green-500 mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">
                      No duplicate clients found. Safe to create new record.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <p className="text-sm text-amber-600 mb-4">
                      ⚠️ Found {potentialMatches.length} potential match(es). Review before creating new client.
                    </p>
                    
                    <div className="space-y-3 max-h-60 overflow-y-auto">
                      {potentialMatches.map((match) => (
                        <div
                          key={match.id}
                          className={`border rounded-lg p-3 cursor-pointer transition-colors ${
                            selectedMatch?.id === match.id 
                              ? 'border-primary bg-primary/5' 
                              : 'border-border hover:bg-accent/30'
                          }`}
                          onClick={() => setSelectedMatch(match)}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <p className="font-medium text-sm">
                              {match.first_name} {match.last_name}
                            </p>
                            <Badge variant="outline" className="text-xs">
                              {match.matchScore}% match
                            </Badge>
                          </div>
                          <div className="text-xs text-muted-foreground space-y-1">
                            {match.email && <p><Mail className="h-3 w-3 inline mr-1" />{match.email}</p>}
                            {match.phone && <p><Phone className="h-3 w-3 inline mr-1" />{match.phone}</p>}
                            {match.address && (
                              <p><MapPin className="h-3 w-3 inline mr-1" />
                                {match.address}, {match.city}, {match.state}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>

                    {selectedMatch && (
                      <div className="pt-3 border-t">
                        <Button
                          onClick={linkToExistingClient}
                          disabled={isCreating}
                          variant="outline"
                          size="sm"
                          className="w-full"
                        >
                          {isCreating ? "Linking..." : "Link to Selected Client"}
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default NewClient;