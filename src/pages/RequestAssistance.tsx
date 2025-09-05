import React, { useState } from "react";
import Header from "@/components/Header";
import ResourcesSidebar from "@/components/ResourcesSidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { HandHeart, AlertTriangle, User, Home, FileText } from "lucide-react";
import { Label } from "@/components/ui/label";

interface FormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  county: string;
  helpNeeded: string;
  disclaimerAccepted: boolean;
}

const RequestAssistance = () => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    state: "GA",
    zipCode: "",
    county: "",
    helpNeeded: "",
    disclaimerAccepted: false,
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

  const handlePhoneChange = (value: string) => {
    const formatted = formatPhoneNumber(value);
    setFormData(prev => ({ ...prev, phone: formatted }));
  };

  const handleZipChange = (value: string) => {
    const formatted = formatZipCode(value);
    setFormData(prev => ({ ...prev, zipCode: formatted }));
  };

  const validateForm = () => {
    const required = [
      'firstName', 'lastName', 'phone', 'email', 'address', 
      'city', 'state', 'zipCode', 'helpNeeded'
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

    if (!formData.disclaimerAccepted) {
      toast({
        title: "Disclaimer Required",
        description: "You must acknowledge the disclaimer to submit your request.",
        variant: "destructive",
      });
      return false;
    }

    const phoneDigits = formData.phone.replace(/\D/g, '');
    if (phoneDigits.length < 10) {
      toast({
        title: "Invalid Phone Number",
        description: "Please enter a valid 10-digit phone number.",
        variant: "destructive",
      });
      return false;
    }

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
      // Submit to secure public intake table
      // This bypasses the need for complex client/interaction creation
      const { data: insertedRecord, error: intakeError } = await supabase
        .from('public_intake')
        .insert({
          first_name: formData.firstName,
          last_name: formData.lastName,
          email: formData.email.toLowerCase(),
          phone: formData.phone,
          address: formData.address,
          city: formData.city,
          state: formData.state,
          zip_code: formData.zipCode,
          county: formData.county,
          help_needed: formData.helpNeeded,
          source: 'web_form',
          user_agent: navigator.userAgent,
        })
        .select('id')
        .single();

      if (intakeError) throw intakeError;

      // Send email notification to office (don't fail submission if this fails)
      try {
        await supabase.functions.invoke('notify-intake-submission', {
          body: {
            intakeId: insertedRecord.id,
            firstName: formData.firstName,
            lastName: formData.lastName,
            email: formData.email,
            phone: formData.phone,
            helpNeeded: formData.helpNeeded,
            address: formData.address,
            city: formData.city,
            state: formData.state
          }
        });
        console.log('Email notification sent for intake:', insertedRecord.id);
      } catch (emailError) {
        console.warn('Email notification failed (but intake was recorded):', emailError);
      }

      toast({
        title: "Request Submitted Successfully",
        description: "We have received your assistance request. A staff member will review it and contact you soon.",
        variant: "default",
      });

      // Reset form
      setFormData({
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        address: "",
        city: "",
        state: "GA",
        zipCode: "",
        county: "",
        helpNeeded: "",
        disclaimerAccepted: false,
      });

    } catch (error) {
      console.error('Error submitting request:', error);
      toast({
        title: "Submission Error",
        description: "Unable to submit your request. Please try again or call us directly.",
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
          <div className="flex-1 max-w-2xl mx-auto">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center p-3 bg-accent/10 rounded-full mb-4">
                <HandHeart className="h-8 w-8 text-accent" />
              </div>
              <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                Request Assistance
              </h1>
              <p className="text-lg text-muted-foreground">
                We're here to help. Please provide your basic information and we'll get back to you soon.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
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
                      <Label htmlFor="phone">Phone Number *</Label>
                      <Input
                        id="phone"
                        type="tel"
                        placeholder="(555) 123-4567"
                        value={formData.phone}
                        onChange={(e) => handlePhoneChange(e.target.value)}
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
                    <Label htmlFor="address">Street Address *</Label>
                    <Input
                      id="address"
                      value={formData.address}
                      onChange={(e) => handleInputChange('address', e.target.value)}
                      required
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="md:col-span-2">
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
                      <Label htmlFor="zipCode">ZIP Code *</Label>
                      <Input
                        id="zipCode"
                        placeholder="12345"
                        value={formData.zipCode}
                        onChange={(e) => handleZipChange(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="county">County</Label>
                    <Input
                      id="county"
                      value={formData.county}
                      onChange={(e) => handleInputChange('county', e.target.value)}
                      placeholder="e.g., Fulton County"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Help Needed */}
              <Card className="shadow-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-primary" />
                    What help do you need?
                  </CardTitle>
                  <CardDescription>Brief description of your assistance request</CardDescription>
                </CardHeader>
                <CardContent>
                  <div>
                    <Label htmlFor="helpNeeded">Please describe what type of assistance you need *</Label>
                    <Textarea
                      id="helpNeeded"
                      placeholder="e.g., help with rent, utility bills, food assistance, transportation..."
                      value={formData.helpNeeded}
                      onChange={(e) => handleInputChange('helpNeeded', e.target.value)}
                      required
                      rows={4}
                      className="mt-2"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Disclaimer */}
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
                      id="disclaimerAccepted"
                      checked={formData.disclaimerAccepted}
                      onCheckedChange={(checked) => handleInputChange('disclaimerAccepted', checked)}
                      required
                    />
                    <Label htmlFor="disclaimerAccepted" className="text-sm leading-relaxed">
                      <strong>I understand that assistance is not guaranteed and depends on available funds and program guidelines.</strong>
                      <br />
                      I acknowledge that Good Samaritan will review my request and contact me if additional information is needed.
                    </Label>
                  </div>
                </CardContent>
              </Card>

              {/* Submit Button */}
              <div className="flex justify-center pt-4">
                <Button 
                  type="submit" 
                  variant="assistance" 
                  size="lg" 
                  disabled={isSubmitting || !formData.disclaimerAccepted}
                  className="min-w-[200px]"
                >
                  {isSubmitting ? "Submitting..." : "Submit Request"}
                </Button>
              </div>
            </form>
          </div>

          {/* Sidebar */}
          <div className="lg:w-80">
            <ResourcesSidebar />
          </div>
        </div>
      </main>
    </div>
  );
};

export default RequestAssistance;