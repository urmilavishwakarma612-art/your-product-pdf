import { motion } from "framer-motion";

interface CurriculumLevel {
  id: string;
  level_number: number;
  name: string;
  week_start: number | null;
  week_end: number | null;
  color: string | null;
}

interface WeekTimelineProps {
  levels: CurriculumLevel[];
}

export const WeekTimeline = ({ levels }: WeekTimelineProps) => {
  if (levels.length === 0) return null;

  const maxWeek = Math.max(...levels.map((l) => l.week_end || 0));
  if (maxWeek === 0) return null;

  const levelColors: Record<number, string> = {
    0: "bg-emerald-500",
    1: "bg-green-500",
    2: "bg-yellow-500",
    3: "bg-orange-500",
    4: "bg-blue-500",
    5: "bg-purple-500",
    6: "bg-red-500",
    7: "bg-pink-500",
    8: "bg-indigo-500",
    9: "bg-cyan-500",
  };

  return (
    <section className="py-12 px-4 bg-muted/30">
      <div className="max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center mb-8"
        >
          <h2 className="text-2xl font-bold mb-2">18-Week Timeline</h2>
          <p className="text-sm text-muted-foreground">
            Structured learning path from fundamentals to interview mastery
          </p>
        </motion.div>

        {/* Timeline Bar */}
        <div className="relative">
          {/* Week markers */}
          <div className="flex justify-between text-xs text-muted-foreground mb-2 px-1">
            {Array.from({ length: Math.ceil(maxWeek / 3) + 1 }, (_, i) => i * 3).map((week) => (
              <span key={week}>W{week || 1}</span>
            ))}
          </div>

          {/* Track */}
          <div className="relative h-8 bg-muted rounded-full overflow-hidden">
            {levels
              .filter((l) => l.week_start && l.week_end)
              .map((level, index) => {
                const start = ((level.week_start! - 1) / maxWeek) * 100;
                const width = ((level.week_end! - level.week_start! + 1) / maxWeek) * 100;
                const colorClass = levelColors[level.level_number] || levelColors[0];

                return (
                  <motion.div
                    key={level.id}
                    initial={{ width: 0 }}
                    whileInView={{ width: `${width}%` }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8, delay: index * 0.1 }}
                    className={`absolute top-0 h-full ${colorClass} flex items-center justify-center text-xs font-medium text-white`}
                    style={{ left: `${start}%` }}
                    title={level.name}
                  >
                    <span className="truncate px-2">L{level.level_number}</span>
                  </motion.div>
                );
              })}
          </div>

          {/* Legend */}
          <div className="flex flex-wrap gap-3 mt-4 justify-center">
            {levels.slice(0, 6).map((level) => {
              const colorClass = levelColors[level.level_number] || levelColors[0];
              return (
                <div key={level.id} className="flex items-center gap-1.5 text-xs">
                  <div className={`w-3 h-3 rounded ${colorClass}`} />
                  <span className="text-muted-foreground">{level.name}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};
