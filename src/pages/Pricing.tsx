import { useRef, useState, useEffect } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { Check, Crown, Sparkles, Zap, Shield, Star, Brain, Trophy, Target, X, ArrowRight, Flame, Clock, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link, useNavigate } from "react-router-dom";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { useAuth } from "@/hooks/useAuth";
import { useSubscription } from "@/hooks/useSubscription";
import { useRazorpay } from "@/hooks/useRazorpay";
import { PaymentOverlay } from "@/components/premium/PaymentOverlay";
import { CouponInput } from "@/components/checkout/CouponInput";
import { Helmet } from "react-helmet-async";

type PlanType = 'monthly' | 'six_month' | 'yearly';
type PaymentStatus = 'loading' | 'success' | 'error' | null;

interface AppliedCoupon {
  code: string;
  // NOTE: stored in the backend as amounts in paise (not ₹)
  monthlyDiscount: number;
  sixMonthDiscount: number;
  yearlyDiscount: number;
  discountType?: "fixed" | "percentage";
}

// Countdown Timer Component
const CountdownTimer = () => {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  useEffect(() => {
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 7);

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
      }
    }, 1000);

    return () => clearInterval(timer);
  }, []);

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
        <div className="flex items-center justify-center gap-2 mb-3">
          <Clock className="w-4 h-4 text-primary animate-pulse" />
          <span className="text-xs sm:text-sm font-semibold text-primary">Launch Offer Ends In</span>
        </div>
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

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

const allFeatures = [
  "Structured, pattern-first DSA curriculum",
  "Interview simulator (copy-paste disabled)",
  "4-layer AI support on every question",
  "Forces thinking before coding",
  "Badges & rewards for consistency",
  "Daily learning tracker",
  "Leaderboard to compete",
  "Weekly DSA contests",
  "Job apply section (DSA-focused)",
  "Referral system for rewards",
];

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

