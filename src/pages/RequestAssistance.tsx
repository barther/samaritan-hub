import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { HandHeart, AlertTriangle, User, Home, Briefcase, Baby, FileText } from "lucide-react";
import Header from "@/components/Header";
import ResourcesSidebar from "@/components/ResourcesSidebar";
import { useToast } from "@/hooks/use-toast";

interface FormData {
  // Contact Information
  firstName: string;
  lastName: string;
  primaryPhone: string;
  email: string;
  dateOfBirth: string;
  
  // Address
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  zip: string;
  
  // Residence & Living Situation
  county: string;
  residenceDuration: string;
  paidLast3Months: boolean | null;
  leaseInName: boolean | null;
  utilityInName: boolean | null;
  
  // Household Information
  maritalStatus: string;
  agesText: string;
  veteranSelf: boolean;
  veteranSpouse: boolean;
  homeChurch: string;
  
  // Employment
  employerSelf: string;
  employerSelfPhone: string;
  employerSelfContact: string;
  employerSpouse: string;
  employerSpousePhone: string;
  employerSpouseContact: string;
  unemployedSelf: boolean;
  unemployedSpouse: boolean;
  
  // Children
  childrenNamesAges: string;
  
  // Assistance Request
  helpRequested: string;
  circumstances: string;
  otherAssistanceSources: string;
  
  // Government Aid
  govtAidUnemployment: boolean;
  govtAidSS: boolean;
  govtAidWorkersComp: boolean;
  govtAidDisability: boolean;
  govtAidOther: string;
  
  // Required Disclaimer
  disclaimerAck: boolean;
}

