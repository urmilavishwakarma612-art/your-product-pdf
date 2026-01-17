import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface RequestRefundBody {
  payment_id: string;
  reason: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const body: RequestRefundBody = await req.json();
    const paymentId = (body.payment_id || '').trim();
    const reason = (body.reason || '').trim();

    if (!paymentId || !reason) {
      return new Response(JSON.stringify({ error: 'payment_id and reason are required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Validate payment ownership + status
    const { data: payment, error: paymentError } = await supabaseAdmin
      .from('payments')
      .select('id, user_id, amount, status, created_at')
      .eq('id', paymentId)
      .maybeSingle();

    if (paymentError) {
      console.error('Payment lookup error:', paymentError);
      return new Response(JSON.stringify({ error: 'Failed to validate payment' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!payment || payment.user_id !== user.id) {
      return new Response(JSON.stringify({ error: 'Payment not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (payment.status !== 'completed') {
      return new Response(JSON.stringify({ error: 'Only completed payments are refundable' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const purchasedAt = new Date(payment.created_at);
    const now = new Date();
    const daysSince = Math.floor((now.getTime() - purchasedAt.getTime()) / (1000 * 60 * 60 * 24));

    if (daysSince > 7) {
      return new Response(JSON.stringify({ error: 'Refund window expired (7 days)' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Prevent duplicates
    const { data: existing } = await supabaseAdmin
      .from('refund_requests')
      .select('id, status')
      .eq('payment_id', paymentId)
      .maybeSingle();

    if (existing) {
      return new Response(JSON.stringify({ error: 'Refund already requested', status: existing.status }), {
        status: 409,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data: inserted, error: insertError } = await supabaseAdmin
      .from('refund_requests')
      .insert({
        payment_id: paymentId,
        user_id: user.id,
        reason,
        refund_amount: payment.amount,
        status: 'pending',
      })
      .select('id, status, created_at')
      .single();

    if (insertError) {
      console.error('Refund insert error:', insertError);
      return new Response(JSON.stringify({ error: 'Failed to submit refund request' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Email: refund requested
    try {
      const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('username')
        .eq('id', user.id)
        .single();

      await supabaseAdmin.functions.invoke('subscription-email', {
        body: {
          email: user.email,
          username: profile?.username || user.email?.split('@')[0] || 'User',
          type: 'refund_requested',
          refundStatus: 'pending',
        },
      });
    } catch (e) {
      console.error('Refund requested email failed (non-fatal):', e);
    }

    return new Response(JSON.stringify({ success: true, request: inserted }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('request-refund error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
