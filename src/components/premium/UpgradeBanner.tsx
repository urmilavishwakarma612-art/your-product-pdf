import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Sparkles, Lock, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSubscription } from "@/hooks/useSubscription";
import { useAuth } from "@/hooks/useAuth";

interface UpgradeBannerProps {
  onUpgradeClick: () => void;
  completedPhase1?: boolean;
}

export const UpgradeBanner = ({ onUpgradeClick, completedPhase1 = false }: UpgradeBannerProps) => {
  const { user } = useAuth();
  const { isPremium } = useSubscription();
  const [isDismissed, setIsDismissed] = useState(false);

  // Reset dismissed state on new session
  useEffect(() => {
    const dismissedKey = "upgrade_banner_dismissed";
    const dismissed = sessionStorage.getItem(dismissedKey);
    if (dismissed) {
      setIsDismissed(true);
    }
  }, []);

  const handleDismiss = () => {
    sessionStorage.setItem("upgrade_banner_dismissed", "true");
    setIsDismissed(true);
  };

  // Don't show for premium users or if dismissed
  if (isPremium || isDismissed || !user) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="mb-6"
      >
        <div className="relative overflow-hidden rounded-xl border border-primary/30 bg-gradient-to-r from-primary/10 via-violet/10 to-primary/10">
          {/* Background decoration */}
          <div className="absolute inset-0 bg-grid opacity-30" />
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-violet/20 rounded-full blur-2xl" />
          
          {/* Content */}
          <div className="relative px-4 py-4 sm:px-6 sm:py-5 flex flex-col sm:flex-row items-start sm:items-center gap-4">
            {/* Icon */}
            <div className="hidden sm:flex items-center justify-center w-12 h-12 rounded-full bg-primary/20 shrink-0">
              <Lock className="w-5 h-5 text-primary" />
            </div>
            
            {/* Text */}
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-foreground mb-0.5 flex items-center gap-2">
                <Lock className="w-4 h-4 text-primary sm:hidden" />
                {completedPhase1 
                  ? "Ready for Advanced Patterns?" 
                  : "Unlock Premium Content"}
              </h3>
              <p className="text-sm text-muted-foreground">
                {completedPhase1
                  ? "You've completed Phase 1! Upgrade to access 100+ advanced problems in Phases 2-6."
                  : "Complete Phase 1 for free, then upgrade to unlock advanced patterns and AI mentor features."}
              </p>
            </div>

            {/* CTA */}
            <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
              <Button 
                onClick={onUpgradeClick}
                size="sm"
                className="btn-primary-glow flex-1 sm:flex-none"
              >
                <Sparkles className="w-3.5 h-3.5 mr-1.5" />
                Upgrade to Pro
                <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
              </Button>
              <button
                onClick={handleDismiss}
                className="p-2 text-muted-foreground hover:text-foreground transition-colors"
                title="Dismiss"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
