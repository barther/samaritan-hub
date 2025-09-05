import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.0';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface GraphTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

interface UserProfile {
  displayName: string;
  givenName: string;
  surname: string;
  mail: string;
  userPrincipalName: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }

  try {
    // Get JWT from Authorization header
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing authorization header" }), {
        status: 401,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Create Supabase client with the user's JWT
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          authorization: authHeader,
        },
      },
    });

    // CRITICAL: Verify user has admin or staff role before proceeding
    const { data: hasAdminRole, error: adminRoleError } = await supabase.rpc('verify_user_role', {
      required_role: 'admin'
    });
    
    const { data: hasStaffRole, error: staffRoleError } = await supabase.rpc('verify_user_role', {
      required_role: 'staff'
    });

    if ((adminRoleError && staffRoleError) || (!hasAdminRole && !hasStaffRole)) {
      console.log("Unauthorized profile lookup attempt");
      
      // Log the security event
      await supabase.rpc('log_edge_function_usage', {
        p_action: 'get_profile_unauthorized',
        p_resource: 'get-user-profile',
        p_details: { error: 'insufficient_privileges' }
      });

      return new Response(JSON.stringify({ error: "Insufficient privileges. Admin or staff role required." }), {
        status: 403,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const { userEmail }: { userEmail: string } = await req.json();

    // Validate required fields
    if (!userEmail) {
      return new Response(JSON.stringify({ error: "Missing required field: userEmail" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Validate email domain (organization emails only)
    if (!userEmail.toLowerCase().endsWith("@lithiaspringsmethodist.org")) {
      console.log("Attempted lookup of non-org email:", userEmail);
      
      await supabase.rpc('log_edge_function_usage', {
        p_action: 'get_profile_blocked',
        p_resource: 'get-user-profile',
        p_details: { userEmail: userEmail, reason: 'non_org_domain' }
      });

      return new Response(JSON.stringify({ error: "Can only lookup organization domain emails" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Get Microsoft Graph credentials from environment
    const tenantId = Deno.env.get("MICROSOFT_TENANT_ID");
    const clientId = Deno.env.get("MICROSOFT_CLIENT_ID");
    const clientSecret = Deno.env.get("MICROSOFT_CLIENT_SECRET");

    if (!tenantId || !clientId || !clientSecret) {
      console.error("Missing Microsoft Graph credentials");
      return new Response(JSON.stringify({ error: "Microsoft Graph not configured" }), {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Get access token from Microsoft Graph
    console.log("Requesting access token from Microsoft Graph...");
    const tokenUrl = `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`;
    const tokenParams = new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      scope: "https://graph.microsoft.com/.default",
      grant_type: "client_credentials"
    });

    const tokenResponse = await fetch(tokenUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: tokenParams,
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error("Token request failed:", errorText);
      return new Response(JSON.stringify({ error: "Failed to get access token" }), {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const tokenData: GraphTokenResponse = await tokenResponse.json();
    console.log("Access token obtained successfully");

    // Get user profile from Microsoft Graph
    const userProfileUrl = `https://graph.microsoft.com/v1.0/users/${userEmail}`;
    
    console.log(`Getting profile for user: ${userEmail}...`);
    const profileResponse = await fetch(userProfileUrl, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${tokenData.access_token}`,
        "Content-Type": "application/json",
      },
    });

    if (!profileResponse.ok) {
      const errorText = await profileResponse.text();
      console.error("Get user profile failed:", errorText);
      
      // If user not found, return a fallback response
      if (profileResponse.status === 404) {
        await supabase.rpc('log_edge_function_usage', {
          p_action: 'get_profile_not_found',
          p_resource: 'get-user-profile',
          p_details: { userEmail: userEmail }
        });

        return new Response(JSON.stringify({ 
          success: true,
          profile: {
            displayName: userEmail.split('@')[0], // Use email prefix as fallback
            givenName: "",
            surname: "",
            mail: userEmail,
            userPrincipalName: userEmail
          }
        }), {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        });
      }
      
      await supabase.rpc('log_edge_function_usage', {
        p_action: 'get_profile_failed',
        p_resource: 'get-user-profile',
        p_details: { userEmail: userEmail, error: errorText }
      });
      
      return new Response(JSON.stringify({ error: "Failed to get user profile", details: errorText }), {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const userProfile: UserProfile = await profileResponse.json();
    console.log("User profile retrieved successfully");

    // Log successful profile lookup
    await supabase.rpc('log_edge_function_usage', {
      p_action: 'get_profile_success',
      p_resource: 'get-user-profile',
      p_details: { 
        userEmail: userEmail,
        displayName: userProfile.displayName 
      }
    });

    return new Response(JSON.stringify({ 
      success: true, 
      profile: {
        displayName: userProfile.displayName || `${userProfile.givenName} ${userProfile.surname}`.trim(),
        givenName: userProfile.givenName,
        surname: userProfile.surname,
        mail: userProfile.mail,
        userPrincipalName: userProfile.userPrincipalName
      }
    }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });

  } catch (error: any) {
    console.error("Error in get-user-profile function:", error);
    
    // Try to log the error if we have supabase access
    try {
      const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
      const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
      const authHeader = req.headers.get("authorization");
      
      if (authHeader) {
        const supabase = createClient(supabaseUrl, supabaseAnonKey, {
          global: { headers: { authorization: authHeader } }
        });
        
        await supabase.rpc('log_edge_function_usage', {
          p_action: 'get_profile_error',
          p_resource: 'get-user-profile',
          p_details: { error: error.message }
        });
      }
    } catch (logError) {
      console.error("Failed to log error:", logError);
    }

    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
};

serve(handler);