import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { RefreshCcw, Clock, Check, X, AlertCircle, Info } from "lucide-react";
import { format, differenceInDays } from "date-fns";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Alert,
  AlertDescription,
} from "@/components/ui/alert";

interface RefundRequest {
  id: string;
  payment_id: string;
  reason: string;
  status: string;
  admin_notes: string | null;
  created_at: string;
  processed_at: string | null;
}

interface Payment {
  id: string;
  amount: number;
  plan_type: string;
  status: string;
  created_at: string;
}

export function RefundSection() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [showRequestDialog, setShowRequestDialog] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [reason, setReason] = useState("");

  // Fetch completed payments
  const { data: eligiblePayments = [] } = useQuery({
    queryKey: ["eligible-refund-payments", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("payments")
        .select("*")
        .eq("user_id", user!.id)
        .eq("status", "completed")
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      
      // Filter payments within 7-day refund window
      return (data as Payment[]).filter(payment => {
        const daysSincePurchase = differenceInDays(new Date(), new Date(payment.created_at));
        return daysSincePurchase <= 7;
      });
    },
    enabled: !!user?.id,
  });

  // Fetch existing refund requests
  const { data: refundRequests = [], isLoading } = useQuery({
    queryKey: ["user-refund-requests", user?.id],
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

  const submitRefundMutation = useMutation({
    mutationFn: async () => {
      if (!selectedPayment || !reason.trim()) throw new Error("Invalid request");
      
      const { error } = await supabase
        .from("refund_requests")
        .insert({
          payment_id: selectedPayment.id,
          user_id: user!.id,
          reason: reason.trim(),
          refund_amount: selectedPayment.amount,
        });
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-refund-requests"] });
      queryClient.invalidateQueries({ queryKey: ["eligible-refund-payments"] });
      toast.success("Refund request submitted successfully");
      setShowRequestDialog(false);
      setSelectedPayment(null);
      setReason("");
    },
    onError: (error) => {
      toast.error("Failed to submit request: " + error.message);
    },
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
      case "approved":
        return <Badge className="bg-green-500/20 text-green-400 border-green-500/30"><Check className="w-3 h-3 mr-1" />Approved</Badge>;
      case "rejected":
        return <Badge className="bg-red-500/20 text-red-400 border-red-500/30"><X className="w-3 h-3 mr-1" />Rejected</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const hasExistingRequest = (paymentId: string) => {
    return refundRequests.some(r => r.payment_id === paymentId);
  };

  if (isLoading) {
    return (
      <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <RefreshCcw className="h-5 w-5 text-primary" />
            Refunds
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3">
            <div className="h-16 bg-muted/50 rounded-lg" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <RefreshCcw className="h-5 w-5 text-primary" />
            Refunds & Cancellations
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Refund Policy Info */}
          <Alert className="border-primary/30 bg-primary/5">
            <Info className="h-4 w-4" />
            <AlertDescription className="text-sm">
              <strong>7-Day Refund Policy:</strong> You can request a refund within 7 days of purchase. 
              Refunds are processed within 3-5 business days after approval.
            </AlertDescription>
          </Alert>

          {/* Eligible Payments for Refund */}
          {eligiblePayments.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-muted-foreground">Eligible for Refund</h4>
              {eligiblePayments.map((payment) => {
                const daysLeft = 7 - differenceInDays(new Date(), new Date(payment.created_at));
                const alreadyRequested = hasExistingRequest(payment.id);
                
                return (
                  <div
                    key={payment.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-lg bg-muted/20 border border-border/30 gap-3"
                  >
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium">₹{payment.amount / 100}</span>
                        <Badge variant="outline" className="capitalize text-xs">{payment.plan_type}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Purchased {format(new Date(payment.created_at), "MMM d, yyyy")} • {daysLeft} days left to request
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={alreadyRequested}
                      onClick={() => {
                        setSelectedPayment(payment);
                        setShowRequestDialog(true);
                      }}
                      className="w-full sm:w-auto"
                    >
                      {alreadyRequested ? "Requested" : "Request Refund"}
                    </Button>
                  </div>
                );
              })}
            </div>
          )}

          {/* Existing Refund Requests */}
          {refundRequests.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-muted-foreground">Your Requests</h4>
              {refundRequests.map((request) => (
                <div
                  key={request.id}
                  className="p-3 rounded-lg bg-muted/20 border border-border/30 space-y-2"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      {getStatusBadge(request.status)}
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(request.created_at), "MMM d, yyyy")}
                      </span>
                    </div>
                    {request.processed_at && (
                      <span className="text-xs text-muted-foreground">
                        Processed {format(new Date(request.processed_at), "MMM d, yyyy")}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">{request.reason}</p>
                  {request.admin_notes && (
                    <div className="mt-2 p-2 rounded bg-muted/30 text-xs">
                      <span className="text-muted-foreground">Admin response: </span>
                      {request.admin_notes}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {eligiblePayments.length === 0 && refundRequests.length === 0 && (
            <div className="text-center py-6 text-muted-foreground">
              <RefreshCcw className="h-10 w-10 mx-auto mb-3 opacity-50" />
              <p className="text-sm">No refund requests or eligible payments</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Refund Request Dialog */}
      <Dialog open={showRequestDialog} onOpenChange={setShowRequestDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <RefreshCcw className="w-5 h-5 text-primary" />
              Request Refund
            </DialogTitle>
            <DialogDescription>
              Please tell us why you'd like a refund
            </DialogDescription>
          </DialogHeader>

          {selectedPayment && (
            <div className="space-y-4 py-4">
              <div className="p-3 rounded-lg bg-muted/30 space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Amount</span>
                  <span className="font-medium">₹{selectedPayment.amount / 100}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Plan</span>
                  <span className="capitalize">{selectedPayment.plan_type}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Purchased</span>
                  <span>{format(new Date(selectedPayment.created_at), "MMM d, yyyy")}</span>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Reason for refund</label>
                <Textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Please explain why you'd like a refund..."
                  rows={4}
                />
              </div>

              <Alert className="border-amber-500/30 bg-amber-500/5">
                <AlertCircle className="h-4 w-4 text-amber-500" />
                <AlertDescription className="text-xs text-amber-400">
                  Refund requests are reviewed within 24-48 hours. If approved, 
                  your subscription will be cancelled and amount refunded within 3-5 business days.
                </AlertDescription>
              </Alert>
            </div>
          )}

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={() => setShowRequestDialog(false)} className="w-full sm:w-auto">
              Cancel
            </Button>
            <Button 
              onClick={() => submitRefundMutation.mutate()}
              disabled={submitRefundMutation.isPending || !reason.trim()}
              className="w-full sm:w-auto"
            >
              {submitRefundMutation.isPending ? "Submitting..." : "Submit Request"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
