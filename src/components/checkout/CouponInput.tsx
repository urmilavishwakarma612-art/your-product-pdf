import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Ticket, Check, X, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";

interface Coupon {
  id: string;
  code: string;
  discount_type: string;
  monthly_discount: number;
  six_month_discount: number;
  yearly_discount: number;
  max_redemptions: number;
  current_redemptions: number;
  starts_at: string;
  expires_at: string | null;
  is_active: boolean;
}

interface CouponInputProps {
  planType: 'monthly' | 'six_month' | 'yearly';
  onCouponApplied: (discount: number, couponCode: string, couponId: string) => void;
  onCouponRemoved: () => void;
  appliedCoupon: string | null;
}

export function CouponInput({ planType, onCouponApplied, onCouponRemoved, appliedCoupon }: CouponInputProps) {
  const { user } = useAuth();
  const [couponCode, setCouponCode] = useState("");
  const [isValidating, setIsValidating] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Check if user already used this coupon
  const checkUserRedemption = async (couponId: string) => {
    if (!user) return false;
    
    const { data } = await supabase
      .from("coupon_redemptions")
      .select("id")
      .eq("user_id", user.id)
      .eq("coupon_id", couponId)
      .single();
    
    return !!data;
  };

  const validateCoupon = async () => {
    if (!couponCode.trim()) return;
    
    setIsValidating(true);
    setValidationError(null);

    try {
      // Fetch coupon
      const { data: coupon, error } = await supabase
        .from("coupons")
        .select("*")
        .eq("code", couponCode.toUpperCase())
        .eq("is_active", true)
        .single();

      if (error || !coupon) {
        setValidationError("Invalid coupon code");
        return;
      }

      // Check if expired
      if (coupon.expires_at && new Date(coupon.expires_at) < new Date()) {
        setValidationError("This coupon has expired");
        return;
      }

      // Check if not started
      if (new Date(coupon.starts_at) > new Date()) {
        setValidationError("This coupon is not yet active");
        return;
      }

      // Check max redemptions
      if (coupon.current_redemptions >= coupon.max_redemptions) {
        setValidationError("This coupon has reached its usage limit");
        return;
      }

      // Check if user already used it
      if (user) {
        const alreadyUsed = await checkUserRedemption(coupon.id);
        if (alreadyUsed) {
          setValidationError("You've already used this coupon");
          return;
        }
      }

      // Get discount for selected plan
      let discount = 0;
      switch (planType) {
        case 'monthly':
          discount = coupon.monthly_discount;
          break;
        case 'six_month':
          discount = coupon.six_month_discount;
          break;
        case 'yearly':
          discount = coupon.yearly_discount;
          break;
      }

      if (discount <= 0) {
        setValidationError("This coupon is not valid for this plan");
        return;
      }

      onCouponApplied(discount, coupon.code, coupon.id);
      toast.success("Coupon applied successfully!");
    } catch (err) {
      setValidationError("Failed to validate coupon");
    } finally {
      setIsValidating(false);
    }
  };

  const removeCoupon = () => {
    setCouponCode("");
    setValidationError(null);
    onCouponRemoved();
  };

  if (appliedCoupon) {
    return (
      <div className="flex items-center justify-between p-3 rounded-lg bg-success/10 border border-success/30">
        <div className="flex items-center gap-2">
          <Check className="w-4 h-4 text-success" />
          <span className="text-sm font-medium text-success">
            Coupon <code className="bg-success/20 px-1 rounded">{appliedCoupon}</code> applied
          </span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={removeCoupon}
          className="h-7 text-muted-foreground hover:text-foreground"
        >
          <X className="w-4 h-4" />
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Ticket className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={couponCode}
            onChange={(e) => {
              setCouponCode(e.target.value.toUpperCase());
              setValidationError(null);
            }}
            placeholder="Have a coupon?"
            className="pl-9 font-mono uppercase"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                validateCoupon();
              }
            }}
          />
        </div>
        <Button
          variant="outline"
          onClick={validateCoupon}
          disabled={isValidating || !couponCode.trim()}
        >
          {isValidating ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            "Apply"
          )}
        </Button>
      </div>
      {validationError && (
        <p className="text-xs text-destructive flex items-center gap-1">
          <X className="w-3 h-3" />
          {validationError}
        </p>
      )}
    </div>
  );
}