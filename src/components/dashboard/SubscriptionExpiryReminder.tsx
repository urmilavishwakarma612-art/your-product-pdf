import { motion } from "framer-motion";
import { Clock, AlertTriangle, Crown, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSubscription } from "@/hooks/useSubscription";
import { differenceInDays, parseISO, format } from "date-fns";
import { useState } from "react";
import { UpgradeModal } from "@/components/premium/UpgradeModal";

export function SubscriptionExpiryReminder() {
  const { subscriptionStatus, subscriptionExpiresAt, isPremium } = useSubscription();
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  // Only show for pro users with an expiry date
  if (subscriptionStatus !== 'pro' || !subscriptionExpiresAt || !isPremium) {
    return null;
  }

  const expiryDate = parseISO(subscriptionExpiresAt);
  const daysRemaining = differenceInDays(expiryDate, new Date());

  // Only show reminder if expiring within 7 days
  if (daysRemaining > 7 || daysRemaining < 0) {
    return null;
  }

  const isUrgent = daysRemaining <= 3;
  const formattedDate = format(expiryDate, 'MMM dd, yyyy');

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className={`glass-card p-4 sm:p-5 border ${
          isUrgent 
            ? 'border-destructive/50 bg-destructive/10' 
            : 'border-warning/50 bg-warning/10'
        }`}
      >
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className={`p-2 rounded-lg ${
              isUrgent ? 'bg-destructive/20' : 'bg-warning/20'
            }`}>
              {isUrgent ? (
                <AlertTriangle className={`w-5 h-5 text-destructive`} />
              ) : (
                <Clock className={`w-5 h-5 text-warning`} />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Crown className="w-4 h-4 text-primary" />
                <span className="font-semibold">Pro Subscription Expiring Soon</span>
              </div>
              <p className="text-sm text-muted-foreground">
                {daysRemaining === 0 ? (
                  <>Your Pro access expires <strong className="text-destructive">today</strong>!</>
                ) : daysRemaining === 1 ? (
                  <>Your Pro access expires <strong className={isUrgent ? 'text-destructive' : 'text-warning'}>tomorrow</strong> ({formattedDate})</>
                ) : (
                  <>Your Pro access expires in <strong className={isUrgent ? 'text-destructive' : 'text-warning'}>{daysRemaining} days</strong> ({formattedDate})</>
                )}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Renew now to keep your access to all advanced patterns
              </p>
            </div>
          </div>
          
          <Button
            onClick={() => setShowUpgradeModal(true)}
            size="sm"
            className={`shrink-0 ${
              isUrgent 
                ? 'bg-destructive hover:bg-destructive/90 text-destructive-foreground' 
                : 'btn-primary-glow'
            }`}
          >
            Renew Now
            <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      </motion.div>

      <UpgradeModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        triggerContext="renewal"
        initialPlan="monthly"
      />
    </>
  );
}
