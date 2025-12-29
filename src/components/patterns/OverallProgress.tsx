import { motion } from "framer-motion";

interface OverallProgressProps {
  totalSolved: number;
  totalQuestions: number;
  easySolved: number;
  easyTotal: number;
  mediumSolved: number;
  mediumTotal: number;
  hardSolved: number;
  hardTotal: number;
}

export const OverallProgress = ({
  totalSolved,
  totalQuestions,
  easySolved,
  easyTotal,
  mediumSolved,
  mediumTotal,
  hardSolved,
  hardTotal,
}: OverallProgressProps) => {
  const percentage = totalQuestions > 0 ? Math.round((totalSolved / totalQuestions) * 100) : 0;
  const circumference = 2 * Math.PI * 40;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="bg-card border border-border rounded-xl p-4 mb-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        {/* Circular Progress */}
        <div className="flex items-center gap-4">
          <div className="relative w-14 h-14 sm:w-16 sm:h-16 shrink-0">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
              {/* Background circle */}
              <circle
                cx="50"
                cy="50"
                r="40"
                fill="none"
                stroke="currentColor"
                strokeWidth="8"
                className="text-muted/30"
              />
              {/* Progress circle */}
              <motion.circle
                cx="50"
                cy="50"
                r="40"
                fill="none"
                stroke="url(#progressGradient)"
                strokeWidth="8"
                strokeLinecap="round"
                initial={{ strokeDashoffset: circumference }}
                animate={{ strokeDashoffset }}
                transition={{ duration: 1, ease: "easeOut" }}
                style={{
                  strokeDasharray: circumference,
                }}
              />
              <defs>
                <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="hsl(var(--primary))" />
                  <stop offset="100%" stopColor="hsl(var(--primary))" />
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-xs sm:text-sm font-bold text-foreground">{percentage}%</span>
            </div>
          </div>
          <div>
            <h3 className="font-semibold text-foreground text-sm sm:text-base">Overall Progress</h3>
            <p className="text-xs sm:text-sm text-muted-foreground">
              {totalSolved}<span className="text-muted-foreground/60">/{totalQuestions}</span>
            </p>
          </div>
        </div>

        {/* Difficulty Breakdown */}
        <div className="grid grid-cols-3 gap-2 sm:flex sm:items-center sm:gap-6 text-xs sm:text-sm">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <span className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-emerald-500 shrink-0" />
            <span className="text-foreground font-medium">Easy</span>
            <span className="text-muted-foreground">
              {easySolved}<span className="text-muted-foreground/60">/{easyTotal}</span>
            </span>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2">
            <span className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-amber-500 shrink-0" />
            <span className="text-foreground font-medium">Med</span>
            <span className="text-muted-foreground">
              {mediumSolved}<span className="text-muted-foreground/60">/{mediumTotal}</span>
            </span>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2">
            <span className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-red-500 shrink-0" />
            <span className="text-foreground font-medium">Hard</span>
            <span className="text-muted-foreground">
              {hardSolved}<span className="text-muted-foreground/60">/{hardTotal}</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
