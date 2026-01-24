import { motion } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Progress } from "@/components/ui/progress";

export function ProgressSummaryBar() {
  const { user } = useAuth();

  const { data: progressStats } = useQuery({
    queryKey: ["home-progress-stats", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;

      // Get all questions with difficulty
      const { data: questions } = await supabase
        .from("questions")
        .select("id, difficulty");

      // Get user's solved questions
      const { data: solved } = await supabase
        .from("user_progress")
        .select("question_id")
        .eq("user_id", user.id)
        .eq("is_solved", true);

      const solvedIds = new Set(solved?.map((s) => s.question_id) || []);

      const stats = {
        easy: { solved: 0, total: 0 },
        medium: { solved: 0, total: 0 },
        hard: { solved: 0, total: 0 },
      };

      questions?.forEach((q) => {
        const diff = q.difficulty?.toLowerCase() as "easy" | "medium" | "hard";
        if (stats[diff]) {
          stats[diff].total++;
          if (solvedIds.has(q.id)) {
            stats[diff].solved++;
          }
        }
      });

      return stats;
    },
    enabled: !!user?.id,
  });

  const difficulties = [
    {
      label: "Easy",
      color: "bg-success",
      bgColor: "bg-success/20",
      textColor: "text-success",
      solved: progressStats?.easy.solved || 0,
      total: progressStats?.easy.total || 0,
    },
    {
      label: "Medium",
      color: "bg-warning",
      bgColor: "bg-warning/20",
      textColor: "text-warning",
      solved: progressStats?.medium.solved || 0,
      total: progressStats?.medium.total || 0,
    },
    {
      label: "Hard",
      color: "bg-destructive",
      bgColor: "bg-destructive/20",
      textColor: "text-destructive",
      solved: progressStats?.hard.solved || 0,
      total: progressStats?.hard.total || 0,
    },
  ];

  const totalSolved = difficulties.reduce((acc, d) => acc + d.solved, 0);
  const totalQuestions = difficulties.reduce((acc, d) => acc + d.total, 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card border border-border rounded-xl p-4"
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-sm">Progress Summary</h3>
        <span className="text-sm text-muted-foreground">
          {totalSolved}/{totalQuestions} solved
        </span>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {difficulties.map((diff, index) => {
          const percent = diff.total > 0 ? (diff.solved / diff.total) * 100 : 0;

          return (
            <motion.div
              key={diff.label}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 }}
              className="text-center"
            >
              <div className={`text-2xl font-bold ${diff.textColor}`}>
                {diff.solved}
                <span className="text-sm text-muted-foreground font-normal">
                  /{diff.total}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mb-2">{diff.label}</p>
              <div className={`h-1.5 rounded-full ${diff.bgColor} overflow-hidden`}>
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${percent}%` }}
                  transition={{ duration: 0.8, delay: 0.3 + index * 0.1 }}
                  className={`h-full rounded-full ${diff.color}`}
                />
              </div>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}
