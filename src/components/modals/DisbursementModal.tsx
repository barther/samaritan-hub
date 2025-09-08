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
import { Minus } from "lucide-react";

interface DisbursementModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  defaultClientId?: string;
  linkedAssistanceRequestId?: string;
  defaultAmount?: number;
}


export const DisbursementModal = ({ open, onOpenChange, onSuccess, defaultClientId, linkedAssistanceRequestId, defaultAmount }: DisbursementModalProps) => {
  const [formData, setFormData] = useState({
    amount: defaultAmount ? String(defaultAmount) : "",
    assistanceType: "",
    recipientName: "",
    clientId: defaultClientId || "",
    disbursementDate: new Date().toISOString().split('T')[0],
    paymentMethod: "direct_payment",
    checkNumber: "",
    notes: ""
  });
  const [clients, setClients] = useState<Array<{id: string, first_name: string, last_name: string}>>([]);
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

  useEffect(() => {
    if (open) {
      loadClients();
    }
  }, [open]);

  const loadClients = async () => {
    try {
      const { data, error } = await supabase
        .from('clients')
        .select('id, first_name, last_name')
        .order('first_name');

      if (error) throw error;
      setClients(data || []);
    } catch (error) {
      console.error('Error loading clients:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Validate client selection for security
      if (!formData.clientId) {
        toast({
          title: "Client required",
          description: "Please select a client for this disbursement.",
          variant: "destructive"
        });
        setIsSubmitting(false);
        return;
      }

      // Check if client has completed triage (required by RLS policy)
      const { data: triageData, error: triageError } = await supabase
        .from('assistance_requests')
        .select('id, triage_completed_at')
        .eq('client_id', formData.clientId)
        .not('triage_completed_at', 'is', null)
        .limit(1);

      if (triageError) {
        console.error('Error checking triage status:', triageError);
        toast({
          title: "Error checking triage status",
          description: "Please try again.",
          variant: "destructive"
        });
        setIsSubmitting(false);
        return;
      }

      if (!triageData || triageData.length === 0) {
        toast({
          title: "Triage required",
          description: "Disbursements are only allowed after triage is completed for this client.",
          variant: "destructive"
        });
        setIsSubmitting(false);
        return;
      }

      const { error } = await supabase
        .from('disbursements')
        .insert([{
          amount: parseFloat(formData.amount),
          assistance_type: formData.assistanceType as 'rent' | 'utilities' | 'food' | 'medical' | 'transportation' | 'other',
          recipient_name: formData.recipientName,
          client_id: formData.clientId,
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
        disbursementDate: new Date().toISOString().split('T')[0],
        paymentMethod: "direct_payment",
        checkNumber: "",
        notes: ""
      });
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

          <div>
            <Label htmlFor="clientId">Client (Optional)</Label>
            <Select value={formData.clientId} onValueChange={(value) => setFormData(prev => ({ ...prev, clientId: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="Select a client (optional)" />
              </SelectTrigger>
              <SelectContent>
                {clients.map((client) => (
                  <SelectItem key={client.id} value={client.id}>
                    {client.first_name} {client.last_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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