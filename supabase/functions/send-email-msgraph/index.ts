import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.0';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface EmailRequest {
  to: string;
  subject: string;
  html: string;
  // Removed user-controlled sender field for security
}

interface GraphTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
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

    // CRITICAL: Verify user has admin role before proceeding
    const { data: hasAdminRole, error: roleError } = await supabase.rpc('verify_user_role', {
      required_role: 'admin'
    });

    if (roleError || !hasAdminRole) {
      console.log("Unauthorized email send attempt:", roleError);
      
      // Log the security event
      await supabase.rpc('log_edge_function_usage', {
        p_action: 'send_email_unauthorized',
        p_resource: 'send-email-msgraph',
        p_details: { error: 'insufficient_privileges' }
      });

      return new Response(JSON.stringify({ error: "Insufficient privileges. Admin role required." }), {
        status: 403,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const { to, subject, html }: EmailRequest = await req.json();

    // Validate required fields
    if (!to || !subject || !html) {
      return new Response(JSON.stringify({ error: "Missing required fields: to, subject, html" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Check email policy from settings (allow external recipients by default)
    const { data: emailSettings } = await supabase
      .from('settings')
      .select('value')
      .eq('key', 'email')
      .single();

    const allowExternal = (emailSettings as any)?.value?.allowExternalRecipients ?? true;
    const orgDomain = 'lithiaspringsmethodist.org';

    if (!allowExternal) {
      // When external recipients are disabled by policy, restrict to org domain
      if (!to.toLowerCase().endsWith(`@${orgDomain}`)) {
        await supabase.rpc('log_edge_function_usage', {
          p_action: 'send_email_blocked',
          p_resource: 'send-email-msgraph',
          p_details: { recipient: to, reason: 'external_recipients_disabled' }
        });

        return new Response(JSON.stringify({ error: "External recipients are disabled by policy" }), {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        });
      }
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

    // Get the default sender mailbox from settings (secure approach)
    const { data: settings, error: settingsError } = await supabase
      .from('settings')
      .select('value')
      .eq('key', 'defaultSenderMailbox')
      .single();

    const senderMailbox = settings?.value || "donotreply@lithiaspringsmethodist.org";

    // Prepare email message
    const message = {
      message: {
        subject: subject,
        body: {
          contentType: "HTML",
          content: html
        },
        toRecipients: [
          {
            emailAddress: {
              address: to
            }
          }
        ]
      },
      saveToSentItems: true
    };

    // Send email via Microsoft Graph
    const sendUrl = `https://graph.microsoft.com/v1.0/users/${senderMailbox}/sendMail`;
    
    console.log(`Sending email to ${to} from ${senderMailbox}...`);
    const sendResponse = await fetch(sendUrl, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${tokenData.access_token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(message),
    });

    if (!sendResponse.ok) {
      const errorText = await sendResponse.text();
      console.error("Send email failed:", errorText);

      // Fallback: if sender mailbox is invalid, retry with donotreply@ mailbox
      if (errorText.includes('ErrorInvalidUser') && senderMailbox !== 'donotreply@lithiaspringsmethodist.org') {
        const fallbackMailbox = 'donotreply@lithiaspringsmethodist.org';
        console.log(`Retrying send with fallback sender: ${fallbackMailbox}`);
        const retryResponse = await fetch(`https://graph.microsoft.com/v1.0/users/${fallbackMailbox}/sendMail`, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${tokenData.access_token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(message),
        });

        if (retryResponse.ok) {
          await supabase.rpc('log_edge_function_usage', {
            p_action: 'send_email_success_fallback',
            p_resource: 'send-email-msgraph',
            p_details: { recipient: to, subject, sender: fallbackMailbox }
          });
          return new Response(JSON.stringify({ success: true, message: "Email sent via fallback sender", sender: fallbackMailbox, recipient: to }), {
            status: 200,
            headers: { "Content-Type": "application/json", ...corsHeaders },
          });
        }
      }
      
      await supabase.rpc('log_edge_function_usage', {
        p_action: 'send_email_failed',
        p_resource: 'send-email-msgraph',
        p_details: { recipient: to, error: errorText }
      });

      return new Response(JSON.stringify({ error: "Failed to send email", details: errorText }), {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Log successful email send
    await supabase.rpc('log_edge_function_usage', {
      p_action: 'send_email_success',
      p_resource: 'send-email-msgraph',
      p_details: { 
        recipient: to, 
        subject: subject,
        sender: senderMailbox 
      }
    });

    console.log("Email sent successfully via Microsoft Graph");
    return new Response(JSON.stringify({ 
      success: true, 
      message: "Email sent successfully",
      sender: senderMailbox,
      recipient: to
    }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });

  } catch (error: any) {
    console.error("Error in send-email-msgraph function:", error);
    
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
          p_action: 'send_email_error',
          p_resource: 'send-email-msgraph',
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