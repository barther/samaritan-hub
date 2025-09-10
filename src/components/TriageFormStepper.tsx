import { useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { CheckCircle, Circle, ArrowRight, ArrowLeft, Save } from "lucide-react";

interface TriageFormData {
  requested_amount: string;
  help_requested: string;
  circumstances: string;
  marital_status: string;
  spouse_name: string;
  spouse_phone: string;
  spouse_email: string;
  rent_paid_3mo: boolean;
  lease_in_name: boolean;
  utility_in_name: boolean;
  veteran_self: boolean;
  veteran_spouse: boolean;
  unemployed_self: boolean;
  unemployed_spouse: boolean;
  employer_self: string;
  employer_self_contact: string;
  employer_self_phone: string;
  employer_spouse: string;
  employer_spouse_contact: string;
  employer_spouse_phone: string;
  children_names_ages: string;
  govt_aid_unemployment: boolean;
  govt_aid_ss: boolean;
  govt_aid_disability: boolean;
  govt_aid_workers_comp: boolean;
  govt_aid_other: string;
  other_assistance_sources: string;
  consent_given: boolean;
}

interface TriageFormStepperProps {
  assistanceRequestId: string;
  initialData?: Partial<TriageFormData>;
  onComplete: () => void;
  onCancel: () => void;
}

const steps = [
  { title: "Financial Request", description: "Amount and assistance details" },
  { title: "Housing & Utilities", description: "Living situation and utilities" },
  { title: "Family & Employment", description: "Family status and work situation" },
  { title: "Story & Consent", description: "Background story and final consent" }
];

export const TriageFormStepper = ({ 
  assistanceRequestId, 
  initialData, 
  onComplete, 
  onCancel 
}: TriageFormStepperProps) => {
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  const [formData, setFormData] = useState<TriageFormData>({
    requested_amount: initialData?.requested_amount || "",
    help_requested: initialData?.help_requested || "",
    circumstances: initialData?.circumstances || "",
    marital_status: initialData?.marital_status || "",
    spouse_name: initialData?.spouse_name || "",
    spouse_phone: initialData?.spouse_phone || "",
    spouse_email: initialData?.spouse_email || "",
    rent_paid_3mo: initialData?.rent_paid_3mo || false,
    lease_in_name: initialData?.lease_in_name || false,
    utility_in_name: initialData?.utility_in_name || false,
    veteran_self: initialData?.veteran_self || false,
    veteran_spouse: initialData?.veteran_spouse || false,
    unemployed_self: initialData?.unemployed_self || false,
    unemployed_spouse: initialData?.unemployed_spouse || false,
    employer_self: initialData?.employer_self || "",
    employer_self_contact: initialData?.employer_self_contact || "",
    employer_self_phone: initialData?.employer_self_phone || "",
    employer_spouse: initialData?.employer_spouse || "",
    employer_spouse_contact: initialData?.employer_spouse_contact || "",
    employer_spouse_phone: initialData?.employer_spouse_phone || "",
    children_names_ages: initialData?.children_names_ages || "",
    govt_aid_unemployment: initialData?.govt_aid_unemployment || false,
    govt_aid_ss: initialData?.govt_aid_ss || false,
    govt_aid_disability: initialData?.govt_aid_disability || false,
    govt_aid_workers_comp: initialData?.govt_aid_workers_comp || false,
    govt_aid_other: initialData?.govt_aid_other || "",
    other_assistance_sources: initialData?.other_assistance_sources || "",
    consent_given: initialData?.consent_given || false,
  });

  const formatPhoneNumber = (value: string) => {
    const cleaned = value.replace(/\D/g, '');
    const match = cleaned.match(/^(\d{3})(\d{3})(\d{4})$/);
    if (match) {
      return `(${match[1]}) ${match[2]}-${match[3]}`;
    }
    return value;
  };

  const handleInputChange = useCallback((field: keyof TriageFormData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  const handlePhoneChange = useCallback((field: keyof TriageFormData, value: string) => {
    const formatted = formatPhoneNumber(value);
    setFormData(prev => ({ ...prev, [field]: formatted }));
  }, []);

  const saveProgress = async () => {
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('assistance_requests')
        .update({
          ...formData,
          requested_amount: formData.requested_amount ? parseFloat(formData.requested_amount) : null,
        })
        .eq('id', assistanceRequestId);

      if (error) throw error;

      toast({
        title: "Progress Saved",
        description: "Your progress has been saved. You can continue later.",
      });
    } catch (error) {
      console.error('Error saving progress:', error);
      toast({
        title: "Save Error",
        description: "Failed to save progress. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  const validateCurrentStep = () => {
    switch (currentStep) {
      case 0: // Financial Request
        return formData.requested_amount && formData.help_requested;
      case 1: // Housing & Utilities
        return true; // Housing info is optional
      case 2: // Family & Employment
        return true; // Family info is optional
      case 3: // Story & Consent
        return formData.consent_given;
      default:
        return true;
    }
  };

  const handleNext = () => {
    if (validateCurrentStep()) {
      setCurrentStep(prev => Math.min(prev + 1, steps.length - 1));
    } else {
      toast({
        title: "Incomplete Information",
        description: "Please fill in all required fields before continuing.",
        variant: "destructive"
      });
    }
  };

  const handlePrevious = () => {
    setCurrentStep(prev => Math.max(prev - 1, 0));
  };

  const handleSubmit = async () => {
    if (!formData.consent_given) {
      toast({
        title: "Consent Required",
        description: "Consent must be given to complete the triage.",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('assistance_requests')
        .update({
          ...formData,
          requested_amount: formData.requested_amount ? parseFloat(formData.requested_amount) : null,
          triage_completed_at: new Date().toISOString(),
          approved_amount: null, // Ensure this is null so it shows up in pending queue
        })
        .eq('id', assistanceRequestId);

      if (error) throw error;

      toast({
        title: "Triage Completed",
        description: "The assistance request is now ready for review and approval.",
      });
      
      onComplete();
    } catch (error) {
      console.error('Error completing triage:', error);
      toast({
        title: "Submission Error",
        description: "Failed to complete triage. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return (
          <div className="space-y-4">
            <div className="text-sm text-muted-foreground mb-4">
              Capture the financial assistance being requested and the specific help needed.
            </div>
            <div>
              <Label htmlFor="requested_amount">Requested Amount *</Label>
              <Input
                id="requested_amount"
                type="number"
                step="0.01"
                placeholder="0.00"
                value={formData.requested_amount}
                onChange={(e) => handleInputChange('requested_amount', e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="help_requested">What help is being requested? *</Label>
              <Textarea
                id="help_requested"
                placeholder="Describe the specific assistance needed..."
                value={formData.help_requested}
                onChange={(e) => handleInputChange('help_requested', e.target.value)}
                rows={4}
              />
            </div>
            <div>
              <Label htmlFor="circumstances">Current circumstances</Label>
              <Textarea
                id="circumstances"
                placeholder="Describe the client's current situation..."
                value={formData.circumstances}
                onChange={(e) => handleInputChange('circumstances', e.target.value)}
                rows={3}
              />
            </div>
          </div>
        );

      case 1:
        return (
          <div className="space-y-4">
            <div className="text-sm text-muted-foreground mb-4">
              Gather information about the client's housing situation and utility arrangements.
            </div>
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="rent_paid_3mo"
                  checked={formData.rent_paid_3mo}
                  onCheckedChange={(checked) => handleInputChange('rent_paid_3mo', !!checked)}
                />
                <Label htmlFor="rent_paid_3mo">Rent paid within last 3 months</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="lease_in_name"
                  checked={formData.lease_in_name}
                  onCheckedChange={(checked) => handleInputChange('lease_in_name', !!checked)}
                />
                <Label htmlFor="lease_in_name">Lease/mortgage in client's name</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="utility_in_name"
                  checked={formData.utility_in_name}
                  onCheckedChange={(checked) => handleInputChange('utility_in_name', !!checked)}
                />
                <Label htmlFor="utility_in_name">Utilities in client's name</Label>
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-4">
            <div className="text-sm text-muted-foreground mb-4">
              Document family status, employment situation, and government assistance.
            </div>
            
            {/* Marital Status */}
            <div>
              <Label>Marital Status</Label>
              <RadioGroup
                value={formData.marital_status}
                onValueChange={(value) => handleInputChange('marital_status', value)}
                className="mt-2"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="single" id="single" />
                  <Label htmlFor="single">Single</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="married" id="married" />
                  <Label htmlFor="married">Married</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="divorced" id="divorced" />
                  <Label htmlFor="divorced">Divorced</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="widowed" id="widowed" />
                  <Label htmlFor="widowed">Widowed</Label>
                </div>
              </RadioGroup>
            </div>

            {/* Spouse Information */}
            {formData.marital_status === 'married' && (
              <div className="space-y-3 p-4 bg-muted/30 rounded-lg">
                <div>
                  <Label htmlFor="spouse_name">Spouse Name</Label>
                  <Input
                    id="spouse_name"
                    value={formData.spouse_name}
                    onChange={(e) => handleInputChange('spouse_name', e.target.value)}
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="spouse_phone">Spouse Phone</Label>
                    <Input
                      id="spouse_phone"
                      value={formData.spouse_phone}
                      onChange={(e) => handlePhoneChange('spouse_phone', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="spouse_email">Spouse Email</Label>
                    <Input
                      id="spouse_email"
                      type="email"
                      value={formData.spouse_email}
                      onChange={(e) => handleInputChange('spouse_email', e.target.value)}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Veterans Status */}
            <div className="space-y-3">
              <Label>Veterans Status</Label>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="veteran_self"
                  checked={formData.veteran_self}
                  onCheckedChange={(checked) => handleInputChange('veteran_self', !!checked)}
                />
                <Label htmlFor="veteran_self">Client is a veteran</Label>
              </div>
              {formData.marital_status === 'married' && (
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="veteran_spouse"
                    checked={formData.veteran_spouse}
                    onCheckedChange={(checked) => handleInputChange('veteran_spouse', !!checked)}
                  />
                  <Label htmlFor="veteran_spouse">Spouse is a veteran</Label>
                </div>
              )}
            </div>

            {/* Employment */}
            <div className="space-y-3">
              <Label>Employment Status</Label>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="unemployed_self"
                  checked={formData.unemployed_self}
                  onCheckedChange={(checked) => handleInputChange('unemployed_self', !!checked)}
                />
                <Label htmlFor="unemployed_self">Client is unemployed</Label>
              </div>
              {!formData.unemployed_self && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-3 bg-muted/30 rounded">
                  <div>
                    <Label htmlFor="employer_self">Client's Employer</Label>
                    <Input
                      id="employer_self"
                      value={formData.employer_self}
                      onChange={(e) => handleInputChange('employer_self', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="employer_self_phone">Employer Phone</Label>
                    <Input
                      id="employer_self_phone"
                      value={formData.employer_self_phone}
                      onChange={(e) => handlePhoneChange('employer_self_phone', e.target.value)}
                    />
                  </div>
                </div>
              )}
              
              {formData.marital_status === 'married' && (
                <>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="unemployed_spouse"
                      checked={formData.unemployed_spouse}
                      onCheckedChange={(checked) => handleInputChange('unemployed_spouse', !!checked)}
                    />
                    <Label htmlFor="unemployed_spouse">Spouse is unemployed</Label>
                  </div>
                  {!formData.unemployed_spouse && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-3 bg-muted/30 rounded">
                      <div>
                        <Label htmlFor="employer_spouse">Spouse's Employer</Label>
                        <Input
                          id="employer_spouse"
                          value={formData.employer_spouse}
                          onChange={(e) => handleInputChange('employer_spouse', e.target.value)}
                        />
                      </div>
                      <div>
                        <Label htmlFor="employer_spouse_phone">Spouse Employer Phone</Label>
                        <Input
                          id="employer_spouse_phone"
                          value={formData.employer_spouse_phone}
                          onChange={(e) => handlePhoneChange('employer_spouse_phone', e.target.value)}
                        />
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Children */}
            <div>
              <Label htmlFor="children_names_ages">Children (names and ages)</Label>
              <Textarea
                id="children_names_ages"
                placeholder="List children's names and ages..."
                value={formData.children_names_ages}
                onChange={(e) => handleInputChange('children_names_ages', e.target.value)}
                rows={2}
              />
            </div>

            {/* Government Aid */}
            <div className="space-y-3">
              <Label>Government Assistance Currently Received</Label>
              <div className="grid grid-cols-2 gap-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="govt_aid_unemployment"
                    checked={formData.govt_aid_unemployment}
                    onCheckedChange={(checked) => handleInputChange('govt_aid_unemployment', !!checked)}
                  />
                  <Label htmlFor="govt_aid_unemployment">Unemployment</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="govt_aid_ss"
                    checked={formData.govt_aid_ss}
                    onCheckedChange={(checked) => handleInputChange('govt_aid_ss', !!checked)}
                  />
                  <Label htmlFor="govt_aid_ss">Social Security</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="govt_aid_disability"
                    checked={formData.govt_aid_disability}
                    onCheckedChange={(checked) => handleInputChange('govt_aid_disability', !!checked)}
                  />
                  <Label htmlFor="govt_aid_disability">Disability</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="govt_aid_workers_comp"
                    checked={formData.govt_aid_workers_comp}
                    onCheckedChange={(checked) => handleInputChange('govt_aid_workers_comp', !!checked)}
                  />
                  <Label htmlFor="govt_aid_workers_comp">Workers' Comp</Label>
                </div>
              </div>
              <div>
                <Label htmlFor="govt_aid_other">Other government assistance</Label>
                <Input
                  id="govt_aid_other"
                  placeholder="Specify other assistance..."
                  value={formData.govt_aid_other}
                  onChange={(e) => handleInputChange('govt_aid_other', e.target.value)}
                />
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-4">
            <div className="text-sm text-muted-foreground mb-4">
              Document any additional assistance sources and obtain final consent to complete the triage.
            </div>
            <div>
              <Label htmlFor="other_assistance_sources">Other Assistance Sources</Label>
              <Textarea
                id="other_assistance_sources"
                placeholder="List any other organizations or sources of assistance the client has contacted or received help from..."
                value={formData.other_assistance_sources}
                onChange={(e) => handleInputChange('other_assistance_sources', e.target.value)}
                rows={3}
              />
            </div>
            
            <div className="p-4 bg-warning/10 border border-warning rounded-lg">
              <div className="flex items-start space-x-2">
                <Checkbox
                  id="consent_given"
                  checked={formData.consent_given}
                  onCheckedChange={(checked) => handleInputChange('consent_given', !!checked)}
                  className="mt-1"
                />
                <div>
                  <Label htmlFor="consent_given" className="font-medium">Required Consent *</Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    I consent to the collection and processing of this information for the purpose of assistance evaluation. 
                    I understand that this information will be kept confidential and used only for providing appropriate aid.
                  </p>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const progress = ((currentStep + 1) / steps.length) * 100;

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-hidden">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle>Staff Triage Form</CardTitle>
            <Button variant="ghost" size="sm" onClick={onCancel}>✕</Button>
          </div>
          
          {/* Progress Indicator */}
          <div className="space-y-3">
            <Progress value={progress} className="w-full" />
            <div className="flex justify-between items-center">
              {steps.map((step, index) => (
                <div key={index} className="flex items-center space-x-2">
                  {index < currentStep ? (
                    <CheckCircle className="h-5 w-5 text-success" />
                  ) : index === currentStep ? (
                    <Circle className="h-5 w-5 text-primary fill-primary" />
                  ) : (
                    <Circle className="h-5 w-5 text-muted-foreground" />
                  )}
                  <div className="text-sm">
                    <div className={index <= currentStep ? "font-medium" : "text-muted-foreground"}>
                      {step.title}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardHeader>

        <CardContent className="overflow-y-auto max-h-[60vh]">
          <div className="mb-4">
            <h3 className="text-lg font-semibold">{steps[currentStep].title}</h3>
            <p className="text-sm text-muted-foreground">{steps[currentStep].description}</p>
          </div>
          {renderStep()}
        </CardContent>

        <div className="flex items-center justify-between p-6 border-t">
          <div className="flex space-x-2">
            <Button
              variant="outline"
              onClick={saveProgress}
              disabled={isSaving}
              className="flex items-center space-x-2"
            >
              <Save className="h-4 w-4" />
              <span>{isSaving ? "Saving..." : "Save & Continue Later"}</span>
            </Button>
          </div>
          
          <div className="flex space-x-2">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={currentStep === 0}
              className="flex items-center space-x-2"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Previous</span>
            </Button>
            
            {currentStep < steps.length - 1 ? (
              <Button
                onClick={handleNext}
                disabled={!validateCurrentStep()}
                className="flex items-center space-x-2"
              >
                <span>Next</span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                disabled={!formData.consent_given || isSubmitting}
                className="flex items-center space-x-2"
              >
                <CheckCircle className="h-4 w-4" />
                <span>{isSubmitting ? "Completing..." : "Complete Triage"}</span>
              </Button>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
};