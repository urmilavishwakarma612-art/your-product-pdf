import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface OrderRequest {
  plan_type: 'monthly' | 'six_month' | 'yearly';
  coupon_code?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');

    if (!authHeader) {
      console.error('No authorization header provided');
      return new Response(
        JSON.stringify({ error: 'No authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    );

    // Get the user from the JWT
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();

    if (userError || !user) {
      console.error('Auth error:', userError);
      return new Response(
        JSON.stringify({ error: 'Unauthorized - please login again' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('User authenticated:', user.id);

    const { plan_type, coupon_code }: OrderRequest = await req.json();

    // Define pricing (amounts in paise)
    const pricing: Record<OrderRequest['plan_type'], { amount: number; description: string }> = {
      monthly: { amount: 19900, description: 'Nexalgotrix Pro - Monthly' },
      six_month: { amount: 99900, description: 'Nexalgotrix Pro - 6 Months' },
      yearly: { amount: 149900, description: 'Nexalgotrix Pro - 1 Year' },
    };

    const selectedPlan = pricing[plan_type];
    if (!selectedPlan) {
      return new Response(
        JSON.stringify({ error: 'Invalid plan type' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const razorpayKeyId = Deno.env.get('RAZORPAY_KEY_ID');
    const razorpayKeySecret = Deno.env.get('RAZORPAY_KEY_SECRET');

    if (!razorpayKeyId || !razorpayKeySecret) {
      console.error('Razorpay credentials not configured');
      return new Response(
        JSON.stringify({ error: 'Payment service not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Admin client (used for coupon validation + writing payments)
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Coupon validation + discount calc (final authority lives in backend)
    const normalizedCoupon = (coupon_code || '').trim().toUpperCase();
    let discountAmount = 0;
    let appliedCouponCode: string | null = null;

    if (normalizedCoupon) {
      const { data: coupon, error: couponError } = await supabaseAdmin
        .from('coupons')
        .select('id, code, is_active, starts_at, expires_at, max_redemptions, current_redemptions, monthly_discount, six_month_discount, yearly_discount')
        .eq('code', normalizedCoupon)
        .maybeSingle();

      if (couponError) {
        console.error('Coupon lookup error:', couponError);
      } else if (!coupon) {
        console.log('Coupon not found:', normalizedCoupon);
      } else {
        const now = new Date();
        const startsAt = coupon.starts_at ? new Date(coupon.starts_at) : null;
        const expiresAt = coupon.expires_at ? new Date(coupon.expires_at) : null;

        const isWithinWindow = (!startsAt || now >= startsAt) && (!expiresAt || now <= expiresAt);
        const hasRemaining = (coupon.current_redemptions ?? 0) < (coupon.max_redemptions ?? 0);

        // enforce once-per-user
        const { data: existingRedemption, error: redemptionError } = await supabaseAdmin
          .from('coupon_redemptions')
          .select('id')
          .eq('coupon_id', coupon.id)
          .eq('user_id', user.id)
          .maybeSingle();

        if (redemptionError) {
          console.error('Coupon redemption lookup error:', redemptionError);
        }

        if (coupon.is_active && isWithinWindow && hasRemaining && !existingRedemption) {
          const discountRupees =
            plan_type === 'monthly'
              ? (coupon.monthly_discount ?? 0)
              : plan_type === 'six_month'
                ? (coupon.six_month_discount ?? 0)
                : (coupon.yearly_discount ?? 0);

          // Convert rupees to paise for discount
          discountAmount = Math.max(0, Math.round(discountRupees * 100));
          appliedCouponCode = coupon.code;
          console.log('Coupon applied:', appliedCouponCode, 'discount paise:', discountAmount);
        } else {
          console.log('Coupon not applicable:', {
            code: coupon.code,
            is_active: coupon.is_active,
            isWithinWindow,
            hasRemaining,
            alreadyUsedByUser: !!existingRedemption,
          });
        }
      }
    }

    const originalAmount = selectedPlan.amount;
    // Ensure minimum amount is ₹10 (1000 paise) to avoid Razorpay issues
    // Also cap discount so final amount is at least ₹10
    const maxDiscount = originalAmount - 1000; // Leave at least ₹10
    const cappedDiscount = Math.min(discountAmount, Math.max(0, maxDiscount));
    const finalAmount = originalAmount - cappedDiscount;

    // Create a short receipt ID (max 40 chars)
    // Use last 8 chars of user ID + timestamp in base36 for uniqueness
    const shortUserId = user.id.replace(/-/g, '').slice(-8);
    const timestamp = Date.now().toString(36);
    const receipt = `rcpt_${shortUserId}_${timestamp}`;

    console.log('Creating Razorpay order with receipt:', receipt, 'finalAmount:', finalAmount);

    // Create Razorpay order
    const orderResponse = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Basic ' + btoa(`${razorpayKeyId}:${razorpayKeySecret}`),
      },
      body: JSON.stringify({
        amount: finalAmount,
        currency: 'INR',
        receipt: receipt,
        notes: {
          user_id: user.id,
          plan_type: plan_type,
          user_email: user.email,
          coupon_code: appliedCouponCode ?? undefined,
          original_amount: originalAmount,
          discount_amount: discountAmount,
        },
      }),
    });

    if (!orderResponse.ok) {
      const errorData = await orderResponse.text();
      console.error('Razorpay order creation failed:', errorData);
      return new Response(
        JSON.stringify({ error: 'Failed to create payment order', details: errorData }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const order = await orderResponse.json();
    console.log('Razorpay order created:', order.id);

    // Record the payment in our database
    const { error: insertError } = await supabaseAdmin
      .from('payments')
      .insert({
        user_id: user.id,
        razorpay_order_id: order.id,
        amount: finalAmount,
        original_amount: originalAmount,
        discount_amount: discountAmount > 0 ? discountAmount : null,
        coupon_code: appliedCouponCode,
        currency: 'INR',
        plan_type: plan_type,
        status: 'pending',
      });

    if (insertError) {
      console.error('Failed to insert payment record:', insertError);
    } else {
      console.log('Payment record created for order:', order.id);
    }

    // Get user profile for prefill
    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('username')
      .eq('id', user.id)
      .single();

    return new Response(
      JSON.stringify({
        order_id: order.id,
        amount: finalAmount,
        currency: 'INR',
        key_id: razorpayKeyId,
        description: selectedPlan.description,
        prefill: {
          name: profile?.username || '',
          email: user.email || '',
        },
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Unexpected error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: 'Internal server error', message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
