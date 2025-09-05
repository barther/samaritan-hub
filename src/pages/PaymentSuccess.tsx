import { useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { CheckCircle, Heart } from "lucide-react";
import Header from "@/components/Header";

const PaymentSuccess = () => {
  useEffect(() => {
    // TODO: Verify payment status when Supabase is connected
    // This would check the payment session and update the fund ledger
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="max-w-2xl mx-auto text-center">
          <div className="inline-flex items-center justify-center p-4 bg-success/10 rounded-full mb-6">
            <CheckCircle className="h-12 w-12 text-success" />
          </div>
          
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            Thank You!
          </h1>
          
          <p className="text-xl text-muted-foreground mb-8">
            Your generous donation has been processed successfully. 
            You're making a real difference in our community.
          </p>

          <Card className="shadow-card mb-8">
            <CardHeader>
              <CardTitle className="flex items-center justify-center gap-2">
                <Heart className="h-5 w-5 text-success" />
                Your Impact
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                Your donation will help us provide essential assistance to neighbors in need, 
                including help with rent, utilities, food, and transportation.
              </p>
              
              <div className="bg-muted/50 rounded-lg p-4 border border-border">
                <h4 className="font-medium text-foreground mb-2">What happens next?</h4>
                <ul className="text-sm text-muted-foreground space-y-1 text-left">
                  <li>• You'll receive an email receipt shortly</li>
                  <li>• Your donation is tax-deductible</li>
                  <li>• Funds will be used for direct community assistance</li>
                  <li>• Our team will allocate resources to those most in need</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild variant="default" size="lg">
              <Link to="/">
                Return to Home
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link to="/give">
                Make Another Donation
              </Link>
            </Button>
          </div>

          <div className="mt-8 text-center">
            <p className="text-sm text-muted-foreground">
              Questions about your donation? Contact us at{" "}
              <a 
                href="mailto:office@lithiaspringsmethodist.org" 
                className="text-primary hover:text-primary-hover transition-colors"
              >
                office@lithiaspringsmethodist.org
              </a>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default PaymentSuccess;