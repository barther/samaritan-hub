import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Shield, Users, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const Portal = () => {
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const email = session?.user?.email?.toLowerCase() || "";
      if (!session?.user) return;
      if (email.endsWith("@lithiaspringsmethodist.org")) {
        navigate("/portal/dashboard", { replace: true });
      } else {
        supabase.auth.signOut();
        toast({
          title: "Organization access only",
          description: "Please sign in with your @lithiaspringsmethodist.org account.",
          variant: "destructive",
        });
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      const email = session?.user?.email?.toLowerCase() || "";
      if (!session?.user) return;
      if (email.endsWith("@lithiaspringsmethodist.org")) {
        navigate("/portal/dashboard", { replace: true });
      } else {
        supabase.auth.signOut();
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate, toast]);

  const handleMicrosoftLogin = async () => {
    const redirectTo = `${window.location.origin}/portal/dashboard`;
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "azure",
      options: { redirectTo }
    });
    if (error) {
      toast({
        title: "Sign-in failed",
        description: error.message,
        variant: "destructive",
      });
    }
  };
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      {/* SEO Meta - No Index */}
      <meta name="robots" content="noindex" />
      
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center p-3 bg-primary/10 rounded-full mb-4">
            <Shield className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Staff Portal</h1>
          <p className="text-muted-foreground">
            Access restricted to authorized Good Samaritan staff
          </p>
        </div>

        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              Organization Access
            </CardTitle>
            <CardDescription>
              Sign in with your organization Microsoft account
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button 
              onClick={handleMicrosoftLogin}
              className="w-full"
              variant="default"
              size="lg"
            >
              Sign in with Microsoft
            </Button>

            <div className="bg-warning/10 rounded-lg p-3 border border-warning/20">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-warning mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-warning-foreground">
                    Access Restricted
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Only @lithiaspringsmethodist.org email addresses are permitted.
                  </p>
                </div>
              </div>
            </div>

            <div className="text-center">
              <p className="text-xs text-muted-foreground">
                Need access? Contact your administrator for assistance.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Portal;