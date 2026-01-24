import { useState } from "react";
import { motion } from "framer-motion";
import { useSubscription } from "@/hooks/useSubscription";
import { useAuth } from "@/hooks/useAuth";
import { ChevronDown, ChevronRight, Lock, Crown, BookOpen, CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

interface CurriculumLevel {
  id: string;
  level_number: number;
  name: string;
  description: string | null;
  is_free: boolean | null;
  week_start: number | null;
  week_end: number | null;
  icon: string | null;
  color: string | null;
}

interface CurriculumModule {
  id: string;
  name: string;
  level_id: string | null;
  module_number: number;
  pattern_id: string | null;
  subtitle: string | null;
}

interface HomeLevelCardProps {
  level: CurriculumLevel;
  modules: CurriculumModule[];
  progress?: { solved: number; total: number };
  onUpgradeClick: () => void;
  searchQuery: string;
}

const levelGradients: Record<number, string> = {
  0: "from-emerald-500/10 to-emerald-600/5 border-emerald-500/30",
  1: "from-green-500/10 to-green-600/5 border-green-500/30",
  2: "from-lime-500/10 to-lime-600/5 border-lime-500/30",
  3: "from-yellow-500/10 to-yellow-600/5 border-yellow-500/30",
  4: "from-amber-500/10 to-amber-600/5 border-amber-500/30",
  5: "from-orange-500/10 to-orange-600/5 border-orange-500/30",
  6: "from-red-500/10 to-red-600/5 border-red-500/30",
  7: "from-rose-500/10 to-rose-600/5 border-rose-500/30",
  8: "from-pink-500/10 to-pink-600/5 border-pink-500/30",
  9: "from-purple-500/10 to-purple-600/5 border-purple-500/30",
  10: "from-violet-500/10 to-violet-600/5 border-violet-500/30",
};

export function HomeLevelCard({
  level,
  modules,
  progress,
  onUpgradeClick,
  searchQuery,
}: HomeLevelCardProps) {
  const [isExpanded, setIsExpanded] = useState(level.level_number <= 1);
  const { isPremium } = useSubscription();
  const { user } = useAuth();

  const isLocked = !level.is_free && !isPremium;
  const gradientClass = levelGradients[level.level_number] || levelGradients[0];
  const progressPercent = progress && progress.total > 0 
    ? (progress.solved / progress.total) * 100 
    : 0;

  // Filter modules by search
  const filteredModules = modules.filter((m) =>
    m.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleClick = () => {
    if (isLocked) {
      onUpgradeClick();
    } else {
      setIsExpanded(!isExpanded);
    }
  };

  return (
    <motion.div
      id={`level-${level.level_number}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "rounded-xl border bg-gradient-to-br overflow-hidden transition-all",
        gradientClass,
        isLocked && "opacity-70"
      )}
    >
      {/* Level Header */}
      <button
        onClick={handleClick}
        className="w-full p-4 flex items-center gap-4 text-left hover:bg-white/5 transition-colors"
      >
        {/* Level Icon */}
        <div
          className={cn(
            "w-12 h-12 rounded-xl flex items-center justify-center text-xl font-bold",
            isLocked ? "bg-muted text-muted-foreground" : "bg-background/80"
          )}
        >
          {isLocked ? <Lock className="w-5 h-5" /> : level.icon || `L${level.level_number}`}
        </div>

        {/* Level Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-semibold truncate">
              Level {level.level_number}: {level.name}
            </h3>
            {level.is_free ? (
              <Badge variant="outline" className="text-xs bg-emerald-500/10 text-emerald-500 border-emerald-500/30">
                Free
              </Badge>
            ) : (
              <Badge className="text-xs bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0">
                <Crown className="w-3 h-3 mr-1" />
                Pro
              </Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">
            {filteredModules.length} modules
            {level.week_start && level.week_end && (
              <span className="ml-2">• Week {level.week_start}-{level.week_end}</span>
            )}
          </p>
        </div>

        {/* Progress */}
        {user && !isLocked && progress && (
          <div className="hidden sm:flex items-center gap-3">
            <div className="text-right">
              <p className="text-sm font-medium">
                {progress.solved}/{progress.total}
              </p>
              <p className="text-xs text-muted-foreground">solved</p>
            </div>
            <div className="w-16">
              <Progress value={progressPercent} className="h-2" />
            </div>
          </div>
        )}

        {/* Expand Icon */}
        {!isLocked && (
          <div className="text-muted-foreground">
            {isExpanded ? (
              <ChevronDown className="w-5 h-5" />
            ) : (
              <ChevronRight className="w-5 h-5" />
            )}
          </div>
        )}
      </button>

      {/* Expanded Content - Modules List */}
      {isExpanded && !isLocked && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          className="border-t border-border/50"
        >
          <div className="p-4 space-y-2">
            {filteredModules.length > 0 ? (
              filteredModules.map((module, index) => (
                <motion.div
                  key={module.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="flex items-center gap-3 p-3 rounded-lg bg-background/50 hover:bg-background/80 transition-colors"
                >
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                    <BookOpen className="w-4 h-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{module.name}</p>
                    {module.subtitle && (
                      <p className="text-xs text-muted-foreground truncate">{module.subtitle}</p>
                    )}
                  </div>
                  <Badge variant="outline" className="text-xs flex-shrink-0">
                    M{module.module_number}
                  </Badge>
                </motion.div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">
                No modules match your search
              </p>
            )}
          </div>
        </motion.div>
      )}

      {/* Locked Overlay Message */}
      {isLocked && (
        <div className="px-4 pb-4">
          <p className="text-sm text-muted-foreground">
            Upgrade to Pro to unlock this level and {filteredModules.length} modules.
          </p>
        </div>
      )}
    </motion.div>
  );
}
