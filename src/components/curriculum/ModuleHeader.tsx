import { motion } from "framer-motion";
import { Clock, BookOpen, Target, CheckCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface ModuleHeaderProps {
  module: {
    id: string;
    module_number: number;
    name: string;
    subtitle: string | null;
    estimated_hours: number;
  };
  level: {
    id: string;
    level_number: number;
    name: string;
    is_free: boolean;
  } | null;
  userProgress: {
    checkpoint_passed: boolean;
    started_at: string;
    completed_at: string | null;
  } | null;
}

export const ModuleHeader = ({ module, level, userProgress }: ModuleHeaderProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card p-6 md:p-8"
    >
      <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
        <div>
          {level && (
            <Badge variant="outline" className="mb-3 text-xs">
              Level {level.level_number} • {level.name}
            </Badge>
          )}
          <h1 className="text-2xl md:text-3xl font-bold">
            Module {module.module_number}: {module.name}
          </h1>
          {module.subtitle && (
            <p className="text-muted-foreground mt-2">{module.subtitle}</p>
          )}
        </div>

        {userProgress?.checkpoint_passed && (
          <Badge className="bg-success/10 text-success border-success/30">
            <CheckCircle className="w-4 h-4 mr-1" />
            Completed
          </Badge>
        )}
      </div>

      <div className="flex flex-wrap gap-4 text-sm">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Clock className="w-4 h-4" />
          <span>~{module.estimated_hours} hours</span>
        </div>
        <div className="flex items-center gap-2 text-muted-foreground">
          <BookOpen className="w-4 h-4" />
          <span>Pattern-based learning</span>
        </div>
        <div className="flex items-center gap-2 text-muted-foreground">
          <Target className="w-4 h-4" />
          <span>Practice ladder included</span>
        </div>
      </div>
    </motion.div>
  );
};
