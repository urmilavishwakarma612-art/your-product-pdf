import { useRef, useState, useEffect } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { Check, Crown, Sparkles, Zap, Shield, Star, Brain, Trophy, Target, X, ArrowRight, Flame, Clock, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link, useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { useAuth } from "@/hooks/useAuth";
import { useSubscription } from "@/hooks/useSubscription";
import { useRazorpay } from "@/hooks/useRazorpay";
import { PaymentOverlay } from "@/components/premium/PaymentOverlay";
import { CouponInput } from "@/components/checkout/CouponInput";
import { LiveCoupons } from "@/components/checkout/LiveCoupons";
import { Helmet } from "react-helmet-async";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

type PlanType = 'monthly' | 'six_month' | 'yearly';
type PaymentStatus = 'loading' | 'success' | 'error' | null;

interface AppliedCoupon {
  code: string;
  monthlyDiscount: number;
  sixMonthDiscount: number;
  yearlyDiscount: number;
  discountType?: "fixed" | "percentage";
}

interface LaunchOfferSettings {
  id: string;
  title: string;
  description: string | null;
  end_date: string;
  is_active: boolean;
}

// Countdown Timer Component
const CountdownTimer = ({ offer }: { offer: LaunchOfferSettings | null }) => {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  useEffect(() => {
    if (!offer) return;
    
    const endDate = new Date(offer.end_date);

    const timer = setInterval(() => {
      const now = new Date().getTime();
      const distance = endDate.getTime() - now;

      if (distance > 0) {
        setTimeLeft({
          days: Math.floor(distance / (1000 * 60 * 60 * 24)),
          hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
          seconds: Math.floor((distance % (1000 * 60)) / 1000),
        });
      } else {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [offer]);

  if (!offer) return null;

  // Don't show if offer has expired
  const now = new Date().getTime();
  const endTime = new Date(offer.end_date).getTime();
  if (endTime <= now) return null;

  const TimeBox = ({ value, label }: { value: number; label: string }) => (
    <div className="flex flex-col items-center">
      <div className="relative">
        <div className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-xl bg-gradient-to-br from-primary/20 to-secondary/20 border border-primary/30 flex items-center justify-center backdrop-blur-sm">
          <span className="text-lg sm:text-xl md:text-2xl font-bold gradient-text">
            {value.toString().padStart(2, '0')}
          </span>
        </div>
        <div className="absolute -inset-0.5 bg-gradient-to-r from-primary/20 to-secondary/20 rounded-xl blur opacity-50" />
      </div>
      <span className="text-[10px] sm:text-xs text-muted-foreground mt-1.5 font-medium">{label}</span>
    </div>
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15 }}
      className="mb-8"
    >
      <div className="glass-card p-4 sm:p-5 border-primary/30 bg-gradient-to-r from-primary/5 via-secondary/5 to-primary/5 max-w-sm mx-auto">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Clock className="w-4 h-4 text-primary animate-pulse" />
          <span className="text-xs sm:text-sm font-semibold text-primary">{offer.title}</span>
        </div>
        {offer.description && (
          <p className="text-xs text-muted-foreground text-center mb-3">{offer.description}</p>
        )}
        <div className="flex items-center justify-center gap-1.5 sm:gap-2">
          <TimeBox value={timeLeft.days} label="Days" />
          <span className="text-lg font-bold text-primary/50 mt-[-16px]">:</span>
          <TimeBox value={timeLeft.hours} label="Hours" />
          <span className="text-lg font-bold text-primary/50 mt-[-16px]">:</span>
          <TimeBox value={timeLeft.minutes} label="Mins" />
          <span className="text-lg font-bold text-primary/50 mt-[-16px]">:</span>
          <TimeBox value={timeLeft.seconds} label="Secs" />
        </div>
      </div>
    </motion.div>
  );
};

const comparisonData = [
  { feature: "Structured, pattern-first curriculum", youtube: false, leetcode: false, paidCourses: "partial", nexalgotrix: true },
  { feature: "Interview simulator (copy-paste disabled)", youtube: false, leetcode: false, paidCourses: false, nexalgotrix: true },
  { feature: "4-layer AI support per question", youtube: false, leetcode: false, paidCourses: false, nexalgotrix: true },
  { feature: "Forces thinking (no spoon-feeding)", youtube: false, leetcode: false, paidCourses: "partial", nexalgotrix: true },
  { feature: "Badges & rewards for consistency", youtube: false, leetcode: "partial", paidCourses: false, nexalgotrix: true },
  { feature: "Daily learning tracker", youtube: false, leetcode: "partial", paidCourses: false, nexalgotrix: true },
  { feature: "Leaderboard for competition", youtube: false, leetcode: "partial", paidCourses: false, nexalgotrix: true },
  { feature: "Weekly DSA contests", youtube: false, leetcode: "partial", paidCourses: false, nexalgotrix: true },
  { feature: "Job apply (DSA-focused roles)", youtube: false, leetcode: false, paidCourses: false, nexalgotrix: true },
  { feature: "Referral rewards (Pro / cash)", youtube: false, leetcode: false, paidCourses: false, nexalgotrix: true },
];

function PricingContent() {
  const sectionRef = useRef<HTMLElement>(null);
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isPremium, refetch } = useSubscription();
  const { initiatePayment, isLoading } = useRazorpay();
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<AppliedCoupon | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<PlanType>('six_month');

  // Fetch launch offer settings
  const { data: launchOffer } = useQuery({
    queryKey: ["launch-offer"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("launch_offer_settings")
        .select("*")
        .eq("is_active", true)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      
      if (error) throw error;
      return data as LaunchOfferSettings | null;
    },
  });

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  });

  const backgroundY = useTransform(scrollYProgress, [0, 1], [50, -50]);

  const basePrices = {
    monthly: 19900,
    six_month: 99900,
    yearly: 149900,
  };

  const getBasePrice = (plan: PlanType) => basePrices[plan];

  const getDiscountPaise = (plan: PlanType) => {
    if (!appliedCoupon) return 0;
    const basePrice = getBasePrice(plan);

    // Coupon values are stored in PAISE in the database
    const discountPaise =
      plan === "monthly"
        ? appliedCoupon.monthlyDiscount
        : plan === "six_month"
          ? appliedCoupon.sixMonthDiscount
          : appliedCoupon.yearlyDiscount;

    const discountType = appliedCoupon.discountType || "fixed";
    
    // For percentage type, calculate percentage of base price
    const actualDiscount =
      discountType === "percentage" ? Math.round(basePrice * (discountPaise / 100)) : discountPaise;

    // Cap discount to ensure minimum ₹10 (1000 paise) final payment
    const maxDiscount = basePrice - 1000;
    return Math.min(Math.max(0, actualDiscount), Math.max(0, maxDiscount));
  };

  const getDiscountedPrice = (plan: PlanType) => {
    const basePrice = getBasePrice(plan);
    const discountPaise = getDiscountPaise(plan);
    // Ensure minimum ₹10 payment
    return Math.max(1000, basePrice - discountPaise);
  };

  const formatRupees = (paise: number) => Math.round(paise / 100);

  const handleUpgrade = async (plan: PlanType) => {
    if (!user) {
      navigate('/auth?upgrade=1');
      return;
    }

    if (isPremium) {
      navigate('/curriculum');
      return;
    }

    setPaymentStatus('loading');
    setErrorMessage('');

    initiatePayment(
      plan,
      () => {
        setPaymentStatus('success');
        refetch();
      },
      (error) => {
        setPaymentStatus('error');
        setErrorMessage(error || 'An unexpected error occurred');
      },
      appliedCoupon?.code,
      () => {
        // On dismiss - stay on pricing page, reset loading state
        setPaymentStatus(null);
      }
    );
  };

  const handleRetry = () => {
    setPaymentStatus(null);
    setErrorMessage('');
    handleUpgrade(selectedPlan);
  };

  const handlePaymentClose = () => {
    setPaymentStatus(null);
    setErrorMessage('');
    if (paymentStatus === 'success') {
      navigate('/curriculum');
    }
  };

  const handleCouponApply = (coupon: {
    code: string;
    monthlyDiscount: number;
    sixMonthDiscount: number;
    yearlyDiscount: number;
    couponId: string;
    discountType?: "fixed" | "percentage";
  }) => {
    setAppliedCoupon(coupon);
  };

  const handleCouponRemove = () => {
    setAppliedCoupon(null);
  };

  const renderCheckIcon = (value: boolean | string) => {
    if (value === true) return <Check className="w-4 h-4 sm:w-5 sm:h-5 text-success mx-auto" />;
    if (value === "partial") return <span className="text-xs sm:text-sm text-warning">⚠️</span>;
    return <X className="w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground/40 mx-auto" />;
  };

  return (
    <>
      <PaymentOverlay
        status={paymentStatus}
        errorMessage={errorMessage}
        onRetry={handleRetry}
        onClose={handlePaymentClose}
      />

      <section 
        ref={sectionRef}
        className="pb-12 sm:pb-20 relative overflow-hidden"
      >
        <motion.div
          style={{ y: backgroundY }}
          className="absolute inset-0 bg-gradient-to-b from-background via-card/30 to-background pointer-events-none"
        />
        
        <div className="absolute top-20 right-10 w-32 sm:w-64 h-32 sm:h-64 bg-primary/5 rounded-full blur-[80px] pointer-events-none" />
        <div className="absolute bottom-20 left-10 w-40 sm:w-80 h-40 sm:h-80 bg-secondary/5 rounded-full blur-[100px] pointer-events-none" />

        <div className="container px-4 relative z-10 max-w-5xl mx-auto">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="text-center max-w-3xl mx-auto mb-6"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 mb-4"
            >
              <Zap className="w-3 h-3 sm:w-4 sm:h-4 text-primary" />
              <span className="text-xs sm:text-sm font-medium text-primary">💸 Simple, Fair, Student-First</span>
            </motion.div>
            <h1 className="text-2xl sm:text-4xl md:text-5xl font-bold mb-3 sm:mb-4 tracking-tight">
              Same features in <span className="gradient-text">every plan</span>
            </h1>
            <p className="text-sm sm:text-lg text-muted-foreground leading-relaxed mb-2">
              Pay only for how long you want to stay consistent.
            </p>
            <p className="text-xs sm:text-sm text-muted-foreground">
              No feature locking. No forced upgrades. Just real DSA preparation.
            </p>
          </motion.div>

          {/* Countdown Timer */}
          <CountdownTimer offer={launchOffer ?? null} />

          {/* Live Coupons Display */}
          <LiveCoupons />

          {/* Coupon Input */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="max-w-md mx-auto mb-8"
          >
            <CouponInput 
              planType={selectedPlan}
              onCouponApply={handleCouponApply}
              onCouponRemove={handleCouponRemove}
            />
          </motion.div>

          {/* Pricing Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 mb-12">
            {/* Monthly Plan */}
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
              whileHover={{ y: -4 }}
              onClick={() => setSelectedPlan('monthly')}
              onPointerUp={() => setSelectedPlan('monthly')}
              onTouchEnd={() => setSelectedPlan('monthly')}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') setSelectedPlan('monthly');
              }}
              className={`interactive-card p-4 sm:p-6 relative cursor-pointer transition-all select-none ${
                selectedPlan === 'monthly' ? 'ring-2 ring-primary border-primary' : ''
              }`}
            >
              {selectedPlan === 'monthly' && (
                <div className="absolute top-3 right-3 pointer-events-none">
                  <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                    <Check className="w-3 h-3 text-primary-foreground" />
                  </div>
                </div>
              )}
              <div className="mb-4 sm:mb-6">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-success/10 border border-success/20 mb-3">
                  <span className="text-xs font-medium text-success">🟢 Monthly Plan</span>
                </div>
                <p className="text-xs sm:text-sm text-muted-foreground">Best to try the platform</p>
              </div>

              <div className="mb-4 sm:mb-6">
                <div className="flex items-baseline gap-2">
                  {appliedCoupon && getDiscountPaise('monthly') > 0 && (
                    <span className="text-base text-muted-foreground line-through">₹199</span>
                  )}
                  <span className="text-3xl sm:text-4xl font-bold gradient-text">
                    ₹{Math.round(getDiscountedPrice('monthly') / 100)}
                  </span>
                  <span className="text-muted-foreground text-sm">/month</span>
                </div>
                {appliedCoupon && getDiscountPaise('monthly') > 0 && (
                  <p className="text-xs text-success mt-1 flex items-center gap-1">
                    <Tag className="w-3 h-3" />
                    Save ₹{formatRupees(getDiscountPaise('monthly'))}
                  </p>
                )}
              </div>

              <Button 
                variant={selectedPlan === 'monthly' ? 'default' : 'outline'}
                className="w-full rounded-xl h-10 text-sm" 
                size="lg"
                onClick={(e) => {
                  e.stopPropagation();
                  handleUpgrade('monthly');
                }}
                disabled={isLoading || isPremium}
              >
                {isPremium ? (
                  <><Check className="w-4 h-4 mr-2" />You're Pro</>
                ) : (
                  <>Start @ ₹{Math.round(getDiscountedPrice('monthly') / 100)}</>
                )}
              </Button>
            </motion.div>

            {/* 6 Months Plan - Most Popular */}
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
              whileHover={{ y: -4 }}
              onClick={() => setSelectedPlan('six_month')}
              onPointerUp={() => setSelectedPlan('six_month')}
              onTouchEnd={() => setSelectedPlan('six_month')}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') setSelectedPlan('six_month');
              }}
              className={`relative cursor-pointer select-none ${
                selectedPlan === 'six_month' ? 'ring-2 ring-primary' : ''
              }`}
            >
              <div className="absolute -inset-0.5 bg-gradient-to-r from-primary via-secondary to-accent rounded-2xl blur opacity-30 pointer-events-none" />
              
              <div
                className="interactive-card p-4 sm:p-6 relative border-primary/30 hover:border-primary/50 h-full"
                onClick={(e) => {
                  // Ensure taps on inner content always select the plan
                  e.stopPropagation();
                  setSelectedPlan('six_month');
                }}
                onPointerUp={(e) => {
                  e.stopPropagation();
                  setSelectedPlan('six_month');
                }}
              >
                <motion.div 
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="absolute -top-3 left-1/2 -translate-x-1/2 pointer-events-none"
                >
                  <motion.div 
                    animate={{ y: [0, -2, 0] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                    className="px-3 py-1 rounded-full bg-gradient-to-r from-primary to-secondary text-xs font-bold text-primary-foreground flex items-center gap-1"
                  >
                    <Star className="w-3 h-3" />
                    MOST POPULAR
                  </motion.div>
                </motion.div>
                
                <div className="mb-4 sm:mb-6 pt-2">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 mb-3">
                    <span className="text-xs font-medium text-primary">⭐ 6 Month Plan</span>
                  </div>
                  <p className="text-xs sm:text-sm text-muted-foreground">Best for serious learners</p>
                </div>

                <div className="mb-4 sm:mb-6">
                  <div className="flex items-baseline gap-2">
                    {appliedCoupon && getDiscountPaise('six_month') > 0 && (
                      <span className="text-base text-muted-foreground line-through">₹999</span>
                    )}
                    <span className="text-3xl sm:text-4xl font-bold gradient-text">
                      ₹{Math.round(getDiscountedPrice('six_month') / 100)}
                    </span>
                    <span className="text-muted-foreground text-sm">/6 months</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">~₹{Math.round(getDiscountedPrice('six_month') / 600)}/month</p>
                  {appliedCoupon && getDiscountPaise('six_month') > 0 && (
                    <p className="text-xs text-success mt-1 flex items-center gap-1">
                      <Tag className="w-3 h-3" />
                      Save ₹{formatRupees(getDiscountPaise('six_month'))}
                    </p>
                  )}
                </div>

                <Button 
                  className="w-full rounded-xl h-10 text-sm btn-primary-glow" 
                  size="lg"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleUpgrade('six_month');
                  }}
                  disabled={isLoading || isPremium}
                >
                  {isPremium ? (
                    <><Check className="w-4 h-4 mr-2" />You're Pro</>
                  ) : (
                    <>Get Started @ ₹{Math.round(getDiscountedPrice('six_month') / 100)}</>
                  )}
                </Button>
              </div>
            </motion.div>

            {/* Yearly Plan */}
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
              whileHover={{ y: -4 }}
              onClick={() => setSelectedPlan('yearly')}
              onPointerUp={() => setSelectedPlan('yearly')}
              onTouchEnd={() => setSelectedPlan('yearly')}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') setSelectedPlan('yearly');
              }}
              className={`interactive-card p-4 sm:p-6 relative cursor-pointer transition-all select-none ${
                selectedPlan === 'yearly' ? 'ring-2 ring-primary border-primary' : ''
              }`}
            >
              {selectedPlan === 'yearly' && (
                <div className="absolute top-3 right-3 pointer-events-none">
                  <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                    <Check className="w-3 h-3 text-primary-foreground" />
                  </div>
                </div>
              )}
              <div className="mb-4 sm:mb-6">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 mb-3">
                  <Crown className="w-3 h-3 text-amber-500" />
                  <span className="text-xs font-medium text-amber-500">Yearly Plan</span>
                </div>
                <p className="text-xs sm:text-sm text-muted-foreground">Maximum value</p>
              </div>

              <div className="mb-4 sm:mb-6">
                <div className="flex items-baseline gap-2">
                  {appliedCoupon && getDiscountPaise('yearly') > 0 && (
                    <span className="text-base text-muted-foreground line-through">₹1,499</span>
                  )}
                  <span className="text-3xl sm:text-4xl font-bold gradient-text">
                    ₹{Math.round(getDiscountedPrice('yearly') / 100)}
                  </span>
                  <span className="text-muted-foreground text-sm">/year</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">~₹{Math.round(getDiscountedPrice('yearly') / 1200)}/month</p>
                {appliedCoupon && getDiscountPaise('yearly') > 0 && (
                  <p className="text-xs text-success mt-1 flex items-center gap-1">
                    <Tag className="w-3 h-3" />
                    Save ₹{formatRupees(getDiscountPaise('yearly'))}
                  </p>
                )}
              </div>

              <Button 
                variant={selectedPlan === 'yearly' ? 'default' : 'outline'}
                className="w-full rounded-xl h-10 text-sm" 
                size="lg"
                onClick={(e) => {
                  e.stopPropagation();
                  handleUpgrade('yearly');
                }}
                disabled={isLoading || isPremium}
              >
                {isPremium ? (
                  <><Check className="w-4 h-4 mr-2" />You're Pro</>
                ) : (
                  <>Start @ ₹{Math.round(getDiscountedPrice('yearly') / 100)}</>
                )}
              </Button>
            </motion.div>
          </div>

          {/* Comparison Table */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.8 }}
            className="mb-12"
          >
            <h2 className="text-xl sm:text-2xl font-bold text-center mb-6">
              Why NexAlgoTrix <span className="gradient-text">beats</span> alternatives
            </h2>
            
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-2 sm:px-4 font-medium">Feature</th>
                    <th className="py-3 px-2 sm:px-4 text-center font-medium">YouTube</th>
                    <th className="py-3 px-2 sm:px-4 text-center font-medium">LeetCode</th>
                    <th className="py-3 px-2 sm:px-4 text-center font-medium">Paid Courses</th>
                    <th className="py-3 px-2 sm:px-4 text-center font-medium text-primary">NexAlgoTrix</th>
                  </tr>
                </thead>
                <tbody>
                  {comparisonData.map((row, index) => (
                    <tr key={index} className="border-b border-border/50">
                      <td className="py-3 px-2 sm:px-4 text-xs sm:text-sm">{row.feature}</td>
                      <td className="py-3 px-2 sm:px-4">{renderCheckIcon(row.youtube)}</td>
                      <td className="py-3 px-2 sm:px-4">{renderCheckIcon(row.leetcode)}</td>
                      <td className="py-3 px-2 sm:px-4">{renderCheckIcon(row.paidCourses)}</td>
                      <td className="py-3 px-2 sm:px-4">{renderCheckIcon(row.nexalgotrix)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>

          {/* Money Back Guarantee */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.8 }}
            className="text-center"
          >
            <div className="inline-flex items-center gap-3 px-6 py-4 rounded-2xl bg-gradient-to-r from-primary/10 to-secondary/10 border border-primary/20">
              <Shield className="w-8 h-8 text-primary" />
              <div className="text-left">
                <p className="font-bold">7-Day Money Back Guarantee</p>
                <p className="text-sm text-muted-foreground">No questions asked. Full refund if not satisfied.</p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    </>
  );
}

export default function Pricing() {
  const { user } = useAuth();

  // For logged-in users, use AppLayout
  if (user) {
    return (
      <>
        <Helmet>
          <title>Upgrade Pro - NexAlgoTrix | Unlock Full DSA Learning</title>
          <meta name="description" content="Upgrade to NexAlgoTrix Pro. All features in every plan. Monthly ₹199, 6 Months ₹999, Yearly ₹1,499. No feature locking." />
        </Helmet>
        <AppLayout>
          <PricingContent />
        </AppLayout>
      </>
    );
  }

  // For non-logged-in users, use Navbar + Footer
  return (
    <>
      <Helmet>
        <title>Upgrade Pro - NexAlgoTrix | Unlock Full DSA Learning</title>
        <meta name="description" content="Upgrade to NexAlgoTrix Pro. All features in every plan. Monthly ₹199, 6 Months ₹999, Yearly ₹1,499. No feature locking." />
      </Helmet>
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="pt-24">
          <PricingContent />
        </div>
        <Footer />
      </div>
    </>
  );
}