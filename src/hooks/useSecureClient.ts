import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface SecureClientData {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zip_code: string;
  county: string;
  preferred_name: string;
  notes: string;
  total_assistance_received: number;
  assistance_count: number;
  last_assistance_date: string;
  risk_level: string;
  flagged_for_review: boolean;
  review_reason: string;
  created_at: string;
  updated_at: string;
}

export interface ClientSummaryData {
  id: string;
  first_name: string;
  last_name: string;
  preferred_name: string;
  phone: string;
  email: string;
  city: string;
  assistance_count: number;
  last_assistance_date: string;
  risk_level: string;
  flagged_for_review: boolean;
}

export interface ClientAccessLog {
  access_time: string;
  user_email: string;
  access_type: string;
  client_id: string;
  user_agent: string;
  ip_address: string;
}

/**
 * Secure client data access hook with enhanced security logging
 * 
 * This hook provides secure access to client data with automatic audit logging.
 * It uses database functions that verify user permissions and log all access attempts.
 * 
 * Security Features:
 * - All access is logged with user, timestamp, IP, and user agent
 * - Role-based access control (admin/staff only)
 * - Organization domain validation
 * - Data minimization (summary view for routine operations)
 * - Audit trail for compliance and security monitoring
 */
export function useSecureClient() {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  /**
   * Get full client details with audit logging
   * Use this for detailed client views where all information is needed
   */
  const getClientSecure = useCallback(async (clientId: string): Promise<SecureClientData | null> => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .rpc('get_client_secure', { p_client_id: clientId });

      if (error) {
        console.error('Error fetching secure client data:', error);
        toast({
          title: "Access Error",
          description: "Unable to access client data. Please check your permissions.",
          variant: "destructive"
        });
        return null;
      }

      return data?.[0] || null;
    } catch (error) {
      console.error('Error in getClientSecure:', error);
      toast({
        title: "Security Error",
        description: "Access denied. This attempt has been logged.",
        variant: "destructive"
      });
      return null;
    } finally {
      setLoading(false);
    }
  }, [toast]);

  /**
   * Get limited client information for routine operations
   * Use this for client lists, searches, and other non-sensitive operations
   */
  const getClientSummary = useCallback(async (clientId: string): Promise<ClientSummaryData | null> => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .rpc('get_client_summary', { p_client_id: clientId });

      if (error) {
        console.error('Error fetching client summary:', error);
        toast({
          title: "Access Error",
          description: "Unable to access client summary.",
          variant: "destructive"
        });
        return null;
      }

      return data?.[0] || null;
    } catch (error) {
      console.error('Error in getClientSummary:', error);
      return null;
    } finally {
      setLoading(false);
    }
  }, [toast]);

  /**
   * Get client access logs (admin only)
   * Use this to monitor who has accessed client data
   */
  const getClientAccessLogs = useCallback(async (
    clientId?: string, 
    days: number = 30
  ): Promise<ClientAccessLog[]> => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .rpc('get_client_access_logs', { 
          p_client_id: clientId || null, 
          p_days: days 
        });

      if (error) {
        console.error('Error fetching access logs:', error);
        toast({
          title: "Access Error",
          description: "Unable to access audit logs. Admin privileges required.",
          variant: "destructive"
        });
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in getClientAccessLogs:', error);
      return [];
    } finally {
      setLoading(false);
    }
  }, [toast]);

  /**
   * Legacy function wrapper for gradual migration
   * This provides backward compatibility while adding security logging
   */
  const searchClients = useCallback(async (searchTerm: string): Promise<ClientSummaryData[]> => {
    setLoading(true);
    try {
      // First get matching client IDs using the existing table query
      const { data: searchResults, error: searchError } = await supabase
        .from('clients')
        .select('id')
        .or(`first_name.ilike.%${searchTerm}%, last_name.ilike.%${searchTerm}%, email.ilike.%${searchTerm}%, phone.ilike.%${searchTerm}%`)
        .limit(50);

      if (searchError) {
        console.error('Error searching clients:', searchError);
        return [];
      }

      // Then get secure summaries for each matching client
      const results: ClientSummaryData[] = [];
      for (const client of searchResults || []) {
        const summary = await getClientSummary(client.id);
        if (summary) {
          results.push(summary);
        }
      }

      return results;
    } catch (error) {
      console.error('Error in searchClients:', error);
      return [];
    } finally {
      setLoading(false);
    }
  }, [getClientSummary]);

  return {
    loading,
    getClientSecure,
    getClientSummary,
    getClientAccessLogs,
    searchClients
  };
}