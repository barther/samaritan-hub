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
    <div className="min-h-screen bg-white text-slate-900">
      <Header />
      
      {/* Hero Section with Gradient Background */}
      <section className="relative isolate py-16 bg-[radial-gradient(ellipse_at_top_left,hsl(var(--emerald-50)),transparent),radial-gradient(ellipse_at_bottom_right,hsl(var(--indigo-50)),transparent)]">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto">
            <div className="mx-auto mb-6 flex h-12 w-12 items-center justify-center rounded-full bg-white shadow ring-1 ring-slate-200">
              <Heart className="h-6 w-6 text-emerald-600" />
            </div>
            <h1 className="text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl mb-4">
              Make a Donation
            </h1>
            <p className="text-lg text-slate-600 leading-relaxed">
              Your generosity helps us provide essential assistance to neighbors in need. 
              Every donation makes a difference in our community.
            </p>
          </div>
        </div>
      </section>
      
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="max-w-2xl mx-auto">
          <div className="rounded-2xl border border-slate-200 bg-white/70 backdrop-blur p-6 shadow-sm">
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-foreground flex items-center gap-2 mb-2">
                <DollarSign className="h-5 w-5 text-emerald-600" />
                Choose Your Donation Amount
              </h2>
              <p className="text-muted-foreground">
                Select a preset amount or enter a custom donation amount.
              </p>
            </div>
            
            <div className="space-y-6">
              {/* Preset Amounts */}
              <div>
                <Label className="text-sm font-medium mb-3 block">Quick Select</Label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {presetAmounts.map((amount) => (
                    <button
                      key={amount}
                      onClick={() => handleDonation(amount)}
                      disabled={isProcessing}
                      className="h-16 text-lg font-semibold rounded-xl border border-slate-200 bg-white hover:bg-emerald-50 hover:border-emerald-300 hover:text-emerald-700 transition-colors disabled:opacity-50"
                    >
                      ${amount}
                    </button>
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
                      className="pl-10 bg-white border-slate-200"
                    />
                  </div>
                  <button 
                    onClick={handleCustomDonation}
                    disabled={!customAmount || isProcessing}
                    className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-white shadow hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 transition-colors disabled:opacity-50"
                  >
                    Donate
                  </button>
                </div>
              </div>

              {/* Payment Info */}
              <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                <div className="flex items-start gap-3">
                  <CreditCard className="h-5 w-5 text-slate-500 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-foreground mb-1">Secure Payment</h4>
                    <p className="text-sm text-slate-600">
                      All donations are processed securely through Stripe. Your payment information 
                      is encrypted and never stored on our servers.
                    </p>
                  </div>
                </div>
              </div>

              {/* Tax Deductible Notice */}
              <div className="bg-emerald-50 rounded-lg p-4 border border-emerald-200">
                <h4 className="font-medium text-foreground mb-1">Tax Deductible</h4>
                <p className="text-sm text-slate-600">
                  Good Samaritan at Lithia Springs Methodist Church is a registered 501(c)(3) 
                  organization. Your donation is tax-deductible to the full extent allowed by law.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Give;