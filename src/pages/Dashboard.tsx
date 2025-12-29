import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Navbar } from "@/components/landing/Navbar";
import { motion } from "framer-motion";
import { Zap, Trophy, Flame, Target, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";

const Dashboard = () => {
  const { user, loading, signOut, isAdmin } = useAuth();
  const navigate = useNavigate();

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

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-20 pb-12 px-4">
        <div className="container max-w-6xl mx-auto">
          {/* Welcome Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <h1 className="text-3xl font-bold mb-2">
                  Welcome back, <span className="gradient-text">{user?.email?.split("@")[0]}</span>!
                </h1>
                <p className="text-muted-foreground">Continue your DSA journey</p>
              </div>
              <div className="flex gap-3">
                {isAdmin && (
                  <Button variant="outline" onClick={() => navigate("/admin")}>
                    Admin Panel
                  </Button>
                )}
                <Button variant="ghost" onClick={signOut}>
                  <LogOut className="w-4 h-4 mr-2" /> Sign out
                </Button>
              </div>
            </div>
          </motion.div>

          {/* Stats Row */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8"
          >
            <StatCard icon={<Zap />} label="Total XP" value="0" color="xp" />
            <StatCard icon={<Flame />} label="Current Streak" value="0 days" color="streak" />
            <StatCard icon={<Target />} label="Problems Solved" value="0" color="primary" />
            <StatCard icon={<Trophy />} label="Badges Earned" value="0" color="warning" />
          </motion.div>

          {/* Quick Actions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="glass-card p-8 text-center"
          >
            <h2 className="text-2xl font-bold mb-4">Ready to Start?</h2>
            <p className="text-muted-foreground mb-6">
              Explore patterns, solve problems, and track your progress.
            </p>
            <Button className="btn-primary-glow" onClick={() => navigate("/patterns")}>
              Explore Patterns
            </Button>
          </motion.div>
        </div>
      </main>
    </div>
  );
};

function StatCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string; color: string }) {
  return (
    <div className="glass-card p-4">
      <div className={`w-10 h-10 rounded-lg bg-${color}/20 text-${color} flex items-center justify-center mb-3`}>
        {icon}
      </div>
      <div className="text-2xl font-bold">{value}</div>
      <div className="text-sm text-muted-foreground">{label}</div>
    </div>
  );
}

export default Dashboard;