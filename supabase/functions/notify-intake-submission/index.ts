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

    // Send email notification using the existing Microsoft Graph function
    const { data: emailResult, error: emailError } = await supabase.functions.invoke('send-email-msgraph', {
      body: {
        to: 'office@lithiaspringsmethodist.org',
        subject: subject,
        html: emailBody
      }
    });

    if (emailError) {
      console.error('Failed to send notification email:', emailError);
      
      // Log the error but don't fail the request - the intake was still recorded
      await supabase.rpc('log_edge_function_usage', {
        p_action: 'intake_notification_email_failed',
        p_resource: 'notify-intake-submission',
        p_details: { 
          intake_id: intakeId, 
          error: emailError.message 
        }
      });

      return new Response(JSON.stringify({ 
        success: true, 
        emailSent: false, 
        error: 'Email notification failed but intake was recorded' 
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Log successful notification
    await supabase.rpc('log_edge_function_usage', {
      p_action: 'intake_notification_sent',
      p_resource: 'notify-intake-submission',
      p_details: { 
        intake_id: intakeId,
        recipient: 'office@lithiaspringsmethodist.org' 
      }
    });

    console.log('Intake notification email sent successfully for:', intakeId);
    
    return new Response(JSON.stringify({ 
      success: true, 
      emailSent: true,
      message: 'Notification sent successfully' 
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
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