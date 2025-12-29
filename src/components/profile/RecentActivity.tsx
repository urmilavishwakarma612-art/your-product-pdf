import { formatDistanceToNow } from "date-fns";
import { CheckCircle2, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface RecentProblem {
  id: string;
  title: string;
  difficulty: string;
  solved_at: string;
}

interface RecentActivityProps {
  recentProblems: RecentProblem[];
}

export function RecentActivity({ recentProblems }: RecentActivityProps) {
  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty.toLowerCase()) {
      case "easy":
        return "bg-emerald-500/10 text-emerald-500 border-emerald-500/20";
      case "medium":
        return "bg-amber-500/10 text-amber-500 border-amber-500/20";
      case "hard":
        return "bg-red-500/10 text-red-500 border-red-500/20";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  if (recentProblems.length === 0) {
    return (
      <div className="p-6 bg-card rounded-xl border">
        <h3 className="font-semibold mb-4 flex items-center gap-2">
          <Clock className="h-5 w-5 text-primary" />
          Recent Activity
        </h3>
        <p className="text-muted-foreground text-sm text-center py-8">
          No problems solved yet. Start your journey!
        </p>
      </div>
    );
  }

  return (
    <div className="p-6 bg-card rounded-xl border">
      <h3 className="font-semibold mb-4 flex items-center gap-2">
        <Clock className="h-5 w-5 text-primary" />
        Recent Activity
      </h3>

      <div className="space-y-3">
        {recentProblems.map((problem) => (
          <div
            key={problem.id}
            className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
          >
            <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate">{problem.title}</p>
              <p className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(problem.solved_at), { addSuffix: true })}
              </p>
            </div>
            <Badge variant="outline" className={getDifficultyColor(problem.difficulty)}>
              {problem.difficulty}
            </Badge>
          </div>
        ))}
      </div>
    </div>
  );
}
