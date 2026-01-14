import { useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface Badge {
  id: string;
  name: string;
  type: string;
  requirement: {
    streak?: number;
    problems_solved?: number;
    xp?: number;
    pattern?: string;
    problems?: number;
  } | null;
}

interface UserStats {
  current_streak: number;
  total_xp: number;
  problems_solved: number;
  patterns_progress: Record<string, number>;
}

export function useBadgeAwarder() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch all badges
  const { data: allBadges = [] } = useQuery({
    queryKey: ["all-badges-for-awarding"],
    queryFn: async () => {
      const { data } = await supabase
        .from("badges")
        .select("id, name, type, requirement");
      return (data || []) as Badge[];
    },
  });

  // Fetch user's earned badge IDs
  const { data: earnedBadgeIds = [] } = useQuery({
    queryKey: ["earned-badge-ids", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data } = await supabase
        .from("user_badges")
        .select("badge_id")
        .eq("user_id", user.id);
      return (data || []).map((b) => b.badge_id);
    },
    enabled: !!user?.id,
  });

  // Fetch user stats
  const { data: userStats } = useQuery({
    queryKey: ["user-stats-for-badges", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;

      // Get profile stats
      const { data: profile } = await supabase
        .from("profiles")
        .select("current_streak, total_xp")
        .eq("id", user.id)
        .single();

      // Count solved problems
      const { count: problemsSolved } = await supabase
        .from("user_progress")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("is_solved", true);

      // Get pattern progress
      const { data: progressData } = await supabase
        .from("user_progress")
        .select(`
          question_id,
          is_solved,
          questions!inner (
            pattern_id,
            patterns!inner (
              slug
            )
          )
        `)
        .eq("user_id", user.id)
        .eq("is_solved", true);

      const patternsProgress: Record<string, number> = {};
      progressData?.forEach((p: any) => {
        const slug = p.questions?.patterns?.slug;
        if (slug) {
          patternsProgress[slug] = (patternsProgress[slug] || 0) + 1;
        }
      });

      return {
        current_streak: profile?.current_streak || 0,
        total_xp: profile?.total_xp || 0,
        problems_solved: problemsSolved || 0,
        patterns_progress: patternsProgress,
      } as UserStats;
    },
    enabled: !!user?.id,
    refetchInterval: 30000, // Check every 30 seconds
  });

  // Award badge mutation
  const awardBadge = useMutation({
    mutationFn: async (badgeId: string) => {
      if (!user?.id) throw new Error("Not authenticated");
      
      const { error } = await supabase
        .from("user_badges")
        .insert({
          user_id: user.id,
          badge_id: badgeId,
        });
      
      if (error) throw error;
    },
    onSuccess: (_, badgeId) => {
      const badge = allBadges.find((b) => b.id === badgeId);
      if (badge) {
        toast.success(`🏆 Badge Unlocked: ${badge.name}!`, {
          description: "Check your badges to share this achievement!",
          duration: 5000,
        });
      }
      queryClient.invalidateQueries({ queryKey: ["user-badges"] });
      queryClient.invalidateQueries({ queryKey: ["earned-badge-ids"] });
    },
  });

  // Check and award badges
  useEffect(() => {
    if (!user?.id || !userStats || allBadges.length === 0) return;

    const checkAndAwardBadges = async () => {
      for (const badge of allBadges) {
        // Skip if already earned
        if (earnedBadgeIds.includes(badge.id)) continue;

        const req = badge.requirement;
        if (!req) continue;

        let shouldAward = false;

        // Check streak badges
        if (badge.type === "streak" && req.streak) {
          shouldAward = userStats.current_streak >= req.streak;
        }

        // Check problem solving badges (achievement type)
        if (badge.type === "achievement" && req.problems_solved) {
          shouldAward = userStats.problems_solved >= req.problems_solved;
        }

        // Check XP badges
        if (badge.type === "xp" && req.xp) {
          shouldAward = userStats.total_xp >= req.xp;
        }

        // Check pattern badges
        if (badge.type === "pattern" && req.pattern && req.problems) {
          const patternCount = userStats.patterns_progress[req.pattern] || 0;
          shouldAward = patternCount >= req.problems;
        }

        if (shouldAward) {
          await awardBadge.mutateAsync(badge.id);
        }
      }
    };

    checkAndAwardBadges();
  }, [user?.id, userStats, allBadges, earnedBadgeIds]);

  return {
    userStats,
    earnedBadgeIds,
    totalBadges: allBadges.length,
    earnedCount: earnedBadgeIds.length,
  };
}
