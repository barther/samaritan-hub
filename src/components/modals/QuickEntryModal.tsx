import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Zap, Plus, AlertCircle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface QuickEntryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
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
    defaultAmount: 58,
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

  const handleScenarioSelect = (scenario: QuickScenario) => {
    setSelectedScenario(scenario);
    setFormData(prev => ({
      ...prev,
      amount: scenario.defaultAmount ? scenario.defaultAmount.toString() : "",
      recipientName: scenario.requiresClient ? `${prev.firstName} ${prev.lastName}`.trim() : ""
    }));
  };

  const handleBackToScenarios = () => {
    setSelectedScenario(null);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (!selectedScenario) return;

      let clientId = null;
      
      // Create or find client if required
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

        // Create basic client record
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

      handleBackToScenarios();
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
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Choose a common assistance scenario for faster entry:
            </p>
            
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
                      {scenario.defaultAmount && (
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