import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { DollarSign } from "lucide-react";

interface DonationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const DonationModal = ({ open, onOpenChange }: DonationModalProps) => {
  const [formData, setFormData] = useState({
    amount: "",
    source: "",
    donorName: "",
    donorEmail: "",
    donationDate: new Date().toISOString().split('T')[0],
    notes: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const { error } = await supabase
        .from('donations')
        .insert([{
          amount: parseFloat(formData.amount),
          source: formData.source,
          donor_name: formData.donorName || null,
          donor_email: formData.donorEmail || null,
          donation_date: formData.donationDate,
          notes: formData.notes || null
        }]);

      if (error) throw error;

      toast({
        title: "Donation recorded successfully",
        description: `$${formData.amount} donation from ${formData.source} has been recorded.`
      });

      setFormData({
        amount: "",
        source: "",
        donorName: "",
        donorEmail: "",
        donationDate: new Date().toISOString().split('T')[0],
        notes: ""
      });
      onOpenChange(false);
    } catch (error) {
      console.error('Error recording donation:', error);
      toast({
        title: "Error recording donation",
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
            <DollarSign className="h-5 w-5 text-success" />
            Record Donation
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
            <Label htmlFor="source">Source *</Label>
            <Input
              id="source"
              placeholder="e.g., Individual donor, Church collection, Fundraiser"
              value={formData.source}
              onChange={(e) => setFormData(prev => ({ ...prev, source: e.target.value }))}
              required
            />
          </div>

          <div>
            <Label htmlFor="donorName">Donor Name</Label>
            <Input
              id="donorName"
              placeholder="Optional"
              value={formData.donorName}
              onChange={(e) => setFormData(prev => ({ ...prev, donorName: e.target.value }))}
            />
          </div>

          <div>
            <Label htmlFor="donorEmail">Donor Email</Label>
            <Input
              id="donorEmail"
              type="email"
              placeholder="Optional"
              value={formData.donorEmail}
              onChange={(e) => setFormData(prev => ({ ...prev, donorEmail: e.target.value }))}
            />
          </div>

          <div>
            <Label htmlFor="donationDate">Donation Date</Label>
            <Input
              id="donationDate"
              type="date"
              value={formData.donationDate}
              onChange={(e) => setFormData(prev => ({ ...prev, donationDate: e.target.value }))}
              required
            />
          </div>

          <div>
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              placeholder="Additional notes about this donation"
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
              {isSubmitting ? "Recording..." : "Record Donation"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};