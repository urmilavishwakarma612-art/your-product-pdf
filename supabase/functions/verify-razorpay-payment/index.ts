import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { crypto } from "https://deno.land/std@0.168.0/crypto/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface VerifyRequest {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
  plan_type: 'monthly' | 'six_month' | 'yearly' | 'lifetime';
}

async function verifySignature(
  orderId: string,
  paymentId: string,
  signature: string,
  secret: string
): Promise<boolean> {
  const message = `${orderId}|${paymentId}`;
  const encoder = new TextEncoder();
  const keyData = encoder.encode(secret);
  const messageData = encoder.encode(message);

  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signatureBuffer = await crypto.subtle.sign('HMAC', cryptoKey, messageData);
  const expectedSignature = Array.from(new Uint8Array(signatureBuffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');

  return expectedSignature === signature;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    // Get the user from the JWT
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();

    if (userError || !user) {
      console.error('Auth error:', userError);
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, plan_type }: VerifyRequest = await req.json();

    const razorpayKeySecret = Deno.env.get('RAZORPAY_KEY_SECRET');
    if (!razorpayKeySecret) {
      console.error('Razorpay secret not configured');
      return new Response(
        JSON.stringify({ error: 'Payment service not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify the payment signature
    const isValid = await verifySignature(
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      razorpayKeySecret
    );

    if (!isValid) {
      console.error('Invalid payment signature for user:', user.id);
      return new Response(
        JSON.stringify({ error: 'Payment verification failed' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Payment verified successfully for user:', user.id, 'Payment ID:', razorpay_payment_id);

    // Use service role client to update data
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Fetch payment row for this order (coupon tracking + email context)
    const { data: paymentRow, error: paymentFetchError } = await supabaseAdmin
      .from('payments')
      .select('id, amount, plan_type, coupon_code, user_id')
      .eq('razorpay_order_id', razorpay_order_id)
      .maybeSingle();

    if (paymentFetchError) {
      console.error('Failed to fetch payment row:', paymentFetchError);
    }

    // Calculate subscription expiry based on plan type
    const now = new Date();
    let expiresAt: Date;

    if (plan_type === 'lifetime') {
      // Set to 100 years from now for lifetime
      expiresAt = new Date(now.getFullYear() + 100, now.getMonth(), now.getDate());
    } else if (plan_type === 'six_month') {
      expiresAt = new Date(now.getTime() + 180 * 24 * 60 * 60 * 1000);
    } else if (plan_type === 'yearly') {
      expiresAt = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000);
    } else {
      // Monthly subscription - 30 days from now
      expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    }

    // Update user's subscription status
    const { error: updateError } = await supabaseAdmin
      .from('profiles')
      .update({
        subscription_status: 'pro',
        subscription_expires_at: expiresAt.toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id);

    if (updateError) {
      console.error('Failed to update subscription:', updateError);
      return new Response(
        JSON.stringify({ error: 'Failed to activate subscription' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Update payment record
    await supabaseAdmin
      .from('payments')
      .update({
        razorpay_payment_id: razorpay_payment_id,
        razorpay_signature: razorpay_signature,
        status: 'completed',
        updated_at: new Date().toISOString(),
      })
      .eq('razorpay_order_id', razorpay_order_id);

    // Coupon tracking (only on successful payment)
    try {
      const couponCode = (paymentRow?.coupon_code || '').trim().toUpperCase();

      if (couponCode && paymentRow?.id) {
        const { data: coupon } = await supabaseAdmin
          .from('coupons')
          .select('id, current_redemptions, max_redemptions')
          .eq('code', couponCode)
          .maybeSingle();

        if (coupon?.id) {
          // avoid duplicates
          const { data: existing } = await supabaseAdmin
            .from('coupon_redemptions')
            .select('id')
            .eq('coupon_id', coupon.id)
            .eq('user_id', user.id)
            .maybeSingle();

          if (!existing) {
            await supabaseAdmin.from('coupon_redemptions').insert({
              coupon_id: coupon.id,
              user_id: user.id,
              payment_id: paymentRow.id,
            });

            const next = (coupon.current_redemptions ?? 0) + 1;
            if ((coupon.max_redemptions ?? 0) === 0 || next <= (coupon.max_redemptions ?? 0)) {
              await supabaseAdmin
                .from('coupons')
                .update({ current_redemptions: next })
                .eq('id', coupon.id);
            }
          }
        }
      }
    } catch (couponTrackError) {
      console.error('Coupon tracking failed (non-fatal):', couponTrackError);
    }

    console.log('Subscription activated for user:', user.id, 'Expires:', expiresAt.toISOString());

    // Get user profile for email
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('username')
      .eq('id', user.id)
      .single();

    // Send confirmation email using the subscription-email function
    try {
      const emailPayload = {
        email: user.email,
        username: profile?.username || user.email?.split('@')[0] || 'User',
        type: 'granted' as const,
        expiresAt: plan_type === 'lifetime' ? undefined : expiresAt.toISOString(),
      };

      console.log('Sending confirmation email with payload:', emailPayload);

      const { data: emailResult, error: emailError } = await supabaseAdmin.functions.invoke('subscription-email', {
        body: emailPayload,
      });

      if (emailError) {
        console.error('Email function error:', emailError);
      } else {
        console.log('Confirmation email sent successfully:', emailResult);
      }
    } catch (emailError) {
      console.error('Failed to send confirmation email:', emailError);
      // Don't fail the request if email fails
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Subscription activated successfully',
        expires_at: expiresAt.toISOString(),
        plan_type: plan_type,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: unknown) {
    console.error('Error in verify-razorpay-payment:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
