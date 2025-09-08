import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Zap, Plus, AlertCircle, Search, History, User } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface QuickEntryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

interface Client {
  id: string;
  first_name: string;
  last_name: string;
  phone?: string;
  email?: string;
  created_at: string;
}

interface AssistanceHistory {
  id: string;
  disbursement_date: string;
  amount: number;
  assistance_type: string;
  notes?: string;
  recipient_name: string;
}

interface QuickScenario {
  id: string;
  title: string;
  description: string;
  assistanceType: string;
  defaultAmount?: number;
  paymentMethod: string;
  requiresClient: boolean;
}

const quickScenarios: QuickScenario[] = [
  {
    id: "hotel_voucher",
    title: "Hotel Voucher",
    description: "Hotel stay assistance (1-7 nights)",
    assistanceType: "other",
    paymentMethod: "direct_payment",
    requiresClient: true
  },
  {
    id: "kroger_card",
    title: "Kroger Gift Card",
    description: "$20 food assistance card",
    assistanceType: "food",
    defaultAmount: 20,
    paymentMethod: "voucher",
    requiresClient: false
  },
  {
    id: "utility_electric",
    title: "Electric Bill",
    description: "Georgia Power or utility payment",
    assistanceType: "utilities",
    paymentMethod: "direct_payment",
    requiresClient: true
  },
  {
    id: "utility_gas",
    title: "Gas Bill",
    description: "Gas South or natural gas payment",
    assistanceType: "utilities",
    paymentMethod: "direct_payment",
    requiresClient: true
  },
  {
    id: "phone_bill",
    title: "Phone/Internet Bill",
    description: "Monthly phone or internet payment",
    assistanceType: "other",
    paymentMethod: "direct_payment",
    requiresClient: true
  },
  {
    id: "referral_only",
    title: "Referral Only",
    description: "Provided resources, no disbursement",
    assistanceType: "other",
    defaultAmount: 0,
    paymentMethod: "other",
    requiresClient: false
  }
];

