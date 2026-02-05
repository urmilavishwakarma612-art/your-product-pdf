-- Enable RLS on payments_public view (views inherit RLS from base table when security_invoker is set)
-- First, recreate the view with security_invoker enabled
DROP VIEW IF EXISTS public.payments_public;

CREATE VIEW public.payments_public
WITH (security_invoker = on) AS
SELECT 
  id,
  user_id,
  amount,
  original_amount,
  discount_amount,
  created_at,
  updated_at,
  razorpay_order_id,
  razorpay_payment_id,
  currency,
  plan_type,
  status,
  coupon_code
FROM public.payments;

-- The view now inherits RLS from the base payments table
-- The payments table already has these policies:
-- 1. "Admins can view all payments" - SELECT for admins
-- 2. "Users cannot directly access payments table" - SELECT for admins only
-- 
-- We need to update the base table policy to allow users to see their own payments via the view

-- Add a policy allowing users to view their own payments
CREATE POLICY "Users can view own payments via public view"
ON public.payments FOR SELECT
TO authenticated
USING (auth.uid() = user_id);