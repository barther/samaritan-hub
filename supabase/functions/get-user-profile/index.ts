import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

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
    const { userEmail }: { userEmail: string } = await req.json();

    // Validate required fields
    if (!userEmail) {
      return new Response(JSON.stringify({ error: "Missing required field: userEmail" }), {
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
      
      return new Response(JSON.stringify({ error: "Failed to get user profile", details: errorText }), {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const userProfile: UserProfile = await profileResponse.json();
    console.log("User profile retrieved successfully");

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
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
};

serve(handler);