export const QuickEntryModal = ({ open, onOpenChange, onSuccess }: QuickEntryModalProps) => {
  const [selectedScenario, setSelectedScenario] = useState<QuickScenario | null>(null);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [clientSearch, setClientSearch] = useState("");
  const [searchResults, setSearchResults] = useState<Client[]>([]);
  const [assistanceHistory, setAssistanceHistory] = useState<AssistanceHistory[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    amount: "",
    recipientName: "",
    notes: "",
    referralAgencies: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  // Search for clients
  useEffect(() => {
    const searchClients = async () => {
      if (clientSearch.length < 2) {
        setSearchResults([]);
        return;
      }

      setIsSearching(true);
      try {
        const { data, error } = await supabase
          .from('clients')
          .select('id, first_name, last_name, phone, email, created_at')
          .or(`first_name.ilike.%${clientSearch}%,last_name.ilike.%${clientSearch}%`)
          .order('last_name', { ascending: true })
          .limit(10);

        if (error) throw error;
        setSearchResults(data || []);
      } catch (error) {
        console.error('Error searching clients:', error);
      } finally {
        setIsSearching(false);
      }
    };

    const debounceTimer = setTimeout(searchClients, 300);
    return () => clearTimeout(debounceTimer);
  }, [clientSearch]);

  // Load assistance history for selected client
  const loadAssistanceHistory = async (clientId: string) => {
    try {
      const { data, error } = await supabase
        .from('disbursements')
        .select('id, disbursement_date, amount, assistance_type, notes, recipient_name')
        .eq('client_id', clientId)
        .order('disbursement_date', { ascending: false });

      if (error) throw error;
      setAssistanceHistory(data || []);
    } catch (error) {
      console.error('Error loading assistance history:', error);
      setAssistanceHistory([]);
    }
  };

  const handleClientSelect = async (client: Client) => {
    setSelectedClient(client);
    setClientSearch(`${client.first_name} ${client.last_name}`);
    setSearchResults([]);
    setFormData(prev => ({
      ...prev,
      firstName: client.first_name,
      lastName: client.last_name,
      phone: client.phone || "",
      recipientName: `${client.first_name} ${client.last_name}`
    }));
    
    await loadAssistanceHistory(client.id);
    setShowHistory(true);
  };

  const handleNewClient = () => {
    setSelectedClient(null);
    setClientSearch("");
    setSearchResults([]);
    setAssistanceHistory([]);
    setShowHistory(false);
    setFormData({
      firstName: "",
      lastName: "",
      phone: "",
      amount: "",
      recipientName: "",
      notes: "",
      referralAgencies: ""
    });
  };

  const handleScenarioSelect = (scenario: QuickScenario) => {
    setSelectedScenario(scenario);
    setFormData(prev => ({
      ...prev,
      amount: scenario.defaultAmount ? scenario.defaultAmount.toString() : "",
      recipientName: scenario.requiresClient ? `${prev.firstName} ${prev.lastName}`.trim() : ""
    }));
  };

  // Check if client has been helped within the last year
  const hasRecentAssistance = () => {
    if (!assistanceHistory.length) return false;
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
    
    return assistanceHistory.some(assistance => 
      new Date(assistance.disbursement_date) > oneYearAgo && assistance.amount > 0
    );
  };

  const handleBackToScenarios = () => {
    setSelectedScenario(null);
    // Don't clear client data when going back to scenarios
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (!selectedScenario) return;

      let clientId = null;
      
      // Use existing client or create new one if required
      if (selectedScenario.requiresClient) {
        if (!formData.firstName || !formData.lastName) {
          toast({
            title: "Client information required",
            description: "Please provide at least first and last name for this type of assistance.",
            variant: "destructive"
          });
          setIsSubmitting(false);
          return;
        }

        if (selectedClient) {
          // Use existing client
          clientId = selectedClient.id;
        } else {
          // Create new client record
          const { data: clientData, error: clientError } = await supabase
            .from('clients')
            .insert([{
              first_name: formData.firstName,
              last_name: formData.lastName,
              phone: formData.phone || null
            }])
            .select('id')
            .single();

          if (clientError) {
            console.error('Error creating client:', clientError);
            toast({
              title: "Error creating client",
              description: "Please try again.",
              variant: "destructive"
            });
            setIsSubmitting(false);
            return;
          }

          clientId = clientData.id;
        }
      }

      // Create interaction record
      const { data: interactionData, error: interactionError } = await supabase
        .from('interactions')
        .insert([{
          client_id: clientId,
          contact_name: selectedScenario.requiresClient 
            ? `${formData.firstName} ${formData.lastName}`
            : "Quick Entry",
          channel: 'phone',
          summary: selectedScenario.title + (formData.amount && parseFloat(formData.amount) > 0 ? ` - $${formData.amount}` : " - No disbursement"),
          details: formData.notes || null,
          assistance_type: selectedScenario.assistanceType as any,
          requested_amount: formData.amount ? parseFloat(formData.amount) : null,
          occurred_at: new Date().toISOString()
        }])
        .select('id')
        .single();

      if (interactionError) {
        console.error('Error creating interaction:', interactionError);
        toast({
          title: "Error recording interaction",
          description: "Please try again.",
          variant: "destructive"
        });
        setIsSubmitting(false);
        return;
      }

      // Create disbursement if amount > 0
      if (formData.amount && parseFloat(formData.amount) > 0) {
        const { error: disbursementError } = await supabase
          .from('disbursements')
          .insert([{
            amount: parseFloat(formData.amount),
            assistance_type: selectedScenario.assistanceType as any,
            recipient_name: formData.recipientName || `${formData.firstName} ${formData.lastName}`,
            client_id: clientId,
            interaction_id: interactionData.id,
            disbursement_date: new Date().toISOString().split('T')[0],
            payment_method: selectedScenario.paymentMethod,
            notes: formData.notes || null
          }]);

        if (disbursementError) {
          console.error('Error creating disbursement:', disbursementError);
          // Don't fail completely, just warn
          toast({
            title: "Interaction recorded",
            description: "Interaction saved but disbursement recording failed. You may need to add it manually.",
            variant: "default"
          });
        } else {
          toast({
            title: "Entry completed successfully",
            description: `${selectedScenario.title} recorded: $${formData.amount} to ${formData.recipientName || `${formData.firstName} ${formData.lastName}`}`
          });
        }
      } else {
        toast({
          title: "Entry completed successfully",
          description: `${selectedScenario.title} recorded - no disbursement`
        });
      }

      // Reset only scenario, keep client info
      setSelectedScenario(null);
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      console.error('Error in quick entry:', error);
      toast({
        title: "Error processing entry",
        description: "Please try again or use the full form.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" />
            Quick Entry
            {selectedScenario && (
              <>
                <span className="text-muted-foreground">•</span>
                <Badge variant="outline">{selectedScenario.title}</Badge>
              </>
            )}
          </DialogTitle>
        </DialogHeader>
        
        {!selectedScenario ? (
          <div className="space-y-6">
            {/* Client Search Section */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Find Existing Client
                </Label>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleNewClient}
                  className="text-xs"
                >
                  + New Client
                </Button>
              </div>
              
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by first or last name..."
                  value={clientSearch}
                  onChange={(e) => setClientSearch(e.target.value)}
                  className="pl-10"
                />
                {isSearching && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                  </div>
                )}
              </div>

              {/* Search Results */}
              {searchResults.length > 0 && (
                <div className="border rounded-lg max-h-32 overflow-y-auto">
                  {searchResults.map((client) => (
                    <button
                      key={client.id}
                      onClick={() => handleClientSelect(client)}
                      className="w-full text-left px-3 py-2 hover:bg-muted border-b last:border-b-0 text-sm"
                    >
                      <div className="font-medium">{client.first_name} {client.last_name}</div>
                      {client.phone && (
                        <div className="text-xs text-muted-foreground">{client.phone}</div>
                      )}
                    </button>
                  ))}
                </div>
              )}

              {/* Selected Client Info */}
              {selectedClient && (
                <div className="bg-muted/30 rounded-lg p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{selectedClient.first_name} {selectedClient.last_name}</p>
                      {selectedClient.phone && (
                        <p className="text-sm text-muted-foreground">{selectedClient.phone}</p>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowHistory(!showHistory)}
                      className="text-xs"
                    >
                      <History className="h-3 w-3 mr-1" />
                      {showHistory ? 'Hide' : 'Show'} History
                    </Button>
                  </div>

                  {/* One Year Policy Warning */}
                  {hasRecentAssistance() && (
                    <Alert className="border-warning bg-warning/10">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription className="text-sm">
                        <strong>Policy Notice:</strong> This client received assistance within the last 12 months. 
                        Please verify approval for additional assistance.
                      </AlertDescription>
                    </Alert>
                  )}

                  {/* Assistance History */}
                  {showHistory && assistanceHistory.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-xs font-medium text-muted-foreground">Recent Assistance:</p>
                      <div className="space-y-1 max-h-24 overflow-y-auto">
                        {assistanceHistory.slice(0, 5).map((assistance) => (
                          <div key={assistance.id} className="text-xs bg-background rounded p-2">
                            <div className="flex justify-between">
                              <span>${assistance.amount.toFixed(2)}</span>
                              <span className="text-muted-foreground">
                                {new Date(assistance.disbursement_date).toLocaleDateString()}
                              </span>
                            </div>
                            <div className="text-muted-foreground capitalize">
                              {assistance.assistance_type.replace('_', ' ')}
                              {assistance.notes && ` - ${assistance.notes.substring(0, 30)}...`}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
            
            <div className="border-t pt-4">
              <p className="text-sm text-muted-foreground mb-4">
                Choose a common assistance scenario for faster entry:
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {quickScenarios.map((scenario) => (
                <Card 
                  key={scenario.id}
                  className="cursor-pointer hover:shadow-md transition-shadow border-2 hover:border-primary/50"
                  onClick={() => handleScenarioSelect(scenario)}
                >
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      {scenario.title}
                      {scenario.defaultAmount && scenario.defaultAmount > 0 && (
                        <Badge variant="secondary" className="text-xs">
                          ${scenario.defaultAmount}
                        </Badge>
                      )}
                    </CardTitle>
                    <CardDescription className="text-xs">
                      {scenario.description}
                    </CardDescription>
                  </CardHeader>
                </Card>
              ))}
            </div>

            <div className="flex items-center gap-2 p-3 bg-muted/30 rounded-lg">
              <AlertCircle className="h-4 w-4 text-muted-foreground" />
              <p className="text-xs text-muted-foreground">
                For complex cases requiring triage (rental assistance over $200, detailed assessments), use the full "New Interaction" form.
              </p>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {selectedScenario.requiresClient && (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="firstName">First Name *</Label>
                    <Input
                      id="firstName"
                      placeholder="First name"
                      value={formData.firstName}
                      onChange={(e) => {
                        const newFirstName = e.target.value;
                        setFormData(prev => ({ 
                          ...prev, 
                          firstName: newFirstName,
                          recipientName: `${newFirstName} ${prev.lastName}`.trim()
                        }));
                      }}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="lastName">Last Name *</Label>
                    <Input
                      id="lastName"
                      placeholder="Last name"
                      value={formData.lastName}
                      onChange={(e) => {
                        const newLastName = e.target.value;
                        setFormData(prev => ({ 
                          ...prev, 
                          lastName: newLastName,
                          recipientName: `${prev.firstName} ${newLastName}`.trim()
                        }));
                      }}
                      required
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="Phone number"
                    value={formData.phone}
                    onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                  />
                </div>
              </>
            )}

            {selectedScenario.id !== "referral_only" && (
              <>
                <div>
                  <Label htmlFor="amount">Amount *</Label>
                  <Input
                    id="amount"
                    type="text"
                    inputMode="decimal"
                    pattern="[0-9]*\.?[0-9]*"
                    placeholder="0.00"
                    value={formData.amount}
                    onChange={(e) => {
                      const value = e.target.value.replace(/[^0-9.]/g, '');
                      const parts = value.split('.');
                      if (parts.length > 2) return;
                      if (parts[1] && parts[1].length > 2) return;
                      setFormData(prev => ({ ...prev, amount: value }));
                    }}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="recipientName">Recipient Name</Label>
                  <Input
                    id="recipientName"
                    placeholder="Who receives the payment/assistance"
                    value={formData.recipientName}
                    onChange={(e) => setFormData(prev => ({ ...prev, recipientName: e.target.value }))}
                  />
                </div>
              </>
            )}

            {selectedScenario.id === "referral_only" && (
              <div>
                <Label htmlFor="referralAgencies">Referred To</Label>
                <Input
                  id="referralAgencies"
                  placeholder="e.g., BCM Georgia, St. Vincent de Paul, DFCS"
                  value={formData.referralAgencies}
                  onChange={(e) => setFormData(prev => ({ ...prev, referralAgencies: e.target.value }))}
                />
              </div>
            )}

            <div>
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                placeholder={`Details about this ${selectedScenario.title.toLowerCase()}${selectedScenario.id === "referral_only" ? " and referrals" : ""}`}
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                rows={3}
              />
            </div>

            <div className="flex justify-between gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleBackToScenarios}
                disabled={isSubmitting}
              >
                Back to Scenarios
              </Button>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Processing..." : "Complete Entry"}
                </Button>
              </div>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
};