import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { 
  Users, 
  Heart, 
  Briefcase, 
  Baby, 
  Shield, 
  CheckCircle,
  Home
} from "lucide-react";

interface TriageFormData {
  // Housing
  rent_paid_3mo: boolean | null;
  lease_in_name: boolean | null;
  utility_in_name: boolean | null;
  
  // Marital/Family
  marital_status: string;
  spouse_name: string;
  spouse_phone: string;
  spouse_email: string;
  
  // Veteran Status
  veteran_self: boolean;
  veteran_spouse: boolean;
  
  // Employment - Self
  employer_self: string;
  employer_self_phone: string;
  employer_self_contact: string;
  unemployed_self: boolean;
  
  // Employment - Spouse
  employer_spouse: string;
  employer_spouse_phone: string;
  employer_spouse_contact: string;
  unemployed_spouse: boolean;
  
  // Children
  children_names_ages: string;
  
  // Other Assistance
  other_assistance_sources: string;
  
  // Government Aid
  govt_aid_unemployment: boolean;
  govt_aid_ss: boolean;
  govt_aid_workers_comp: boolean;
  govt_aid_disability: boolean;
  govt_aid_other: string;
  
  // Extended Details
  circumstances: string;
  
  // Consent
  consent_given: boolean;
}

interface TriageFormProps {
  assistanceRequestId: string;
  initialData?: any;
  onComplete: () => void;
  onCancel: () => void;
}

