import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useUserRole } from "@/hooks/useUserRole";
import { supabase } from "@/integrations/supabase/client";
import { Minus, Search, Plus } from "lucide-react";

interface DisbursementModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  defaultClientId?: string;
  linkedAssistanceRequestId?: string;
  defaultAmount?: number;
}

interface Client {
  id: string;
  first_name: string;
  last_name: string;
  phone?: string;
  email?: string;
  risk_level?: string;
  assistance_count?: number;
  total_assistance_received?: number;
}


export const DisbursementModal = ({ open, onOpenChange, onSuccess, defaultClientId, linkedAssistanceRequestId, defaultAmount }: DisbursementModalProps) => {
  const [formData, setFormData] = useState({
    amount: defaultAmount ? String(defaultAmount) : "",
    assistanceType: "",
    recipientName: "",
    clientId: defaultClientId || "",
    clientName: "",
    disbursementDate: new Date().toISOString().split('T')[0],
    paymentMethod: "direct_payment",
    checkNumber: "",
    notes: ""
  });
  const [clientSearch, setClientSearch] = useState("");
  const [searchResults, setSearchResults] = useState<Client[]>([]);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const { isAdmin } = useUserRole();

  const assistanceTypes = [
    { value: "rent", label: "Rent Assistance" },
    { value: "utilities", label: "Utilities" },
    { value: "food", label: "Food Assistance" },
    { value: "medical", label: "Medical" },
    { value: "transportation", label: "Transportation" },
    { value: "other", label: "Other" }
  ];

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
          .select('id, first_name, last_name, phone, email, risk_level, assistance_count, total_assistance_received')
          .or(`first_name.ilike.%${clientSearch}%,last_name.ilike.%${clientSearch}%,phone.ilike.%${clientSearch}%`)
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

  const handleClientSelect = (client: Client) => {
    setSelectedClient(client);
    setClientSearch(`${client.first_name} ${client.last_name}`);
    setFormData(prev => ({
      ...prev,
      clientId: client.id,
      clientName: `${client.first_name} ${client.last_name}`,
      recipientName: prev.recipientName || `${client.first_name} ${client.last_name}`
    }));
    setSearchResults([]);
  };

  const handleCreateNewClient = async () => {
    if (!clientSearch.trim()) return;

    const [firstName, ...lastNameParts] = clientSearch.trim().split(' ');
    const lastName = lastNameParts.join(' ') || '';

    try {
      const { data: clientData, error: clientError } = await supabase
        .from('clients')
        .insert([{
          first_name: firstName,
          last_name: lastName
        }])
        .select('id, first_name, last_name')
        .single();

      if (clientError) throw clientError;

      const newClient = {
        ...clientData,
        risk_level: 'low',
        assistance_count: 0,
        total_assistance_received: 0
      };

      handleClientSelect(newClient);
      
      toast({
        title: "New client created",
        description: `${firstName} ${lastName} has been added to the system.`
      });
    } catch (error) {
      console.error('Error creating client:', error);
      toast({
        title: "Error creating client",
        description: "Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (!formData.clientName && !selectedClient) {
        toast({
          title: "Client required",
          description: "Please select or create a client for this disbursement.",
          variant: "destructive"
        });
        setIsSubmitting(false);
        return;
      }

      let clientId = selectedClient?.id;

      // Create new client if needed
      if (!selectedClient && formData.clientName) {
        const [firstName, ...lastNameParts] = formData.clientName.trim().split(' ');
        const lastName = lastNameParts.join(' ') || '';

        const { data: clientData, error: clientError } = await supabase
          .from('clients')
          .insert([{
            first_name: firstName,
            last_name: lastName
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

      // Create interaction record first
      const interactionSummary = `Disbursement: $${formData.amount} for ${formData.assistanceType}`;
      const { data: interactionData, error: interactionError } = await supabase
        .from('interactions')
        .insert([{
          client_id: clientId,
          contact_name: formData.clientName || (selectedClient ? `${selectedClient.first_name} ${selectedClient.last_name}` : formData.recipientName),
          channel: 'phone',
          summary: interactionSummary,
          details: formData.notes || null,
          assistance_type: formData.assistanceType as any,
          requested_amount: parseFloat(formData.amount),
          occurred_at: new Date().toISOString()
        }])
        .select('id')
        .single();

      if (interactionError) {
        console.error('Error creating interaction:', interactionError);
        // Continue with disbursement even if interaction fails
      }

      // Create disbursement record
      const { error } = await supabase
        .from('disbursements')
        .insert([{
          amount: parseFloat(formData.amount),
          assistance_type: formData.assistanceType as 'rent' | 'utilities' | 'food' | 'medical' | 'transportation' | 'other',
          recipient_name: formData.recipientName,
          client_id: clientId,
          interaction_id: interactionData?.id || null,
          disbursement_date: formData.disbursementDate,
          payment_method: formData.paymentMethod,
          check_number: formData.checkNumber || null,
          notes: formData.notes || null
        }]);

      if (error) {
        if (error.code === 'PGRST301') {
          toast({
            title: "Access denied",
            description: "You don't have permission to record disbursements. Contact an administrator.",
            variant: "destructive"
          });
          setIsSubmitting(false);
          return;
        }
        throw error;
      }

      toast({
        title: "Disbursement recorded successfully",
        description: `$${formData.amount} disbursement to ${formData.recipientName} has been recorded.`
      });

      setFormData({
        amount: "",
        assistanceType: "",
        recipientName: "",
        clientId: "",
        clientName: "",
        disbursementDate: new Date().toISOString().split('T')[0],
        paymentMethod: "direct_payment",
        checkNumber: "",
        notes: ""
      });
      setClientSearch("");
      setSelectedClient(null);
      setSearchResults([]);
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      console.error('Error recording disbursement:', error);
      toast({
        title: "Error recording disbursement",
        description: "Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Minus className="h-5 w-5 text-destructive" />
            Record Disbursement
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
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
                  // Only allow numbers and decimal point
                  const value = e.target.value.replace(/[^0-9.]/g, '');
                  // Ensure only one decimal point
                  const parts = value.split('.');
                  if (parts.length > 2) return;
                  // Limit to 2 decimal places
                  if (parts[1] && parts[1].length > 2) return;
                  setFormData(prev => ({ ...prev, amount: value }));
                }}
                required
              />
          </div>

          <div>
            <Label htmlFor="assistanceType">Assistance Type *</Label>
            <Select value={formData.assistanceType} onValueChange={(value) => setFormData(prev => ({ ...prev, assistanceType: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="Select assistance type" />
              </SelectTrigger>
              <SelectContent>
                {assistanceTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="recipientName">Recipient Name *</Label>
            <Input
              id="recipientName"
              placeholder="Full name of recipient"
              value={formData.recipientName}
              onChange={(e) => setFormData(prev => ({ ...prev, recipientName: e.target.value }))}
              required
            />
          </div>

          <div>
            <Label htmlFor="disbursementDate">Disbursement Date</Label>
            <Input
              id="disbursementDate"
              type="date"
              value={formData.disbursementDate}
              onChange={(e) => setFormData(prev => ({ ...prev, disbursementDate: e.target.value }))}
              required
            />
            {isAdmin && (
              <p className="text-xs text-muted-foreground mt-1">
                Admin: You can backdate this disbursement if needed
              </p>
            )}
          </div>

          {/* Client Search */}
          <div>
            <Label htmlFor="clientSearch">Client *</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="clientSearch"
                placeholder="Search by name or phone, or type new client name..."
                value={clientSearch}
                onChange={(e) => setClientSearch(e.target.value)}
                className="pl-10"
                required
              />
              {isSearching && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                </div>
              )}
            </div>

            {/* Search Results */}
            {searchResults.length > 0 && (
              <div className="border rounded-lg mt-2 max-h-40 overflow-y-auto">
                {searchResults.map((client) => (
                  <button
                    key={client.id}
                    type="button"
                    onClick={() => handleClientSelect(client)}
                    className="w-full text-left px-3 py-2 hover:bg-muted border-b last:border-b-0 text-sm"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">{client.first_name} {client.last_name}</div>
                        {client.phone && (
                          <div className="text-xs text-muted-foreground">{client.phone}</div>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {(client.assistance_count || 0) > 0 && (
                          <span className="text-xs text-muted-foreground">
                            {client.assistance_count} prev • ${(client.total_assistance_received || 0).toFixed(0)}
                          </span>
                        )}
                        {client.risk_level && client.risk_level !== 'low' && (
                          <span className={`text-xs px-1 rounded ${
                            client.risk_level === 'high' ? 'bg-destructive/20 text-destructive' : 'bg-warning/20 text-warning-foreground'
                          }`}>
                            {client.risk_level}
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                ))}
                {clientSearch && !selectedClient && (
                  <button
                    type="button"
                    onClick={handleCreateNewClient}
                    className="w-full text-left px-3 py-2 hover:bg-muted text-sm border-t bg-muted/30"
                  >
                    <div className="flex items-center gap-2 font-medium text-primary">
                      <Plus className="h-3 w-3" />
                      Create new client: "{clientSearch}"
                    </div>
                  </button>
                )}
              </div>
            )}

            {/* Selected Client Display */}
            {selectedClient && (
              <div className="mt-2 p-2 bg-muted/30 rounded border flex items-center justify-between">
                <div>
                  <div className="font-medium">{selectedClient.first_name} {selectedClient.last_name}</div>
                  {selectedClient.phone && (
                    <div className="text-xs text-muted-foreground">{selectedClient.phone}</div>
                  )}
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSelectedClient(null);
                    setClientSearch("");
                    setFormData(prev => ({ ...prev, clientId: "", clientName: "", recipientName: "" }));
                  }}
                >
                  Change
                </Button>
              </div>
            )}
          </div>

          <div>
            <Label htmlFor="paymentMethod">Payment Method</Label>
            <Select value={formData.paymentMethod} onValueChange={(value) => setFormData(prev => ({ ...prev, paymentMethod: value }))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="check">Check</SelectItem>
                <SelectItem value="cash">Cash</SelectItem>
                <SelectItem value="direct_payment">Direct Payment</SelectItem>
                <SelectItem value="voucher">Voucher</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {formData.paymentMethod === "check" && (
            <div>
              <Label htmlFor="checkNumber">Check Number</Label>
              <Input
                id="checkNumber"
                placeholder="Check number"
                value={formData.checkNumber}
                onChange={(e) => setFormData(prev => ({ ...prev, checkNumber: e.target.value }))}
              />
            </div>
          )}

          <div>
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              placeholder="Additional notes about this disbursement"
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Recording..." : "Record Disbursement"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};