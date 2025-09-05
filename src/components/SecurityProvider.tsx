import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface SecurityContextType {
  sessionValid: boolean;
  lastActivity: Date;
  securityLevel: 'low' | 'medium' | 'high';
  logSecurityEvent: (event: string, details?: any) => void;
}

const SecurityContext = createContext<SecurityContextType | undefined>(undefined);

export const useSecurityContext = () => {
  const context = useContext(SecurityContext);
  if (!context) {
    throw new Error('useSecurityContext must be used within SecurityProvider');
  }
  return context;
};

interface SecurityProviderProps {
  children: React.ReactNode;
}

export const SecurityProvider: React.FC<SecurityProviderProps> = ({ children }) => {
  const [sessionValid, setSessionValid] = useState(true);
  const [lastActivity, setLastActivity] = useState(new Date());
  const [securityLevel, setSecurityLevel] = useState<'low' | 'medium' | 'high'>('medium');
  const { toast } = useToast();

  const logSecurityEvent = async (event: string, details?: any) => {
    try {
      await supabase.rpc('log_edge_function_usage', {
        p_action: `security_event_${event}`,
        p_resource: 'security_system',
        p_details: details ? JSON.stringify(details) : null
      });
    } catch (error) {
      console.error('Error logging security event:', error);
    }
  };

  useEffect(() => {
    // Monitor for suspicious activities
    const checkSecurityThreats = () => {
      // Check for multiple failed login attempts (basic detection)
      const failedAttempts = localStorage.getItem('failed_login_attempts');
      if (failedAttempts && parseInt(failedAttempts) > 3) {
        setSecurityLevel('high');
        logSecurityEvent('multiple_failed_logins', { attempts: failedAttempts });
      }

      // Check for session hijacking indicators (basic check)
      const userAgent = navigator.userAgent;
      const storedUserAgent = localStorage.getItem('initial_user_agent');
      if (storedUserAgent && storedUserAgent !== userAgent) {
        setSecurityLevel('high');
        logSecurityEvent('user_agent_change', { 
          original: storedUserAgent, 
          current: userAgent 
        });
        toast({
          title: "Security Alert",
          description: "Unusual browser activity detected. Please verify your identity.",
          variant: "destructive"
        });
      } else if (!storedUserAgent) {
        localStorage.setItem('initial_user_agent', userAgent);
      }
    };

    // Set up security monitoring
    const securityInterval = setInterval(checkSecurityThreats, 5 * 60 * 1000); // Every 5 minutes

    // Activity tracking
    const updateActivity = () => {
      setLastActivity(new Date());
    };

    const events = ['mousedown', 'keydown', 'touchstart', 'scroll'];
    events.forEach(event => {
      document.addEventListener(event, updateActivity);
    });

    // Initial check
    checkSecurityThreats();

    return () => {
      clearInterval(securityInterval);
      events.forEach(event => {
        document.removeEventListener(event, updateActivity);  
      });
    };
  }, [toast]);

  // Monitor session validity
  useEffect(() => {
    const checkSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error || !session) {
          setSessionValid(false);
          logSecurityEvent('session_invalid', { error: error?.message });
        } else {
          setSessionValid(true);
        }
      } catch (error) {
        setSessionValid(false);
        logSecurityEvent('session_check_error', { error: error });
      }
    };

    // Check session every 2 minutes
    const sessionInterval = setInterval(checkSession, 2 * 60 * 1000);
    checkSession(); // Initial check

    return () => clearInterval(sessionInterval);
  }, []);

  const value: SecurityContextType = {
    sessionValid,
    lastActivity,
    securityLevel,
    logSecurityEvent
  };

  return (
    <SecurityContext.Provider value={value}>
      {children}
    </SecurityContext.Provider>
  );
};