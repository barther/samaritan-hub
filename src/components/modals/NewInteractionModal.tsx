import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Plus } from "lucide-react";

interface NewInteractionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const NewInteractionModal = ({ open, onOpenChange }: NewInteractionModalProps) => {
  const [formData, setFormData] = useState({
    contactName: "",
    channel: "",
    summary: "",
    details: "",
    assistanceType: "",
    requestedAmount: "",
    occurredAt: new Date().toISOString().slice(0, 16)
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const channels = [
    { value: "public_form", label: "Public Form" },
    { value: "phone", label: "Phone" },
    { value: "email", label: "Email" },
    { value: "in_person", label: "In Person" },
    { value: "text", label: "Text Message" }
  ];

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
        .from('interactions')
        .insert([{
          contact_name: formData.contactName,
          channel: formData.channel as 'public_form' | 'phone' | 'email' | 'in_person' | 'text',
          summary: formData.summary,
          details: formData.details || null,
          assistance_type: formData.assistanceType ? formData.assistanceType as 'rent' | 'utilities' | 'food' | 'medical' | 'transportation' | 'other' : null,
          requested_amount: formData.requestedAmount ? parseFloat(formData.requestedAmount) : null,
          occurred_at: formData.occurredAt
        }]);

      if (error) throw error;

      toast({
        title: "Interaction recorded successfully",
        description: `New interaction with ${formData.contactName} has been recorded.`
      });

      setFormData({
        contactName: "",
        channel: "",
        summary: "",
        details: "",
        assistanceType: "",
        requestedAmount: "",
        occurredAt: new Date().toISOString().slice(0, 16)
      });
      onOpenChange(false);
    } catch (error) {
      console.error('Error recording interaction:', error);
      toast({
        title: "Error recording interaction",
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
            <Plus className="h-5 w-5 text-primary" />
            New Interaction
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="contactName">Contact Name *</Label>
            <Input
              id="contactName"
              placeholder="Full name or identifier"
              value={formData.contactName}
              onChange={(e) => setFormData(prev => ({ ...prev, contactName: e.target.value }))}
              required
            />
          </div>

          <div>
            <Label htmlFor="channel">Channel *</Label>
            <Select value={formData.channel} onValueChange={(value) => setFormData(prev => ({ ...prev, channel: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="How did they contact us?" />
              </SelectTrigger>
              <SelectContent>
                {channels.map((channel) => (
                  <SelectItem key={channel.value} value={channel.value}>
                    {channel.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="summary">Summary *</Label>
            <Input
              id="summary"
              placeholder="Brief description of the interaction"
              value={formData.summary}
              onChange={(e) => setFormData(prev => ({ ...prev, summary: e.target.value }))}
              required
            />
          </div>

          <div>
            <Label htmlFor="details">Details</Label>
            <Textarea
              id="details"
              placeholder="Additional details about the interaction"
              value={formData.details}
              onChange={(e) => setFormData(prev => ({ ...prev, details: e.target.value }))}
            />
          </div>

          <div>
            <Label htmlFor="assistanceType">Assistance Type</Label>
            <Select value={formData.assistanceType} onValueChange={(value) => setFormData(prev => ({ ...prev, assistanceType: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="Select type if assistance request" />
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
            <Label htmlFor="requestedAmount">Requested Amount</Label>
            <Input
              id="requestedAmount"
              type="number"
              step="0.01"
              min="0"
              placeholder="0.00"
              value={formData.requestedAmount}
              onChange={(e) => setFormData(prev => ({ ...prev, requestedAmount: e.target.value }))}
            />
          </div>

          <div>
            <Label htmlFor="occurredAt">Occurred At</Label>
            <Input
              id="occurredAt"
              type="datetime-local"
              value={formData.occurredAt}
              onChange={(e) => setFormData(prev => ({ ...prev, occurredAt: e.target.value }))}
              required
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
              {isSubmitting ? "Recording..." : "Record Interaction"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};