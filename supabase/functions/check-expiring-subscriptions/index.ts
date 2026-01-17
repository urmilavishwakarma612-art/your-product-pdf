import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

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

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      {
        auth: { autoRefreshToken: false, persistSession: false },
      }
    );

    const mkDayWindow = (daysFromNow: number) => {
      const d = new Date();
      d.setDate(d.getDate() + daysFromNow);
      const start = new Date(d);
      start.setHours(0, 0, 0, 0);
      const end = new Date(d);
      end.setHours(23, 59, 59, 999);
      return { start, end };
    };

    const window3 = mkDayWindow(3);
    const window1 = mkDayWindow(1);

    const { data: expiringIn3Days, error: error3 } = await supabaseAdmin
      .from("profiles")
      .select("id, username, subscription_expires_at")
      .eq("subscription_status", "pro")
      .gte("subscription_expires_at", window3.start.toISOString())
      .lte("subscription_expires_at", window3.end.toISOString());

    if (error3) console.error("Error fetching 3-day expiring profiles:", error3);

    const { data: expiringIn1Day, error: error1 } = await supabaseAdmin
      .from("profiles")
      .select("id, username, subscription_expires_at")
      .eq("subscription_status", "pro")
      .gte("subscription_expires_at", window1.start.toISOString())
      .lte("subscription_expires_at", window1.end.toISOString());

    if (error1) console.error("Error fetching 1-day expiring profiles:", error1);

    let emailsSent = 0;

    const sendExpiry = async (profile: { id: string; username: string | null; subscription_expires_at: string | null }, days: number) => {
      try {
        const { data: userData } = await supabaseAdmin.auth.admin.getUserById(profile.id);
        const email = userData?.user?.email;
        if (!email || !profile.subscription_expires_at) return;

        const payload = {
          email,
          username: profile.username || email.split('@')[0] || 'Learner',
          type: 'expiring',
          expiresAt: profile.subscription_expires_at,
          daysUntilExpiry: days,
        };

        const { error } = await supabaseAdmin.functions.invoke('subscription-email', { body: payload });
        if (error) {
          console.error('subscription-email error:', error);
          return;
        }

        emailsSent += 1;
        console.log(`Sent ${days}-day reminder to ${email}`);
      } catch (emailError) {
        console.error(`Failed to send expiry email for user ${profile.id}:`, emailError);
      }
    };

    for (const profile of expiringIn3Days || []) await sendExpiry(profile, 3);
    for (const profile of expiringIn1Day || []) await sendExpiry(profile, 1);

    console.log(`Subscription check complete. Sent ${emailsSent} emails.`);

    return new Response(
      JSON.stringify({
        success: true,
        emailsSent,
        details: {
          expiringIn3Days: expiringIn3Days?.length || 0,
          expiringIn1Day: expiringIn1Day?.length || 0,
        },
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in check-expiring-subscriptions function:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
};

serve(handler);

