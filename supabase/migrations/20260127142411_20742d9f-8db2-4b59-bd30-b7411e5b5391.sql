-- Create a public view for payments that excludes sensitive signature field
CREATE VIEW public.payments_public
WITH (security_invoker = on) AS
SELECT 
  id,
  user_id,
  amount,
  original_amount,
  discount_amount,
  razorpay_order_id,
  razorpay_payment_id,
  -- razorpay_signature is intentionally excluded for security
  currency,
  plan_type,
  status,
  coupon_code,
  created_at,
  updated_at
FROM public.payments;

-- Drop the existing user SELECT policy
DROP POLICY IF EXISTS "Users can view own payments" ON public.payments;

-- Create a new policy that denies direct user access to the base table
-- Users must use the payments_public view instead
CREATE POLICY "Users cannot directly access payments table"
ON public.payments
FOR SELECT
TO authenticated
USING (
  -- Only admins can directly access the base table
  has_role(auth.uid(), 'admin'::app_role)
);

-- Grant SELECT on the view to authenticated users
GRANT SELECT ON public.payments_public TO authenticated;

-- Add comment explaining the security model
COMMENT ON VIEW public.payments_public IS 'Secure view of payments table that excludes razorpay_signature. Users should query this view, not the base table directly.';