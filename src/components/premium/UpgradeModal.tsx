import { motion, AnimatePresence } from "framer-motion";
import { X, Sparkles, Zap, Brain, Trophy, Target, Check, Crown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  triggerContext?: string; // e.g., "pattern", "question", "feature"
}

const benefits = [
  { icon: Target, text: "Access all 6 phases of learning", highlight: true },
  { icon: Brain, text: "Unlimited AI Mentor sessions" },
  { icon: Zap, text: "Advanced pattern techniques" },
  { icon: Trophy, text: "Full gamification & leaderboards" },
  { icon: Sparkles, text: "Priority content updates" },
];

export const UpgradeModal = ({ isOpen, onClose, triggerContext }: UpgradeModalProps) => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleUpgrade = () => {
    if (!user) {
      navigate("/auth");
    } else {
      // Future: Navigate to payment/checkout
      // For now, show coming soon or navigate to a pricing page
      window.open("/#pricing", "_self");
    }
    onClose();
  };

  return (
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
          
          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", duration: 0.5 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md px-4"
          >
            <div className="glass-card p-6 sm:p-8 relative overflow-hidden">
              {/* Decorative gradient */}
              <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-violet/10 pointer-events-none" />
              
              {/* Close button */}
              <button
                onClick={onClose}
                className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors z-10"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Content */}
              <div className="relative z-10">
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

                {/* Pricing */}
                <div className="bg-muted/30 rounded-lg p-4 mb-6 text-center">
                  <div className="flex items-center justify-center gap-3 mb-2">
                    <span className="text-3xl font-bold gradient-text">₹49</span>
                    <span className="text-muted-foreground">/month</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    or ₹449 one-time (early bird offer)
                  </p>
                </div>

                {/* CTA Buttons */}
                <div className="space-y-3">
                  <Button 
                    onClick={handleUpgrade}
                    className="w-full btn-primary-glow"
                    size="lg"
                  >
                    <Sparkles className="w-4 h-4 mr-2" />
                    {user ? "Upgrade Now" : "Sign Up & Upgrade"}
                  </Button>
                  <Button 
                    onClick={onClose}
                    variant="ghost"
                    className="w-full text-muted-foreground"
                  >
                    Continue with Free Plan
                  </Button>
                </div>

                {/* Trust badge */}
                <p className="text-center text-xs text-muted-foreground mt-4">
                  🔒 Secure payment • Cancel anytime
                </p>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
