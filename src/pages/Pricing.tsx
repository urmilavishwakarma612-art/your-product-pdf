import { useRef, useState, useEffect } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { Check, Crown, Sparkles, Zap, Shield, Star, Brain, Trophy, Target, X, ArrowRight, Flame, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link, useNavigate } from "react-router-dom";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { useAuth } from "@/hooks/useAuth";
import { useSubscription } from "@/hooks/useSubscription";
import { useRazorpay } from "@/hooks/useRazorpay";
import { PaymentOverlay } from "@/components/premium/PaymentOverlay";
import { Helmet } from "react-helmet-async";

type PlanType = 'monthly' | 'yearly';
type PaymentStatus = 'loading' | 'success' | 'error' | null;

// Countdown Timer Component
const CountdownTimer = () => {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  useEffect(() => {
    // Set end date to 30 days from now (or use a fixed date)
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 7); // 7 days from now

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
        <div className="w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20 rounded-xl bg-gradient-to-br from-primary/20 to-secondary/20 border border-primary/30 flex items-center justify-center backdrop-blur-sm">
          <span className="text-xl sm:text-2xl md:text-3xl font-bold gradient-text">
            {value.toString().padStart(2, '0')}
          </span>
        </div>
        <div className="absolute -inset-0.5 bg-gradient-to-r from-primary/20 to-secondary/20 rounded-xl blur opacity-50" />
      </div>
      <span className="text-xs sm:text-sm text-muted-foreground mt-2 font-medium">{label}</span>
    </div>
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15 }}
      className="mb-10"
    >
      <div className="glass-card p-4 sm:p-6 border-primary/30 bg-gradient-to-r from-primary/5 via-secondary/5 to-primary/5 max-w-lg mx-auto">
        <div className="flex items-center justify-center gap-2 mb-4">
          <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-primary animate-pulse" />
          <span className="text-sm sm:text-base font-semibold text-primary">Early-Bird Offer Ends In</span>
        </div>
        <div className="flex items-center justify-center gap-2 sm:gap-3 md:gap-4">
          <TimeBox value={timeLeft.days} label="Days" />
          <span className="text-xl sm:text-2xl font-bold text-primary/50 mt-[-20px]">:</span>
          <TimeBox value={timeLeft.hours} label="Hours" />
          <span className="text-xl sm:text-2xl font-bold text-primary/50 mt-[-20px]">:</span>
          <TimeBox value={timeLeft.minutes} label="Mins" />
          <span className="text-xl sm:text-2xl font-bold text-primary/50 mt-[-20px]">:</span>
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

const freeFeatures = [
  "Complete Phase 1 - Foundation",
  "Arrays, Strings, Two-Pointer",
  "Sliding Window, Prefix Sum",
  "Full AI Mentor Access",
  "XP, Badges & Streaks",
  "Global Leaderboard",
];

const proFeatures = [
  "Everything in Free",
  "Phase 2-6 - All Advanced Patterns",
  "Stack, Queue, Heap, HashMap",
  "Trees, Graphs, DP, Greedy",
  "Trie, Bit Manipulation",
  "Advanced: Segment Trees & more",
  "Priority Support",
];

const comparisonFeatures = [
  { name: "Pattern-wise DSA roadmap", free: true, pro: true },
  { name: "AI hints, approach & solutions", free: true, pro: true },
  { name: "XP, badges, streaks, leaderboard", free: true, pro: true },
  { name: "Admin-curated best questions", free: true, pro: true },
  { name: "Lifetime access to Phase 1", free: true, pro: true },
  { name: "Phase 2-6 Advanced Patterns", free: false, pro: true },
  { name: "Stack, Queue, Heap, HashMap", free: false, pro: true },
  { name: "Trees, Graphs, DP, Greedy", free: false, pro: true },
  { name: "Trie, Bit Manipulation", free: false, pro: true },
  { name: "Segment Trees & Advanced", free: false, pro: true },
  { name: "Priority Support", free: false, pro: true },
];

