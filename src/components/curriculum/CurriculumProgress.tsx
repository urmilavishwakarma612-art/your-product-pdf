import { motion } from "framer-motion";
import { Trophy, BookOpen, Clock, Target } from "lucide-react";

interface CurriculumLevel {
  id: string;
  level_number: number;
  name: string;
}

interface CurriculumModule {
  id: string;
  level_id: string;
  estimated_hours: number;
}

interface UserProgress {
  module_id: string;
  checkpoint_passed: boolean;
}

interface CurriculumProgressProps {
  levels: CurriculumLevel[];
  modules: CurriculumModule[];
  userProgress: UserProgress[];
}

export const CurriculumProgress = ({ levels, modules, userProgress }: CurriculumProgressProps) => {
  const totalModules = modules.length;
  const completedModules = userProgress.filter((p) => p.checkpoint_passed).length;
  const progressPercent = totalModules > 0 ? (completedModules / totalModules) * 100 : 0;

  const totalHours = modules.reduce((acc, m) => acc + (m.estimated_hours || 4), 0);
  const completedHours = modules
    .filter((m) => userProgress.some((p) => p.module_id === m.id && p.checkpoint_passed))
    .reduce((acc, m) => acc + (m.estimated_hours || 4), 0);

  const currentLevel = levels.find((level) => {
    const levelModules = modules.filter((m) => m.level_id === level.id);
    const levelCompleted = levelModules.every((m) =>
      userProgress.some((p) => p.module_id === m.id && p.checkpoint_passed)
    );
    return !levelCompleted;
  });

  const stats = [
    {
      icon: Target,
      label: "Progress",
      value: `${Math.round(progressPercent)}%`,
      color: "text-primary",
    },
    {
      icon: BookOpen,
      label: "Modules",
      value: `${completedModules}/${totalModules}`,
      color: "text-success",
    },
    {
      icon: Clock,
      label: "Hours",
      value: `${completedHours}/${totalHours}h`,
      color: "text-warning",
    },
    {
      icon: Trophy,
      label: "Current Level",
      value: currentLevel ? `L${currentLevel.level_number}` : "Done!",
      color: "text-violet",
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.3 }}
      className="glass-card p-6"
    >
      <h3 className="font-semibold mb-4">Your Progress</h3>

      {/* Progress Bar */}
      <div className="mb-6">
        <div className="flex justify-between text-sm mb-2">
          <span className="text-muted-foreground">Overall Completion</span>
          <span className="font-medium">{Math.round(progressPercent)}%</span>
        </div>
        <div className="h-3 bg-muted rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progressPercent}%` }}
            transition={{ duration: 1, ease: "easeOut" }}
            className="h-full rounded-full"
            style={{ background: "var(--gradient-primary)" }}
          />
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.4 + index * 0.1 }}
            className="text-center"
          >
            <stat.icon className={`w-5 h-5 mx-auto mb-1.5 ${stat.color}`} />
            <div className="text-xl font-bold">{stat.value}</div>
            <div className="text-xs text-muted-foreground">{stat.label}</div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
};
