-- Fix Security Definer View issue with payments_public
-- Drop and recreate with SECURITY INVOKER (default) instead of SECURITY DEFINER

DROP VIEW IF EXISTS public.payments_public;

-- Recreate view without security_barrier (which implies SECURITY DEFINER)
-- Using a simpler approach that respects RLS on the base table
CREATE VIEW public.payments_public AS
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