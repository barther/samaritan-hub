import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface EmailRequest {
  to: string;
  subject: string;
  html: string;
  sender?: string; // Optional sender mailbox, defaults to configured default
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
    const { to, subject, html, sender }: EmailRequest = await req.json();

    // Validate required fields
    if (!to || !subject || !html) {
      return new Response(JSON.stringify({ error: "Missing required fields: to, subject, html" }), {
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
    const senderMailbox = sender || "default-mailbox@yourdomain.com"; // Replace with actual default
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
      return new Response(JSON.stringify({ error: "Failed to send email", details: errorText }), {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

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
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
};

serve(handler);