const RequestAssistance = () => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    firstName: "",
    lastName: "",
    primaryPhone: "",
    email: "",
    dateOfBirth: "",
    addressLine1: "",
    addressLine2: "",
    city: "",
    state: "",
    zip: "",
    county: "",
    residenceDuration: "",
    paidLast3Months: null,
    leaseInName: null,
    utilityInName: null,
    maritalStatus: "",
    agesText: "",
    veteranSelf: false,
    veteranSpouse: false,
    homeChurch: "",
    employerSelf: "",
    employerSelfPhone: "",
    employerSelfContact: "",
    employerSpouse: "",
    employerSpousePhone: "",
    employerSpouseContact: "",
    unemployedSelf: false,
    unemployedSpouse: false,
    childrenNamesAges: "",
    helpRequested: "",
    circumstances: "",
    otherAssistanceSources: "",
    govtAidUnemployment: false,
    govtAidSS: false,
    govtAidWorkersComp: false,
    govtAidDisability: false,
    govtAidOther: "",
    disclaimerAck: false,
  });

  // Phone number formatting
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

  // ZIP code formatting
  const formatZipCode = (value: string) => {
    const digits = value.replace(/\D/g, '');
    if (digits.length > 5) {
      return `${digits.slice(0, 5)}-${digits.slice(5, 9)}`;
    }
    return digits;
  };

  const handleInputChange = (field: keyof FormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handlePhoneChange = (field: keyof FormData, value: string) => {
    const formatted = formatPhoneNumber(value);
    setFormData(prev => ({ ...prev, [field]: formatted }));
  };

  const handleZipChange = (value: string) => {
    const formatted = formatZipCode(value);
    setFormData(prev => ({ ...prev, zip: formatted }));
  };

  const validateForm = () => {
    const required = [
      'firstName', 'lastName', 'primaryPhone', 'email', 'addressLine1', 
      'city', 'state', 'zip', 'helpRequested', 'circumstances'
    ];
    
    for (const field of required) {
      if (!formData[field as keyof FormData]) {
        toast({
          title: "Missing Required Field",
          description: `Please fill in the ${field.replace(/([A-Z])/g, ' $1').toLowerCase()} field.`,
          variant: "destructive",
        });
        return false;
      }
    }

    if (!formData.disclaimerAck) {
      toast({
        title: "Disclaimer Required",
        description: "You must acknowledge the disclaimer to submit your request.",
        variant: "destructive",
      });
      return false;
    }

    // Validate phone number (at least 10 digits)
    const phoneDigits = formData.primaryPhone.replace(/\D/g, '');
    if (phoneDigits.length < 10) {
      toast({
        title: "Invalid Phone Number",
        description: "Please enter a valid 10-digit phone number.",
        variant: "destructive",
      });
      return false;
    }

    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      toast({
        title: "Invalid Email",
        description: "Please enter a valid email address.",
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
      // TODO: Process form submission when Supabase is connected
      toast({
        title: "Supabase Integration Required",
        description: "Please connect to Supabase to enable form submission.",
        variant: "destructive",
      });
    } catch (error) {
      toast({
        title: "Submission Error",
        description: "Unable to submit your request. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Main Form */}
          <div className="flex-1">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center p-3 bg-accent/10 rounded-full mb-4">
                <HandHeart className="h-8 w-8 text-accent" />
              </div>
              <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                Request Assistance
              </h1>
              <p className="text-lg text-muted-foreground">
                We're here to help. Please provide detailed information so we can better understand your needs.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Contact Information */}
              <Card className="shadow-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5 text-primary" />
                    Contact Information
                  </CardTitle>
                  <CardDescription>Your basic contact details</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="firstName">First Name *</Label>
                      <Input
                        id="firstName"
                        value={formData.firstName}
                        onChange={(e) => handleInputChange('firstName', e.target.value)}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="lastName">Last Name *</Label>
                      <Input
                        id="lastName"
                        value={formData.lastName}
                        onChange={(e) => handleInputChange('lastName', e.target.value)}
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="primaryPhone">Primary Phone *</Label>
                      <Input
                        id="primaryPhone"
                        type="tel"
                        placeholder="(555) 123-4567"
                        value={formData.primaryPhone}
                        onChange={(e) => handlePhoneChange('primaryPhone', e.target.value)}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="email">Email Address *</Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => handleInputChange('email', e.target.value.toLowerCase().trim())}
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="dateOfBirth">Date of Birth</Label>
                    <Input
                      id="dateOfBirth"
                      type="date"
                      value={formData.dateOfBirth}
                      onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Address Information */}
              <Card className="shadow-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Home className="h-5 w-5 text-primary" />
                    Address Information
                  </CardTitle>
                  <CardDescription>Your current residence</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="addressLine1">Address Line 1 *</Label>
                    <Input
                      id="addressLine1"
                      value={formData.addressLine1}
                      onChange={(e) => handleInputChange('addressLine1', e.target.value)}
                      required
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="addressLine2">Address Line 2</Label>
                    <Input
                      id="addressLine2"
                      value={formData.addressLine2}
                      onChange={(e) => handleInputChange('addressLine2', e.target.value)}
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="city">City *</Label>
                      <Input
                        id="city"
                        value={formData.city}
                        onChange={(e) => handleInputChange('city', e.target.value)}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="state">State *</Label>
                      <Input
                        id="state"
                        maxLength={2}
                        placeholder="GA"
                        value={formData.state}
                        onChange={(e) => handleInputChange('state', e.target.value.toUpperCase())}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="zip">ZIP Code *</Label>
                      <Input
                        id="zip"
                        placeholder="12345 or 12345-6789"
                        value={formData.zip}
                        onChange={(e) => handleZipChange(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="county">County</Label>
                      <Input
                        id="county"
                        value={formData.county}
                        onChange={(e) => handleInputChange('county', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="residenceDuration">How long at current address?</Label>
                      <Input
                        id="residenceDuration"
                        placeholder="e.g., 2 years, 6 months"
                        value={formData.residenceDuration}
                        onChange={(e) => handleInputChange('residenceDuration', e.target.value)}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Assistance Request */}
              <Card className="shadow-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-primary" />
                    Assistance Request
                  </CardTitle>
                  <CardDescription>Tell us about your specific needs</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="helpRequested">What type of help are you requesting? *</Label>
                    <Textarea
                      id="helpRequested"
                      placeholder="e.g., rent assistance, utility bills, food, transportation, etc."
                      value={formData.helpRequested}
                      onChange={(e) => handleInputChange('helpRequested', e.target.value)}
                      required
                      rows={3}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="circumstances">Describe your current circumstances *</Label>
                    <Textarea
                      id="circumstances"
                      placeholder="Please explain the situation that has led to your need for assistance..."
                      value={formData.circumstances}
                      onChange={(e) => handleInputChange('circumstances', e.target.value)}
                      required
                      rows={4}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="otherAssistanceSources">Other sources of assistance you've contacted</Label>
                    <Textarea
                      id="otherAssistanceSources"
                      placeholder="Please list any other organizations, agencies, or programs you've applied to for help..."
                      value={formData.otherAssistanceSources}
                      onChange={(e) => handleInputChange('otherAssistanceSources', e.target.value)}
                      rows={3}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Required Disclaimer */}
              <Card className="shadow-card border-destructive/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-destructive">
                    <AlertTriangle className="h-5 w-5" />
                    Important Notice
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-start space-x-3">
                    <Checkbox
                      id="disclaimerAck"
                      checked={formData.disclaimerAck}
                      onCheckedChange={(checked) => handleInputChange('disclaimerAck', checked)}
                      required
                    />
                    <Label htmlFor="disclaimerAck" className="text-sm leading-relaxed">
                      <strong>I understand that assistance is not guaranteed and depends on policy and available funds.</strong>
                      <br />
                      I acknowledge that Good Samaritan will review my request on a case-by-case basis and that 
                      approval is subject to available resources and program guidelines.
                    </Label>
                  </div>
                </CardContent>
              </Card>

              {/* Submit Button */}
              <div className="flex justify-center">
                <Button 
                  type="submit" 
                  variant="assistance" 
                  size="lg" 
                  disabled={isSubmitting || !formData.disclaimerAck}
                  className="min-w-[200px]"
                  data-testid="submit-assistance-request"
                >
                  {isSubmitting ? "Submitting..." : "Submit Request"}
                </Button>
              </div>
            </form>
          </div>

          {/* Resources Sidebar */}
          <ResourcesSidebar />
        </div>
      </main>
    </div>
  );
};

export default RequestAssistance;