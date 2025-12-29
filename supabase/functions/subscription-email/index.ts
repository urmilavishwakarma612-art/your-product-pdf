import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface SubscriptionEmailRequest {
  email: string;
  username: string;
  type: "granted" | "revoked" | "expiring";
  expiresAt?: string;
  daysUntilExpiry?: number;
}

const getEmailContent = (request: SubscriptionEmailRequest) => {
  const { username, type, expiresAt, daysUntilExpiry } = request;
  const displayName = username || "Learner";

  switch (type) {
    case "granted":
      return {
        subject: "🎉 Welcome to Nexalgotrix Pro!",
        html: `
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
                  <div style="font-size: 48px; margin-bottom: 16px;">🎉</div>
                  <h1 style="color: #f59e0b; margin: 0; font-size: 28px; font-weight: bold;">Welcome to Pro!</h1>
                </div>
                
                <p style="color: #e0e0e0; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
                  Hey ${displayName},
                </p>
                
                <p style="color: #e0e0e0; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
                  Congratulations! Your Nexalgotrix Pro subscription is now active. You've just unlocked access to our complete DSA mastery curriculum.
                </p>
                
                <div style="background: rgba(245, 158, 11, 0.1); border-radius: 12px; padding: 20px; margin: 24px 0; border-left: 4px solid #f59e0b;">
                  <h3 style="color: #f59e0b; margin: 0 0 12px 0; font-size: 16px;">What's now unlocked:</h3>
                  <ul style="color: #e0e0e0; margin: 0; padding-left: 20px; line-height: 1.8;">
                    <li>All Phase 2-6 Advanced Patterns</li>
                    <li>AI Mentor for personalized guidance</li>
                    <li>Complete solutions & approaches</li>
                    <li>Spaced repetition system</li>
                  </ul>
                </div>
                
                ${expiresAt ? `
                <p style="color: #a0a0a0; font-size: 14px; margin-top: 24px;">
                  Your subscription is valid until: <strong style="color: #f59e0b;">${new Date(expiresAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</strong>
                </p>
                ` : `
                <p style="color: #a0a0a0; font-size: 14px; margin-top: 24px;">
                  Your subscription: <strong style="color: #f59e0b;">Lifetime Access</strong>
                </p>
                `}
                
                <div style="text-align: center; margin-top: 32px;">
                  <a href="https://nexalgotrix.com/patterns" style="display: inline-block; background: linear-gradient(135deg, #f59e0b 0%, #ea580c 100%); color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px;">
                    Start Learning Now →
                  </a>
                </div>
              </div>
              
              <p style="color: #666; font-size: 12px; text-align: center; margin-top: 24px;">
                © ${new Date().getFullYear()} Nexalgotrix. Master DSA with pattern-based learning.
              </p>
            </div>
          </body>
          </html>
        `,
      };

    case "revoked":
      return {
        subject: "Your Nexalgotrix Pro Access Has Ended",
        html: `
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
                  <h1 style="color: #e0e0e0; margin: 0; font-size: 24px; font-weight: bold;">Pro Access Ended</h1>
                </div>
                
                <p style="color: #e0e0e0; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
                  Hey ${displayName},
                </p>
                
                <p style="color: #e0e0e0; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
                  Your Nexalgotrix Pro subscription has ended. You'll continue to have access to all Phase 1 patterns completely free.
                </p>
                
                <div style="background: rgba(99, 102, 241, 0.1); border-radius: 12px; padding: 20px; margin: 24px 0; border-left: 4px solid #6366f1;">
                  <h3 style="color: #6366f1; margin: 0 0 12px 0; font-size: 16px;">Your progress is saved!</h3>
                  <p style="color: #e0e0e0; margin: 0; line-height: 1.6;">
                    All your solved questions, notes, and XP are preserved. When you renew, you'll pick up right where you left off.
                  </p>
                </div>
                
                <p style="color: #a0a0a0; font-size: 14px; margin-top: 24px;">
                  Miss the advanced patterns? Renew anytime to continue your DSA mastery journey.
                </p>
                
                <div style="text-align: center; margin-top: 32px;">
                  <a href="https://nexalgotrix.com/patterns" style="display: inline-block; background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px;">
                    Renew Pro Access →
                  </a>
                </div>
              </div>
              
              <p style="color: #666; font-size: 12px; text-align: center; margin-top: 24px;">
                © ${new Date().getFullYear()} Nexalgotrix. Master DSA with pattern-based learning.
              </p>
            </div>
          </body>
          </html>
        `,
      };

    case "expiring":
      return {
        subject: `⏰ Your Nexalgotrix Pro expires in ${daysUntilExpiry} day${daysUntilExpiry === 1 ? '' : 's'}!`,
        html: `
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
                  Hey ${displayName},
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
                  Expires on: <strong style="color: #f59e0b;">${expiresAt ? new Date(expiresAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 'Soon'}</strong>
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
        `,
      };

    default:
      throw new Error(`Unknown email type: ${type}`);
  }
};

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const request: SubscriptionEmailRequest = await req.json();
    console.log("Received subscription email request:", request);

    if (!request.email) {
      throw new Error("Email is required");
    }

    const { subject, html } = getEmailContent(request);

    const emailResponse = await resend.emails.send({
      from: "Nexalgotrix <onboarding@resend.dev>",
      to: [request.email],
      subject,
      html,
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(JSON.stringify(emailResponse), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in subscription-email function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