const TriageForm: React.FC<TriageFormProps> = ({ 
  assistanceRequestId, 
  initialData, 
  onComplete, 
  onCancel 
}) => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<TriageFormData>({
    rent_paid_3mo: null,
    lease_in_name: null,
    utility_in_name: null,
    marital_status: "",
    spouse_name: "",
    spouse_phone: "",
    spouse_email: "",
    veteran_self: false,
    veteran_spouse: false,
    employer_self: "",
    employer_self_phone: "",
    employer_self_contact: "",
    unemployed_self: false,
    employer_spouse: "",
    employer_spouse_phone: "",
    employer_spouse_contact: "",
    unemployed_spouse: false,
    children_names_ages: "",
    other_assistance_sources: "",
    govt_aid_unemployment: false,
    govt_aid_ss: false,
    govt_aid_workers_comp: false,
    govt_aid_disability: false,
    govt_aid_other: "",
    circumstances: initialData?.circumstances || "",
    consent_given: false,
  });

  const formatPhoneNumber = (value: string) => {
    const digits = value.replace(/\D/g, '');
    if (digits.length >= 10) {
      return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
    } else if (digits.length >= 6) {
      return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
    } else if (digits.length >= 3) {
      return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
    }
    return digits;
  };

  const handleInputChange = (field: keyof TriageFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handlePhoneChange = (field: keyof TriageFormData, value: string) => {
    const formatted = formatPhoneNumber(value);
    setFormData(prev => ({ ...prev, [field]: formatted }));
  };

  const validateForm = () => {
    if (!formData.consent_given) {
      toast({
        title: "Consent Required",
        description: "Consent for information validation must be given to complete triage.",
        variant: "destructive",
      });
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setIsSubmitting(true);
    
    try {
      const { error } = await supabase
        .from('assistance_requests')
        .update({
          ...formData,
          triage_completed_at: new Date().toISOString(),
          triaged_by_user_id: 'current_staff_user', // TODO: Replace with actual user ID
        })
        .eq('id', assistanceRequestId);

      if (error) throw error;

      toast({
        title: "Triage Completed",
        description: "The assistance request has been successfully triaged and is ready for review.",
        variant: "default",
      });

      onComplete();
    } catch (error) {
      console.error('Error completing triage:', error);
      toast({
        title: "Triage Error",
        description: "Unable to complete triage. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-4">
          Staff Triage Form
        </h1>
        <p className="text-lg text-muted-foreground">
          Complete detailed information collection for assistance request evaluation
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Housing Information */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Home className="h-5 w-5 text-primary" />
              Housing & Utilities
            </CardTitle>
            <CardDescription>Current living situation details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-base font-medium">Have you paid 3 full months of rent/mortgage?</Label>
              <RadioGroup 
                value={formData.rent_paid_3mo === null ? "" : formData.rent_paid_3mo.toString()}
                onValueChange={(value) => handleInputChange('rent_paid_3mo', value === "true")}
                className="mt-2"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="true" id="rent-yes" />
                  <Label htmlFor="rent-yes">Yes</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="false" id="rent-no" />
                  <Label htmlFor="rent-no">No</Label>
                </div>
              </RadioGroup>
            </div>

            <div>
              <Label className="text-base font-medium">Is the lease/mortgage in your name?</Label>
              <RadioGroup 
                value={formData.lease_in_name === null ? "" : formData.lease_in_name.toString()}
                onValueChange={(value) => handleInputChange('lease_in_name', value === "true")}
                className="mt-2"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="true" id="lease-yes" />
                  <Label htmlFor="lease-yes">Yes</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="false" id="lease-no" />
                  <Label htmlFor="lease-no">No</Label>
                </div>
              </RadioGroup>
            </div>

            <div>
              <Label className="text-base font-medium">Do you have a utility bill in your name?</Label>
              <RadioGroup 
                value={formData.utility_in_name === null ? "" : formData.utility_in_name.toString()}
                onValueChange={(value) => handleInputChange('utility_in_name', value === "true")}
                className="mt-2"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="true" id="utility-yes" />
                  <Label htmlFor="utility-yes">Yes</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="false" id="utility-no" />
                  <Label htmlFor="utility-no">No</Label>
                </div>
              </RadioGroup>
            </div>
          </CardContent>
        </Card>

        {/* Marital Status & Family */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              Marital Status & Family
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="maritalStatus">Marital Status</Label>
              <RadioGroup 
                value={formData.marital_status}
                onValueChange={(value) => handleInputChange('marital_status', value)}
                className="mt-2"
              >
                {['Single', 'Married', 'Divorced', 'Separated', 'Widowed'].map((status) => (
                  <div key={status} className="flex items-center space-x-2">
                    <RadioGroupItem value={status} id={`marital-${status.toLowerCase()}`} />
                    <Label htmlFor={`marital-${status.toLowerCase()}`}>{status}</Label>
                  </div>
                ))}
              </RadioGroup>
            </div>

            {formData.marital_status === 'Married' && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                <div>
                  <Label htmlFor="spouseName">Spouse Name</Label>
                  <Input
                    id="spouseName"
                    value={formData.spouse_name}
                    onChange={(e) => handleInputChange('spouse_name', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="spousePhone">Spouse Phone</Label>
                  <Input
                    id="spousePhone"
                    type="tel"
                    value={formData.spouse_phone}
                    onChange={(e) => handlePhoneChange('spouse_phone', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="spouseEmail">Spouse Email</Label>
                  <Input
                    id="spouseEmail"
                    type="email"
                    value={formData.spouse_email}
                    onChange={(e) => handleInputChange('spouse_email', e.target.value)}
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Veteran Status */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Heart className="h-5 w-5 text-primary" />
              Veteran Status
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-3">
              <Checkbox
                id="veteranSelf"
                checked={formData.veteran_self}
                onCheckedChange={(checked) => handleInputChange('veteran_self', checked)}
              />
              <Label htmlFor="veteranSelf">I am a veteran</Label>
            </div>
            
            {formData.marital_status === 'Married' && (
              <div className="flex items-center space-x-3">
                <Checkbox
                  id="veteranSpouse"
                  checked={formData.veteran_spouse}
                  onCheckedChange={(checked) => handleInputChange('veteran_spouse', checked)}
                />
                <Label htmlFor="veteranSpouse">My spouse is a veteran</Label>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Employment Information */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Briefcase className="h-5 w-5 text-primary" />
              Employment Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Self Employment */}
            <div>
              <h4 className="font-medium mb-3">Your Employment</h4>
              <div className="flex items-center space-x-3 mb-4">
                <Checkbox
                  id="unemployedSelf"
                  checked={formData.unemployed_self}
                  onCheckedChange={(checked) => handleInputChange('unemployed_self', checked)}
                />
                <Label htmlFor="unemployedSelf">Currently unemployed</Label>
              </div>
              
              {!formData.unemployed_self && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="employerSelf">Employer/Company</Label>
                    <Input
                      id="employerSelf"
                      value={formData.employer_self}
                      onChange={(e) => handleInputChange('employer_self', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="employerSelfPhone">Employer Phone</Label>
                    <Input
                      id="employerSelfPhone"
                      type="tel"
                      value={formData.employer_self_phone}
                      onChange={(e) => handlePhoneChange('employer_self_phone', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="employerSelfContact">Contact Person</Label>
                    <Input
                      id="employerSelfContact"
                      value={formData.employer_self_contact}
                      onChange={(e) => handleInputChange('employer_self_contact', e.target.value)}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Spouse Employment */}
            {formData.marital_status === 'Married' && (
              <div>
                <h4 className="font-medium mb-3">Spouse Employment</h4>
                <div className="flex items-center space-x-3 mb-4">
                  <Checkbox
                    id="unemployedSpouse"
                    checked={formData.unemployed_spouse}
                    onCheckedChange={(checked) => handleInputChange('unemployed_spouse', checked)}
                  />
                  <Label htmlFor="unemployedSpouse">Spouse currently unemployed</Label>
                </div>
                
                {!formData.unemployed_spouse && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="employerSpouse">Employer/Company</Label>
                      <Input
                        id="employerSpouse"
                        value={formData.employer_spouse}
                        onChange={(e) => handleInputChange('employer_spouse', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="employerSpousePhone">Employer Phone</Label>
                      <Input
                        id="employerSpousePhone"
                        type="tel"
                        value={formData.employer_spouse_phone}
                        onChange={(e) => handlePhoneChange('employer_spouse_phone', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="employerSpouseContact">Contact Person</Label>
                      <Input
                        id="employerSpouseContact"
                        value={formData.employer_spouse_contact}
                        onChange={(e) => handleInputChange('employer_spouse_contact', e.target.value)}
                      />
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Children */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Baby className="h-5 w-5 text-primary" />
              Children Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div>
              <Label htmlFor="childrenNamesAges">Children's Names & Ages</Label>
              <Textarea
                id="childrenNamesAges"
                placeholder="List children's names and ages, e.g., John (12), Mary (8), etc."
                value={formData.children_names_ages}
                onChange={(e) => handleInputChange('children_names_ages', e.target.value)}
                rows={3}
                className="mt-2"
              />
            </div>
          </CardContent>
        </Card>

        {/* Government Aid */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              Government Assistance
            </CardTitle>
            <CardDescription>Check all that apply</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center space-x-3">
              <Checkbox
                id="govtUnemployment"
                checked={formData.govt_aid_unemployment}
                onCheckedChange={(checked) => handleInputChange('govt_aid_unemployment', checked)}
              />
              <Label htmlFor="govtUnemployment">Unemployment Insurance</Label>
            </div>
            
            <div className="flex items-center space-x-3">
              <Checkbox
                id="govtSS"
                checked={formData.govt_aid_ss}
                onCheckedChange={(checked) => handleInputChange('govt_aid_ss', checked)}
              />
              <Label htmlFor="govtSS">Social Security</Label>
            </div>
            
            <div className="flex items-center space-x-3">
              <Checkbox
                id="govtWorkersComp"
                checked={formData.govt_aid_workers_comp}
                onCheckedChange={(checked) => handleInputChange('govt_aid_workers_comp', checked)}
              />
              <Label htmlFor="govtWorkersComp">Worker's Compensation</Label>
            </div>
            
            <div className="flex items-center space-x-3">
              <Checkbox
                id="govtDisability"
                checked={formData.govt_aid_disability}
                onCheckedChange={(checked) => handleInputChange('govt_aid_disability', checked)}
              />
              <Label htmlFor="govtDisability">Disability</Label>
            </div>
            
            <div>
              <Label htmlFor="govtOther">Other Government Aid</Label>
              <Input
                id="govtOther"
                placeholder="Please specify..."
                value={formData.govt_aid_other}
                onChange={(e) => handleInputChange('govt_aid_other', e.target.value)}
                className="mt-2"
              />
            </div>
          </CardContent>
        </Card>

        {/* Additional Details */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle>Additional Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="circumstances">Detailed circumstances</Label>
              <Textarea
                id="circumstances"
                placeholder="Provide additional details about the circumstances that brought about this need..."
                value={formData.circumstances}
                onChange={(e) => handleInputChange('circumstances', e.target.value)}
                rows={4}
                className="mt-2"
              />
            </div>
            
            <div>
              <Label htmlFor="otherAssistance">Other sources of assistance contacted</Label>
              <Textarea
                id="otherAssistance"
                placeholder="List other organizations, agencies, or programs contacted for help and amount of support received..."
                value={formData.other_assistance_sources}
                onChange={(e) => handleInputChange('other_assistance_sources', e.target.value)}
                rows={3}
                className="mt-2"
              />
            </div>
          </CardContent>
        </Card>

        {/* Consent */}
        <Card className="shadow-card border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-primary">
              <CheckCircle className="h-5 w-5" />
              Consent & Validation
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-start space-x-3">
              <Checkbox
                id="consentGiven"
                checked={formData.consent_given}
                onCheckedChange={(checked) => handleInputChange('consent_given', checked)}
                required
              />
              <Label htmlFor="consentGiven" className="text-sm leading-relaxed">
                <strong>Permission to validate information:</strong>
                <br />
                I give my permission to have the appropriate church personnel validate any of the above information.
              </Label>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex justify-end gap-4 pt-6">
          <Button 
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button 
            type="submit"
            disabled={isSubmitting || !formData.consent_given}
            className="min-w-[160px]"
          >
            {isSubmitting ? "Completing Triage..." : "Complete Triage"}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default TriageForm;
