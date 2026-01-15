-- Create coupons table for admin-managed discount codes
CREATE TABLE public.coupons (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code VARCHAR(50) NOT NULL UNIQUE,
  discount_type VARCHAR(20) NOT NULL DEFAULT 'fixed' CHECK (discount_type IN ('fixed', 'percentage')),
  -- Discount values for each plan (in paise for fixed, percentage for percentage type)
  monthly_discount INTEGER NOT NULL DEFAULT 0,
  six_month_discount INTEGER NOT NULL DEFAULT 0,
  yearly_discount INTEGER NOT NULL DEFAULT 0,
  max_redemptions INTEGER NOT NULL DEFAULT 100,
  current_redemptions INTEGER NOT NULL DEFAULT 0,
  starts_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create coupon redemptions tracking
CREATE TABLE public.coupon_redemptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  coupon_id UUID NOT NULL REFERENCES public.coupons(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  payment_id UUID REFERENCES public.payments(id) ON DELETE SET NULL,
  redeemed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create refund requests table
CREATE TABLE public.refund_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  payment_id UUID NOT NULL REFERENCES public.payments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  reason TEXT NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'processed')),
  admin_notes TEXT,
  refund_amount INTEGER,
  processed_at TIMESTAMP WITH TIME ZONE,
  processed_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add coupon_code to payments table
ALTER TABLE public.payments 
ADD COLUMN coupon_code VARCHAR(50),
ADD COLUMN original_amount INTEGER,
ADD COLUMN discount_amount INTEGER DEFAULT 0;

-- Add plan_type options for new plans (update check constraint won't work, use trigger instead)
-- Create a validation function for plan types
CREATE OR REPLACE FUNCTION public.validate_plan_type()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.plan_type NOT IN ('monthly', 'six_month', 'yearly', 'lifetime') THEN
    RAISE EXCEPTION 'Invalid plan_type: %', NEW.plan_type;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for plan type validation
CREATE TRIGGER validate_payment_plan_type
  BEFORE INSERT OR UPDATE ON public.payments
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_plan_type();

-- Enable RLS
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupon_redemptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.refund_requests ENABLE ROW LEVEL SECURITY;

-- Coupons policies (public can read active coupons, admin can manage)
CREATE POLICY "Anyone can view active coupons"
  ON public.coupons FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins can manage coupons"
  ON public.coupons FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- Coupon redemptions policies
CREATE POLICY "Users can view their own redemptions"
  ON public.coupon_redemptions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "System can insert redemptions"
  ON public.coupon_redemptions FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Admins can view all redemptions"
  ON public.coupon_redemptions FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

-- Refund requests policies
CREATE POLICY "Users can view their own refund requests"
  ON public.refund_requests FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create refund requests for their payments"
  ON public.refund_requests FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can manage all refund requests"
  ON public.refund_requests FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- Create indexes for performance
CREATE INDEX idx_coupons_code ON public.coupons(code);
CREATE INDEX idx_coupons_active ON public.coupons(is_active);
CREATE INDEX idx_coupon_redemptions_user ON public.coupon_redemptions(user_id);
CREATE INDEX idx_coupon_redemptions_coupon ON public.coupon_redemptions(coupon_id);
CREATE INDEX idx_refund_requests_user ON public.refund_requests(user_id);
CREATE INDEX idx_refund_requests_status ON public.refund_requests(status);

-- Insert the launch coupon NEX100
INSERT INTO public.coupons (code, discount_type, monthly_discount, six_month_discount, yearly_discount, max_redemptions, is_active)
VALUES ('NEX100', 'fixed', 5000, 20000, 30000, 100, true);

-- Update triggers for updated_at
CREATE TRIGGER update_coupons_updated_at
  BEFORE UPDATE ON public.coupons
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_refund_requests_updated_at
  BEFORE UPDATE ON public.refund_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();