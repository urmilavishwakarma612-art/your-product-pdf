import { useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Clock, Lock, Unlock, BookOpen } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useSubscription } from "@/hooks/useSubscription";

interface CurriculumLevel {
  id: string;
  level_number: number;
  name: string;
  description: string | null;
  color: string | null;
  icon: string | null;
  week_start: number | null;
  week_end: number | null;
  is_free: boolean;
  display_order: number;
}

interface CurriculumModule {
  id: string;
  level_id: string;
  pattern_id: string | null;
  module_number: number;
  name: string;
  subtitle: string | null;
  estimated_hours: number;
  display_order: number;
}

interface UserProgress {
  module_id: string;
  checkpoint_passed: boolean;
}

interface LevelCardProps {
  level: CurriculumLevel;
  modules: CurriculumModule[];
  index: number;
  userProgress: UserProgress[];
}

export const LevelCard = ({ level, modules, index, userProgress }: LevelCardProps) => {
  const [isExpanded, setIsExpanded] = useState(index === 0);
  const { isPremium } = useSubscription();
  const isLocked = !isPremium && !level.is_free;

  const completedModules = modules.filter((m) =>
    userProgress.some((p) => p.module_id === m.id && p.checkpoint_passed)
  ).length;

  const progress = modules.length > 0 ? (completedModules / modules.length) * 100 : 0;

  const levelColors: Record<number, string> = {
    0: "from-emerald-500/20 to-emerald-600/10 border-emerald-500/30",
    1: "from-green-500/20 to-green-600/10 border-green-500/30",
    2: "from-yellow-500/20 to-yellow-600/10 border-yellow-500/30",
    3: "from-orange-500/20 to-orange-600/10 border-orange-500/30",
    4: "from-blue-500/20 to-blue-600/10 border-blue-500/30",
    5: "from-purple-500/20 to-purple-600/10 border-purple-500/30",
    6: "from-red-500/20 to-red-600/10 border-red-500/30",
    7: "from-pink-500/20 to-pink-600/10 border-pink-500/30",
    8: "from-indigo-500/20 to-indigo-600/10 border-indigo-500/30",
    9: "from-cyan-500/20 to-cyan-600/10 border-cyan-500/30",
  };

  const colorClass = levelColors[level.level_number] || levelColors[0];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
    >
      <div
        className={`rounded-xl border bg-gradient-to-br ${colorClass} overflow-hidden transition-all duration-300 ${
          isLocked ? "opacity-75" : ""
        }`}
      >
        {/* Header */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full p-5 flex items-center justify-between text-left"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-background/50 backdrop-blur flex items-center justify-center font-bold text-lg">
              {level.level_number}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-lg">{level.name}</h3>
                {level.is_free ? (
                  <Badge variant="outline" className="text-xs bg-success/10 text-success border-success/30">
                    <Unlock className="w-3 h-3 mr-1" />
                    Free
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-xs bg-primary/10 text-primary border-primary/30">
                    <Lock className="w-3 h-3 mr-1" />
                    Pro
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                <span className="flex items-center gap-1">
                  <BookOpen className="w-3.5 h-3.5" />
                  {modules.length} modules
                </span>
                {level.week_start && level.week_end && (
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    Week {level.week_start}-{level.week_end}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Progress */}
            {modules.length > 0 && (
              <div className="hidden sm:flex items-center gap-2">
                <div className="w-24 h-2 bg-background/50 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full transition-all"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <span className="text-xs text-muted-foreground">
                  {completedModules}/{modules.length}
                </span>
              </div>
            )}

            <motion.div
              animate={{ rotate: isExpanded ? 180 : 0 }}
              transition={{ duration: 0.2 }}
            >
              <ChevronDown className="w-5 h-5 text-muted-foreground" />
            </motion.div>
          </div>
        </button>

        {/* Expanded Content */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden"
            >
              <div className="px-5 pb-5 pt-0">
                {level.description && (
                  <p className="text-sm text-muted-foreground mb-4">{level.description}</p>
                )}

                {modules.length === 0 ? (
                  <p className="text-sm text-muted-foreground italic">Modules coming soon...</p>
                ) : (
                  <div className="grid gap-2">
                    {modules.map((module) => {
                      const isCompleted = userProgress.some(
                        (p) => p.module_id === module.id && p.checkpoint_passed
                      );
                      return (
                        <Link
                          key={module.id}
                          to={isLocked ? "#" : `/curriculum/module/${module.id}`}
                          className={`group flex items-center justify-between p-3 rounded-lg bg-background/50 hover:bg-background/80 transition-colors ${
                            isLocked ? "pointer-events-none opacity-60" : ""
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <span className="w-7 h-7 rounded-lg bg-muted flex items-center justify-center text-xs font-medium">
                              {module.module_number}
                            </span>
                            <div>
                              <span className="font-medium group-hover:text-primary transition-colors">
                                {module.name}
                              </span>
                              {module.subtitle && (
                                <p className="text-xs text-muted-foreground">{module.subtitle}</p>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground">
                              ~{module.estimated_hours}h
                            </span>
                            {isCompleted && (
                              <Badge variant="outline" className="text-xs bg-success/10 text-success border-success/30">
                                ✓
                              </Badge>
                            )}
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};
