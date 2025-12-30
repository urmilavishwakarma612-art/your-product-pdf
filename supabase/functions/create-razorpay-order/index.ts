import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface OrderRequest {
  plan_type: 'monthly' | 'lifetime';
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

    const { plan_type }: OrderRequest = await req.json();
    
    // Define pricing (amounts in paise)
    const pricing = {
      monthly: { amount: 9900, description: 'Nexalgotrix Pro - Monthly' }, // ₹99
      lifetime: { amount: 99900, description: 'Nexalgotrix Pro - Yearly' }, // ₹999
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

    // Create a short receipt ID (max 40 chars)
    // Use last 8 chars of user ID + timestamp in base36 for uniqueness
    const shortUserId = user.id.replace(/-/g, '').slice(-8);
    const timestamp = Date.now().toString(36);
    const receipt = `rcpt_${shortUserId}_${timestamp}`;
    
    console.log('Creating Razorpay order with receipt:', receipt);

    // Create Razorpay order
    const orderResponse = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Basic ' + btoa(`${razorpayKeyId}:${razorpayKeySecret}`),
      },
      body: JSON.stringify({
        amount: selectedPlan.amount,
        currency: 'INR',
        receipt: receipt,
        notes: {
          user_id: user.id,
          plan_type: plan_type,
          user_email: user.email,
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
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { error: insertError } = await supabaseAdmin
      .from('payments')
      .insert({
        user_id: user.id,
        razorpay_order_id: order.id,
        amount: selectedPlan.amount,
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
        amount: selectedPlan.amount,
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
