import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Shield, Users, AlertTriangle } from "lucide-react";
import Header from "@/components/Header";
import FooterTrust from "@/components/landing/FooterTrust";
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
    const redirectTo = `${window.location.origin}/portal`;
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
    <div className="min-h-screen flex flex-col">
      <Header />
      <section 
        className="relative isolate flex-1 bg-[radial-gradient(ellipse_at_top_left,hsl(var(--emerald-50)),transparent),radial-gradient(ellipse_at_bottom_right,hsl(var(--indigo-50)),transparent)] flex items-center justify-center p-2 sm:p-4"
        role="region"
        aria-labelledby="portal-headline"
      >
        {/* SEO Meta - No Index */}
        <meta name="robots" content="noindex" />
        
        <div className="container mx-auto px-2 sm:px-4 lg:px-6">
          <div className="text-center max-w-sm mx-auto">
            {/* Icon Badge */}
            <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-white shadow ring-1 ring-slate-200">
              <Shield className="h-5 w-5 text-primary" />
            </div>

            {/* Headlines */}
            <h1 
              id="portal-headline"
              className="text-xl font-extrabold tracking-tight text-foreground sm:text-2xl mb-1"
            >
              Staff Portal
            </h1>
            
            <p className="text-xs text-muted-foreground mb-4 sm:mb-5">
              Access restricted to authorized Good Samaritan staff
            </p>

            {/* Authentication Card */}
            <Card className="shadow-card bg-white/80 backdrop-blur-sm">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center justify-center gap-2 text-base sm:text-lg">
                  <Users className="h-4 w-4 text-primary" />
                  Organization Access
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm">
                  Sign in with your organization Microsoft account
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2.5 pt-0">
                <Button onClick={handleMicrosoftLogin} className="w-full" variant="default" size="default">
                  Sign in with Microsoft
                </Button>

                <div className="bg-warning/10 rounded-lg p-2 border border-warning/20">
                  <div className="flex items-center justify-center gap-2">
                    <AlertTriangle className="h-3 w-3 text-rose-700 flex-shrink-0" />
                    <div className="text-center">
                      <p className="text-xs font-medium text-rose-700">Access is Restricted.</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
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
      </section>
      <FooterTrust />
    </div>
  );
};

export default Portal;