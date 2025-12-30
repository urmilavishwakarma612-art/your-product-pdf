import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Loader2, CheckCircle2, XCircle, Clock, Crown, ArrowRight, Home } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useSubscription } from "@/hooks/useSubscription";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/landing/Navbar";

const PaymentStatus = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { isPremium, refetch: refetchSubscription } = useSubscription();

  // Redirect to auth if not logged in
  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  // Fetch latest payment
  const { data: payment, isLoading, refetch } = useQuery({
    queryKey: ['latest-payment', user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from('payments')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
      
      if (error && error.code !== 'PGRST116') throw error;
      return data;
    },
    enabled: !!user,
    refetchInterval: (query) => {
      // Auto-refresh every 3 seconds if payment is pending
      const data = query.state.data;
      return data?.status === 'pending' ? 3000 : false;
    },
  });

  // Refetch subscription when payment becomes completed
  useEffect(() => {
    if (payment?.status === 'completed') {
      refetchSubscription();
    }
  }, [payment?.status, refetchSubscription]);

  const getStatusConfig = () => {
    if (!payment) {
      return {
        icon: Clock,
        iconBg: "bg-muted",
        iconColor: "text-muted-foreground",
        title: "No Payment Found",
        description: "You haven't made any payments yet.",
        showRetry: false,
      };
    }

    switch (payment.status) {
      case 'completed':
        return {
          icon: CheckCircle2,
          iconBg: "bg-green-500/20",
          iconColor: "text-green-500",
          title: "Payment Successful!",
          description: `Your ${payment.plan_type === 'lifetime' ? 'Lifetime' : 'Monthly'} Pro subscription is now active.`,
          showRetry: false,
        };
      case 'failed':
        return {
          icon: XCircle,
          iconBg: "bg-destructive/20",
          iconColor: "text-destructive",
          title: "Payment Failed",
          description: "Your payment could not be processed. Please try again.",
          showRetry: true,
        };
      case 'pending':
      default:
        return {
          icon: Clock,
          iconBg: "bg-primary/20",
          iconColor: "text-primary",
          title: "Payment Pending",
          description: "Your payment is being processed. This page will update automatically.",
          showRetry: false,
        };
    }
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  const config = getStatusConfig();
  const StatusIcon = config.icon;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container mx-auto px-4 pt-24 pb-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md mx-auto"
        >
          <div className="glass-card p-8 text-center">
            {/* Status Icon */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", delay: 0.2 }}
              className={`w-24 h-24 mx-auto mb-6 rounded-full ${config.iconBg} flex items-center justify-center`}
            >
              {payment?.status === 'pending' ? (
                <Loader2 className={`w-12 h-12 ${config.iconColor} animate-spin`} />
              ) : (
                <StatusIcon className={`w-12 h-12 ${config.iconColor}`} />
              )}
            </motion.div>

            {/* Title & Description */}
            <h1 className="text-2xl font-bold mb-2">{config.title}</h1>
            <p className="text-muted-foreground mb-6">{config.description}</p>

            {/* Pro Badge if successful */}
            {payment?.status === 'completed' && isPremium && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/20 border border-primary/30 mb-6"
              >
                <Crown className="w-5 h-5 text-primary" />
                <span className="font-medium text-primary">Pro Member</span>
              </motion.div>
            )}

            {/* Payment Details */}
            {payment && (
              <div className="bg-muted/30 rounded-lg p-4 mb-6 text-left">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Amount</span>
                    <span className="font-medium">₹{payment.amount / 100}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Plan</span>
                    <span className="font-medium capitalize">{payment.plan_type}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Date</span>
                    <span className="font-medium">
                      {new Date(payment.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Status</span>
                    <span className={`font-medium capitalize ${
                      payment.status === 'completed' ? 'text-green-500' :
                      payment.status === 'failed' ? 'text-destructive' :
                      'text-primary'
                    }`}>
                      {payment.status}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="space-y-3">
              {config.showRetry && (
                <Button 
                  onClick={() => navigate('/patterns')} 
                  className="w-full btn-primary-glow"
                >
                  Try Again
                </Button>
              )}
              
              {payment?.status === 'completed' && (
                <Button 
                  onClick={() => navigate('/patterns')} 
                  className="w-full btn-primary-glow"
                >
                  Start Learning
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              )}

              <Button 
                onClick={() => navigate('/')} 
                variant="ghost" 
                className="w-full text-muted-foreground"
              >
                <Home className="w-4 h-4 mr-2" />
                Go to Home
              </Button>

              {payment?.status === 'pending' && (
                <Button 
                  onClick={() => refetch()} 
                  variant="outline" 
                  className="w-full"
                >
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Checking Status...
                </Button>
              )}
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  );
};

export default PaymentStatus;
