import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface IntakeNotificationRequest {
  intakeId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  helpNeeded: string;
  address: string;
  city: string;
  state: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const {
      intakeId,
      firstName,
      lastName,
      email,
      phone,
      helpNeeded,
      address,
      city,
      state
    }: IntakeNotificationRequest = await req.json();

    // Validate required fields
    if (!intakeId || !firstName || !lastName || !email || !helpNeeded) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Format the email content
    const subject = `New Assistance Request - ${firstName} ${lastName}`;
    const emailBody = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px;">
          New Public Intake Request
        </h2>
        
        <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #374151;">Contact Information</h3>
          <p><strong>Name:</strong> ${firstName} ${lastName}</p>
          <p><strong>Email:</strong> <a href="mailto:${email}">${email}</a></p>
          <p><strong>Phone:</strong> <a href="tel:${phone}">${phone}</a></p>
          <p><strong>Address:</strong> ${address}, ${city}, ${state}</p>
        </div>
        
        <div style="background-color: #fef3c7; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #92400e;">Assistance Requested</h3>
          <p style="white-space: pre-wrap; line-height: 1.6;">${helpNeeded}</p>
        </div>
        
        <div style="background-color: #ecfdf5; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #065f46;">Next Steps</h3>
          <p>This request is waiting for staff review in the admin dashboard.</p>
          <p><strong>Request ID:</strong> ${intakeId}</p>
        </div>
        
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
        <p style="color: #6b7280; font-size: 14px;">
          This is an automated notification from the Good Samaritan intake system.
          Please log into the admin portal to review and process this request.
        </p>
      </div>
    `;

    // Send email notification directly via Microsoft Graph (server-to-server)
    // Determine sender mailbox from settings or fallback
    const { data: senderSetting } = await supabase
      .from('settings')
      .select('value')
      .eq('key', 'defaultSenderMailbox')
      .single();
    const senderMailbox = (senderSetting?.value as string) || 'office@lithiaspringsmethodist.org';

    // Resolve Graph credentials from env (support both prefix variants)
    const tenantId = Deno.env.get('MICROSOFT_TENANT_ID') || Deno.env.get('MS_GRAPH_TENANT_ID');
    const clientId = Deno.env.get('MICROSOFT_CLIENT_ID') || Deno.env.get('MS_GRAPH_CLIENT_ID');
    const clientSecret = Deno.env.get('MICROSOFT_CLIENT_SECRET') || Deno.env.get('MS_GRAPH_CLIENT_SECRET');

    if (!tenantId || !clientId || !clientSecret) {
      console.error('Microsoft Graph credentials missing in environment');
      await supabase.rpc('log_edge_function_usage', {
        p_action: 'intake_notification_email_failed',
        p_resource: 'notify-intake-submission',
        p_details: { intake_id: intakeId, error: 'missing_graph_credentials' }
      });
      return new Response(JSON.stringify({ success: true, emailSent: false }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get access token
    const tokenResp = await fetch(`https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        scope: 'https://graph.microsoft.com/.default',
        grant_type: 'client_credentials',
      }),
    });

    if (!tokenResp.ok) {
      const err = await tokenResp.text();
      console.error('Graph token fetch failed:', err);
      await supabase.rpc('log_edge_function_usage', {
        p_action: 'intake_notification_email_failed',
        p_resource: 'notify-intake-submission',
        p_details: { intake_id: intakeId, error: 'token_fetch_failed', details: err }
      });
      return new Response(JSON.stringify({ success: true, emailSent: false }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { access_token } = await tokenResp.json();

    const message = {
      message: {
        subject,
        body: { contentType: 'HTML', content: emailBody },
        toRecipients: [{ emailAddress: { address: 'office@lithiaspringsmethodist.org' } }],
      },
      saveToSentItems: true,
    };

    const sendResp = await fetch(`https://graph.microsoft.com/v1.0/users/${senderMailbox}/sendMail`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(message),
    });

    if (!sendResp.ok) {
      const err = await sendResp.text();
      console.error('Failed to send Graph email:', err);
      await supabase.rpc('log_edge_function_usage', {
        p_action: 'intake_notification_email_failed',
        p_resource: 'notify-intake-submission',
        p_details: { intake_id: intakeId, error: 'send_failed', details: err }
      });
      return new Response(JSON.stringify({ success: true, emailSent: false }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    // Log successful notification
    await supabase.rpc('log_edge_function_usage', {
      p_action: 'intake_notification_sent',
      p_resource: 'notify-intake-submission',
      p_details: { intake_id: intakeId, recipient: 'office@lithiaspringsmethodist.org', sender: senderMailbox }
    });

    return new Response(JSON.stringify({
      success: true,
      emailSent: true,
      message: 'Notification sent successfully'
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
    console.error('Error in notify-intake-submission function:', error);

    // Try to log the error
    try {
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
      const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
      const supabase = createClient(supabaseUrl, supabaseServiceKey);
      
      await supabase.rpc('log_edge_function_usage', {
        p_action: 'notify_intake_error',
        p_resource: 'notify-intake-submission',
        p_details: { error: error.message }
      });
    } catch (logError) {
      console.error('Failed to log error:', logError);
    }

    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
};

serve(handler);