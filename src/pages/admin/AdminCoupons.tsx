import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { 
  Ticket, 
  Plus, 
  Edit, 
  Trash2, 
  Copy,
  Check,
  Users,
  IndianRupee,
  Calendar,
  ToggleLeft,
  ToggleRight
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
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";

interface Coupon {
  id: string;
  code: string;
  discount_type: string;
  monthly_discount: number;
  six_month_discount: number;
  yearly_discount: number;
  max_redemptions: number;
  current_redemptions: number;
  starts_at: string;
  expires_at: string | null;
  is_active: boolean;
  created_at: string;
}

const AdminCoupons = () => {
  const queryClient = useQueryClient();
  const [showDialog, setShowDialog] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  
  // Form state
  const [code, setCode] = useState("");
  const [discountType, setDiscountType] = useState("fixed");
  const [monthlyDiscount, setMonthlyDiscount] = useState("");
  const [sixMonthDiscount, setSixMonthDiscount] = useState("");
  const [yearlyDiscount, setYearlyDiscount] = useState("");
  const [maxRedemptions, setMaxRedemptions] = useState("100");
  const [expiresAt, setExpiresAt] = useState("");
  const [isActive, setIsActive] = useState(true);

  const { data: coupons, isLoading } = useQuery({
    queryKey: ["admin-coupons"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("coupons")
        .select("*")
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data as Coupon[];
    },
  });

  const { data: analytics } = useQuery({
    queryKey: ["coupon-analytics"],
    queryFn: async () => {
      const { data: redemptions, error } = await supabase
        .from("coupon_redemptions")
        .select("coupon_id, payment_id");
      
      if (error) throw error;
      
      const totalRedemptions = redemptions?.length || 0;
      return { totalRedemptions };
    },
  });

  const resetForm = () => {
    setCode("");
    setDiscountType("fixed");
    setMonthlyDiscount("");
    setSixMonthDiscount("");
    setYearlyDiscount("");
    setMaxRedemptions("100");
    setExpiresAt("");
    setIsActive(true);
    setEditingCoupon(null);
  };

  const openEditDialog = (coupon: Coupon) => {
    setEditingCoupon(coupon);
    setCode(coupon.code);
    setDiscountType(coupon.discount_type);
    setMonthlyDiscount((coupon.monthly_discount / 100).toString());
    setSixMonthDiscount((coupon.six_month_discount / 100).toString());
    setYearlyDiscount((coupon.yearly_discount / 100).toString());
    setMaxRedemptions(coupon.max_redemptions.toString());
    setExpiresAt(coupon.expires_at ? coupon.expires_at.split('T')[0] : "");
    setIsActive(coupon.is_active);
    setShowDialog(true);
  };

  const saveCouponMutation = useMutation({
    mutationFn: async () => {
      const couponData = {
        code: code.toUpperCase(),
        discount_type: discountType,
        monthly_discount: Math.round(parseFloat(monthlyDiscount || "0") * 100),
        six_month_discount: Math.round(parseFloat(sixMonthDiscount || "0") * 100),
        yearly_discount: Math.round(parseFloat(yearlyDiscount || "0") * 100),
        max_redemptions: parseInt(maxRedemptions),
        expires_at: expiresAt ? new Date(expiresAt).toISOString() : null,
        is_active: isActive,
      };

      if (editingCoupon) {
        const { error } = await supabase
          .from("coupons")
          .update(couponData)
          .eq("id", editingCoupon.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("coupons")
          .insert(couponData);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-coupons"] });
      toast.success(editingCoupon ? "Coupon updated!" : "Coupon created!");
      setShowDialog(false);
      resetForm();
    },
    onError: (error) => {
      toast.error("Failed: " + error.message);
    },
  });

  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const { error } = await supabase
        .from("coupons")
        .update({ is_active: isActive })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-coupons"] });
      toast.success("Coupon status updated");
    },
  });

  const deleteCouponMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("coupons")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-coupons"] });
      toast.success("Coupon deleted");
    },
  });

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const totalCoupons = coupons?.length || 0;
  const activeCoupons = coupons?.filter(c => c.is_active).length || 0;
  const totalRedemptions = analytics?.totalRedemptions || 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold mb-2">Coupons</h1>
          <p className="text-muted-foreground text-sm sm:text-base">Manage discount codes and offers</p>
        </div>
        <Button onClick={() => { resetForm(); setShowDialog(true); }} className="w-full sm:w-auto">
          <Plus className="w-4 h-4 mr-2" />
          Create Coupon
        </Button>
      </div>

      {/* Analytics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-4"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Ticket className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{totalCoupons}</p>
              <p className="text-xs text-muted-foreground">Total Coupons</p>
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
            <div className="p-2 rounded-lg bg-success/10">
              <ToggleRight className="w-5 h-5 text-success" />
            </div>
            <div>
              <p className="text-2xl font-bold">{activeCoupons}</p>
              <p className="text-xs text-muted-foreground">Active</p>
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
            <div className="p-2 rounded-lg bg-amber-500/10">
              <Users className="w-5 h-5 text-amber-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{totalRedemptions}</p>
              <p className="text-xs text-muted-foreground">Redemptions</p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Coupons Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="glass-card overflow-hidden"
      >
        {isLoading ? (
          <div className="p-8 text-center text-muted-foreground">Loading...</div>
        ) : coupons?.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            <Ticket className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No coupons yet</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead className="hidden sm:table-cell">Discounts</TableHead>
                  <TableHead className="hidden md:table-cell">Usage</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {coupons?.map((coupon) => (
                  <TableRow key={coupon.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <code className="bg-muted px-2 py-1 rounded text-sm font-mono">
                          {coupon.code}
                        </code>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => copyCode(coupon.code)}
                        >
                          {copiedCode === coupon.code ? (
                            <Check className="w-3 h-3 text-success" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      <div className="text-xs space-y-1">
                        <div>Monthly: ₹{coupon.monthly_discount / 100}</div>
                        <div>6 Month: ₹{coupon.six_month_discount / 100}</div>
                        <div>Yearly: ₹{coupon.yearly_discount / 100}</div>
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <div className="text-sm">
                        {coupon.current_redemptions} / {coupon.max_redemptions}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={coupon.is_active}
                          onCheckedChange={(checked) => 
                            toggleActiveMutation.mutate({ id: coupon.id, isActive: checked })
                          }
                        />
                        <Badge variant={coupon.is_active ? "default" : "secondary"}>
                          {coupon.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => openEditDialog(coupon)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive"
                          onClick={() => {
                            if (confirm("Delete this coupon?")) {
                              deleteCouponMutation.mutate(coupon.id);
                            }
                          }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </motion.div>

      {/* Create/Edit Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Ticket className="w-5 h-5 text-primary" />
              {editingCoupon ? "Edit Coupon" : "Create Coupon"}
            </DialogTitle>
            <DialogDescription>
              {editingCoupon ? "Update coupon details" : "Create a new discount coupon"}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Coupon Code</Label>
              <Input
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="NEX100"
                className="font-mono"
              />
            </div>

            <div className="space-y-2">
              <Label>Discount Type</Label>
              <Select value={discountType} onValueChange={setDiscountType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="fixed">Fixed Amount (₹)</SelectItem>
                  <SelectItem value="percentage">Percentage (%)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div className="space-y-2">
                <Label className="text-xs">Monthly</Label>
                <div className="relative">
                  <IndianRupee className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground" />
                  <Input
                    type="number"
                    value={monthlyDiscount}
                    onChange={(e) => setMonthlyDiscount(e.target.value)}
                    placeholder="50"
                    className="pl-6"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-xs">6 Month</Label>
                <div className="relative">
                  <IndianRupee className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground" />
                  <Input
                    type="number"
                    value={sixMonthDiscount}
                    onChange={(e) => setSixMonthDiscount(e.target.value)}
                    placeholder="200"
                    className="pl-6"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Yearly</Label>
                <div className="relative">
                  <IndianRupee className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground" />
                  <Input
                    type="number"
                    value={yearlyDiscount}
                    onChange={(e) => setYearlyDiscount(e.target.value)}
                    placeholder="300"
                    className="pl-6"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Max Redemptions</Label>
                <Input
                  type="number"
                  value={maxRedemptions}
                  onChange={(e) => setMaxRedemptions(e.target.value)}
                  placeholder="100"
                />
              </div>
              <div className="space-y-2">
                <Label>Expires At</Label>
                <Input
                  type="date"
                  value={expiresAt}
                  onChange={(e) => setExpiresAt(e.target.value)}
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t">
              <Label>Active</Label>
              <Switch checked={isActive} onCheckedChange={setIsActive} />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={() => saveCouponMutation.mutate()}
              disabled={saveCouponMutation.isPending || !code}
            >
              {saveCouponMutation.isPending ? "Saving..." : editingCoupon ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminCoupons;