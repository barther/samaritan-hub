import { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface AuthGuardProps {
  children: React.ReactNode;
}

const AuthGuard = ({ children }: AuthGuardProps) => {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [hasValidRole, setHasValidRole] = useState(false);
  const location = useLocation();
  const { toast } = useToast();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Check if user is authenticated
        const { data: session } = await supabase.auth.getSession();
        
        if (!session.session?.user) {
          setIsAuthenticated(false);
          setIsLoading(false);
          return;
        }

        setIsAuthenticated(true);

        // Validate email domain
        const email = session.session.user.email?.toLowerCase() || "";
        if (!email.endsWith("@lithiaspringsmethodist.org")) {
          await supabase.auth.signOut();
          toast({
            title: "Organization access only",
            description: "Please sign in with your @lithiaspringsmethodist.org account.",
            variant: "destructive",
          });
          setIsAuthenticated(false);
          setIsLoading(false);
          return;
        }

        // Check user roles using secure RPC function
        try {
          // Check for admin role
          const { data: hasAdminRole, error: adminError } = await supabase
            .rpc('has_role', { _user_id: session.session.user.id, _role: 'admin' });
          
          // Check for staff role
          const { data: hasStaffRole, error: staffError } = await supabase
            .rpc('has_role', { _user_id: session.session.user.id, _role: 'staff' });

          if (adminError && staffError) {
            console.error('Error checking user roles:', adminError, staffError);
            toast({
              title: "Error loading permissions", 
              description: "Please contact an administrator.",
              variant: "destructive"
            });
            setHasValidRole(false);
            setIsLoading(false);
            return;
          }

          // User must have at least admin or staff role
          if (!hasAdminRole && !hasStaffRole) {
            toast({
              title: "No permissions assigned",
              description: "Please contact an administrator to assign your role.",
              variant: "destructive"
            });
            setHasValidRole(false);
            setIsLoading(false);
            return;
          }

          setHasValidRole(true);
        } catch (roleError) {
          console.error('Failed to load roles:', roleError);
          toast({
            title: "Permission check failed",
            description: "Please contact an administrator to assign your role.",
            variant: "destructive"
          });
          setHasValidRole(false);
        }
      } catch (error) {
        console.error('Error in auth check:', error);
        setIsAuthenticated(false);
        setHasValidRole(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === 'SIGNED_OUT') {
          setIsAuthenticated(false);
          setHasValidRole(false);
        } else if (event === 'SIGNED_IN' && session) {
          // Re-run the full auth check
          checkAuth();
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [toast]);

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Checking permissions...</p>
        </div>
      </div>
    );
  }

  // Redirect to portal login if not authenticated or no valid role
  if (!isAuthenticated || !hasValidRole) {
    return <Navigate to="/portal" state={{ from: location }} replace />;
  }

  // Render protected content
  return <>{children}</>;
};

export default AuthGuard;