import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, Clock, AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";

interface PatternStats {
  pattern_name: string;
  pattern_id: string;
  total: number;
  solved: number;
  accuracy: number;
  last_practiced: string | null;
  status: "learning" | "improving" | "strong";
}

export const PatternSignals = () => {
  const { user } = useAuth();

  const { data: patternStats = [] } = useQuery({
    queryKey: ["pattern-signals", user?.id],
    queryFn: async () => {
      if (!user) return [];

      // Get all patterns with questions
      const { data: patterns } = await supabase
        .from("patterns")
        .select("id, name")
        .order("display_order")
        .limit(10);

      if (!patterns) return [];

      // Get user progress
      const { data: progress } = await supabase
        .from("user_progress")
        .select("question_id, is_solved, solved_at, questions!inner(pattern_id)")
        .eq("user_id", user.id);

      // Get question counts per pattern
      const { data: questionCounts } = await supabase
        .from("questions")
        .select("pattern_id");

      const stats: PatternStats[] = patterns.map(pattern => {
        const patternQuestions = questionCounts?.filter(q => q.pattern_id === pattern.id) || [];
        const userPatternProgress = progress?.filter(
          (p: any) => p.questions?.pattern_id === pattern.id
        ) || [];
        
        const solved = userPatternProgress.filter((p: any) => p.is_solved).length;
        const total = patternQuestions.length;
        const accuracy = total > 0 ? Math.round((solved / total) * 100) : 0;
        
        const lastSolved = userPatternProgress
          .filter((p: any) => p.solved_at)
          .sort((a: any, b: any) => new Date(b.solved_at).getTime() - new Date(a.solved_at).getTime())[0];

        let status: "learning" | "improving" | "strong" = "learning";
        if (accuracy >= 70) status = "strong";
        else if (accuracy >= 30) status = "improving";

        return {
          pattern_name: pattern.name,
          pattern_id: pattern.id,
          total,
          solved,
          accuracy,
          last_practiced: lastSolved?.solved_at || null,
          status,
        };
      }).filter(s => s.total > 0);

      return stats.slice(0, 6);
    },
    enabled: !!user,
  });

  const getDaysSince = (dateStr: string | null) => {
    if (!dateStr) return null;
    const date = new Date(dateStr);
    const now = new Date();
    const diff = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    return diff;
  };

  const statusColors = {
    learning: "bg-amber-500/10 text-amber-500 border-amber-500/30",
    improving: "bg-blue-500/10 text-blue-500 border-blue-500/30",
    strong: "bg-emerald-500/10 text-emerald-500 border-emerald-500/30",
  };

  const statusIcons = {
    learning: <AlertTriangle className="w-3 h-3" />,
    improving: <TrendingUp className="w-3 h-3" />,
    strong: <TrendingUp className="w-3 h-3" />,
  };

  if (patternStats.length === 0) {
    return null;
  }

  // Find weak patterns (needs attention)
  const weakPatterns = patternStats.filter(p => {
    const daysSince = getDaysSince(p.last_practiced);
    return p.status === "learning" || (daysSince !== null && daysSince > 7);
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card p-4"
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold">Pattern Signals</h3>
        {weakPatterns.length > 0 && (
          <Badge variant="outline" className="bg-amber-500/10 text-amber-500 border-amber-500/30">
            {weakPatterns.length} Need Attention
          </Badge>
        )}
      </div>

      <div className="space-y-3">
        {patternStats.map((pattern, index) => {
          const daysSince = getDaysSince(pattern.last_practiced);
          const isStale = daysSince !== null && daysSince > 7;

          return (
            <motion.div
              key={pattern.pattern_id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className="space-y-1.5"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium truncate max-w-[120px]">
                    {pattern.pattern_name}
                  </span>
                  <Badge variant="outline" className={`text-xs py-0 ${statusColors[pattern.status]}`}>
                    {statusIcons[pattern.status]}
                    <span className="ml-1 capitalize">{pattern.status}</span>
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  {isStale && (
                    <span className="text-xs text-amber-500 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {daysSince}d
                    </span>
                  )}
                  <span className="text-xs text-muted-foreground">
                    {pattern.solved}/{pattern.total}
                  </span>
                </div>
              </div>
              <Progress 
                value={pattern.accuracy} 
                className={`h-1.5 ${
                  pattern.status === "strong" ? "[&>div]:bg-emerald-500" :
                  pattern.status === "improving" ? "[&>div]:bg-blue-500" :
                  "[&>div]:bg-amber-500"
                }`}
              />
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
};
