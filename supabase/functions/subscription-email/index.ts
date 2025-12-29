import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

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

interface EmailTemplate {
  subject: string;
  heading: string;
  body_text: string;
  cta_text: string;
  cta_url: string;
  primary_color: string;
  footer_text: string | null;
}

const getDefaultTemplate = (type: string): EmailTemplate => {
  const defaults: Record<string, EmailTemplate> = {
    granted: {
      subject: "🎉 Welcome to Nexalgotrix Pro!",
      heading: "Welcome to Pro!",
      body_text: "Congratulations! Your Nexalgotrix Pro subscription is now active. You've just unlocked access to our complete DSA mastery curriculum including Phase 2-6 advanced patterns, AI Mentor, and complete solutions.",
      cta_text: "Start Learning Now",
      cta_url: "https://nexalgotrix.com/patterns",
      primary_color: "#f59e0b",
      footer_text: "Master DSA with pattern-based learning.",
    },
    revoked: {
      subject: "Your Nexalgotrix Pro Access Has Ended",
      heading: "Pro Access Ended",
      body_text: "Your Nexalgotrix Pro subscription has ended. You'll continue to have access to all Phase 1 patterns completely free. All your solved questions, notes, and XP are preserved. When you renew, you'll pick up right where you left off.",
      cta_text: "Renew Pro Access",
      cta_url: "https://nexalgotrix.com/patterns",
      primary_color: "#6366f1",
      footer_text: "Master DSA with pattern-based learning.",
    },
    expiring: {
      subject: "⏰ Your Nexalgotrix Pro expires soon!",
      heading: "Pro Expiring Soon!",
      body_text: "Your Nexalgotrix Pro subscription will expire soon. Don't lose access to the advanced patterns you've been working on! Continue Phase 2-6 patterns, keep your AI Mentor access, and maintain your learning streak.",
      cta_text: "Renew Now",
      cta_url: "https://nexalgotrix.com/patterns",
      primary_color: "#f59e0b",
      footer_text: "Master DSA with pattern-based learning.",
    },
  };
  return defaults[type] || defaults.granted;
};

const getEmailHtml = (
  template: EmailTemplate, 
  username: string, 
  type: string,
  expiresAt?: string,
  daysUntilExpiry?: number
): string => {
  const emoji = type === 'granted' ? '🎉' : type === 'revoked' ? '📋' : '⏰';
  const bodyText = template.body_text.replace(/\{\{username\}\}/g, username);
  
  let expiryInfo = '';
  if (type === 'granted' && expiresAt) {
    expiryInfo = `<p style="color: #a0a0a0; font-size: 14px; margin-top: 24px;">
      Your subscription is valid until: <strong style="color: ${template.primary_color};">${new Date(expiresAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</strong>
    </p>`;
  } else if (type === 'granted') {
    expiryInfo = `<p style="color: #a0a0a0; font-size: 14px; margin-top: 24px;">
      Your subscription: <strong style="color: ${template.primary_color};">Lifetime Access</strong>
    </p>`;
  } else if (type === 'expiring' && daysUntilExpiry !== undefined) {
    expiryInfo = `<p style="color: #a0a0a0; font-size: 14px; margin-top: 24px;">
      Expires in: <strong style="color: ${template.primary_color};">${daysUntilExpiry} day${daysUntilExpiry === 1 ? '' : 's'}</strong>
    </p>`;
  }

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
            <div style="font-size: 48px; margin-bottom: 16px;">${emoji}</div>
            <h1 style="color: ${template.primary_color}; margin: 0; font-size: 28px; font-weight: bold;">${template.heading}</h1>
          </div>
          
          <p style="color: #e0e0e0; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
            Hey ${username},
          </p>
          
          <p style="color: #e0e0e0; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
            ${bodyText}
          </p>
          
          ${expiryInfo}
          
          <div style="text-align: center; margin-top: 32px;">
            <a href="${template.cta_url}" style="display: inline-block; background: linear-gradient(135deg, ${template.primary_color} 0%, #ea580c 100%); color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px;">
              ${template.cta_text} →
            </a>
          </div>
        </div>
        
        <p style="color: #666; font-size: 12px; text-align: center; margin-top: 24px;">
          © ${new Date().getFullYear()} Nexalgotrix. ${template.footer_text || ''}
        </p>
      </div>
    </body>
    </html>
  `;
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const request: SubscriptionEmailRequest = await req.json();
    console.log("Received subscription email request:", request);

    if (!request.email) {
      throw new Error("Email is required");
    }

    // Create Supabase client to fetch template
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    // Fetch template from database
    const { data: templateData } = await supabase
      .from("email_templates")
      .select("*")
      .eq("type", request.type)
      .single();

    const template: EmailTemplate = templateData || getDefaultTemplate(request.type);
    
    // Handle dynamic subject for expiring emails
    let subject = template.subject;
    if (request.type === "expiring" && request.daysUntilExpiry !== undefined) {
      subject = subject.replace("soon", `in ${request.daysUntilExpiry} day${request.daysUntilExpiry === 1 ? '' : 's'}`);
    }

    const html = getEmailHtml(
      template, 
      request.username, 
      request.type, 
      request.expiresAt, 
      request.daysUntilExpiry
    );

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
