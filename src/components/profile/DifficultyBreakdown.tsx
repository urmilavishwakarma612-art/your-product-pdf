import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

interface DifficultyBreakdownProps {
  easy: { solved: number; total: number };
  medium: { solved: number; total: number };
  hard: { solved: number; total: number };
}

export function DifficultyBreakdown({ easy, medium, hard }: DifficultyBreakdownProps) {
  const difficulties = [
    {
      label: "Easy",
      ...easy,
      color: "bg-emerald-500",
      bgColor: "bg-emerald-500/20",
    },
    {
      label: "Medium",
      ...medium,
      color: "bg-amber-500",
      bgColor: "bg-amber-500/20",
    },
    {
      label: "Hard",
      ...hard,
      color: "bg-red-500",
      bgColor: "bg-red-500/20",
    },
  ];

  return (
    <Card>
      <CardContent className="p-6">
        <h3 className="font-semibold mb-4">Progress by Difficulty</h3>
        <div className="space-y-4">
          {difficulties.map((diff) => {
            const percentage = diff.total > 0 ? (diff.solved / diff.total) * 100 : 0;
            return (
              <div key={diff.label} className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="font-medium">{diff.label}</span>
                  <span className="text-muted-foreground">
                    {diff.solved}/{diff.total}
                  </span>
                </div>
                <div className="relative h-2 rounded-full overflow-hidden" style={{ backgroundColor: `var(--muted)` }}>
                  <div
                    className={`absolute inset-y-0 left-0 rounded-full ${diff.color}`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
