import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowRight, Lightbulb } from "lucide-react";
import { Link } from "react-router-dom";

interface PatternStats {
  pattern_id: string;
  pattern_name: string;
  total_questions: number;
  solved_count: number;
  solve_rate: number;
  avg_hints_used: number;
  avg_ease_factor: number;
}

interface WeakPatternCardProps {
  pattern: PatternStats;
}

export function WeakPatternCard({ pattern }: WeakPatternCardProps) {
  const getStatusColor = (rate: number) => {
    if (rate < 25) return "text-destructive";
    if (rate < 50) return "text-amber-500";
    return "text-yellow-500";
  };

  const getRecommendation = (pattern: PatternStats) => {
    if (pattern.avg_hints_used > 2) {
      return "Try solving without hints first";
    }
    if (pattern.solve_rate < 25) {
      return "Review the pattern fundamentals";
    }
    if (pattern.avg_ease_factor < 2.0) {
      return "Practice more for better retention";
    }
    return "Keep practicing regularly";
  };

  return (
    <div className="p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h4 className="font-medium">{pattern.pattern_name}</h4>
          <p className="text-sm text-muted-foreground">
            {pattern.solved_count} / {pattern.total_questions} solved
          </p>
        </div>
        <Badge 
          variant="outline" 
          className={getStatusColor(pattern.solve_rate)}
        >
          {pattern.solve_rate.toFixed(0)}%
        </Badge>
      </div>

      <Progress 
        value={pattern.solve_rate} 
        className="h-2 mb-3"
      />

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Lightbulb className="w-4 h-4" />
          <span>{getRecommendation(pattern)}</span>
        </div>
        <Button variant="ghost" size="sm" asChild>
          <Link to={`/patterns?highlight=${pattern.pattern_id}`}>
            Practice <ArrowRight className="w-4 h-4 ml-1" />
          </Link>
        </Button>
      </div>
    </div>
  );
}
