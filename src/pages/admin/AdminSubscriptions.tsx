import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import { format, formatDistanceToNow } from "date-fns";
import { 
  Crown, 
  Users, 
  TrendingUp, 
  Search,
  MoreHorizontal,
  Check,
  X,
  Calendar,
  Sparkles,
  Mail
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";

interface Profile {
  id: string;
  username: string | null;
  total_xp: number;
  current_level: number;
  subscription_status: string;
  subscription_expires_at: string | null;
  created_at: string;
  last_solved_at: string | null;
  email?: string;
}

const AdminSubscriptions = () => {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "pro" | "free">("all");
  const [selectedUser, setSelectedUser] = useState<Profile | null>(null);
  const [showGrantDialog, setShowGrantDialog] = useState(false);
  const [grantDuration, setGrantDuration] = useState<string>("30");
  const [sendEmailNotification, setSendEmailNotification] = useState(true);

  const { data: users, isLoading } = useQuery({
    queryKey: ["admin-subscriptions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .order("subscription_status", { ascending: false })
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data as Profile[];
    },
  });

  // Send email notification
  const sendSubscriptionEmail = async (
    userId: string, 
    username: string | null,
    type: "granted" | "revoked" | "expiring",
    expiresAt?: string | null
  ) => {
    try {
      // Get user email from edge function (uses service role)
      const { data: emailData, error: emailError } = await supabase.functions.invoke("get-user-email", {
        body: { userId },
      });
      
      if (emailError || !emailData?.email) {
        console.log("No email found for user:", userId);
        return;
      }

      const response = await supabase.functions.invoke("subscription-email", {
        body: {
          email: emailData.email,
          username: username || "Learner",
          type,
          expiresAt,
        },
      });

      if (response.error) {
        console.error("Failed to send email:", response.error);
        toast.error("Subscription updated but email notification failed");
      } else {
        console.log("Email sent successfully to:", emailData.email);
        toast.success("Email notification sent");
      }
    } catch (error) {
      console.error("Error sending email notification:", error);
    }
  };

  const updateSubscriptionMutation = useMutation({
    mutationFn: async ({ 
      userId, 
      status, 
      expiresAt,
      username,
      shouldSendEmail
    }: { 
      userId: string; 
      status: string; 
      expiresAt: string | null;
      username: string | null;
      shouldSendEmail: boolean;
    }) => {
      const { error } = await supabase
        .from("profiles")
        .update({ 
          subscription_status: status,
          subscription_expires_at: expiresAt
        })
        .eq("id", userId);
      
      if (error) throw error;

      // Send email notification if enabled
      if (shouldSendEmail) {
        const emailType = status === "pro" ? "granted" : "revoked";
        await sendSubscriptionEmail(userId, username, emailType, expiresAt);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-subscriptions"] });
      toast.success("Subscription updated successfully");
      setShowGrantDialog(false);
      setSelectedUser(null);
    },
    onError: (error) => {
      toast.error("Failed to update subscription: " + error.message);
    },
  });

  const handleGrantPro = () => {
    if (!selectedUser) return;
    
    const expiresAt = grantDuration === "lifetime" 
      ? null 
      : new Date(Date.now() + parseInt(grantDuration) * 24 * 60 * 60 * 1000).toISOString();
    
    updateSubscriptionMutation.mutate({
      userId: selectedUser.id,
      status: "pro",
      expiresAt,
      username: selectedUser.username,
      shouldSendEmail: sendEmailNotification,
    });
  };

  const handleRevokePro = (user: Profile) => {
    updateSubscriptionMutation.mutate({
      userId: user.id,
      status: "free",
      expiresAt: null,
      username: user.username,
      shouldSendEmail: sendEmailNotification,
    });
  };

  // Filter users
  const filteredUsers = users?.filter(user => {
    const matchesSearch = !searchQuery || 
      user.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || user.subscription_status === statusFilter;
    return matchesSearch && matchesStatus;
  }) || [];

  // Analytics
  const totalUsers = users?.length || 0;
  const proUsers = users?.filter(u => u.subscription_status === "pro").length || 0;
  const freeUsers = totalUsers - proUsers;
  const conversionRate = totalUsers > 0 ? ((proUsers / totalUsers) * 100).toFixed(1) : "0";

  const analyticsCards = [
    { 
      title: "Total Users", 
      value: totalUsers, 
      icon: Users, 
      color: "text-primary",
      bgColor: "bg-primary/10"
    },
    { 
      title: "Pro Subscribers", 
      value: proUsers, 
      icon: Crown, 
      color: "text-amber-500",
      bgColor: "bg-amber-500/10"
    },
    { 
      title: "Free Users", 
      value: freeUsers, 
      icon: Users, 
      color: "text-muted-foreground",
      bgColor: "bg-muted"
    },
    { 
      title: "Conversion Rate", 
      value: `${conversionRate}%`, 
      icon: TrendingUp, 
      color: "text-emerald-500",
      bgColor: "bg-emerald-500/10"
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Subscriptions</h1>
        <p className="text-muted-foreground">Manage user subscriptions and view analytics</p>
      </div>

      {/* Analytics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {analyticsCards.map((card, index) => (
          <motion.div
            key={card.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="glass-card p-4"
          >
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${card.bgColor}`}>
                <card.icon className={`w-5 h-5 ${card.color}`} />
              </div>
              <div>
                <p className="text-2xl font-bold">{card.value}</p>
                <p className="text-xs text-muted-foreground">{card.title}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by username or ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as typeof statusFilter)}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Users</SelectItem>
            <SelectItem value="pro">Pro Only</SelectItem>
            <SelectItem value="free">Free Only</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Users Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="glass-card overflow-hidden"
      >
        {isLoading ? (
          <div className="p-8 text-center text-muted-foreground">Loading...</div>
        ) : filteredUsers.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            {searchQuery || statusFilter !== "all" 
              ? "No users match your filters." 
              : "No users yet."}
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="hidden md:table-cell">Expires</TableHead>
                <TableHead className="hidden md:table-cell">XP</TableHead>
                <TableHead className="hidden md:table-cell">Joined</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map((user) => {
                const isExpired = user.subscription_expires_at && 
                  new Date(user.subscription_expires_at) < new Date();
                
                return (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{user.username || "Anonymous"}</p>
                        <p className="text-xs text-muted-foreground truncate max-w-[150px]">
                          {user.id.slice(0, 8)}...
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      {user.subscription_status === "pro" ? (
                        <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0">
                          <Crown className="w-3 h-3 mr-1" />
                          Pro
                          {isExpired && <span className="ml-1 text-[10px]">(Expired)</span>}
                        </Badge>
                      ) : (
                        <Badge variant="secondary">Free</Badge>
                      )}
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-muted-foreground text-sm">
                      {user.subscription_expires_at ? (
                        <span className={isExpired ? "text-destructive" : ""}>
                          {format(new Date(user.subscription_expires_at), "MMM d, yyyy")}
                        </span>
                      ) : user.subscription_status === "pro" ? (
                        <span className="text-amber-500">Lifetime</span>
                      ) : (
                        "-"
                      )}
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <span className="xp-badge text-xs">+{user.total_xp}</span>
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-muted-foreground text-sm">
                      {formatDistanceToNow(new Date(user.created_at), { addSuffix: true })}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {user.subscription_status !== "pro" || isExpired ? (
                            <DropdownMenuItem 
                              onClick={() => {
                                setSelectedUser(user);
                                setShowGrantDialog(true);
                              }}
                              className="text-amber-500"
                            >
                              <Crown className="w-4 h-4 mr-2" />
                              Grant Pro Access
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem 
                              onClick={() => handleRevokePro(user)}
                              className="text-destructive"
                            >
                              <X className="w-4 h-4 mr-2" />
                              Revoke Pro Access
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            onClick={() => {
                              setSelectedUser(user);
                              setShowGrantDialog(true);
                            }}
                          >
                            <Calendar className="w-4 h-4 mr-2" />
                            Modify Subscription
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </motion.div>

      {/* Grant Pro Dialog */}
      <Dialog open={showGrantDialog} onOpenChange={setShowGrantDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Crown className="w-5 h-5 text-amber-500" />
              Grant Pro Access
            </DialogTitle>
            <DialogDescription>
              Grant Pro subscription access to {selectedUser?.username || "this user"}.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Duration</Label>
              <Select value={grantDuration} onValueChange={setGrantDuration}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">7 days</SelectItem>
                  <SelectItem value="30">30 days</SelectItem>
                  <SelectItem value="90">90 days</SelectItem>
                  <SelectItem value="365">1 year</SelectItem>
                  <SelectItem value="lifetime">Lifetime</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {grantDuration !== "lifetime" && (
              <p className="text-sm text-muted-foreground">
                Expires: {format(
                  new Date(Date.now() + parseInt(grantDuration) * 24 * 60 * 60 * 1000),
                  "MMMM d, yyyy"
                )}
              </p>
            )}

            <div className="flex items-center space-x-2 pt-2 border-t">
              <Checkbox 
                id="sendEmail" 
                checked={sendEmailNotification}
                onCheckedChange={(checked) => setSendEmailNotification(checked as boolean)}
              />
              <Label htmlFor="sendEmail" className="text-sm cursor-pointer flex items-center gap-2">
                <Mail className="w-4 h-4" />
                Send email notification
              </Label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowGrantDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleGrantPro}
              disabled={updateSubscriptionMutation.isPending}
              className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              {updateSubscriptionMutation.isPending ? "Granting..." : "Grant Pro"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminSubscriptions;
