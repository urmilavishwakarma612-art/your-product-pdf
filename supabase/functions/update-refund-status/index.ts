import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface UpdateRefundBody {
  refund_request_id: string;
  status: 'approved' | 'rejected' | 'processed';
  admin_notes?: string;
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

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Admin guard
    const { data: roleRow } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .maybeSingle();

    if (!roleRow) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const body: UpdateRefundBody = await req.json();
    const refundRequestId = (body.refund_request_id || '').trim();

    if (!refundRequestId || !['approved', 'rejected', 'processed'].includes(body.status)) {
      return new Response(JSON.stringify({ error: 'Invalid payload' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Load refund request
    const { data: rr, error: rrError } = await supabaseAdmin
      .from('refund_requests')
      .select('id, user_id, payment_id, status')
      .eq('id', refundRequestId)
      .maybeSingle();

    if (rrError) {
      console.error('Refund request fetch error:', rrError);
      return new Response(JSON.stringify({ error: 'Failed to load refund request' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!rr) {
      return new Response(JSON.stringify({ error: 'Refund request not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Allow transition: pending -> approved/rejected, or approved -> processed
    const validTransitions = {
      pending: ['approved', 'rejected'],
      approved: ['processed'],
    };
    const allowed = validTransitions[rr.status as keyof typeof validTransitions] || [];
    if (!allowed.includes(body.status)) {
      return new Response(JSON.stringify({ error: `Cannot transition from ${rr.status} to ${body.status}` }), {
        status: 409,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data: updated, error: updateError } = await supabaseAdmin
      .from('refund_requests')
      .update({
        status: body.status,
        admin_notes: body.admin_notes ?? null,
        processed_at: new Date().toISOString(),
        processed_by: user.id,
      })
      .eq('id', refundRequestId)
      .select('id, status, user_id')
      .single();

    if (updateError) {
      console.error('Refund request update error:', updateError);
      return new Response(JSON.stringify({ error: 'Failed to update refund request' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // If approved: cancel subscription (refund payment is still manual in Razorpay)
    if (body.status === 'approved') {
      const { error: profileUpdateError } = await supabaseAdmin
        .from('profiles')
        .update({ subscription_status: 'free', subscription_expires_at: null })
        .eq('id', rr.user_id);

      if (profileUpdateError) {
        console.error('Failed to downgrade subscription:', profileUpdateError);
      }
    }

    // Email user about status update
    try {
      const { data: userData } = await supabaseAdmin.auth.admin.getUserById(rr.user_id);
      const email = userData?.user?.email;

      const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('username')
        .eq('id', rr.user_id)
        .single();

      if (email) {
        const emailTypeMap = {
          approved: 'refund_approved',
          rejected: 'refund_rejected',
          processed: 'refund_processed',
        };
        await supabaseAdmin.functions.invoke('subscription-email', {
          body: {
            email,
            username: profile?.username || email.split('@')[0] || 'User',
            type: emailTypeMap[body.status],
            refundStatus: body.status,
            adminNotes: body.admin_notes ?? undefined,
          },
        });
      }
    } catch (e) {
      console.error('Refund status email failed (non-fatal):', e);
    }

    return new Response(JSON.stringify({ success: true, refund: updated }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('update-refund-status error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
