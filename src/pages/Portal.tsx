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

  // Removed insecure development bypass for security

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('Auth state change:', event, session?.user?.email);
      const email = session?.user?.email?.toLowerCase() || "";
      if (!session?.user) {
        console.log('No user session');
        return;
      }
      console.log('Checking email domain:', email);
      if (email.endsWith("@lithiaspringsmethodist.org")) {
        console.log('Valid domain, redirecting to dashboard');
        navigate("/portal/dashboard", { replace: true });
      } else {
        console.log('Invalid domain, signing out');
        supabase.auth.signOut();
        toast({
          title: "Organization access only",
          description: "Please sign in with your @lithiaspringsmethodist.org account.",
          variant: "destructive"
        });
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('Initial session check:', session?.user?.email);
      const email = session?.user?.email?.toLowerCase() || "";
      if (!session?.user) {
        console.log('No initial session');
        return;
      }
      console.log('Initial email domain check:', email);
      if (email.endsWith("@lithiaspringsmethodist.org")) {
        console.log('Valid initial domain, redirecting to dashboard');
        navigate("/portal/dashboard", { replace: true });
      } else {
        console.log('Invalid initial domain, signing out');
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
        variant: "destructive"
      });
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      {/* SEO Meta - No Index */}
      <meta name="robots" content="noindex" />
      
      {/* Secure authentication - no bypass available */}
      
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
            <Button onClick={handleMicrosoftLogin} className="w-full" variant="default" size="lg">
              Sign in with Microsoft
            </Button>

            <div className="bg-warning/10 rounded-lg p-3 border border-warning/20">
              <div className="flex items-center justify-center gap-2">
                <AlertTriangle className="h-4 w-4 text-rose-700 flex-shrink-0" />
                <div className="text-center">
                  <p className="text-sm font-medium text-rose-700">Access is Restricted.</p>
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