export default function Pricing() {
  const sectionRef = useRef<HTMLElement>(null);
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isPremium, refetch } = useSubscription();
  const { initiatePayment, isLoading } = useRazorpay();
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<AppliedCoupon | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<PlanType>('six_month');

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  });

  const backgroundY = useTransform(scrollYProgress, [0, 1], [50, -50]);

  // Base prices in paise
  const basePrices = {
    monthly: 19900,
    six_month: 99900,
    yearly: 149900,
  };

  const getBasePrice = (plan: PlanType) => basePrices[plan];

  const getDiscountPaise = (plan: PlanType) => {
    if (!appliedCoupon) return 0;
    const basePrice = getBasePrice(plan);

    const raw =
      plan === "monthly"
        ? appliedCoupon.monthlyDiscount
        : plan === "six_month"
          ? appliedCoupon.sixMonthDiscount
          : appliedCoupon.yearlyDiscount;

    // Backward compatible:
    // - fixed coupons store amounts in paise (e.g., ₹50 => 5000)
    // - percentage coupons store percent (e.g., 10 => 10%)
    const discountType = appliedCoupon.discountType || "fixed";
    const discountPaise =
      discountType === "percentage" ? Math.round(basePrice * (raw / 100)) : raw;

    // Never exceed base price
    return Math.min(Math.max(0, discountPaise), basePrice);
  };

  // Calculate discounted prices - ensure never negative
  const getDiscountedPrice = (plan: PlanType) => {
    const basePrice = getBasePrice(plan);
    const discountPaise = getDiscountPaise(plan);
    return Math.max(0, basePrice - discountPaise);
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
      appliedCoupon?.code
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
      <Helmet>
        <title>Pricing - NexAlgoTrix | Student-First DSA Learning Plans</title>
        <meta name="description" content="Simple, fair, student-first pricing. All features in every plan. Monthly ₹199, 6 Months ₹999, Yearly ₹1,499. No feature locking." />
      </Helmet>

      <PaymentOverlay
        status={paymentStatus}
        errorMessage={errorMessage}
        onRetry={handleRetry}
        onClose={handlePaymentClose}
      />

      <div className="min-h-screen bg-background">
        <Navbar />
        
        <section 
          ref={sectionRef}
          className="pt-20 sm:pt-28 pb-12 sm:pb-20 relative overflow-hidden"
        >
          {/* Background */}
          <motion.div
            style={{ y: backgroundY }}
            className="absolute inset-0 bg-gradient-to-b from-background via-card/30 to-background pointer-events-none"
          />
          
          {/* Decorative orbs */}
          <div className="absolute top-20 right-10 w-32 sm:w-64 h-32 sm:h-64 bg-primary/5 rounded-full blur-[80px] pointer-events-none" />
          <div className="absolute bottom-20 left-10 w-40 sm:w-80 h-40 sm:h-80 bg-secondary/5 rounded-full blur-[100px] pointer-events-none" />

          <div className="container px-4 relative z-10">
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
            <CountdownTimer />

            {/* Coupon Hint - Show available offer */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="max-w-md mx-auto mb-4"
            >
              <div className="glass-card p-3 border-primary/30 bg-gradient-to-r from-primary/5 to-secondary/5">
                <div className="flex items-center justify-center gap-2 text-sm">
                  <Tag className="w-4 h-4 text-primary" />
                  <span className="font-medium text-primary">Launch Offer:</span>
                  <code className="px-2 py-0.5 rounded bg-primary/10 text-primary font-bold">NEX100</code>
                  <span className="text-muted-foreground">• Save up to ₹300</span>
                </div>
              </div>
            </motion.div>

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

            {/* Pricing Cards - 3 columns */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 max-w-5xl mx-auto mb-12">
              {/* Monthly Plan */}
              <motion.div
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                whileHover={{ y: -4 }}
                onClick={() => setSelectedPlan('monthly')}
                className={`interactive-card p-4 sm:p-6 relative cursor-pointer transition-all ${
                  selectedPlan === 'monthly' ? 'ring-2 ring-primary border-primary' : ''
                }`}
              >
                {selectedPlan === 'monthly' && (
                  <div className="absolute top-3 right-3">
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
                className={`relative cursor-pointer ${
                  selectedPlan === 'six_month' ? 'ring-2 ring-primary' : ''
                }`}
              >
                {/* Glow effect */}
                <div className="absolute -inset-0.5 bg-gradient-to-r from-primary via-secondary to-accent rounded-2xl blur opacity-30" />
                
                <div className="interactive-card p-4 sm:p-6 relative border-primary/30 hover:border-primary/50 h-full">
                  {/* Popular Badge */}
                  <motion.div 
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="absolute -top-3 left-1/2 -translate-x-1/2"
                  >
                    <motion.div 
                      animate={{ y: [0, -2, 0] }}
                      transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                      className="flex items-center gap-1 px-3 py-1 rounded-full bg-gradient-to-r from-primary to-secondary text-primary-foreground text-xs font-semibold shadow-lg shadow-primary/25"
                    >
                      <Star className="w-3 h-3 fill-current" />
                      Most Popular
                    </motion.div>
                  </motion.div>

                  <div className="mb-4 sm:mb-6 pt-2">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 mb-3">
                      <span className="text-xs font-medium text-primary">⭐ 6 Months Plan</span>
                    </div>
                    <p className="text-xs sm:text-sm text-muted-foreground">Best for semester prep</p>
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
                    <p className="text-xs text-success mt-1 font-medium">
                      ≈ ₹{Math.round(getDiscountedPrice('six_month') / 600)}/month
                    </p>
                    {appliedCoupon && getDiscountPaise('six_month') > 0 && (
                      <p className="text-xs text-success mt-1 flex items-center gap-1">
                        <Tag className="w-3 h-3" />
                        Save ₹{formatRupees(getDiscountPaise('six_month'))}
                      </p>
                    )}
                  </div>

                  <Button 
                    className="w-full btn-primary-glow rounded-xl h-10 text-sm" 
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
                      <>
                        <Sparkles className="w-4 h-4 mr-2" />
                        Go Serious @ ₹{Math.round(getDiscountedPrice('six_month') / 100)}
                      </>
                    )}
                  </Button>
                </div>
              </motion.div>

              {/* Yearly Plan - Best Value */}
              <motion.div
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
                whileHover={{ y: -4 }}
                onClick={() => setSelectedPlan('yearly')}
                className={`interactive-card p-4 sm:p-6 relative cursor-pointer transition-all ${
                  selectedPlan === 'yearly' ? 'ring-2 ring-primary' : ''
                }`}
              >
                <div className="mb-4 sm:mb-6">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-500/10 border border-violet-500/20 mb-3">
                    <span className="text-xs font-medium text-violet-400">💎 1 Year Plan</span>
                  </div>
                  <p className="text-xs sm:text-sm text-muted-foreground">Best for placements</p>
                </div>

                <div className="mb-4 sm:mb-6">
                  <div className="flex items-baseline gap-2">
                    {appliedCoupon && getDiscountPaise('yearly') > 0 && (
                      <span className="text-base text-muted-foreground line-through">₹1,499</span>
                    )}
                    <span className="text-3xl sm:text-4xl font-bold gradient-text">
                      ₹{Math.round(getDiscountedPrice('yearly') / 100).toLocaleString()}
                    </span>
                    <span className="text-muted-foreground text-sm">/year</span>
                  </div>
                  <p className="text-xs text-success mt-1 font-medium">
                    ≈ ₹{Math.round(getDiscountedPrice('yearly') / 1200)}/month
                  </p>
                  {appliedCoupon && getDiscountPaise('yearly') > 0 && (
                    <p className="text-xs text-success mt-1 flex items-center gap-1">
                      <Tag className="w-3 h-3" />
                      Save ₹{formatRupees(getDiscountPaise('yearly'))}
                    </p>
                  )}
                  <div className="inline-flex items-center gap-1 mt-2">
                    <Crown className="w-3 h-3 text-violet-400" />
                    <span className="text-xs font-medium text-violet-400">Best Value</span>
                  </div>
                </div>

                <Button 
                  variant="outline"
                  className="w-full rounded-xl h-10 text-sm border-violet-500/50 hover:bg-violet-500/10" 
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
                    <>Go All-In @ ₹{Math.round(getDiscountedPrice('yearly') / 100).toLocaleString()}</>
                  )}
                </Button>
              </motion.div>
            </div>

            {/* Important Note */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="max-w-xl mx-auto mb-12"
            >
              <div className="glass-card p-4 text-center border-primary/20">
                <p className="text-sm font-medium mb-1">✅ Important</p>
                <p className="text-xs text-muted-foreground">
                  All plans include ALL features. There is no difference in access — only in duration.
                </p>
              </div>
            </motion.div>

            {/* All Features List */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="max-w-3xl mx-auto mb-12"
            >
              <h2 className="text-xl sm:text-2xl font-bold text-center mb-6">
                ⭐ Everything You Get <span className="text-muted-foreground">(In Every Plan)</span>
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {allFeatures.map((feature, i) => (
                  <motion.div 
                    key={i}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 + i * 0.05 }}
                    className="flex items-center gap-2 p-3 rounded-lg bg-muted/30"
                  >
                    <div className="w-5 h-5 rounded-full bg-success/15 flex items-center justify-center flex-shrink-0">
                      <Check className="w-3 h-3 text-success" />
                    </div>
                    <span className="text-sm">{feature}</span>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Comparison Table */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="max-w-4xl mx-auto mb-12"
            >
              <h2 className="text-xl sm:text-2xl font-bold text-center mb-2">
                🔍 Feature Comparison <span className="text-muted-foreground">(Honest & Real)</span>
              </h2>
              <p className="text-center text-sm text-muted-foreground mb-6">
                What actually helps you in interviews — not just practice
              </p>
              <div className="glass-card overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border bg-muted/30">
                        <th className="text-left py-3 px-3 sm:px-4 font-semibold text-xs sm:text-sm">Core Feature</th>
                        <th className="text-center py-3 px-2 font-semibold text-xs sm:text-sm">YouTube</th>
                        <th className="text-center py-3 px-2 font-semibold text-xs sm:text-sm">LeetCode</th>
                        <th className="text-center py-3 px-2 font-semibold text-xs sm:text-sm">Paid Courses</th>
                        <th className="text-center py-3 px-2 font-semibold text-xs sm:text-sm text-primary">NexAlgoTrix</th>
                      </tr>
                    </thead>
                    <tbody>
                      {comparisonData.map((row, index) => (
                        <tr 
                          key={index} 
                          className={`border-b border-border/50 ${index % 2 === 0 ? 'bg-muted/10' : ''}`}
                        >
                          <td className="py-2.5 px-3 sm:px-4 text-xs sm:text-sm">{row.feature}</td>
                          <td className="text-center py-2.5 px-2">{renderCheckIcon(row.youtube)}</td>
                          <td className="text-center py-2.5 px-2">{renderCheckIcon(row.leetcode)}</td>
                          <td className="text-center py-2.5 px-2">{renderCheckIcon(row.paidCourses)}</td>
                          <td className="text-center py-2.5 px-2">{renderCheckIcon(row.nexalgotrix)}</td>
                        </tr>
                      ))}
                      <tr className="bg-primary/5">
                        <td className="py-3 px-3 sm:px-4 font-semibold text-xs sm:text-sm">Full access cost</td>
                        <td className="text-center py-3 px-2 text-xs text-muted-foreground">Free (scattered)</td>
                        <td className="text-center py-3 px-2 text-xs text-muted-foreground">₹3k–₹5k/yr</td>
                        <td className="text-center py-3 px-2 text-xs text-muted-foreground">₹8k–₹15k</td>
                        <td className="text-center py-3 px-2 text-xs text-primary font-bold">₹199–₹1,499</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <p className="text-xs text-muted-foreground p-3 text-center">
                  ⚠️ = available partially or inconsistently
                </p>
              </div>
            </motion.div>

            {/* Why NexAlgoTrix Exists */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="max-w-2xl mx-auto mb-12"
            >
              <div className="glass-card p-6 text-center border-primary/20">
                <Brain className="w-10 h-10 text-primary mx-auto mb-4" />
                <h3 className="text-lg sm:text-xl font-bold mb-3">🧠 Why NexAlgoTrix Exists</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Most platforms help you solve questions.<br />
                  <span className="text-foreground font-medium">NexAlgoTrix trains you to think like an interviewer.</span>
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-left">
                  <div className="p-3 rounded-lg bg-muted/30">
                    <p className="text-xs font-medium mb-1">✓ Why a pattern fits</p>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/30">
                    <p className="text-xs font-medium mb-1">✓ When it fails</p>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/30">
                    <p className="text-xs font-medium mb-1">✓ How to explain it</p>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-4">
                  That's what interviews actually test.
                </p>
              </div>
            </motion.div>

            {/* Pricing Philosophy */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              className="max-w-xl mx-auto mb-12"
            >
              <div className="glass-card p-5 text-center border-amber-500/20 bg-amber-500/5">
                <p className="text-sm font-medium mb-2">💰 Pricing Philosophy (Trust Builder)</p>
                <p className="text-xs text-muted-foreground mb-3">
                  If you want answers, many platforms are free.<br />
                  If you want clarity, structure, and thinking — this is for you.
                </p>
                <p className="text-xs font-medium text-primary">
                  All features available in every plan. You simply save more by committing longer.
                </p>
              </div>
            </motion.div>

            {/* Trust Badges */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
              className="flex flex-wrap items-center justify-center gap-2 sm:gap-4 text-xs text-muted-foreground"
            >
              <div className="flex items-center gap-1.5">
                <Shield className="w-4 h-4 text-success" />
                <span>Secure payment via Razorpay</span>
              </div>
              <div className="w-1 h-1 rounded-full bg-border hidden sm:block" />
              <span>No hidden charges</span>
              <div className="w-1 h-1 rounded-full bg-border hidden sm:block" />
              <span>7-day money back</span>
            </motion.div>
          </div>
        </section>

        <Footer />
      </div>
    </>
  );
}