import { useRef, useState } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { Check, Crown, Sparkles, Zap, Shield, Star, Brain, Trophy, Target, X, ArrowRight, Flame } from "lucide-react";
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
  const [selectedPlan, setSelectedPlan] = useState<PlanType>('yearly');
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

  const handleRetry = () => {
    setPaymentStatus(null);
    setErrorMessage('');
    handleUpgrade(selectedPlan);
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
        onRetry={handleRetry}
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

            {/* Pricing Cards */}
            <div className="grid md:grid-cols-2 gap-6 sm:gap-8 max-w-5xl mx-auto mb-16">
              {/* Free Plan */}
              <motion.div
                initial={{ opacity: 0, x: -40 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                whileHover={{ y: -8 }}
                className="interactive-card p-5 sm:p-8 md:p-10 relative"
              >
                <div className="mb-6 sm:mb-8">
                  <h3 className="text-xl sm:text-2xl font-bold mb-2">Free</h3>
                  <p className="text-sm sm:text-base text-muted-foreground">Phase 1 - Perfect to get started</p>
                </div>

                <div className="mb-6 sm:mb-8">
                  <span className="text-4xl sm:text-5xl lg:text-6xl font-bold">₹0</span>
                  <span className="text-muted-foreground ml-2 text-base sm:text-lg">forever</span>
                  <p className="text-sm text-muted-foreground mt-2">No card required • Full beginner experience</p>
                </div>

                <motion.ul 
                  variants={containerVariants}
                  initial="hidden"
                  animate="visible"
                  className="space-y-3 sm:space-y-4 mb-6 sm:mb-10"
                >
                  {freeFeatures.map((feature, i) => (
                    <motion.li 
                      key={i} 
                      variants={itemVariants}
                      className="flex items-center gap-3 group"
                    >
                      <div className="w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-success/15 flex items-center justify-center flex-shrink-0 group-hover:bg-success/25 transition-colors">
                        <Check className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-success" />
                      </div>
                      <span className="text-sm sm:text-base text-muted-foreground group-hover:text-foreground transition-colors">{feature}</span>
                    </motion.li>
                  ))}
                </motion.ul>

                <Link to="/auth">
                  <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                    <Button variant="outline" className="w-full rounded-xl h-10 sm:h-12 text-sm sm:text-base" size="lg">
                      Get Started Free
                    </Button>
                  </motion.div>
                </Link>
              </motion.div>

              {/* Pro Plan */}
              <motion.div
                initial={{ opacity: 0, x: 40 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                whileHover={{ y: -8 }}
                className="relative"
              >
                {/* Glow effect */}
                <div className="absolute -inset-0.5 bg-gradient-to-r from-primary via-secondary to-accent rounded-2xl blur opacity-30 group-hover:opacity-40 transition-opacity" />
                
                <div className="interactive-card p-5 sm:p-8 md:p-10 relative border-primary/30 hover:border-primary/50">
                  {/* Popular Badge */}
                  <motion.div 
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="absolute -top-4 left-1/2 -translate-x-1/2"
                  >
                    <motion.div 
                      animate={{ y: [0, -3, 0] }}
                      transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                      className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-5 py-1.5 sm:py-2 rounded-full bg-gradient-to-r from-primary to-secondary text-primary-foreground text-xs sm:text-sm font-semibold shadow-lg shadow-primary/25"
                    >
                      <Star className="w-3 h-3 sm:w-4 sm:h-4 fill-current" />
                      Most Popular
                    </motion.div>
                  </motion.div>

                  <div className="mb-6 sm:mb-8 pt-4">
                    <h3 className="text-xl sm:text-2xl font-bold mb-2 flex items-center gap-2">
                      Pro 
                      <motion.div
                        animate={{ rotate: [0, 15, -15, 0] }}
                        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                      >
                        <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                      </motion.div>
                    </h3>
                    <p className="text-sm sm:text-base text-muted-foreground">Unlock all advanced patterns</p>
                  </div>

                  {/* Plan Toggle */}
                  <div className="mb-6">
                    <div className="flex gap-2 p-1 bg-muted/50 rounded-lg">
                      <button
                        onClick={() => setSelectedPlan('monthly')}
                        className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-all ${
                          selectedPlan === 'monthly'
                            ? 'bg-background shadow-sm text-foreground'
                            : 'text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        Monthly
                      </button>
                      <button
                        onClick={() => setSelectedPlan('yearly')}
                        className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-all relative ${
                          selectedPlan === 'yearly'
                            ? 'bg-background shadow-sm text-foreground'
                            : 'text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        Yearly
                        <span className="absolute -top-2 -right-2 text-[10px] bg-success text-success-foreground px-1.5 py-0.5 rounded-full font-bold">
                          SAVE 2 MONTHS
                        </span>
                      </button>
                    </div>
                  </div>

                  <div className="mb-6 sm:mb-8">
                    {selectedPlan === 'yearly' ? (
                      <>
                        <div className="flex items-baseline gap-2">
                          <span className="text-lg text-muted-foreground line-through">₹1,499</span>
                          <span className="text-4xl sm:text-5xl lg:text-6xl font-bold gradient-text">₹999</span>
                          <span className="text-muted-foreground text-base sm:text-lg">/year</span>
                        </div>
                        <p className="text-sm text-success mt-2 font-medium">
                          ≈ ₹83/month • Save 2 months compared to monthly
                        </p>
                        <div className="mt-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30">
                          <Flame className="w-3 h-3 text-amber-500" />
                          <span className="text-xs font-medium text-amber-500">Early-Bird Price</span>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="flex items-baseline gap-2">
                          <span className="text-lg text-muted-foreground line-through">₹149</span>
                          <span className="text-4xl sm:text-5xl lg:text-6xl font-bold gradient-text">₹99</span>
                          <span className="text-muted-foreground text-base sm:text-lg">/month</span>
                        </div>
                        <p className="text-sm text-muted-foreground mt-2">
                          Cancel anytime
                        </p>
                        <div className="mt-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30">
                          <Flame className="w-3 h-3 text-amber-500" />
                          <span className="text-xs font-medium text-amber-500">Early-Bird Price</span>
                        </div>
                      </>
                    )}
                  </div>

                  <motion.ul 
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                    className="space-y-3 sm:space-y-4 mb-6 sm:mb-10"
                  >
                    {proFeatures.map((feature, i) => (
                      <motion.li 
                        key={i} 
                        variants={itemVariants}
                        className="flex items-center gap-3 group"
                      >
                        <div className="w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-primary/15 flex items-center justify-center flex-shrink-0 group-hover:bg-primary/25 transition-colors">
                          <Check className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-primary" />
                        </div>
                        <span className="text-sm sm:text-base group-hover:text-foreground transition-colors">{feature}</span>
                      </motion.li>
                    ))}
                  </motion.ul>

                  <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                    <Button 
                      className="w-full btn-primary-glow rounded-xl h-10 sm:h-12 text-sm sm:text-base" 
                      size="lg"
                      onClick={() => handleUpgrade(selectedPlan)}
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
