import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { DollarSign, Search, Plus } from "lucide-react";

interface DirectPaymentModalProps {
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
}

export const DirectPaymentModal = ({ open, onOpenChange, onSuccess }: DirectPaymentModalProps) => {
  const [formData, setFormData] = useState({
    clientName: "",
    vendorName: "",
    vendorContact: "",
    serviceDate: new Date().toISOString().split('T')[0],
    quantity: "1",
    unitCost: "",
    description: "",
    notes: ""
  });
  const [clientSearch, setClientSearch] = useState("");
  const [searchResults, setSearchResults] = useState<Client[]>([]);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [isSearching, setIsSearching] = useState(false);
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
          .select('id, first_name, last_name, phone, email')
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

  const handleClientSelect = (client: Client) => {
    setSelectedClient(client);
    setClientSearch(`${client.first_name} ${client.last_name}`);
    setFormData(prev => ({
      ...prev,
      clientName: `${client.first_name} ${client.last_name}`
    }));
    setSearchResults([]);
  };

  const handleCreateNewClient = () => {
    if (!clientSearch.trim()) return;

    const [firstName, ...lastNameParts] = clientSearch.trim().split(' ');
    const lastName = lastNameParts.join(' ') || '';

    setFormData(prev => ({
      ...prev,
      clientName: clientSearch.trim()
    }));
    setSelectedClient(null);
    setSearchResults([]);
  };

  const calculateTotal = () => {
    const quantity = parseInt(formData.quantity) || 0;
    const cost = parseFloat(formData.unitCost) || 0;
    return quantity * cost;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (!formData.clientName) {
        toast({
          title: "Client name required",
          description: "Please provide a client name.",
          variant: "destructive"
        });
        setIsSubmitting(false);
        return;
      }

      if (!formData.vendorName || !formData.unitCost) {
        toast({
          title: "Vendor information required",
          description: "Please provide vendor name and cost.",
          variant: "destructive"
        });
        setIsSubmitting(false);
        return;
      }

      const total = calculateTotal();
      if (total <= 0) {
        toast({
          title: "Invalid amount",
          description: "Please check the quantity and unit cost.",
          variant: "destructive"
        });
        setIsSubmitting(false);
        return;
      }

      let clientId = selectedClient?.id;

      // Create new client if needed
      if (!selectedClient) {
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

      // Create interaction record
      const interactionSummary = `Direct payment: ${formData.description || formData.vendorName} - $${total.toFixed(2)}`;
      const { data: interactionData, error: interactionError } = await supabase
        .from('interactions')
        .insert([{
          client_id: clientId,
          contact_name: formData.clientName,
          channel: 'phone',
          summary: interactionSummary,
          details: `Vendor: ${formData.vendorName}\nContact: ${formData.vendorContact}\nService Date: ${formData.serviceDate}\nQuantity: ${formData.quantity}\nUnit Cost: $${formData.unitCost}\nDescription: ${formData.description}\n${formData.notes ? `Notes: ${formData.notes}` : ''}`,
          assistance_type: 'other',
          requested_amount: total,
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

      // Create disbursement record
      const { error: disbursementError } = await supabase
        .from('disbursements')
        .insert([{
          amount: total,
          assistance_type: 'other',
          recipient_name: formData.vendorContact || formData.vendorName,
          client_id: clientId,
          interaction_id: interactionData.id,
          disbursement_date: new Date().toISOString().split('T')[0],
          payment_method: 'direct_payment',
          notes: `Direct payment to ${formData.vendorName} for ${formData.clientName}: ${formData.description || 'Service payment'}`
        }]);

      if (disbursementError) {
        console.error('Error creating disbursement:', disbursementError);
        toast({
          title: "Error recording disbursement",
          description: "Please try again.",
          variant: "destructive"
        });
        setIsSubmitting(false);
        return;
      }

      toast({
        title: "Direct payment recorded successfully",
        description: `$${total.toFixed(2)} payment to ${formData.vendorName} for ${formData.clientName}`
      });

      // Reset form
      setFormData({
        clientName: "",
        vendorName: "",
        vendorContact: "",
        serviceDate: new Date().toISOString().split('T')[0],
        quantity: "1",
        unitCost: "",
        description: "",
        notes: ""
      });
      setClientSearch("");
      setSelectedClient(null);
      setSearchResults([]);
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      console.error('Error processing direct payment:', error);
      toast({
        title: "Error processing payment",
        description: "Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-primary" />
            Direct Payment
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Client Search */}
          <div>
            <Label htmlFor="clientSearch">Client Name *</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="clientSearch"
                placeholder="Search existing client or type new name..."
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
              <div className="border rounded-lg mt-2 max-h-32 overflow-y-auto">
                {searchResults.map((client) => (
                  <button
                    key={client.id}
                    type="button"
                    onClick={() => handleClientSelect(client)}
                    className="w-full text-left px-3 py-2 hover:bg-muted border-b last:border-b-0 text-sm"
                  >
                    <div className="font-medium">{client.first_name} {client.last_name}</div>
                    {client.phone && (
                      <div className="text-xs text-muted-foreground">{client.phone}</div>
                    )}
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
          </div>

          {/* Vendor Information */}
          <div>
            <Label htmlFor="vendorName">Vendor/Provider Name *</Label>
            <Input
              id="vendorName"
              placeholder="e.g., Hotel, Utility Company, Landlord"
              value={formData.vendorName}
              onChange={(e) => setFormData(prev => ({ ...prev, vendorName: e.target.value }))}
              required
            />
          </div>

          <div>
            <Label htmlFor="vendorContact">Vendor Contact</Label>
            <Input
              id="vendorContact"
              placeholder="Contact name or phone number"
              value={formData.vendorContact}
              onChange={(e) => setFormData(prev => ({ ...prev, vendorContact: e.target.value }))}
            />
          </div>

          {/* Service Details */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="serviceDate">Service Date</Label>
              <Input
                id="serviceDate"
                type="date"
                value={formData.serviceDate}
                onChange={(e) => setFormData(prev => ({ ...prev, serviceDate: e.target.value }))}
                required
              />
            </div>
            
            <div>
              <Label htmlFor="quantity">Quantity *</Label>
              <Input
                id="quantity"
                type="number"
                min="1"
                value={formData.quantity}
                onChange={(e) => setFormData(prev => ({ ...prev, quantity: e.target.value }))}
                required
              />
            </div>
          </div>

          <div>
            <Label htmlFor="unitCost">Unit Cost *</Label>
            <Input
              id="unitCost"
              type="number"
              step="0.01"
              placeholder="0.00"
              value={formData.unitCost}
              onChange={(e) => setFormData(prev => ({ ...prev, unitCost: e.target.value }))}
              required
            />
          </div>

          <div>
            <Label htmlFor="description">Description/Service Type</Label>
            <Input
              id="description"
              placeholder="e.g., Hotel stay, Rent payment, Utility bill"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            />
          </div>

          {/* Total Calculation */}
          {formData.quantity && formData.unitCost && (
            <div className="bg-muted/30 rounded-lg p-3">
              <div className="text-sm text-muted-foreground">Total Cost:</div>
              <div className="text-lg font-semibold">
                ${calculateTotal().toFixed(2)}
              </div>
              <div className="text-xs text-muted-foreground">
                {formData.quantity} × ${formData.unitCost} each
              </div>
            </div>
          )}

          <div>
            <Label htmlFor="notes">Additional Notes</Label>
            <Textarea
              id="notes"
              placeholder="Special circumstances, payment details, etc."
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
            <Button type="submit" disabled={isSubmitting || calculateTotal() <= 0}>
              {isSubmitting ? "Processing..." : `Pay $${calculateTotal().toFixed(2)}`}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};