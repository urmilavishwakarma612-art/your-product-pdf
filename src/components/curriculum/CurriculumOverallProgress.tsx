import { motion } from "framer-motion";

interface CurriculumOverallProgressProps {
  totalSolved: number;
  totalQuestions: number;
  easySolved: number;
  easyTotal: number;
  mediumSolved: number;
  mediumTotal: number;
  hardSolved: number;
  hardTotal: number;
}

export const CurriculumOverallProgress = ({
  totalSolved,
  totalQuestions,
  easySolved,
  easyTotal,
  mediumSolved,
  mediumTotal,
  hardSolved,
  hardTotal,
}: CurriculumOverallProgressProps) => {
  const percentage = totalQuestions > 0 ? (totalSolved / totalQuestions) * 100 : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card p-4 sm:p-6 mb-6"
    >
      <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-8">
        {/* Circular Progress */}
        <div className="relative w-24 h-24 sm:w-28 sm:h-28 shrink-0">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
            <circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              stroke="currentColor"
              strokeWidth="8"
              className="text-muted/30"
            />
            <motion.circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              stroke="currentColor"
              strokeWidth="8"
              strokeLinecap="round"
              className="text-primary"
              strokeDasharray={`${percentage * 2.83} 283`}
              initial={{ strokeDasharray: "0 283" }}
              animate={{ strokeDasharray: `${percentage * 2.83} 283` }}
              transition={{ duration: 1, ease: "easeOut" }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-xl sm:text-2xl font-bold">{totalSolved}</span>
            <span className="text-xs text-muted-foreground">/{totalQuestions}</span>
          </div>
        </div>

        {/* Difficulty Breakdown */}
        <div className="flex-1 w-full grid grid-cols-3 gap-3 sm:gap-4">
          {/* Easy */}
          <div className="text-center sm:text-left">
            <div className="flex items-center justify-center sm:justify-start gap-2 mb-1">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <span className="text-xs sm:text-sm text-muted-foreground">Easy</span>
            </div>
            <p className="text-lg sm:text-xl font-bold">
              {easySolved}<span className="text-muted-foreground font-normal text-sm">/{easyTotal}</span>
            </p>
          </div>

          {/* Medium */}
          <div className="text-center sm:text-left">
            <div className="flex items-center justify-center sm:justify-start gap-2 mb-1">
              <div className="w-2.5 h-2.5 rounded-full bg-amber-500" />
              <span className="text-xs sm:text-sm text-muted-foreground">Medium</span>
            </div>
            <p className="text-lg sm:text-xl font-bold">
              {mediumSolved}<span className="text-muted-foreground font-normal text-sm">/{mediumTotal}</span>
            </p>
          </div>

          {/* Hard */}
          <div className="text-center sm:text-left">
            <div className="flex items-center justify-center sm:justify-start gap-2 mb-1">
              <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
              <span className="text-xs sm:text-sm text-muted-foreground">Hard</span>
            </div>
            <p className="text-lg sm:text-xl font-bold">
              {hardSolved}<span className="text-muted-foreground font-normal text-sm">/{hardTotal}</span>
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
