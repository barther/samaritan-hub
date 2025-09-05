import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Heart, CreditCard, DollarSign } from "lucide-react";
import Header from "@/components/Header";
import { useToast } from "@/hooks/use-toast";

const Give = () => {
  const [customAmount, setCustomAmount] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  const presetAmounts = [25, 50, 100, 250, 500];

  const handleDonation = async (amount: number) => {
    setIsProcessing(true);
    
    try {
      // TODO: Integrate with Stripe when Supabase is connected
      toast({
        title: "Stripe Integration Required",
        description: "Please connect to Supabase to enable payment processing.",
        variant: "destructive",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Unable to process donation. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCustomDonation = () => {
    const amount = parseFloat(customAmount);
    if (amount && amount > 0) {
      handleDonation(amount);
    } else {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid donation amount.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center p-3 bg-success/10 rounded-full mb-4">
              <Heart className="h-8 w-8 text-success" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Make a Donation
            </h1>
            <p className="text-lg text-muted-foreground">
              Your generosity helps us provide essential assistance to neighbors in need. 
              Every donation makes a difference in our community.
            </p>
          </div>

          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-success" />
                Choose Your Donation Amount
              </CardTitle>
              <CardDescription>
                Select a preset amount or enter a custom donation amount.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Preset Amounts */}
              <div>
                <Label className="text-sm font-medium mb-3">Quick Select</Label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {presetAmounts.map((amount) => (
                    <Button
                      key={amount}
                      variant="outline"
                      onClick={() => handleDonation(amount)}
                      disabled={isProcessing}
                      className="h-16 text-lg font-semibold hover:bg-success/10 hover:border-success hover:text-success"
                    >
                      ${amount}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Custom Amount */}
              <div className="space-y-3">
                <Label htmlFor="custom-amount" className="text-sm font-medium">
                  Custom Amount
                </Label>
                <div className="flex gap-3">
                  <div className="relative flex-1">
                    <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="custom-amount"
                      type="number"
                      min="1"
                      step="0.01"
                      placeholder="0.00"
                      value={customAmount}
                      onChange={(e) => setCustomAmount(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <Button 
                    onClick={handleCustomDonation}
                    disabled={!customAmount || isProcessing}
                    variant="donation"
                  >
                    Donate
                  </Button>
                </div>
              </div>

              {/* Payment Info */}
              <div className="bg-muted/50 rounded-lg p-4 border border-border">
                <div className="flex items-start gap-3">
                  <CreditCard className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <h4 className="font-medium text-foreground mb-1">Secure Payment</h4>
                    <p className="text-sm text-muted-foreground">
                      All donations are processed securely through Stripe. Your payment information 
                      is encrypted and never stored on our servers.
                    </p>
                  </div>
                </div>
              </div>

              {/* Tax Deductible Notice */}
              <div className="bg-primary/5 rounded-lg p-4 border border-primary/20">
                <h4 className="font-medium text-foreground mb-1">Tax Deductible</h4>
                <p className="text-sm text-muted-foreground">
                  Good Samaritan at Lithia Springs Methodist Church is a registered 501(c)(3) 
                  organization. Your donation is tax-deductible to the full extent allowed by law.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Give;