import { motion } from "framer-motion";
import { Flame, Snowflake } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useQueryClient } from "@tanstack/react-query";

interface StreakCounterProps {
  compact?: boolean;
}

export const StreakCounter = ({ compact = false }: StreakCounterProps) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: profile } = useQuery({
    queryKey: ["profile-streak", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from("profiles")
        .select("current_streak, longest_streak, streak_freeze_available, last_freeze_used_at")
        .eq("id", user.id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const handleUseFreeze = async () => {
    if (!user || !profile) return;
    
    const lastUsed = profile.last_freeze_used_at 
      ? new Date(profile.last_freeze_used_at) 
      : null;
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    if (lastUsed && lastUsed > oneWeekAgo) {
      toast.error("Streak freeze can only be used once per week");
      return;
    }

    if ((profile.streak_freeze_available || 0) <= 0) {
      toast.error("No streak freeze available");
      return;
    }

    const { error } = await supabase
      .from("profiles")
      .update({
        streak_freeze_available: (profile.streak_freeze_available || 1) - 1,
        last_freeze_used_at: new Date().toISOString(),
      })
      .eq("id", user.id);

    if (error) {
      toast.error("Failed to use streak freeze");
      return;
    }

    queryClient.invalidateQueries({ queryKey: ["profile-streak"] });
    toast.success("Streak freeze activated! Your streak is protected for today.");
  };

  const streak = profile?.current_streak || 0;
  const freezeAvailable = (profile?.streak_freeze_available || 0) > 0;

  if (compact) {
    return (
      <div className="flex items-center gap-1.5 text-sm">
        <Flame className={`w-4 h-4 ${streak > 0 ? "text-orange-500" : "text-muted-foreground"}`} />
        <span className={streak > 0 ? "text-orange-500 font-semibold" : "text-muted-foreground"}>
          {streak}
        </span>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card p-4"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
            streak > 0 ? "bg-gradient-to-br from-orange-500 to-red-500" : "bg-muted"
          }`}>
            <Flame className={`w-6 h-6 ${streak > 0 ? "text-white" : "text-muted-foreground"}`} />
          </div>
          <div>
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-bold">{streak}</span>
              <span className="text-muted-foreground text-sm">day streak</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Longest: {profile?.longest_streak || 0} days
            </p>
          </div>
        </div>

        {freezeAvailable && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleUseFreeze}
            className="gap-1.5 border-cyan-500/30 text-cyan-500 hover:bg-cyan-500/10"
          >
            <Snowflake className="w-4 h-4" />
            Freeze
          </Button>
        )}
      </div>

      {streak >= 7 && (
        <div className="mt-3 pt-3 border-t border-border/50">
          <div className="flex items-center gap-2 text-xs text-amber-500">
            <span className="text-lg">🔥</span>
            <span>You're on fire! {streak >= 21 ? "21-Day Discipline!" : streak >= 14 ? "2 Week Champion!" : "7-Day Streak!"}</span>
          </div>
        </div>
      )}
    </motion.div>
  );
};
