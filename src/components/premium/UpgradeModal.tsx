import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Sparkles, Zap, Brain, Trophy, Target, Check, Crown, Loader2, CheckCircle2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useRazorpay } from "@/hooks/useRazorpay";
import { useSubscription } from "@/hooks/useSubscription";
import { PaymentOverlay } from "./PaymentOverlay";

type PlanType = 'monthly' | 'six_month' | 'yearly';
type PaymentStatus = 'loading' | 'success' | 'error' | null;

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  triggerContext?: string;
  initialPlan?: PlanType;
}

const benefits = [
  { icon: Target, text: "Access all 6 phases of learning", highlight: true },
  { icon: Brain, text: "Unlimited AI Mentor sessions" },
  { icon: Zap, text: "Advanced pattern techniques" },
  { icon: Trophy, text: "Full gamification & leaderboards" },
  { icon: Sparkles, text: "Priority content updates" },
];

export const UpgradeModal = ({ isOpen, onClose, triggerContext, initialPlan }: UpgradeModalProps) => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { initiatePayment, isLoading } = useRazorpay();
  const { isPremium, subscriptionStatus, refetch } = useSubscription();
  const [selectedPlan, setSelectedPlan] = useState<PlanType>(initialPlan ?? 'yearly');
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>(null);
  const [errorMessage, setErrorMessage] = useState<string>('');

  useEffect(() => {
    if (isOpen && initialPlan) {
      setSelectedPlan(initialPlan);
    }
  }, [isOpen, initialPlan]);

  // Reset payment status when modal closes
  useEffect(() => {
    if (!isOpen) {
      setPaymentStatus(null);
      setErrorMessage('');
    }
  }, [isOpen]);

  const handleUpgrade = async () => {
    console.log('handleUpgrade called, user:', user?.id, 'authLoading:', authLoading, 'selectedPlan:', selectedPlan);
    
    // Wait for auth to finish loading before making decisions
    if (authLoading) {
      console.log('Auth still loading, please wait...');
      return;
    }
    
    if (!user) {
      console.log('User not logged in, redirecting to auth');
      const next = `${window.location.pathname}${window.location.search}`;
      sessionStorage.setItem(
        'upgrade_pending',
        JSON.stringify({ plan: selectedPlan, context: triggerContext ?? 'feature', next })
      );
      navigate(`/auth?next=${encodeURIComponent(next)}&upgrade=1`);
      onClose();
      return;
    }

    console.log('User is logged in, initiating payment...');
    setPaymentStatus('loading');
    setErrorMessage('');
    
    initiatePayment(
      selectedPlan,
      () => {
        console.log('Payment successful, refetching subscription...');
        setPaymentStatus('success');
        refetch();
      },
      (error) => {
        console.error('Payment error:', error);
        setPaymentStatus('error');
        setErrorMessage(error || 'An unexpected error occurred');
      },
      undefined, // no coupon in modal context
      () => {
        // On dismiss - reset loading state but keep modal open
        setPaymentStatus(null);
      }
    );
  };

  const handleRetry = () => {
    setPaymentStatus(null);
    setErrorMessage('');
    handleUpgrade();
  };

  const handlePaymentClose = () => {
    setPaymentStatus(null);
    setErrorMessage('');
    if (paymentStatus === 'success') {
      onClose();
      navigate('/patterns');
    }
  };

  // If user is already on Pro plan, show different content
  const isAlreadyPro = isPremium || subscriptionStatus === 'pro';

  return (
    <>
      {/* Payment Overlay */}
      <PaymentOverlay
        status={paymentStatus}
        errorMessage={errorMessage}
        onRetry={handleRetry}
        onClose={handlePaymentClose}
      />

      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
              className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50"
            />
            
            {/* Modal - Scrollable container that fills viewport */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 overflow-y-auto"
            >
              <div className="min-h-full flex items-center justify-center p-4">
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 20 }}
                  transition={{ type: "spring", duration: 0.5 }}
                  className="w-full max-w-md"
                  onClick={(e) => e.stopPropagation()}
                >
              <div className="glass-card p-6 sm:p-8 relative overflow-hidden">
                {/* Decorative gradient */}
                <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-violet/10 pointer-events-none" />
                
                {/* Close button */}
                <button
                  onClick={onClose}
                  disabled={isLoading}
                  className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors z-10 disabled:opacity-50"
                >
                  <X className="w-5 h-5" />
                </button>

                {/* Content */}
                <div className="relative z-10">
                  {isAlreadyPro ? (
                    // Already Pro Content
                    <>
                      <div className="text-center mb-6">
                        <motion.div 
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ type: "spring", duration: 0.5 }}
                          className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-500/20 mb-4"
                        >
                          <CheckCircle2 className="w-10 h-10 text-green-500" />
                        </motion.div>
                        <h2 className="text-2xl font-bold mb-2">You're Already Pro!</h2>
                        <p className="text-muted-foreground text-sm">
                          You have full access to all premium features.
                        </p>
                      </div>

                      {/* Pro Badge */}
                      <div className="flex justify-center mb-6">
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/20 border border-primary/30">
                          <Crown className="w-5 h-5 text-primary" />
                          <span className="font-medium text-primary">Pro Member</span>
                        </div>
                      </div>

                      {/* Benefits with checkmarks */}
                      <div className="space-y-3 mb-6">
                        {benefits.map((benefit, index) => (
                          <motion.div
                            key={index}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className="flex items-center gap-3 p-3 rounded-lg bg-green-500/10 border border-green-500/20"
                          >
                            <div className="w-8 h-8 rounded-full flex items-center justify-center bg-green-500/20">
                              <Check className="w-4 h-4 text-green-500" />
                            </div>
                            <span className="text-sm text-foreground">
                              {benefit.text}
                            </span>
                          </motion.div>
                        ))}
                      </div>

                      {/* CTA */}
                      <div className="space-y-3">
                        <Button 
                          onClick={() => {
                            onClose();
                            navigate('/patterns');
                          }}
                          className="w-full btn-primary-glow"
                          size="lg"
                        >
                          <Sparkles className="w-4 h-4 mr-2" />
                          Continue Learning
                          <ArrowRight className="w-4 h-4 ml-2" />
                        </Button>
                        <Button 
                          onClick={() => {
                            onClose();
                            navigate('/payment-status');
                          }}
                          variant="ghost"
                          className="w-full text-muted-foreground"
                        >
                          View Payment History
                        </Button>
                      </div>
                    </>
                  ) : (
                    // Upgrade Content (existing)
                    <>
                      {/* Header */}
                      <div className="text-center mb-6">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/20 mb-4">
                          <Crown className="w-8 h-8 text-primary" />
                        </div>
                        <h2 className="text-2xl font-bold mb-2">Unlock Premium</h2>
                        <p className="text-muted-foreground text-sm">
                          {triggerContext === "pattern" 
                            ? "This pattern is part of our advanced curriculum"
                            : triggerContext === "question"
                            ? "Access this and 100+ more premium questions"
                            : "Get full access to master DSA patterns"}
                        </p>
                      </div>

                      {/* Benefits */}
                      <div className="space-y-3 mb-6">
                        {benefits.map((benefit, index) => (
                          <motion.div
                            key={index}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className={`flex items-center gap-3 p-3 rounded-lg ${
                              benefit.highlight 
                                ? "bg-primary/10 border border-primary/20" 
                                : "bg-muted/30"
                            }`}
                          >
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                              benefit.highlight ? "bg-primary/20" : "bg-muted"
                            }`}>
                              <benefit.icon className={`w-4 h-4 ${
                                benefit.highlight ? "text-primary" : "text-muted-foreground"
                              }`} />
                            </div>
                            <span className={`text-sm ${
                              benefit.highlight ? "font-medium text-foreground" : "text-muted-foreground"
                            }`}>
                              {benefit.text}
                            </span>
                            {benefit.highlight && (
                              <Check className="w-4 h-4 text-primary ml-auto" />
                            )}
                          </motion.div>
                        ))}
                      </div>

                      {/* Plan Selection */}
                      <div className="space-y-3 mb-6">
                        {/* Yearly Plan - Best Value */}
                        <button
                          onClick={() => setSelectedPlan('yearly')}
                          disabled={isLoading}
                          className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                            selectedPlan === 'yearly'
                              ? 'border-primary bg-primary/10'
                              : 'border-border bg-muted/30 hover:border-primary/50'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-semibold">1 Year</span>
                                <span className="text-xs bg-success/20 text-success px-2 py-0.5 rounded-full font-bold">
                                  BEST VALUE
                                </span>
                              </div>
                              <p className="text-xs text-muted-foreground mt-1">≈ ₹125/month</p>
                            </div>
                            <div className="text-right">
                              <span className="text-2xl font-bold gradient-text">₹1,499</span>
                              <p className="text-xs text-muted-foreground">/year</p>
                            </div>
                          </div>
                        </button>

                        {/* 6 Month Plan - Most Popular */}
                        <button
                          onClick={() => setSelectedPlan('six_month')}
                          disabled={isLoading}
                          className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                            selectedPlan === 'six_month'
                              ? 'border-primary bg-primary/10'
                              : 'border-border bg-muted/30 hover:border-primary/50'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-semibold">6 Months</span>
                                <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full font-bold">
                                  MOST POPULAR
                                </span>
                              </div>
                              <p className="text-xs text-muted-foreground mt-1">≈ ₹166/month</p>
                            </div>
                            <div className="text-right">
                              <span className="text-2xl font-bold gradient-text">₹999</span>
                              <p className="text-xs text-muted-foreground">/6 months</p>
                            </div>
                          </div>
                        </button>

                        {/* Monthly Plan */}
                        <button
                          onClick={() => setSelectedPlan('monthly')}
                          disabled={isLoading}
                          className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                            selectedPlan === 'monthly'
                              ? 'border-primary bg-primary/10'
                              : 'border-border bg-muted/30 hover:border-primary/50'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <span className="font-semibold">Monthly</span>
                              <p className="text-xs text-muted-foreground mt-1">Cancel anytime</p>
                            </div>
                            <div className="text-right">
                              <span className="text-2xl font-bold">₹199</span>
                              <p className="text-xs text-muted-foreground">/month</p>
                            </div>
                          </div>
                        </button>
                      </div>

                      {/* CTA Buttons */}
                      <div className="space-y-3">
                        <Button 
                          onClick={handleUpgrade}
                          className="w-full btn-primary-glow"
                          size="lg"
                          disabled={isLoading || authLoading}
                        >
                          {isLoading || authLoading ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              {authLoading ? 'Loading...' : 'Processing...'}
                            </>
                          ) : (
                            <>
                              <Sparkles className="w-4 h-4 mr-2" />
                              {user ? `Pay ${selectedPlan === 'yearly' ? '₹1,499' : selectedPlan === 'six_month' ? '₹999' : '₹199'}` : "Sign Up & Upgrade"}
                            </>
                          )}
                        </Button>
                        <Button 
                          onClick={onClose}
                          variant="ghost"
                          className="w-full text-muted-foreground"
                          disabled={isLoading || authLoading}
                        >
                          Continue with Free Plan
                        </Button>
                      </div>

                      {/* Trust badge */}
                      <p className="text-center text-xs text-muted-foreground mt-4">
                        🔒 Secure payment via Razorpay • Cancel anytime
                      </p>
                    </>
                  )}
                </div>
              </div>
                </motion.div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};
