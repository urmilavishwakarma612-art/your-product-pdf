import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import { format, formatDistanceToNow } from "date-fns";
import { 
  RefreshCcw, 
  Check, 
  X, 
  Clock,
  IndianRupee,
  MessageSquare,
  AlertCircle
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

interface RefundRequest {
  id: string;
  payment_id: string;
  user_id: string;
  reason: string;
  status: string;
  admin_notes: string | null;
  refund_amount: number | null;
  created_at: string;
  processed_at: string | null;
  payments: {
    amount: number;
    plan_type: string;
    created_at: string;
    razorpay_payment_id: string | null;
  };
  profiles: {
    username: string | null;
  };
}

const AdminRefunds = () => {
  const queryClient = useQueryClient();
  const [selectedRequest, setSelectedRequest] = useState<RefundRequest | null>(null);
  const [showDialog, setShowDialog] = useState(false);
  const [adminNotes, setAdminNotes] = useState("");
  const [action, setAction] = useState<"approve" | "reject" | null>(null);

  const { data: refundRequests, isLoading } = useQuery({
    queryKey: ["admin-refunds"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("refund_requests")
        .select(`
          *,
          payments!inner (amount, plan_type, created_at, razorpay_payment_id),
          profiles:user_id (username)
        `)
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data as unknown as RefundRequest[];
    },
  });

  const processRefundMutation = useMutation({
    mutationFn: async ({ id, status, notes }: { id: string; status: string; notes: string }) => {
      const { data, error } = await supabase.functions.invoke('update-refund-status', {
        body: {
          refund_request_id: id,
          status: status === 'approved' ? 'approved' : 'rejected',
          admin_notes: notes,
        },
      });

      if (error) throw error;
      if (!data?.success) {
        throw new Error(data?.error || 'Failed to update refund request');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-refunds"] });
      toast.success(action === "approve" ? "Refund approved" : "Refund rejected");
      setShowDialog(false);
      setSelectedRequest(null);
      setAdminNotes("");
    },
    onError: (error) => {
      toast.error("Failed: " + error.message);
    },
  });

  const openActionDialog = (request: RefundRequest, actionType: "approve" | "reject") => {
    setSelectedRequest(request);
    setAction(actionType);
    setAdminNotes("");
    setShowDialog(true);
  };

  const handleProcess = () => {
    if (!selectedRequest || !action) return;
    processRefundMutation.mutate({
      id: selectedRequest.id,
      status: action === "approve" ? "approved" : "rejected",
      notes: adminNotes,
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
      case "approved":
        return <Badge className="bg-green-500/20 text-green-400 border-green-500/30"><Check className="w-3 h-3 mr-1" />Approved</Badge>;
      case "rejected":
        return <Badge className="bg-red-500/20 text-red-400 border-red-500/30"><X className="w-3 h-3 mr-1" />Rejected</Badge>;
      case "processed":
        return <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30"><RefreshCcw className="w-3 h-3 mr-1" />Processed</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const pendingCount = refundRequests?.filter(r => r.status === "pending").length || 0;
  const approvedCount = refundRequests?.filter(r => r.status === "approved").length || 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold mb-2">Refund Requests</h1>
        <p className="text-muted-foreground text-sm sm:text-base">Review and process refund requests</p>
      </div>

      {/* Analytics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-4"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-yellow-500/10">
              <Clock className="w-5 h-5 text-yellow-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{pendingCount}</p>
              <p className="text-xs text-muted-foreground">Pending</p>
            </div>
          </div>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-card p-4"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-green-500/10">
              <Check className="w-5 h-5 text-green-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{approvedCount}</p>
              <p className="text-xs text-muted-foreground">Approved</p>
            </div>
          </div>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass-card p-4"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <RefreshCcw className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{refundRequests?.length || 0}</p>
              <p className="text-xs text-muted-foreground">Total Requests</p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Refund Requests Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="glass-card overflow-hidden"
      >
        {isLoading ? (
          <div className="p-8 text-center text-muted-foreground">Loading...</div>
        ) : refundRequests?.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            <RefreshCcw className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No refund requests yet</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead className="hidden md:table-cell">Reason</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="hidden sm:table-cell">Requested</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {refundRequests?.map((request) => (
                  <TableRow key={request.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{request.profiles?.username || "Anonymous"}</p>
                        <p className="text-xs text-muted-foreground capitalize">{request.payments?.plan_type}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <IndianRupee className="w-3 h-3" />
                        <span className="font-medium">{request.payments?.amount / 100}</span>
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell max-w-[200px]">
                      <p className="truncate text-sm text-muted-foreground">{request.reason}</p>
                    </TableCell>
                    <TableCell>{getStatusBadge(request.status)}</TableCell>
                    <TableCell className="hidden sm:table-cell text-muted-foreground text-sm">
                      {formatDistanceToNow(new Date(request.created_at), { addSuffix: true })}
                    </TableCell>
                    <TableCell className="text-right">
                      {request.status === "pending" ? (
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-green-500 hover:text-green-400 h-8"
                            onClick={() => openActionDialog(request, "approve")}
                          >
                            <Check className="w-4 h-4 mr-1" />
                            <span className="hidden sm:inline">Approve</span>
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-500 hover:text-red-400 h-8"
                            onClick={() => openActionDialog(request, "reject")}
                          >
                            <X className="w-4 h-4 mr-1" />
                            <span className="hidden sm:inline">Reject</span>
                          </Button>
                        </div>
                      ) : (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedRequest(request);
                            setShowDialog(true);
                            setAction(null);
                          }}
                        >
                          <MessageSquare className="w-4 h-4" />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </motion.div>

      {/* Action Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {action === "approve" ? (
                <Check className="w-5 h-5 text-green-500" />
              ) : action === "reject" ? (
                <X className="w-5 h-5 text-red-500" />
              ) : (
                <MessageSquare className="w-5 h-5 text-primary" />
              )}
              {action === "approve" ? "Approve Refund" : action === "reject" ? "Reject Refund" : "Request Details"}
            </DialogTitle>
            <DialogDescription>
              {action ? "Add notes for this decision" : "View request details"}
            </DialogDescription>
          </DialogHeader>
          
          {selectedRequest && (
            <div className="space-y-4 py-4">
              <div className="p-3 rounded-lg bg-muted/30 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">User</span>
                  <span>{selectedRequest.profiles?.username || "Anonymous"}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Amount</span>
                  <span>₹{selectedRequest.payments?.amount / 100}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Plan</span>
                  <span className="capitalize">{selectedRequest.payments?.plan_type}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Purchase Date</span>
                  <span>{format(new Date(selectedRequest.payments?.created_at), "MMM d, yyyy")}</span>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-muted-foreground">Reason</Label>
                <p className="text-sm p-3 rounded-lg bg-muted/20 border border-border/50">
                  {selectedRequest.reason}
                </p>
              </div>

              {action && (
                <div className="space-y-2">
                  <Label>Admin Notes</Label>
                  <Textarea
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    placeholder="Add notes about this decision..."
                    rows={3}
                  />
                </div>
              )}

              {selectedRequest.admin_notes && !action && (
                <div className="space-y-2">
                  <Label className="text-muted-foreground">Admin Notes</Label>
                  <p className="text-sm p-3 rounded-lg bg-muted/20 border border-border/50">
                    {selectedRequest.admin_notes}
                  </p>
                </div>
              )}

              {action === "approve" && (
                <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/30">
                  <AlertCircle className="w-4 h-4 text-amber-500 mt-0.5" />
                  <p className="text-xs text-amber-400">
                    Approving will downgrade user to free plan. Process refund manually via Razorpay dashboard.
                  </p>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>
              {action ? "Cancel" : "Close"}
            </Button>
            {action && (
              <Button 
                onClick={handleProcess}
                disabled={processRefundMutation.isPending}
                variant={action === "approve" ? "default" : "destructive"}
              >
                {processRefundMutation.isPending ? "Processing..." : action === "approve" ? "Approve" : "Reject"}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminRefunds;