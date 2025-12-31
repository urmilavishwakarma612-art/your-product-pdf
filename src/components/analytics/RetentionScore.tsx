import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Brain, TrendingUp, TrendingDown, Minus } from "lucide-react";

interface RetentionScoreProps {
  score: number;
  avgEaseFactor: number;
}

export function RetentionScore({ score, avgEaseFactor }: RetentionScoreProps) {
  const getScoreStatus = (score: number) => {
    if (score >= 80) return { label: "Excellent", color: "text-green-500", icon: TrendingUp };
    if (score >= 60) return { label: "Good", color: "text-primary", icon: TrendingUp };
    if (score >= 40) return { label: "Average", color: "text-amber-500", icon: Minus };
    return { label: "Needs Work", color: "text-destructive", icon: TrendingDown };
  };

  const status = getScoreStatus(score);
  const StatusIcon = status.icon;

  const tips = [
    {
      condition: score < 40,
      text: "Focus on reviewing problems you've already solved before moving to new ones.",
    },
    {
      condition: score >= 40 && score < 60,
      text: "Use the spaced repetition system regularly to improve retention.",
    },
    {
      condition: score >= 60 && score < 80,
      text: "Great progress! Try solving problems without looking at hints.",
    },
    {
      condition: score >= 80,
      text: "Excellent retention! Challenge yourself with harder problems.",
    },
  ];

  const currentTip = tips.find((t) => t.condition)?.text || "";

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="w-5 h-5" />
          Memory Retention Analysis
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Score Display */}
          <div className="flex flex-col items-center justify-center p-6 rounded-lg bg-muted/50">
            <div className="relative">
              <svg className="w-32 h-32 -rotate-90">
                <circle
                  cx="64"
                  cy="64"
                  r="56"
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="none"
                  className="text-muted"
                />
                <circle
                  cx="64"
                  cy="64"
                  r="56"
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="none"
                  strokeDasharray={`${(score / 100) * 352} 352`}
                  strokeLinecap="round"
                  className={status.color}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-bold">{score}%</span>
                <span className="text-sm text-muted-foreground">Retention</span>
              </div>
            </div>
            <div className={`flex items-center gap-2 mt-4 ${status.color}`}>
              <StatusIcon className="w-4 h-4" />
              <span className="font-medium">{status.label}</span>
            </div>
          </div>

          {/* Details */}
          <div className="md:col-span-2 space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-muted-foreground">Ease Factor</span>
                <span className="font-medium">{avgEaseFactor.toFixed(2)} / 2.50</span>
              </div>
              <Progress value={(avgEaseFactor / 2.5) * 100} className="h-2" />
              <p className="text-xs text-muted-foreground mt-1">
                Higher ease factor = better long-term retention
              </p>
            </div>

            <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
              <h4 className="font-medium mb-2 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-primary" />
                Recommendation
              </h4>
              <p className="text-sm text-muted-foreground">{currentTip}</p>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="p-3 rounded-lg bg-muted/50">
                <p className="text-muted-foreground">Spaced Repetition</p>
                <p className="font-medium">Active</p>
              </div>
              <div className="p-3 rounded-lg bg-muted/50">
                <p className="text-muted-foreground">Review Algorithm</p>
                <p className="font-medium">SM-2</p>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
