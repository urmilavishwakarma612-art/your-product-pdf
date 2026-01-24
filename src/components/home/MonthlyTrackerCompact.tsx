import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { ChevronLeft, ChevronRight, Flame, Snowflake, Calendar as CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isFuture, isToday } from "date-fns";

interface DayActivity {
  date: string;
  problemsSolved: number;
  status: "achieved" | "missed" | "freeze" | "future";
}

export function MonthlyTrackerCompact() {
  const { user } = useAuth();
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // Fetch user activity for the month
  const { data: activities = [] } = useQuery({
    queryKey: ["compact-monthly-activities", user?.id, format(currentMonth, "yyyy-MM")],
    queryFn: async () => {
      if (!user?.id) return [];

      const monthStart = startOfMonth(currentMonth);
      const monthEnd = endOfMonth(currentMonth);

      const { data: progressData } = await supabase
        .from("user_progress")
        .select("solved_at")
        .eq("user_id", user.id)
        .eq("is_solved", true)
        .gte("solved_at", monthStart.toISOString())
        .lte("solved_at", monthEnd.toISOString());

      const { data: profile } = await supabase
        .from("profiles")
        .select("last_freeze_used_at")
        .eq("id", user.id)
        .single();

      const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
      return days.map((day) => {
        const dateStr = format(day, "yyyy-MM-dd");
        const problemsSolved = progressData?.filter((p) =>
          p.solved_at && format(new Date(p.solved_at), "yyyy-MM-dd") === dateStr
        ).length || 0;

        const freezeUsed = profile?.last_freeze_used_at &&
          format(new Date(profile.last_freeze_used_at), "yyyy-MM-dd") === dateStr;

        let status: DayActivity["status"] = "missed";
        if (isFuture(day) && !isToday(day)) {
          status = "future";
        } else if (freezeUsed) {
          status = "freeze";
        } else if (problemsSolved > 0) {
          status = "achieved";
        }

        return { date: dateStr, problemsSolved, status };
      });
    },
    enabled: !!user?.id,
  });

  // Get streak stats
  const { data: profile } = useQuery({
    queryKey: ["compact-profile-streak", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data } = await supabase
        .from("profiles")
        .select("current_streak, longest_streak")
        .eq("id", user.id)
        .single();
      return data;
    },
    enabled: !!user?.id,
  });

  const weekDays = ["M", "T", "W", "T", "F", "S", "S"];
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const startDayOfWeek = (monthStart.getDay() + 6) % 7;
  const paddingDays = Array(startDayOfWeek).fill(null);

  const achievedDays = activities.filter((a) => a.status === "achieved").length;

  return (
    <div className="space-y-3">
      {/* Streak Stats */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 px-2 py-1 rounded-md bg-orange-500/10">
            <Flame className="w-3.5 h-3.5 text-orange-500" />
            <span className="text-xs font-semibold text-orange-500">{profile?.current_streak || 0}</span>
          </div>
          <span className="text-[10px] text-muted-foreground">day streak</span>
        </div>
        <div className="text-xs text-muted-foreground">
          Best: <span className="font-semibold text-foreground">{profile?.longest_streak || 0}</span>
        </div>
      </div>

      {/* Month Navigation */}
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6"
          onClick={() => setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1))}
        >
          <ChevronLeft className="w-3.5 h-3.5" />
        </Button>
        <span className="text-xs font-medium">{format(currentMonth, "MMMM yyyy")}</span>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6"
          onClick={() => setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1))}
        >
          <ChevronRight className="w-3.5 h-3.5" />
        </Button>
      </div>

      {/* Calendar Grid */}
      <div className="space-y-1">
        {/* Week headers */}
        <div className="grid grid-cols-7 gap-0.5">
          {weekDays.map((day, i) => (
            <div key={i} className="text-[9px] text-center text-muted-foreground font-medium">
              {day}
            </div>
          ))}
        </div>

        {/* Days grid */}
        <TooltipProvider delayDuration={0}>
          <div className="grid grid-cols-7 gap-0.5">
            {paddingDays.map((_, i) => (
              <div key={`pad-${i}`} className="aspect-square" />
            ))}
            {days.map((day) => {
              const dateStr = format(day, "yyyy-MM-dd");
              const activity = activities.find(a => a.date === dateStr);
              const status = activity?.status || "missed";

              let bgClass = "bg-muted/30";
              if (status === "achieved") bgClass = "bg-green-500";
              else if (status === "freeze") bgClass = "bg-blue-500";
              else if (status === "future") bgClass = "bg-transparent border border-border/30";

              return (
                <Tooltip key={dateStr}>
                  <TooltipTrigger asChild>
                    <div
                      className={`aspect-square rounded-sm ${bgClass} cursor-pointer hover:ring-1 hover:ring-primary/50 transition-all flex items-center justify-center`}
                    >
                      {status === "freeze" && (
                        <Snowflake className="w-2 h-2 text-white" />
                      )}
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="text-xs">
                    <p className="font-medium">{format(day, "MMM d, yyyy")}</p>
                    <p className="text-muted-foreground">
                      {activity?.problemsSolved || 0} problems solved
                    </p>
                  </TooltipContent>
                </Tooltip>
              );
            })}
          </div>
        </TooltipProvider>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-3 text-[9px]">
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-sm bg-green-500" />
          <span className="text-muted-foreground">Active</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-sm bg-blue-500" />
          <span className="text-muted-foreground">Freeze</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-sm bg-muted/50" />
          <span className="text-muted-foreground">Missed</span>
        </div>
      </div>

      {/* Monthly summary */}
      <div className="text-center text-xs text-muted-foreground">
        <span className="font-medium text-foreground">{achievedDays}</span> active days this month
      </div>
    </div>
  );
}
