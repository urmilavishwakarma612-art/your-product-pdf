import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CreditCard, Crown, Calendar, IndianRupee } from "lucide-react";
import { format } from "date-fns";
import { useAuth } from "@/hooks/useAuth";

interface Payment {
  id: string;
  razorpay_order_id: string;
  razorpay_payment_id: string | null;
  amount: number;
  currency: string;
  plan_type: string;
  status: string;
  created_at: string;
}

export function PaymentHistory() {
  const { user } = useAuth();

  const { data: payments = [], isLoading } = useQuery({
    queryKey: ["payments", user?.id],
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

  const { data: profile } = useQuery({
    queryKey: ["subscription-details", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("subscription_status, subscription_expires_at")
        .eq("id", user!.id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
      case "captured":
        return <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Completed</Badge>;
      case "pending":
        return <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">Pending</Badge>;
      case "failed":
        return <Badge className="bg-red-500/20 text-red-400 border-red-500/30">Failed</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getPlanBadge = (planType: string) => {
    if (planType === "lifetime") {
      return (
        <Badge className="bg-gradient-to-r from-amber-500/20 to-yellow-500/20 text-amber-400 border-amber-500/30">
          <Crown className="h-3 w-3 mr-1" />
          Lifetime
        </Badge>
      );
    }
    return (
      <Badge className="bg-primary/20 text-primary border-primary/30">
        Monthly
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <CreditCard className="h-5 w-5 text-primary" />
            Payment History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-muted/50 rounded-lg" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <CreditCard className="h-5 w-5 text-primary" />
          Payment History
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current Subscription Status */}
        {profile && (
          <div className="p-4 rounded-lg bg-muted/30 border border-border/50">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Current Plan</p>
                <p className="font-semibold capitalize flex items-center gap-2 mt-1">
                  {profile.subscription_status === "pro" ? (
                    <>
                      <Crown className="h-4 w-4 text-amber-400" />
                      Pro Member
                    </>
                  ) : (
                    "Free Plan"
                  )}
                </p>
              </div>
              {profile.subscription_status === "pro" && profile.subscription_expires_at && (
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Expires</p>
                  <p className="font-medium text-sm flex items-center gap-1 mt-1">
                    <Calendar className="h-3 w-3" />
                    {new Date(profile.subscription_expires_at).getFullYear() > 2100
                      ? "Never (Lifetime)"
                      : format(new Date(profile.subscription_expires_at), "MMM d, yyyy")}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Payment List */}
        {payments.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <CreditCard className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No payment history yet</p>
            <p className="text-sm mt-1">Your transactions will appear here</p>
          </div>
        ) : (
          <div className="space-y-3">
            {payments.map((payment) => (
              <div
                key={payment.id}
                className="flex items-center justify-between p-3 rounded-lg bg-muted/20 border border-border/30 hover:bg-muted/30 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <IndianRupee className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">₹{payment.amount / 100}</span>
                      {getPlanBadge(payment.plan_type)}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {format(new Date(payment.created_at), "MMM d, yyyy 'at' h:mm a")}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  {getStatusBadge(payment.status)}
                  {payment.razorpay_payment_id && (
                    <p className="text-xs text-muted-foreground mt-1 font-mono">
                      {payment.razorpay_payment_id.slice(-8)}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
