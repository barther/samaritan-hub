import { useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

interface SessionSecurityOptions {
  idleTimeout?: number; // milliseconds
  sessionTimeout?: number; // milliseconds
  warningTime?: number; // milliseconds before timeout to show warning
}

export const useSessionSecurity = (options: SessionSecurityOptions = {}) => {
  const {
    idleTimeout = 30 * 60 * 1000, // 30 minutes
    sessionTimeout = 8 * 60 * 60 * 1000, // 8 hours
    warningTime = 5 * 60 * 1000 // 5 minutes
  } = options;

  const { toast } = useToast();
  const navigate = useNavigate();
  
  const idleTimerRef = useRef<NodeJS.Timeout>();
  const sessionTimerRef = useRef<NodeJS.Timeout>();
  const warningTimerRef = useRef<NodeJS.Timeout>();
  const lastActivityRef = useRef<number>(Date.now());
  const sessionStartRef = useRef<number>(Date.now());

  const handleLogout = useCallback(async (reason: string) => {
    try {
      await supabase.auth.signOut();
      toast({
        title: "Session Expired",
        description: reason,
        variant: "destructive"
      });
      navigate('/portal');
    } catch (error) {
      console.error('Error during logout:', error);
    }
  }, [toast, navigate]);

  const showWarning = useCallback(() => {
    toast({
      title: "Session Warning",
      description: "Your session will expire in 5 minutes due to inactivity. Move your mouse or click to stay logged in.",
      variant: "destructive"
    });
  }, [toast]);

  const resetTimers = useCallback(() => {
    const now = Date.now();
    lastActivityRef.current = now;

    // Clear existing timers
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    if (warningTimerRef.current) clearTimeout(warningTimerRef.current);

    // Set warning timer (5 minutes before idle timeout)
    warningTimerRef.current = setTimeout(() => {
      showWarning();
    }, idleTimeout - warningTime);

    // Set idle timeout timer
    idleTimerRef.current = setTimeout(() => {
      handleLogout("You have been logged out due to inactivity.");
    }, idleTimeout);
  }, [idleTimeout, warningTime, handleLogout, showWarning]);

  const trackActivity = useCallback(() => {
    resetTimers();
  }, [resetTimers]);

  const updateSessionActivity = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        // Update last activity in user_sessions table
        await supabase
          .from('user_sessions')
          .update({ 
            last_activity: new Date().toISOString(),
            expires_at: new Date(Date.now() + sessionTimeout).toISOString()
          })
          .eq('user_id', user.id)
          .eq('is_active', true);
      }
    } catch (error) {
      console.error('Error updating session activity:', error);
    }
  }, [sessionTimeout]);

  useEffect(() => {
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    
    // Add event listeners for user activity
    events.forEach(event => {
      document.addEventListener(event, trackActivity, true);
    });

    // Set session timeout (absolute timeout regardless of activity)
    sessionTimerRef.current = setTimeout(() => {
      handleLogout("Your session has expired for security reasons.");
    }, sessionTimeout);

    // Initial timer setup
    resetTimers();

    // Update session activity every 5 minutes
    const activityInterval = setInterval(updateSessionActivity, 5 * 60 * 1000);

    return () => {
      // Cleanup
      events.forEach(event => {
        document.removeEventListener(event, trackActivity, true);
      });
      
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
      if (sessionTimerRef.current) clearTimeout(sessionTimerRef.current);
      if (warningTimerRef.current) clearTimeout(warningTimerRef.current);
      clearInterval(activityInterval);
    };
  }, [trackActivity, resetTimers, handleLogout, sessionTimeout, updateSessionActivity]);

  return {
    resetTimers,
    trackActivity
  };
};