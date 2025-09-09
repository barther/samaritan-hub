import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Building2, Search, Plus } from "lucide-react";

interface HotelPaymentModalProps {
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

export const HotelPaymentModal = ({ open, onOpenChange, onSuccess }: HotelPaymentModalProps) => {
  const [formData, setFormData] = useState({
    clientName: "",
    hotelName: "",
    hotelContact: "",
    checkInDate: new Date().toISOString().split('T')[0],
    nights: "1",
    ratePerNight: "",
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
    const nights = parseInt(formData.nights) || 0;
    const rate = parseFloat(formData.ratePerNight) || 0;
    return nights * rate;
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

      if (!formData.hotelName || !formData.ratePerNight) {
        toast({
          title: "Hotel information required",
          description: "Please provide hotel name and rate per night.",
          variant: "destructive"
        });
        setIsSubmitting(false);
        return;
      }

      const total = calculateTotal();
      if (total <= 0) {
        toast({
          title: "Invalid amount",
          description: "Please check the number of nights and rate per night.",
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
      const interactionSummary = `Hotel payment: ${formData.nights} nights at ${formData.hotelName} - $${total.toFixed(2)}`;
      const { data: interactionData, error: interactionError } = await supabase
        .from('interactions')
        .insert([{
          client_id: clientId,
          contact_name: formData.clientName,
          channel: 'phone',
          summary: interactionSummary,
          details: `Hotel: ${formData.hotelName}\nContact: ${formData.hotelContact}\nCheck-in: ${formData.checkInDate}\nNights: ${formData.nights}\nRate: $${formData.ratePerNight}/night\n${formData.notes ? `Notes: ${formData.notes}` : ''}`,
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
          recipient_name: formData.hotelContact || formData.hotelName,
          client_id: clientId,
          interaction_id: interactionData.id,
          disbursement_date: new Date().toISOString().split('T')[0],
          payment_method: 'direct_payment',
          notes: `Hotel payment for ${formData.clientName}: ${formData.nights} nights at ${formData.hotelName}`
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
        title: "Hotel payment recorded successfully",
        description: `$${total.toFixed(2)} payment to ${formData.hotelName} for ${formData.clientName}`
      });

      // Reset form
      setFormData({
        clientName: "",
        hotelName: "",
        hotelContact: "",
        checkInDate: new Date().toISOString().split('T')[0],
        nights: "1",
        ratePerNight: "",
        notes: ""
      });
      setClientSearch("");
      setSelectedClient(null);
      setSearchResults([]);
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      console.error('Error processing hotel payment:', error);
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
            <Building2 className="h-5 w-5 text-primary" />
            Hotel Payment
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

          {/* Hotel Information */}
          <div>
            <Label htmlFor="hotelName">Hotel Name *</Label>
            <Input
              id="hotelName"
              placeholder="e.g., Hampton Inn, Motel 6"
              value={formData.hotelName}
              onChange={(e) => setFormData(prev => ({ ...prev, hotelName: e.target.value }))}
              required
            />
          </div>

          <div>
            <Label htmlFor="hotelContact">Hotel Contact</Label>
            <Input
              id="hotelContact"
              placeholder="Manager name or phone number"
              value={formData.hotelContact}
              onChange={(e) => setFormData(prev => ({ ...prev, hotelContact: e.target.value }))}
            />
          </div>

          {/* Stay Details */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="checkInDate">Check-in Date</Label>
              <Input
                id="checkInDate"
                type="date"
                value={formData.checkInDate}
                onChange={(e) => setFormData(prev => ({ ...prev, checkInDate: e.target.value }))}
                required
              />
            </div>
            
            <div>
              <Label htmlFor="nights">Number of Nights *</Label>
              <Input
                id="nights"
                type="number"
                min="1"
                max="7"
                value={formData.nights}
                onChange={(e) => setFormData(prev => ({ ...prev, nights: e.target.value }))}
                required
              />
            </div>
          </div>

          <div>
            <Label htmlFor="ratePerNight">Rate per Night *</Label>
            <Input
              id="ratePerNight"
              type="number"
              step="0.01"
              placeholder="0.00"
              value={formData.ratePerNight}
              onChange={(e) => setFormData(prev => ({ ...prev, ratePerNight: e.target.value }))}
              required
            />
          </div>

          {/* Total Calculation */}
          {formData.nights && formData.ratePerNight && (
            <div className="bg-muted/30 rounded-lg p-3">
              <div className="text-sm text-muted-foreground">Total Cost:</div>
              <div className="text-lg font-semibold">
                ${calculateTotal().toFixed(2)}
              </div>
              <div className="text-xs text-muted-foreground">
                {formData.nights} nights × ${formData.ratePerNight}/night
              </div>
            </div>
          )}

          <div>
            <Label htmlFor="notes">Additional Notes</Label>
            <Textarea
              id="notes"
              placeholder="Special circumstances, voucher details, etc."
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