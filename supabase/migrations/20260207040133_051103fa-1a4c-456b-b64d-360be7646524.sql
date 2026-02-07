-- Fix Security Definer View issue - add security_invoker=on to payments_public view
DROP VIEW IF EXISTS public.payments_public;

CREATE VIEW public.payments_public 
WITH (security_invoker = on)
AS
SELECT 
  id,
  user_id,
  amount,
  currency,
  plan_type,
  status,
  razorpay_order_id,
  razorpay_payment_id,
  coupon_code,
  discount_amount,
  original_amount,
  created_at,
  updated_at
FROM public.payments;