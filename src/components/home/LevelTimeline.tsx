import { motion } from "framer-motion";
import { useSubscription } from "@/hooks/useSubscription";
import { Lock } from "lucide-react";
import { cn } from "@/lib/utils";

interface CurriculumLevel {
  id: string;
  level_number: number;
  name: string;
  is_free: boolean | null;
}

interface LevelTimelineProps {
  levels: CurriculumLevel[];
  onLevelClick: (level: CurriculumLevel) => void;
}

const levelColors: Record<number, string> = {
  0: "bg-emerald-500",
  1: "bg-green-500",
  2: "bg-lime-500",
  3: "bg-yellow-500",
  4: "bg-amber-500",
  5: "bg-orange-500",
  6: "bg-red-500",
  7: "bg-rose-500",
  8: "bg-pink-500",
  9: "bg-purple-500",
  10: "bg-violet-500",
};

export function LevelTimeline({ levels, onLevelClick }: LevelTimelineProps) {
  const { isPremium } = useSubscription();

  return (
    <div className="bg-card border border-border rounded-xl p-4">
      <h3 className="font-semibold text-sm mb-4">Level Timeline</h3>

      <div className="flex items-center gap-1 overflow-x-auto pb-2 scrollbar-hide">
        {levels.map((level, index) => {
          const isLocked = !level.is_free && !isPremium;
          const color = levelColors[level.level_number] || "bg-primary";

          return (
            <motion.button
              key={level.id}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.05 }}
              onClick={() => onLevelClick(level)}
              className={cn(
                "relative flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center",
                "font-bold text-sm transition-all hover:scale-110",
                isLocked ? "bg-muted text-muted-foreground" : `${color} text-white`,
                "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
              )}
              title={`Level ${level.level_number}: ${level.name}`}
            >
              {isLocked ? (
                <Lock className="w-4 h-4" />
              ) : (
                `L${level.level_number}`
              )}
            </motion.button>
          );
        })}
      </div>

      <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-emerald-500" />
          <span>Free</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-muted" />
          <span>Pro</span>
        </div>
      </div>
    </div>
  );
}