export default function Pricing() {
  const sectionRef = useRef<HTMLElement>(null);
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isPremium, refetch } = useSubscription();
  const { initiatePayment, isLoading } = useRazorpay();
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>(null);
  const [errorMessage, setErrorMessage] = useState('');

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  });

  const backgroundY = useTransform(scrollYProgress, [0, 1], [50, -50]);

  const handleUpgrade = async (plan: PlanType) => {
    if (!user) {
      navigate('/auth?upgrade=1');
      return;
    }

    if (isPremium) {
      navigate('/patterns');
      return;
    }

    setPaymentStatus('loading');
    setErrorMessage('');

    // Map yearly to lifetime for backend compatibility
    const backendPlan = plan === 'yearly' ? 'lifetime' : 'monthly';
    
    initiatePayment(
      backendPlan as 'monthly' | 'lifetime',
      () => {
        setPaymentStatus('success');
        refetch();
      },
      (error) => {
        setPaymentStatus('error');
        setErrorMessage(error || 'An unexpected error occurred');
      }
    );
  };

  const handleRetry = (plan: PlanType) => {
    setPaymentStatus(null);
    setErrorMessage('');
    handleUpgrade(plan);
  };

  const handlePaymentClose = () => {
    setPaymentStatus(null);
    setErrorMessage('');
    if (paymentStatus === 'success') {
      navigate('/patterns');
    }
  };

  return (
    <>
      <Helmet>
        <title>Pricing - Nexalgotrix | Affordable DSA Learning Plans</title>
        <meta name="description" content="Choose your plan to master DSA patterns. Start free with Phase 1, upgrade to Pro for full access. Yearly plan saves 2 months compared to monthly." />
      </Helmet>

      <PaymentOverlay
        status={paymentStatus}
        errorMessage={errorMessage}
        onRetry={() => handleRetry('yearly')}
        onClose={handlePaymentClose}
      />

      <div className="min-h-screen bg-background">
        <Navbar />
        
        <section 
          ref={sectionRef}
          className="pt-24 pb-16 sm:pt-32 sm:pb-24 relative overflow-hidden"
        >
          {/* Animated gradient background */}
          <motion.div
            style={{ y: backgroundY }}
            className="absolute inset-0 bg-gradient-to-b from-background via-card/30 to-background pointer-events-none"
          />
          
          {/* Decorative orbs */}
          <div className="absolute top-20 right-20 w-48 sm:w-80 h-48 sm:h-80 bg-primary/5 rounded-full blur-[100px] pointer-events-none" />
          <div className="absolute bottom-20 left-20 w-64 sm:w-96 h-64 sm:h-96 bg-secondary/5 rounded-full blur-[120px] pointer-events-none" />

          <div className="container px-4 relative z-10">
            {/* Header */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
              className="text-center max-w-3xl mx-auto mb-8"
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-amber-500/10 border border-amber-500/30 mb-4 sm:mb-6"
              >
                <Flame className="w-3 h-3 sm:w-4 sm:h-4 text-amber-500" />
                <span className="text-xs sm:text-sm font-medium text-amber-500">🔥 Early Access — Limited Time</span>
              </motion.div>
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-4 sm:mb-6 tracking-tight">
                Early-Bird Pricing — <span className="gradient-text">Limited Time Launch Offer</span>
              </h1>
              <p className="text-base sm:text-lg lg:text-xl text-muted-foreground leading-relaxed mb-4">
                Lock the lowest price forever. Prices will increase as Nexalgotrix grows.
              </p>
              <p className="text-sm text-muted-foreground">
                Start free with Phase 1. Upgrade when you're ready. No pressure, no traps.
              </p>
            </motion.div>

            {/* Countdown Timer */}
            <CountdownTimer />

            {/* Value Proposition Banner */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="max-w-2xl mx-auto mb-12"
            >
              <div className="glass-card p-4 sm:p-6 border-primary/20 text-center">
                <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-4 text-sm sm:text-base">
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-success" />
                    <span>Pattern-wise DSA roadmap</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-success" />
                    <span>AI hints & solutions</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-success" />
                    <span>XP, badges, leaderboard</span>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Pricing Cards - 3 columns */}
            <div className="grid md:grid-cols-3 gap-6 sm:gap-8 max-w-6xl mx-auto mb-16">
              {/* Free Plan */}
              <motion.div
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                whileHover={{ y: -8 }}
                className="interactive-card p-5 sm:p-6 lg:p-8 relative"
              >
                <div className="mb-6">
                  <h3 className="text-xl sm:text-2xl font-bold mb-2">Free</h3>
                  <p className="text-sm text-muted-foreground">Phase 1 - Perfect to start</p>
                </div>

                <div className="mb-6">
                  <span className="text-4xl sm:text-5xl font-bold">₹0</span>
                  <span className="text-muted-foreground ml-2 text-sm sm:text-base">forever</span>
                  <p className="text-xs text-muted-foreground mt-2">No card required</p>
                </div>

                <motion.ul 
                  variants={containerVariants}
                  initial="hidden"
                  animate="visible"
                  className="space-y-3 mb-8"
                >
                  {freeFeatures.map((feature, i) => (
                    <motion.li 
                      key={i} 
                      variants={itemVariants}
                      className="flex items-center gap-2.5 group"
                    >
                      <div className="w-4 h-4 rounded-full bg-success/15 flex items-center justify-center flex-shrink-0 group-hover:bg-success/25 transition-colors">
                        <Check className="w-2.5 h-2.5 text-success" />
                      </div>
                      <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors">{feature}</span>
                    </motion.li>
                  ))}
                </motion.ul>

                <Link to="/auth">
                  <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                    <Button variant="outline" className="w-full rounded-xl h-10 sm:h-11 text-sm" size="lg">
                      Get Started Free
                    </Button>
                  </motion.div>
                </Link>
              </motion.div>

              {/* Monthly Pro Plan */}
              <motion.div
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
                whileHover={{ y: -8 }}
                className="interactive-card p-5 sm:p-6 lg:p-8 relative border-secondary/30 hover:border-secondary/50"
              >
                <div className="mb-6">
                  <h3 className="text-xl sm:text-2xl font-bold mb-2 flex items-center gap-2">
                    Pro Monthly
                    <Sparkles className="w-4 h-4 text-secondary" />
                  </h3>
                  <p className="text-sm text-muted-foreground">Flexible monthly billing</p>
                </div>

                <div className="mb-6">
                  <div className="flex items-baseline gap-2">
                    <span className="text-lg text-muted-foreground line-through">₹149</span>
                    <span className="text-4xl sm:text-5xl font-bold gradient-text">₹99</span>
                    <span className="text-muted-foreground text-sm sm:text-base">/month</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Cancel anytime
                  </p>
                  <div className="mt-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30">
                    <Flame className="w-3 h-3 text-amber-500" />
                    <span className="text-xs font-medium text-amber-500">Early-Bird Price</span>
                  </div>
                </div>

                <motion.ul 
                  variants={containerVariants}
                  initial="hidden"
                  animate="visible"
                  className="space-y-3 mb-8"
                >
                  {proFeatures.map((feature, i) => (
                    <motion.li 
                      key={i} 
                      variants={itemVariants}
                      className="flex items-center gap-2.5 group"
                    >
                      <div className="w-4 h-4 rounded-full bg-secondary/15 flex items-center justify-center flex-shrink-0 group-hover:bg-secondary/25 transition-colors">
                        <Check className="w-2.5 h-2.5 text-secondary" />
                      </div>
                      <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors">{feature}</span>
                    </motion.li>
                  ))}
                </motion.ul>

                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Button 
                    variant="outline"
                    className="w-full rounded-xl h-10 sm:h-11 text-sm border-secondary/50 hover:bg-secondary/10 hover:border-secondary" 
                    size="lg"
                    onClick={() => handleUpgrade('monthly')}
                    disabled={isLoading || isPremium}
                  >
                    {isPremium ? (
                      <>
                        <Check className="w-4 h-4 mr-2" />
                        You're Pro
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 mr-2" />
                        Unlock Monthly Pro
                      </>
                    )}
                  </Button>
                </motion.div>
                
                <p className="text-xs text-center text-muted-foreground mt-3">
                  Early supporters get the best price.
                </p>
              </motion.div>

              {/* Yearly Pro Plan - Most Popular */}
              <motion.div
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
                whileHover={{ y: -8 }}
                className="relative"
              >
                {/* Glow effect */}
                <div className="absolute -inset-0.5 bg-gradient-to-r from-primary via-secondary to-accent rounded-2xl blur opacity-30 group-hover:opacity-40 transition-opacity" />
                
                <div className="interactive-card p-5 sm:p-6 lg:p-8 relative border-primary/30 hover:border-primary/50 h-full">
                  {/* Popular Badge */}
                  <motion.div 
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="absolute -top-4 left-1/2 -translate-x-1/2"
                  >
                    <motion.div 
                      animate={{ y: [0, -3, 0] }}
                      transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                      className="flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-gradient-to-r from-primary to-secondary text-primary-foreground text-xs sm:text-sm font-semibold shadow-lg shadow-primary/25"
                    >
                      <Star className="w-3 h-3 sm:w-4 sm:h-4 fill-current" />
                      Most Popular
                    </motion.div>
                  </motion.div>

                  <div className="mb-6 pt-4">
                    <h3 className="text-xl sm:text-2xl font-bold mb-2 flex items-center gap-2">
                      Pro Yearly
                      <motion.div
                        animate={{ rotate: [0, 15, -15, 0] }}
                        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                      >
                        <Crown className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                      </motion.div>
                    </h3>
                    <p className="text-sm text-muted-foreground">Best value for serious learners</p>
                  </div>

                  <div className="mb-6">
                    <div className="flex items-baseline gap-2">
                      <span className="text-lg text-muted-foreground line-through">₹1,499</span>
                      <span className="text-4xl sm:text-5xl font-bold gradient-text">₹999</span>
                      <span className="text-muted-foreground text-sm sm:text-base">/year</span>
                    </div>
                    <p className="text-xs sm:text-sm text-success mt-2 font-medium">
                      ≈ ₹83/month • Save 2 months!
                    </p>
                    <div className="mt-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30">
                      <Flame className="w-3 h-3 text-amber-500" />
                      <span className="text-xs font-medium text-amber-500">Early-Bird Price</span>
                    </div>
                  </div>

                  <motion.ul 
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                    className="space-y-3 mb-8"
                  >
                    {proFeatures.map((feature, i) => (
                      <motion.li 
                        key={i} 
                        variants={itemVariants}
                        className="flex items-center gap-2.5 group"
                      >
                        <div className="w-4 h-4 rounded-full bg-primary/15 flex items-center justify-center flex-shrink-0 group-hover:bg-primary/25 transition-colors">
                          <Check className="w-2.5 h-2.5 text-primary" />
                        </div>
                        <span className="text-sm group-hover:text-foreground transition-colors">{feature}</span>
                      </motion.li>
                    ))}
                  </motion.ul>

                  <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                    <Button 
                      className="w-full btn-primary-glow rounded-xl h-10 sm:h-11 text-sm" 
                      size="lg"
                      onClick={() => handleUpgrade('yearly')}
                      disabled={isLoading || isPremium}
                    >
                      {isPremium ? (
                        <>
                          <Check className="w-4 h-4 mr-2" />
                          You're Already Pro
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4 mr-2" />
                          Unlock Pro at Early-Bird Price
                        </>
                      )}
                    </Button>
                  </motion.div>
                  
                  {/* Trust note */}
                  <p className="text-xs text-center text-muted-foreground mt-3">
                    Early supporters always get the best price.
                  </p>
                </div>
              </motion.div>
            </div>

            {/* Price Anchoring */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="max-w-2xl mx-auto mb-16"
            >
              <div className="glass-card p-6 text-center border-amber-500/20 bg-amber-500/5">
                <p className="text-lg font-medium mb-2">
                  💡 Comparable DSA courses cost ₹3,000–₹10,000
                </p>
                <p className="text-muted-foreground">
                  Nexalgotrix costs just <span className="text-primary font-bold">₹999/year</span> for the complete pattern-based learning experience
                </p>
              </div>
            </motion.div>

            {/* Comparison Table */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="max-w-4xl mx-auto mb-16"
            >
              <h2 className="text-2xl sm:text-3xl font-bold text-center mb-8">
                Compare Plans
              </h2>
              <div className="glass-card overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left py-4 px-4 sm:px-6 font-semibold">Features</th>
                        <th className="text-center py-4 px-4 sm:px-6 font-semibold">Free</th>
                        <th className="text-center py-4 px-4 sm:px-6 font-semibold">
                          <div className="flex items-center justify-center gap-2">
                            <Crown className="w-4 h-4 text-primary" />
                            Pro
                          </div>
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {comparisonFeatures.map((feature, index) => (
                        <tr 
                          key={index} 
                          className={`border-b border-border/50 ${index % 2 === 0 ? 'bg-muted/20' : ''}`}
                        >
                          <td className="py-3 px-4 sm:px-6 text-sm sm:text-base">{feature.name}</td>
                          <td className="text-center py-3 px-4 sm:px-6">
                            {feature.free ? (
                              <Check className="w-5 h-5 text-success mx-auto" />
                            ) : (
                              <X className="w-5 h-5 text-muted-foreground/50 mx-auto" />
                            )}
                          </td>
                          <td className="text-center py-3 px-4 sm:px-6">
                            {feature.pro ? (
                              <Check className="w-5 h-5 text-primary mx-auto" />
                            ) : (
                              <X className="w-5 h-5 text-muted-foreground/50 mx-auto" />
                            )}
                          </td>
                        </tr>
                      ))}
                      <tr className="bg-primary/5">
                        <td className="py-4 px-4 sm:px-6 font-semibold">Price</td>
                        <td className="text-center py-4 px-4 sm:px-6 font-bold">₹0</td>
                        <td className="text-center py-4 px-4 sm:px-6">
                          <div className="flex items-center justify-center gap-2">
                            <span className="text-sm text-muted-foreground line-through">₹149</span>
                            <span className="font-bold text-primary">₹99/mo</span>
                          </div>
                          <div className="flex items-center justify-center gap-2 mt-1">
                            <span className="text-xs text-muted-foreground line-through">₹1,499</span>
                            <span className="text-xs text-primary font-medium">₹999/year</span>
                          </div>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </motion.div>

            {/* Trust Badges */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="flex flex-wrap items-center justify-center gap-3 sm:gap-6 text-xs sm:text-sm text-muted-foreground"
            >
              <div className="flex items-center gap-1.5 sm:gap-2">
                <Shield className="w-4 h-4 sm:w-5 sm:h-5 text-success" />
                <span>Secure payment via Razorpay</span>
              </div>
              <div className="w-1 h-1 rounded-full bg-border hidden sm:block" />
              <span>Cancel anytime</span>
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
