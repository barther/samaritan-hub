import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Minus } from "lucide-react";

interface DisbursementModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const DisbursementModal = ({ open, onOpenChange }: DisbursementModalProps) => {
  const [formData, setFormData] = useState({
    amount: "",
    assistanceType: "",
    recipientName: "",
    disbursementDate: new Date().toISOString().split('T')[0],
    paymentMethod: "check",
    checkNumber: "",
    notes: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const assistanceTypes = [
    { value: "rent", label: "Rent Assistance" },
    { value: "utilities", label: "Utilities" },
    { value: "food", label: "Food Assistance" },
    { value: "medical", label: "Medical" },
    { value: "transportation", label: "Transportation" },
    { value: "other", label: "Other" }
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const { error } = await supabase
        .from('disbursements')
        .insert([{
          amount: parseFloat(formData.amount),
          assistance_type: formData.assistanceType as 'rent' | 'utilities' | 'food' | 'medical' | 'transportation' | 'other',
          recipient_name: formData.recipientName,
          disbursement_date: formData.disbursementDate,
          payment_method: formData.paymentMethod,
          check_number: formData.checkNumber || null,
          notes: formData.notes || null
        }]);

      if (error) throw error;

      toast({
        title: "Disbursement recorded successfully",
        description: `$${formData.amount} disbursement to ${formData.recipientName} has been recorded.`
      });

      setFormData({
        amount: "",
        assistanceType: "",
        recipientName: "",
        disbursementDate: new Date().toISOString().split('T')[0],
        paymentMethod: "check",
        checkNumber: "",
        notes: ""
      });
      onOpenChange(false);
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
              type="number"
              step="0.01"
              min="0"
              placeholder="0.00"
              value={formData.amount}
              onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
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