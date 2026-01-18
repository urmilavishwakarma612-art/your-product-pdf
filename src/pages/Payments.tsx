import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { motion } from "framer-motion";
import { format, differenceInDays } from "date-fns";
import { 
  CreditCard, 
  CheckCircle, 
  XCircle, 
  Clock, 
  RefreshCcw,
  Shield,
  HelpCircle,
  ChevronDown,
  IndianRupee,
  Calendar,
  AlertTriangle
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RefundSection } from "@/components/profile/RefundSection";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface Payment {
  id: string;
  amount: number;
  original_amount: number | null;
  discount_amount: number | null;
  coupon_code: string | null;
  plan_type: string;
  status: string;
  created_at: string;
  razorpay_payment_id: string | null;
}

interface RefundRequest {
  id: string;
  payment_id: string;
  reason: string;
  status: string;
  admin_notes: string | null;
  created_at: string;
  processed_at: string | null;
}

const Payments = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  // Fetch all payments
  const { data: payments = [], isLoading: paymentsLoading } = useQuery({
    queryKey: ["user-payments", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("payments")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data as Payment[];
    },
    enabled: !!user?.id,
  });

  // Fetch refund requests
  const { data: refundRequests = [] } = useQuery({
    queryKey: ["user-refund-requests-full", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("refund_requests")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data as RefundRequest[];
    },
    enabled: !!user?.id,
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case "failed":
        return <XCircle className="w-5 h-5 text-red-500" />;
      case "pending":
        return <Clock className="w-5 h-5 text-yellow-500" />;
      default:
        return <Clock className="w-5 h-5 text-muted-foreground" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Completed</Badge>;
      case "failed":
        return <Badge className="bg-red-500/20 text-red-400 border-red-500/30">Failed</Badge>;
      case "pending":
        return <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">Pending</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getRefundStatus = (paymentId: string) => {
    return refundRequests.find(r => r.payment_id === paymentId);
  };

  const getRefundStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30"><Clock className="w-3 h-3 mr-1" />Refund Pending</Badge>;
      case "approved":
        return <Badge className="bg-green-500/20 text-green-400 border-green-500/30"><CheckCircle className="w-3 h-3 mr-1" />Refund Approved</Badge>;
      case "rejected":
        return <Badge className="bg-red-500/20 text-red-400 border-red-500/30"><XCircle className="w-3 h-3 mr-1" />Refund Rejected</Badge>;
      case "processed":
        return <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30"><RefreshCcw className="w-3 h-3 mr-1" />Refund Processed</Badge>;
      default:
        return null;
    }
  };

  const faqItems = [
    {
      question: "How long does a refund take to process?",
      answer: "Once approved, refunds are processed within 3-5 business days. The amount will be credited to your original payment method."
    },
    {
      question: "What is the refund policy?",
      answer: "You can request a full refund within 7 days of purchase. After 7 days, refunds are not available. No questions asked during the refund window."
    },
    {
      question: "Can I cancel my subscription?",
      answer: "Yes, you can request a refund within the 7-day window to cancel. After approval, your Pro access will be reverted to Free."
    },
    {
      question: "What payment methods are accepted?",
      answer: "We accept all major credit/debit cards, UPI, net banking, and popular wallets through Razorpay's secure payment gateway."
    },
    {
      question: "Is my payment information secure?",
      answer: "Yes, all payments are processed through Razorpay, which is PCI-DSS compliant. We never store your card details on our servers."
    },
    {
      question: "What happens if my payment fails?",
      answer: "If a payment fails, you can try again from the Pricing page. If the issue persists, please contact us at hello.nexalgotrix@gmail.com."
    },
  ];

  // Check for failed/pending payments to show alert
  const hasFailedPayments = payments.some(p => p.status === "failed");
  const hasPendingPayments = payments.some(p => p.status === "pending" && differenceInDays(new Date(), new Date(p.created_at)) > 0);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-primary">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container mx-auto px-4 pt-24 pb-12 max-w-4xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-xl bg-primary/10">
              <CreditCard className="w-6 h-6 text-primary" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold">Payments & Refunds</h1>
          </div>
          <p className="text-muted-foreground">Track your payments, request refunds, and manage your subscription</p>
        </motion.div>

        {/* Alert for failed/pending payments */}
        {(hasFailedPayments || hasPendingPayments) && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            <Alert className="border-amber-500/30 bg-amber-500/10">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              <AlertDescription className="text-amber-400">
                {hasFailedPayments 
                  ? "You have failed payments. Please try again from the Pricing page or contact support."
                  : "You have pending payments. If they remain pending for too long, please contact support."}
              </AlertDescription>
            </Alert>
          </motion.div>
        )}

        {/* Trust Badges */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8"
        >
          {[
            { icon: Shield, label: "Secure Payments", sublabel: "PCI-DSS Compliant" },
            { icon: RefreshCcw, label: "7-Day Refund", sublabel: "No Questions Asked" },
            { icon: CreditCard, label: "Multiple Options", sublabel: "Cards, UPI, Wallets" },
            { icon: CheckCircle, label: "Instant Access", sublabel: "On Payment Success" },
          ].map((item, index) => (
            <div key={item.label} className="glass-card p-3 sm:p-4 text-center">
              <item.icon className="w-5 h-5 sm:w-6 sm:h-6 text-primary mx-auto mb-2" />
              <p className="text-xs sm:text-sm font-medium">{item.label}</p>
              <p className="text-[10px] sm:text-xs text-muted-foreground">{item.sublabel}</p>
            </div>
          ))}
        </motion.div>

        {/* Payment History */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-8"
        >
          <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Calendar className="w-5 h-5 text-primary" />
                Payment History
              </CardTitle>
            </CardHeader>
            <CardContent>
              {paymentsLoading ? (
                <div className="animate-pulse space-y-3">
                  {[1, 2].map(i => (
                    <div key={i} className="h-20 bg-muted/30 rounded-lg" />
                  ))}
                </div>
              ) : payments.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <CreditCard className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No payments yet</p>
                  <Button 
                    variant="outline" 
                    className="mt-4"
                    onClick={() => navigate("/pricing")}
                  >
                    View Plans
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {payments.map((payment, index) => {
                    const refund = getRefundStatus(payment.id);
                    const daysAgo = differenceInDays(new Date(), new Date(payment.created_at));
                    const canRefund = payment.status === "completed" && daysAgo <= 7 && !refund;
                    
                    return (
                      <motion.div
                        key={payment.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="relative"
                      >
                        {/* Timeline connector */}
                        {index < payments.length - 1 && (
                          <div className="absolute left-[18px] top-12 bottom-0 w-0.5 bg-border/50 hidden sm:block" />
                        )}
                        
                        <div className="flex gap-3 sm:gap-4">
                          {/* Status Icon */}
                          <div className="flex-shrink-0 w-9 h-9 rounded-full bg-muted/50 flex items-center justify-center z-10">
                            {getStatusIcon(payment.status)}
                          </div>
                          
                          {/* Content */}
                          <div className="flex-1 p-3 sm:p-4 rounded-xl bg-muted/20 border border-border/30 space-y-2">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                              <div className="flex items-center gap-2 flex-wrap">
                                <div className="flex items-center gap-1">
                                  <IndianRupee className="w-4 h-4" />
                                  <span className="font-bold text-lg">{payment.amount / 100}</span>
                                </div>
                                <Badge variant="outline" className="capitalize text-xs">{payment.plan_type.replace("_", " ")}</Badge>
                                {getStatusBadge(payment.status)}
                              </div>
                              <span className="text-xs text-muted-foreground">
                                {format(new Date(payment.created_at), "MMM d, yyyy 'at' h:mm a")}
                              </span>
                            </div>
                            
                            {/* Discount info */}
                            {payment.coupon_code && payment.discount_amount && (
                              <p className="text-xs text-green-400">
                                Coupon <span className="font-mono bg-green-500/10 px-1 rounded">{payment.coupon_code}</span> applied • Saved ₹{payment.discount_amount / 100}
                              </p>
                            )}
                            
                            {/* Refund status if exists */}
                            {refund && (
                              <div className="flex items-center gap-2 pt-2 border-t border-border/30">
                                {getRefundStatusBadge(refund.status)}
                                {refund.processed_at && (
                                  <span className="text-xs text-muted-foreground">
                                    Processed on {format(new Date(refund.processed_at), "MMM d, yyyy")}
                                  </span>
                                )}
                              </div>
                            )}
                            
                            {/* Refund eligibility */}
                            {canRefund && (
                              <p className="text-xs text-primary">
                                ✓ Eligible for refund ({7 - daysAgo} days remaining)
                              </p>
                            )}

                            {/* Transaction ID */}
                            {payment.razorpay_payment_id && (
                              <p className="text-[10px] text-muted-foreground font-mono">
                                ID: {payment.razorpay_payment_id}
                              </p>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Refund Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mb-8"
        >
          <RefundSection />
        </motion.div>

        {/* FAQ Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-lg">
                <HelpCircle className="w-5 h-5 text-primary" />
                Frequently Asked Questions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="w-full">
                {faqItems.map((item, index) => (
                  <AccordionItem key={index} value={`item-${index}`} className="border-border/30">
                    <AccordionTrigger className="text-left text-sm sm:text-base hover:no-underline py-3">
                      {item.question}
                    </AccordionTrigger>
                    <AccordionContent className="text-muted-foreground text-sm pb-4">
                      {item.answer}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </CardContent>
          </Card>
        </motion.div>

        {/* Contact Support */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-8 text-center"
        >
          <p className="text-sm text-muted-foreground">
            Need help? Contact us at{" "}
            <a href="mailto:hello.nexalgotrix@gmail.com" className="text-primary hover:underline">
              hello.nexalgotrix@gmail.com
            </a>
          </p>
        </motion.div>
      </main>

      <Footer />
    </div>
  );
};

export default Payments;