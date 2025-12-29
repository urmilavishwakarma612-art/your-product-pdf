import { useMemo } from "react";
import { format, subDays, startOfWeek, addDays, isSameDay } from "date-fns";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface ActivityGraphProps {
  activityData: { date: string; count: number }[];
}

export function ActivityGraph({ activityData }: ActivityGraphProps) {
  const weeks = 52;
  const days = 7;

  const { grid, monthLabels, maxCount } = useMemo(() => {
    const today = new Date();
    const startDate = startOfWeek(subDays(today, weeks * 7), { weekStartsOn: 0 });
    
    // Create activity map for quick lookup
    const activityMap = new Map<string, number>();
    activityData.forEach((item) => {
      activityMap.set(item.date, item.count);
    });

    // Generate grid data
    const gridData: { date: Date; count: number }[][] = [];
    const months: { label: string; week: number }[] = [];
    let lastMonth = -1;

    for (let week = 0; week < weeks; week++) {
      const weekData: { date: Date; count: number }[] = [];
      
      for (let day = 0; day < days; day++) {
        const date = addDays(startDate, week * 7 + day);
        const dateStr = format(date, "yyyy-MM-dd");
        const count = activityMap.get(dateStr) || 0;
        weekData.push({ date, count });

        // Track month labels
        const month = date.getMonth();
        if (month !== lastMonth && day === 0) {
          months.push({ label: format(date, "MMM"), week });
          lastMonth = month;
        }
      }
      gridData.push(weekData);
    }

    const max = Math.max(...activityData.map((d) => d.count), 1);

    return { grid: gridData, monthLabels: months, maxCount: max };
  }, [activityData]);

  const getIntensity = (count: number) => {
    if (count === 0) return "bg-muted";
    const ratio = count / maxCount;
    if (ratio <= 0.25) return "bg-emerald-200 dark:bg-emerald-900";
    if (ratio <= 0.5) return "bg-emerald-400 dark:bg-emerald-700";
    if (ratio <= 0.75) return "bg-emerald-500 dark:bg-emerald-500";
    return "bg-emerald-600 dark:bg-emerald-400";
  };

  const dayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const totalContributions = activityData.reduce((sum, d) => sum + d.count, 0);

  return (
    <div className="p-6 bg-card rounded-xl border">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold">Activity</h3>
        <span className="text-sm text-muted-foreground">
          {totalContributions} problems solved in the last year
        </span>
      </div>

      <div className="overflow-x-auto">
        <div className="inline-flex flex-col gap-1 min-w-max">
          {/* Month labels */}
          <div className="flex ml-8">
            {monthLabels.map((m, i) => (
              <span
                key={i}
                className="text-xs text-muted-foreground"
                style={{ marginLeft: i === 0 ? 0 : `${(m.week - (monthLabels[i - 1]?.week || 0)) * 13 - 24}px` }}
              >
                {m.label}
              </span>
            ))}
          </div>

          {/* Grid */}
          <div className="flex gap-1">
            {/* Day labels */}
            <div className="flex flex-col gap-1 pr-2">
              {dayLabels.map((day, i) => (
                <span
                  key={day}
                  className="text-xs text-muted-foreground h-[10px] flex items-center"
                  style={{ visibility: i % 2 === 1 ? "visible" : "hidden" }}
                >
                  {day}
                </span>
              ))}
            </div>

            {/* Activity cells */}
            {grid.map((week, weekIndex) => (
              <div key={weekIndex} className="flex flex-col gap-1">
                {week.map((day, dayIndex) => (
                  <Tooltip key={dayIndex}>
                    <TooltipTrigger asChild>
                      <div
                        className={`w-[10px] h-[10px] rounded-sm ${getIntensity(day.count)} cursor-pointer hover:ring-1 hover:ring-foreground/20`}
                      />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="text-xs">
                        <strong>{day.count} problem{day.count !== 1 ? "s" : ""}</strong> on{" "}
                        {format(day.date, "MMM d, yyyy")}
                      </p>
                    </TooltipContent>
                  </Tooltip>
                ))}
              </div>
            ))}
          </div>

          {/* Legend */}
          <div className="flex items-center gap-2 mt-2 justify-end">
            <span className="text-xs text-muted-foreground">Less</span>
            <div className="flex gap-1">
              <div className="w-[10px] h-[10px] rounded-sm bg-muted" />
              <div className="w-[10px] h-[10px] rounded-sm bg-emerald-200 dark:bg-emerald-900" />
              <div className="w-[10px] h-[10px] rounded-sm bg-emerald-400 dark:bg-emerald-700" />
              <div className="w-[10px] h-[10px] rounded-sm bg-emerald-500 dark:bg-emerald-500" />
              <div className="w-[10px] h-[10px] rounded-sm bg-emerald-600 dark:bg-emerald-400" />
            </div>
            <span className="text-xs text-muted-foreground">More</span>
          </div>
        </div>
      </div>
    </div>
  );
}
