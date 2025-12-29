import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { crypto } from "https://deno.land/std@0.168.0/crypto/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-razorpay-signature',
};

async function verifyWebhookSignature(
  body: string,
  signature: string,
  secret: string
): Promise<boolean> {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(secret);
  const messageData = encoder.encode(body);
  
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
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const signature = req.headers.get('x-razorpay-signature');
    const body = await req.text();
    
    const webhookSecret = Deno.env.get('RAZORPAY_KEY_SECRET');
    if (!webhookSecret) {
      console.error('Razorpay webhook secret not configured');
      return new Response(
        JSON.stringify({ error: 'Webhook not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify webhook signature
    if (signature) {
      const isValid = await verifyWebhookSignature(body, signature, webhookSecret);
      if (!isValid) {
        console.error('Invalid webhook signature');
        return new Response(
          JSON.stringify({ error: 'Invalid signature' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    const event = JSON.parse(body);
    console.log('Razorpay webhook event:', event.event);

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    switch (event.event) {
      case 'payment.failed': {
        const paymentEntity = event.payload?.payment?.entity;
        if (paymentEntity) {
          console.log('Payment failed:', paymentEntity.id, 'Order:', paymentEntity.order_id);
          
          // Update payment status in our records
          await supabaseAdmin
            .from('payments')
            .update({ 
              status: 'failed',
              updated_at: new Date().toISOString()
            })
            .eq('razorpay_order_id', paymentEntity.order_id);

          // Get user email from the payment record
          const { data: payment } = await supabaseAdmin
            .from('payments')
            .select('user_id')
            .eq('razorpay_order_id', paymentEntity.order_id)
            .single();

          if (payment?.user_id) {
            // Send failed payment notification
            try {
              await supabaseAdmin.functions.invoke('subscription-email', {
                body: {
                  user_id: payment.user_id,
                  email_type: 'payment_failed'
                }
              });
              console.log('Failed payment notification sent to user:', payment.user_id);
            } catch (emailError) {
              console.error('Failed to send payment failed email:', emailError);
            }
          }
        }
        break;
      }

      case 'payment.captured': {
        const paymentEntity = event.payload?.payment?.entity;
        if (paymentEntity) {
          console.log('Payment captured:', paymentEntity.id, 'Order:', paymentEntity.order_id);
          
          // Update payment record
          await supabaseAdmin
            .from('payments')
            .update({ 
              status: 'captured',
              razorpay_payment_id: paymentEntity.id,
              updated_at: new Date().toISOString()
            })
            .eq('razorpay_order_id', paymentEntity.order_id);
        }
        break;
      }

      case 'subscription.charged': {
        // Handle subscription renewal
        const subscriptionEntity = event.payload?.subscription?.entity;
        if (subscriptionEntity) {
          console.log('Subscription charged:', subscriptionEntity.id);
          // Could extend subscription here if using Razorpay subscriptions
        }
        break;
      }

      default:
        console.log('Unhandled webhook event:', event.event);
    }

    return new Response(
      JSON.stringify({ received: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: unknown) {
    console.error('Webhook error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
