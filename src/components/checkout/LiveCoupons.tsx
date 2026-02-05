import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import { Tag, Copy, Check, Sparkles } from "lucide-react";
import { toast } from "sonner";

interface Coupon {
  id: string;
  code: string;
  monthly_discount: number;
  six_month_discount: number;
  yearly_discount: number;
  discount_type: string;
  max_redemptions: number;
  current_redemptions: number;
  expires_at: string | null;
}

export function LiveCoupons() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCoupons = async () => {
      const now = new Date().toISOString();
      const { data, error } = await supabase
        .from("coupons")
        .select("*")
        .eq("is_active", true)
        .lte("starts_at", now)
        .order("created_at", { ascending: false })
        .limit(3);

      if (!error && data) {
        // Filter out expired coupons and fully redeemed ones
        const validCoupons = data.filter((coupon) => {
          const notExpired = !coupon.expires_at || new Date(coupon.expires_at) > new Date();
          const hasRedemptions = coupon.current_redemptions < coupon.max_redemptions;
          return notExpired && hasRedemptions;
        });
        setCoupons(validCoupons);
      }
      setLoading(false);
    };

    fetchCoupons();
  }, []);

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    toast.success(`Coupon "${code}" copied!`);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const getMaxDiscount = (coupon: Coupon) => {
    return Math.max(coupon.monthly_discount, coupon.six_month_discount, coupon.yearly_discount);
  };

  const getRemainingSlots = (coupon: Coupon) => {
    return coupon.max_redemptions - coupon.current_redemptions;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-4">
        <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (coupons.length === 0) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="max-w-md mx-auto mb-6"
    >
      <div className="flex items-center justify-center gap-2 mb-3">
        <Sparkles className="w-4 h-4 text-primary" />
        <span className="text-sm font-medium text-foreground">Available Offers</span>
      </div>
      
      <div className="space-y-2">
        {coupons.map((coupon) => (
          <motion.div
            key={coupon.id}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => copyCode(coupon.code)}
            className="glass-card p-3 border-primary/30 bg-gradient-to-r from-primary/5 to-secondary/5 cursor-pointer group"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Tag className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <code className="px-2 py-0.5 rounded bg-primary/10 text-primary font-bold text-sm">
                      {coupon.code}
                    </code>
                    {copiedCode === coupon.code ? (
                      <Check className="w-4 h-4 text-success" />
                    ) : (
                      <Copy className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Save up to ₹{getMaxDiscount(coupon)} • {getRemainingSlots(coupon)} left
                  </p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-xs font-medium text-success bg-success/10 px-2 py-1 rounded-full">
                  {coupon.discount_type === "percentage" ? `${getMaxDiscount(coupon)}% OFF` : `₹${getMaxDiscount(coupon)} OFF`}
                </span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
      
      <p className="text-xs text-muted-foreground text-center mt-3">
        Click to copy • Apply in the coupon field above
      </p>
    </motion.div>
  );
}
