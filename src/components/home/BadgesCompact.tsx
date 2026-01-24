import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Trophy, Lock, Star, Zap, Target, Award, Medal, Crown, Flame } from "lucide-react";
import { motion } from "framer-motion";
import { Progress } from "@/components/ui/progress";

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  trophy: Trophy,
  star: Star,
  zap: Zap,
  target: Target,
  award: Award,
  medal: Medal,
  crown: Crown,
  flame: Flame,
};

export function BadgesCompact() {
  const { user } = useAuth();

  const { data: badges = [] } = useQuery({
    queryKey: ["compact-badges"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("badges")
        .select("*")
        .order("required_value", { ascending: true })
        .limit(12);
      if (error) throw error;
      return data;
    },
  });

  const { data: userBadges = [] } = useQuery({
    queryKey: ["compact-user-badges", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data } = await supabase
        .from("user_badges")
        .select("badge_id")
        .eq("user_id", user.id);
      return data || [];
    },
    enabled: !!user?.id,
  });

  const earnedBadgeIds = new Set(userBadges.map(ub => ub.badge_id));
  const earnedCount = userBadges.length;
  const totalCount = badges.length;
  const progressPercent = totalCount > 0 ? (earnedCount / totalCount) * 100 : 0;

  return (
    <div className="space-y-3">
      {/* Progress Overview */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Badges Earned</span>
          <span className="font-medium">{earnedCount}/{totalCount}</span>
        </div>
        <Progress value={progressPercent} className="h-1.5" />
      </div>

      {/* Badge Grid */}
      <div className="grid grid-cols-4 gap-2">
        {badges.slice(0, 8).map((badge, index) => {
          const isEarned = earnedBadgeIds.has(badge.id);
          const IconComponent = iconMap[badge.icon?.toLowerCase() || "trophy"] || Trophy;

          return (
            <motion.div
              key={badge.id}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.05 }}
              className={`relative aspect-square rounded-lg flex flex-col items-center justify-center p-1.5 transition-all ${
                isEarned
                  ? "bg-gradient-to-br from-primary/20 to-primary/10 border border-primary/30"
                  : "bg-muted/30 border border-border/30 opacity-50"
              }`}
            >
              <IconComponent
                className={`w-4 h-4 ${
                  isEarned ? "text-primary" : "text-muted-foreground"
                }`}
              />
              {!isEarned && (
                <Lock className="w-2 h-2 text-muted-foreground absolute top-1 right-1" />
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Recent Badges */}
      {earnedCount > 0 && (
        <div className="space-y-2">
          <p className="text-[10px] text-muted-foreground font-medium">Recent Achievements</p>
          <div className="space-y-1.5">
            {badges
              .filter(b => earnedBadgeIds.has(b.id))
              .slice(0, 3)
              .map((badge) => {
                const IconComponent = iconMap[badge.icon?.toLowerCase() || "trophy"] || Trophy;
                return (
                  <div
                    key={badge.id}
                    className="flex items-center gap-2 p-1.5 rounded-md bg-muted/30"
                  >
                    <div className="w-6 h-6 rounded-md bg-primary/10 flex items-center justify-center">
                      <IconComponent className="w-3 h-3 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] font-medium truncate">{badge.name}</p>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* Empty state */}
      {earnedCount === 0 && (
        <div className="text-center py-2">
          <Trophy className="w-6 h-6 mx-auto text-muted-foreground/50 mb-1" />
          <p className="text-[10px] text-muted-foreground">
            Start solving to earn badges!
          </p>
        </div>
      )}
    </div>
  );
}
