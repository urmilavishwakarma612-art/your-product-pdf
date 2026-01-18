import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { differenceInHours } from "date-fns";
import { AlertTriangle, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

export function PaymentFailedBanner() {
  const { user } = useAuth();
  const [dismissed, setDismissed] = useState(false);

  const { data: failedPayments } = useQuery({
    queryKey: ["failed-payments-banner", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("payments")
        .select("id, created_at, status, plan_type")
        .eq("user_id", user!.id)
        .in("status", ["failed", "pending"])
        .order("created_at", { ascending: false })
        .limit(5);
      
      if (error) throw error;
      
      // Filter to show only recent failed/pending payments (within 48 hours)
      return data?.filter(p => {
        const hoursAgo = differenceInHours(new Date(), new Date(p.created_at));
        return hoursAgo <= 48;
      }) || [];
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  if (dismissed || !failedPayments?.length) return null;

  const hasFailedPayment = failedPayments.some(p => p.status === "failed");
  const hasPendingPayment = failedPayments.some(p => p.status === "pending");

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -10, height: 0 }}
        animate={{ opacity: 1, y: 0, height: "auto" }}
        exit={{ opacity: 0, y: -10, height: 0 }}
        className={`mb-6 rounded-xl border p-4 ${
          hasFailedPayment 
            ? "bg-red-500/10 border-red-500/30" 
            : "bg-yellow-500/10 border-yellow-500/30"
        }`}
      >
        <div className="flex items-start gap-3">
          <AlertTriangle className={`w-5 h-5 flex-shrink-0 mt-0.5 ${
            hasFailedPayment ? "text-red-500" : "text-yellow-500"
          }`} />
          
          <div className="flex-1 min-w-0">
            <h4 className={`font-medium text-sm ${
              hasFailedPayment ? "text-red-400" : "text-yellow-400"
            }`}>
              {hasFailedPayment 
                ? "Payment Failed" 
                : "Payment Pending"}
            </h4>
            <p className="text-sm text-muted-foreground mt-1">
              {hasFailedPayment 
                ? "Your recent payment could not be processed. Please try again or use a different payment method."
                : "Your payment is still being processed. If it doesn't complete soon, please try again."}
            </p>
            
            <div className="flex flex-wrap gap-2 mt-3">
              <Link to="/pricing">
                <Button size="sm" variant={hasFailedPayment ? "destructive" : "default"} className="h-8">
                  {hasFailedPayment ? "Try Again" : "Check Status"}
                </Button>
              </Link>
              <Link to="/payments">
                <Button size="sm" variant="outline" className="h-8">
                  View Payment History
                </Button>
              </Link>
            </div>
          </div>
          
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 flex-shrink-0"
            onClick={() => setDismissed(true)}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}