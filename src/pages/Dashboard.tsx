import { useEffect, useMemo } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AppLayout } from "@/components/layout/AppLayout";
import { motion } from "framer-motion";
import { Zap, Trophy, Flame, Target, LogOut, BookOpen, ArrowRight, User, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { SubscriptionExpiryReminder } from "@/components/dashboard/SubscriptionExpiryReminder";
import { PaymentFailedBanner } from "@/components/dashboard/PaymentFailedBanner";
import { WeaknessAnalytics } from "@/components/analytics/WeaknessAnalytics";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const Dashboard = () => {
  const { user, loading, signOut, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const defaultTab = useMemo(() => {
    const tab = searchParams.get("tab");
    return tab === "analytics" ? "analytics" : "overview";
  }, [searchParams]);

  const { data: profile } = useQuery({
    queryKey: ["profile", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user?.id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const { data: progressStats } = useQuery({
    queryKey: ["progress-stats", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_progress")
        .select("is_solved")
        .eq("user_id", user?.id);
      if (error) throw error;
      return {
        solved: data.filter(p => p.is_solved).length,
        total: data.length,
      };
    },
    enabled: !!user,
  });

  const { data: badgeCount } = useQuery({
    queryKey: ["badge-count", user?.id],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("user_badges")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user?.id);
      if (error) throw error;
      return count || 0;
    },
    enabled: !!user,
  });

  const { data: recentPatterns } = useQuery({
    queryKey: ["recent-patterns"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("patterns")
        .select("id, name, icon, color, total_questions, is_free")
        .order("display_order", { ascending: true })
        .limit(4);
      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-primary">Loading...</div>
      </div>
    );
  }

  const level = profile?.current_level || 1;
  const xp = profile?.total_xp || 0;
  const xpForNextLevel = level * 100;
  const xpProgress = (xp % 100) / 100 * 100;

  return (
    <AppLayout>
      <div className="bg-grid">
        {/* Welcome Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-3xl font-bold mb-2">
                Welcome back, <span className="gradient-text">{profile?.username || user?.email?.split("@")[0]}</span>!
              </h1>
              <p className="text-muted-foreground">Continue your DSA journey</p>
            </div>
            <div className="flex gap-3">
              {isAdmin && (
                <Button variant="outline" onClick={() => navigate("/admin")}>
                  Admin Panel
                </Button>
              )}
              <Button
                variant="outline"
                onClick={() =>
                  navigate(`/profile/${encodeURIComponent((profile?.username || "").trim())}`)
                }
              >
                <User className="w-4 h-4 mr-2" /> View Profile
              </Button>
              <Button variant="ghost" onClick={signOut}>
                <LogOut className="w-4 h-4 mr-2" /> Sign out
              </Button>
            </div>
          </div>
        </motion.div>

        {/* Payment Failed Banner */}
        <PaymentFailedBanner />

        {/* Subscription Expiry Reminder */}
        <SubscriptionExpiryReminder />

        {/* Level Progress */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="glass-card p-6 mb-8"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-xl font-bold">
                {level}
              </div>
              <div>
                <p className="font-semibold">Level {level}</p>
                <p className="text-sm text-muted-foreground">{xp} XP total</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Next level</p>
              <p className="font-semibold">{xpForNextLevel - (xp % 100)} XP needed</p>
            </div>
          </div>
          <Progress value={xpProgress} className="h-3" />
        </motion.div>

        {/* Stats Row */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8"
        >
          <StatCard 
            icon={<Zap className="w-5 h-5" />} 
            label="Total XP" 
            value={xp.toString()} 
            colorClass="bg-primary/20 text-primary" 
          />
          <StatCard 
            icon={<Flame className="w-5 h-5" />} 
            label="Current Streak" 
            value={`${profile?.current_streak || 0} days`} 
            colorClass="bg-warning/20 text-warning" 
          />
          <StatCard 
            icon={<Target className="w-5 h-5" />} 
            label="Problems Solved" 
            value={(progressStats?.solved || 0).toString()} 
            colorClass="bg-success/20 text-success" 
          />
          <StatCard 
            icon={<Trophy className="w-5 h-5" />} 
            label="Badges Earned" 
            value={(badgeCount || 0).toString()} 
            colorClass="bg-secondary/20 text-secondary" 
          />
        </motion.div>

        {/* Tabbed Content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <Tabs defaultValue={defaultTab} className="space-y-6">
            <TabsList className="grid w-full max-w-md grid-cols-2">
              <TabsTrigger value="overview">
                <BookOpen className="w-4 h-4 mr-2" />
                Overview
              </TabsTrigger>
              <TabsTrigger value="analytics">
                <BarChart3 className="w-4 h-4 mr-2" />
                Weakness Analytics
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-8">
              {/* Recent Patterns */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold">Continue Learning</h2>
                  <Link to="/curriculum" className="text-primary hover:underline text-sm flex items-center gap-1">
                    View all patterns <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {recentPatterns?.map((pattern) => (
                    <Link key={pattern.id} to="/curriculum">
                      <div className="glass-card p-4 hover:bg-white/10 transition-colors cursor-pointer group">
                        <div 
                          className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl mb-3"
                          style={{ background: pattern.color || 'hsl(var(--primary) / 0.2)' }}
                        >
                          {pattern.icon || "📚"}
                        </div>
                        <h3 className="font-semibold group-hover:text-primary transition-colors">{pattern.name}</h3>
                        <p className="text-sm text-muted-foreground">{pattern.total_questions} questions</p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>

              {/* Quick Actions */}
              <div className="glass-card p-8 text-center">
                <BookOpen className="w-12 h-12 text-primary mx-auto mb-4" />
                <h2 className="text-2xl font-bold mb-4">Ready to Continue?</h2>
                <p className="text-muted-foreground mb-6">
                  Explore patterns, solve problems, and track your progress.
                </p>
                <Button className="btn-primary-glow" onClick={() => navigate("/curriculum")}>
                  Explore Patterns
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="analytics">
              <WeaknessAnalytics />
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>
    </AppLayout>
  );
};

function StatCard({ icon, label, value, colorClass }: { icon: React.ReactNode; label: string; value: string; colorClass: string }) {
  return (
    <motion.div 
      whileHover={{ y: -4, scale: 1.02 }}
      className="interactive-card p-5"
    >
      <motion.div 
        whileHover={{ rotate: [0, -10, 10, 0], scale: 1.1 }}
        transition={{ duration: 0.4 }}
        className={`w-12 h-12 rounded-xl ${colorClass} flex items-center justify-center mb-4`}
      >
        {icon}
      </motion.div>
      <div className="text-3xl font-bold mb-1">{value}</div>
      <div className="text-sm text-muted-foreground">{label}</div>
    </motion.div>
  );
}

export default Dashboard;