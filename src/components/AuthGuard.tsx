import { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useSessionSecurity } from '@/hooks/useSessionSecurity';
import { checkRateLimit } from '@/utils/inputSanitizer';
import { useSecurityContext } from './SecurityProvider';

interface AuthGuardProps {
  children: React.ReactNode;
}

const AuthGuard = ({ children }: AuthGuardProps) => {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [hasValidRole, setHasValidRole] = useState(false);
  const location = useLocation();
  const { toast } = useToast();
  const { logSecurityEvent } = useSecurityContext();
  
  // Enhanced session security with timeout and idle logout
  useSessionSecurity({
    idleTimeout: 30 * 60 * 1000, // 30 minutes
    sessionTimeout: 8 * 60 * 60 * 1000, // 8 hours
    warningTime: 5 * 60 * 1000 // 5 minutes warning
  });

  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Rate limiting for authentication checks
        const userIp = 'auth-check'; // In production, get actual IP
        if (!checkRateLimit(userIp, 10, 60000)) {
          logSecurityEvent('rate_limit_exceeded', { type: 'auth_check' });
          toast({
            title: "Too Many Requests",
            description: "Please wait before trying again.",
            variant: "destructive"
          });
          setIsAuthenticated(false);
          setIsLoading(false);
          return;
        }

        // Check if user is authenticated
        const { data: session } = await supabase.auth.getSession();
        
        if (!session.session?.user) {
          setIsAuthenticated(false);
          setIsLoading(false);
          return;
        }

        setIsAuthenticated(true);

        // Create or update session tracking
        try {
          const sessionId = session.session.access_token.substring(0, 32);
          await supabase
            .from('user_sessions')
            .upsert({
              user_id: session.session.user.id,
              session_id: sessionId,
              ip_address: 'unknown', // In production, get actual IP
              user_agent: navigator.userAgent,
              last_activity: new Date().toISOString(),
              expires_at: new Date(Date.now() + (8 * 60 * 60 * 1000)).toISOString(),
              is_active: true
            }, {
              onConflict: 'session_id'
            });
          
          logSecurityEvent('session_created', { user_id: session.session.user.id });
        } catch (sessionError) {
          console.error('Session tracking error:', sessionError);
          logSecurityEvent('session_tracking_error', { error: sessionError });
        }

        // Validate email domain
        const email = session.session.user.email?.toLowerCase() || "";
        if (!email.endsWith("@lithiaspringsmethodist.org")) {
          await supabase.auth.signOut();
          logSecurityEvent('unauthorized_domain_attempt', { email });
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