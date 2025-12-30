import { motion, AnimatePresence } from "framer-motion";
import { Loader2, XCircle, RefreshCw, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

type PaymentStatus = 'loading' | 'success' | 'error' | null;

interface PaymentOverlayProps {
  status: PaymentStatus;
  errorMessage?: string;
  onRetry: () => void;
  onClose: () => void;
}

export const PaymentOverlay = ({ status, errorMessage, onRetry, onClose }: PaymentOverlayProps) => {
  if (!status) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] bg-background/95 backdrop-blur-md flex items-center justify-center p-4"
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="glass-card p-8 max-w-md w-full text-center"
        >
          {status === 'loading' && (
            <>
              <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-primary/20 flex items-center justify-center">
                <Loader2 className="w-10 h-10 text-primary animate-spin" />
              </div>
              <h2 className="text-xl font-bold mb-2">Processing Payment</h2>
              <p className="text-muted-foreground text-sm">
                Please wait while we process your payment. Do not close this window.
              </p>
            </>
          )}

          {status === 'success' && (
            <>
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", duration: 0.5 }}
                className="w-20 h-20 mx-auto mb-6 rounded-full bg-green-500/20 flex items-center justify-center"
              >
                <CheckCircle2 className="w-10 h-10 text-green-500" />
              </motion.div>
              <h2 className="text-xl font-bold mb-2 text-green-500">Payment Successful!</h2>
              <p className="text-muted-foreground text-sm mb-6">
                Welcome to Pro! You now have access to all premium features.
              </p>
              <Button onClick={onClose} className="w-full btn-primary-glow">
                Continue Learning
              </Button>
            </>
          )}

          {status === 'error' && (
            <>
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", duration: 0.5 }}
                className="w-20 h-20 mx-auto mb-6 rounded-full bg-destructive/20 flex items-center justify-center"
              >
                <XCircle className="w-10 h-10 text-destructive" />
              </motion.div>
              <h2 className="text-xl font-bold mb-2 text-destructive">Payment Failed</h2>
              <p className="text-muted-foreground text-sm mb-2">
                We couldn't process your payment. Please try again.
              </p>
              {errorMessage && (
                <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3 mb-6">
                  <p className="text-xs text-destructive font-mono">{errorMessage}</p>
                </div>
              )}
              <div className="space-y-3">
                <Button onClick={onRetry} className="w-full btn-primary-glow">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Try Again
                </Button>
                <Button onClick={onClose} variant="ghost" className="w-full text-muted-foreground">
                  Cancel
                </Button>
              </div>
            </>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
