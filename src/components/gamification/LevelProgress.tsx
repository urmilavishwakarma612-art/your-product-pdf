import { motion } from "framer-motion";
import { Star, Lock, CheckCircle, ChevronRight } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { useSubscription } from "@/hooks/useSubscription";

const LEVEL_ICONS: Record<number, string> = {
  0: "🌱",
  1: "🔍",
  2: "🔎",
  3: "🏗️",
  4: "🧠",
  5: "⚡",
  6: "♟️",
  7: "🎯",
  8: "🚀",
  9: "💼",
  10: "👑",
};

export const LevelProgress = () => {
  const { user } = useAuth();
  const { isPremium } = useSubscription();

  const { data: levels = [] } = useQuery({
    queryKey: ["curriculum-levels-progress"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("curriculum_levels")
        .select("*")
        .order("level_number");
      if (error) throw error;
      return data;
    },
  });

  const { data: userProgress } = useQuery({
    queryKey: ["user-curriculum-all-progress", user?.id],
    queryFn: async () => {
      if (!user) return null;
      
      // Get user's completed modules
      const { data: completedModules, error } = await supabase
        .from("user_curriculum_progress")
        .select("module_id, checkpoint_passed")
        .eq("user_id", user.id)
        .eq("checkpoint_passed", true);

      if (error) throw error;

      // Get all modules per level
      const { data: modulesPerLevel } = await supabase
        .from("curriculum_modules")
        .select("id, level_id");

      const levelModuleCounts: Record<string, { total: number; completed: number }> = {};
      
      modulesPerLevel?.forEach(m => {
        if (!m.level_id) return;
        if (!levelModuleCounts[m.level_id]) {
          levelModuleCounts[m.level_id] = { total: 0, completed: 0 };
        }
        levelModuleCounts[m.level_id].total++;
        if (completedModules?.some(cm => cm.module_id === m.id)) {
          levelModuleCounts[m.level_id].completed++;
        }
      });

      return levelModuleCounts;
    },
    enabled: !!user,
  });

  const { data: profile } = useQuery({
    queryKey: ["profile-level", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from("profiles")
        .select("curriculum_level")
        .eq("id", user.id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const currentLevel = profile?.curriculum_level || 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card p-4"
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold">Level Progress</h3>
        <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30">
          Level {currentLevel}
        </Badge>
      </div>

      <div className="space-y-3">
        {levels.slice(0, 5).map((level, index) => {
          const isCompleted = currentLevel > level.level_number;
          const isCurrent = currentLevel === level.level_number;
          const isLocked = !isPremium && !level.is_free;
          
          const progress = userProgress?.[level.id] || { total: 0, completed: 0 };
          const progressPercent = progress.total > 0 
            ? Math.round((progress.completed / progress.total) * 100)
            : 0;

          return (
            <div
              key={level.id}
              className={`flex items-center gap-3 p-2 rounded-lg transition-colors ${
                isCurrent ? "bg-primary/10 ring-1 ring-primary/30" :
                isCompleted ? "bg-success/5" :
                isLocked ? "opacity-50" : "hover:bg-card/50"
              }`}
            >
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-lg ${
                isCompleted ? "bg-success/10" :
                isCurrent ? "bg-primary/10" :
                isLocked ? "bg-muted" : "bg-card"
              }`}>
                {isLocked ? <Lock className="w-4 h-4 text-muted-foreground" /> : LEVEL_ICONS[level.level_number]}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm truncate">Level {level.level_number}</span>
                  {isCompleted && <CheckCircle className="w-3.5 h-3.5 text-success" />}
                  {level.is_free && !isCompleted && (
                    <Badge variant="outline" className="text-xs py-0 px-1">Free</Badge>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Progress value={progressPercent} className="h-1.5 flex-1" />
                  <span className="text-xs text-muted-foreground w-8">{progressPercent}%</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <Link 
        to="/curriculum" 
        className="flex items-center justify-center gap-1 text-sm text-primary hover:text-primary/80 transition-colors mt-4"
      >
        View All Levels
        <ChevronRight className="w-4 h-4" />
      </Link>
    </motion.div>
  );
};
