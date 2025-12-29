import { Card, CardContent } from "@/components/ui/card";
import { Zap, Trophy, Flame, CheckCircle2 } from "lucide-react";

interface StatsGridProps {
  totalXp: number;
  level: number;
  currentStreak: number;
  longestStreak: number;
  solvedCount: number;
}

export function StatsGrid({
  totalXp,
  level,
  currentStreak,
  longestStreak,
  solvedCount,
}: StatsGridProps) {
  const stats = [
    {
      label: "Total XP",
      value: totalXp.toLocaleString(),
      icon: Zap,
      color: "text-amber-500",
      bgColor: "bg-amber-500/10",
    },
    {
      label: "Level",
      value: level,
      icon: Trophy,
      color: "text-purple-500",
      bgColor: "bg-purple-500/10",
    },
    {
      label: "Current Streak",
      value: `${currentStreak} days`,
      subValue: `Best: ${longestStreak}`,
      icon: Flame,
      color: "text-orange-500",
      bgColor: "bg-orange-500/10",
    },
    {
      label: "Problems Solved",
      value: solvedCount,
      icon: CheckCircle2,
      color: "text-emerald-500",
      bgColor: "bg-emerald-500/10",
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat) => (
        <Card key={stat.label}>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                <stat.icon className={`h-5 w-5 ${stat.color}`} />
              </div>
              <div>
                <p className="text-2xl font-bold">{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
                {stat.subValue && (
                  <p className="text-xs text-muted-foreground">{stat.subValue}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
