import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Starting subscription expiry check...");

    // Create admin client with service role key
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    // Find users with subscriptions expiring in 3 days
    const threeDaysFromNow = new Date();
    threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);
    const threeDaysFromNowStart = new Date(threeDaysFromNow);
    threeDaysFromNowStart.setHours(0, 0, 0, 0);
    const threeDaysFromNowEnd = new Date(threeDaysFromNow);
    threeDaysFromNowEnd.setHours(23, 59, 59, 999);

    // Find users with subscriptions expiring in 1 day
    const oneDayFromNow = new Date();
    oneDayFromNow.setDate(oneDayFromNow.getDate() + 1);
    const oneDayFromNowStart = new Date(oneDayFromNow);
    oneDayFromNowStart.setHours(0, 0, 0, 0);
    const oneDayFromNowEnd = new Date(oneDayFromNow);
    oneDayFromNowEnd.setHours(23, 59, 59, 999);

    // Get profiles expiring in 3 days
    const { data: expiringIn3Days, error: error3 } = await supabaseAdmin
      .from("profiles")
      .select("id, username, subscription_expires_at")
      .eq("subscription_status", "pro")
      .gte("subscription_expires_at", threeDaysFromNowStart.toISOString())
      .lte("subscription_expires_at", threeDaysFromNowEnd.toISOString());

    if (error3) {
      console.error("Error fetching 3-day expiring profiles:", error3);
    }

    // Get profiles expiring in 1 day
    const { data: expiringIn1Day, error: error1 } = await supabaseAdmin
      .from("profiles")
      .select("id, username, subscription_expires_at")
      .eq("subscription_status", "pro")
      .gte("subscription_expires_at", oneDayFromNowStart.toISOString())
      .lte("subscription_expires_at", oneDayFromNowEnd.toISOString());

    if (error1) {
      console.error("Error fetching 1-day expiring profiles:", error1);
    }

    const emailsSent: string[] = [];

    // Send 3-day expiry reminders
    for (const profile of expiringIn3Days || []) {
      try {
        const { data: userData } = await supabaseAdmin.auth.admin.getUserById(profile.id);
        const email = userData?.user?.email;

        if (email) {
          await resend.emails.send({
            from: "Nexalgotrix <onboarding@resend.dev>",
            to: [email],
            subject: "⏰ Your Nexalgotrix Pro expires in 3 days!",
            html: getExpiryEmailHtml(profile.username || "Learner", 3, profile.subscription_expires_at),
          });
          emailsSent.push(email);
          console.log(`Sent 3-day reminder to ${email}`);
        }
      } catch (emailError) {
        console.error(`Failed to send email for user ${profile.id}:`, emailError);
      }
    }

    // Send 1-day expiry reminders
    for (const profile of expiringIn1Day || []) {
      try {
        const { data: userData } = await supabaseAdmin.auth.admin.getUserById(profile.id);
        const email = userData?.user?.email;

        if (email) {
          await resend.emails.send({
            from: "Nexalgotrix <onboarding@resend.dev>",
            to: [email],
            subject: "⚠️ Your Nexalgotrix Pro expires tomorrow!",
            html: getExpiryEmailHtml(profile.username || "Learner", 1, profile.subscription_expires_at),
          });
          emailsSent.push(email);
          console.log(`Sent 1-day reminder to ${email}`);
        }
      } catch (emailError) {
        console.error(`Failed to send email for user ${profile.id}:`, emailError);
      }
    }

    console.log(`Subscription check complete. Sent ${emailsSent.length} emails.`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        emailsSent: emailsSent.length,
        details: {
          expiringIn3Days: expiringIn3Days?.length || 0,
          expiringIn1Day: expiringIn1Day?.length || 0,
        }
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in check-expiring-subscriptions function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

function getExpiryEmailHtml(username: string, daysUntilExpiry: number, expiresAt: string): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #0f0f0f;">
      <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
        <div style="background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); border-radius: 16px; padding: 40px; border: 1px solid rgba(255,255,255,0.1);">
          <div style="text-align: center; margin-bottom: 30px;">
            <div style="font-size: 48px; margin-bottom: 16px;">⏰</div>
            <h1 style="color: #f59e0b; margin: 0; font-size: 24px; font-weight: bold;">Pro Expiring Soon!</h1>
          </div>
          
          <p style="color: #e0e0e0; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
            Hey ${username},
          </p>
          
          <p style="color: #e0e0e0; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
            Your Nexalgotrix Pro subscription will expire in <strong style="color: #f59e0b;">${daysUntilExpiry} day${daysUntilExpiry === 1 ? '' : 's'}</strong>. Don't lose access to the advanced patterns you've been working on!
          </p>
          
          <div style="background: rgba(245, 158, 11, 0.1); border-radius: 12px; padding: 20px; margin: 24px 0; border-left: 4px solid #f59e0b;">
            <h3 style="color: #f59e0b; margin: 0 0 12px 0; font-size: 16px;">Keep your momentum going:</h3>
            <ul style="color: #e0e0e0; margin: 0; padding-left: 20px; line-height: 1.8;">
              <li>Continue Phase 2-6 advanced patterns</li>
              <li>Keep your AI Mentor access</li>
              <li>Maintain your learning streak</li>
              <li>Access all solutions & hints</li>
            </ul>
          </div>
          
          <p style="color: #a0a0a0; font-size: 14px;">
            Expires on: <strong style="color: #f59e0b;">${new Date(expiresAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</strong>
          </p>
          
          <div style="text-align: center; margin-top: 32px;">
            <a href="https://nexalgotrix.com/patterns" style="display: inline-block; background: linear-gradient(135deg, #f59e0b 0%, #ea580c 100%); color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px;">
              Renew Now →
            </a>
          </div>
        </div>
        
        <p style="color: #666; font-size: 12px; text-align: center; margin-top: 24px;">
          © ${new Date().getFullYear()} Nexalgotrix. Master DSA with pattern-based learning.
        </p>
      </div>
    </body>
    </html>
  `;
}

serve(handler);
