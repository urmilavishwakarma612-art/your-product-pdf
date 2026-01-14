import { useState } from "react";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { ChevronLeft, ChevronRight, Flame, Snowflake, Calendar as CalendarIcon, Pause, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, subMonths, addMonths, isToday, isFuture } from "date-fns";

interface DayActivity {
  date: string;
  problemsSolved: number;
  lessonsCompleted: number;
  interviewsTaken: number;
  patterns: string[];
  status: "achieved" | "missed" | "holiday" | "paused" | "freeze" | "future";
}

const dayStateConfig = {
  achieved: { color: "bg-green-500", icon: null, label: "Achieved" },
  missed: { color: "bg-muted", icon: XCircle, label: "Missed" },
  holiday: { color: "bg-muted/50 border-2 border-dashed border-muted-foreground/30", icon: CalendarIcon, label: "Holiday" },
  paused: { color: "bg-yellow-500/50", icon: Pause, label: "Paused" },
  freeze: { color: "bg-blue-500", icon: Snowflake, label: "Streak Freeze Used" },
  future: { color: "bg-transparent border border-border/50", icon: null, label: "Upcoming" },
};

export function MonthlyTracker() {
  const { user } = useAuth();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [viewMode, setViewMode] = useState<"daily" | "weekly">("daily");

  // Fetch user activity for the month
  const { data: activities = [] } = useQuery({
    queryKey: ["monthly-activities", user?.id, format(currentMonth, "yyyy-MM")],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const monthStart = startOfMonth(currentMonth);
      const monthEnd = endOfMonth(currentMonth);
      
      // Fetch user progress for the month
      const { data: progressData } = await supabase
        .from("user_progress")
        .select(`
          solved_at,
          questions (
            patterns (name)
          )
        `)
        .eq("user_id", user.id)
        .eq("is_solved", true)
        .gte("solved_at", monthStart.toISOString())
        .lte("solved_at", monthEnd.toISOString());

      // Fetch daily challenges
      const { data: challengesData } = await supabase
        .from("daily_challenges")
        .select("challenge_date, completed")
        .eq("user_id", user.id)
        .gte("challenge_date", format(monthStart, "yyyy-MM-dd"))
        .lte("challenge_date", format(monthEnd, "yyyy-MM-dd"));

      // Fetch profile for streak freeze info
      const { data: profile } = await supabase
        .from("profiles")
        .select("last_freeze_used_at")
        .eq("id", user.id)
        .single();

      // Process data into day activities
      const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
      const activitiesMap: DayActivity[] = days.map((day) => {
        const dateStr = format(day, "yyyy-MM-dd");
        const dayProgress = progressData?.filter((p) => 
          p.solved_at && format(new Date(p.solved_at), "yyyy-MM-dd") === dateStr
        ) || [];
        
        const patterns = [...new Set(dayProgress.map((p: any) => p.questions?.patterns?.name).filter(Boolean))];
        const problemsSolved = dayProgress.length;
        
        // Check if freeze was used on this day
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

        return {
          date: dateStr,
          problemsSolved,
          lessonsCompleted: 0,
          interviewsTaken: 0,
          patterns: patterns as string[],
          status,
        };
      });

      return activitiesMap;
    },
    enabled: !!user?.id,
  });

  // Get streak stats
  const { data: profile } = useQuery({
    queryKey: ["profile-streak", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data } = await supabase
        .from("profiles")
        .select("current_streak, longest_streak, streak_freeze_available")
        .eq("id", user.id)
        .single();
      return data;
    },
    enabled: !!user?.id,
  });

  const weekDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  
  // Get days with proper padding for grid
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
  
  // Calculate padding days for proper week alignment
  const startDayOfWeek = (monthStart.getDay() + 6) % 7; // Monday = 0
  const paddingDays = Array(startDayOfWeek).fill(null);

  const achievedDays = activities.filter((a) => a.status === "achieved").length;
  const totalDays = activities.filter((a) => a.status !== "future").length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-green-500/10 to-emerald-500/5 border-green-500/20">
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-green-500">{achievedDays}</div>
            <p className="text-xs text-muted-foreground">Days Active</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-orange-500/10 to-amber-500/5 border-orange-500/20">
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-orange-500 flex items-center gap-1">
              <Flame className="w-5 h-5" />
              {profile?.current_streak || 0}
            </div>
            <p className="text-xs text-muted-foreground">Current Streak</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-purple-500/10 to-violet-500/5 border-purple-500/20">
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-purple-500">{profile?.longest_streak || 0}</div>
            <p className="text-xs text-muted-foreground">Longest Streak</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-blue-500/10 to-cyan-500/5 border-blue-500/20">
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-blue-500 flex items-center gap-1">
              <Snowflake className="w-5 h-5" />
              {profile?.streak_freeze_available || 0}
            </div>
            <p className="text-xs text-muted-foreground">Freezes Left</p>
          </CardContent>
        </Card>
      </div>

      {/* Calendar */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Monthly Activity</CardTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <span className="font-medium min-w-[140px] text-center">
                {format(currentMonth, "MMMM yyyy")}
              </span>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                disabled={isSameDay(startOfMonth(currentMonth), startOfMonth(new Date()))}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Week day headers */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {weekDays.map((day) => (
              <div key={day} className="text-center text-xs text-muted-foreground font-medium py-1">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          <TooltipProvider>
            <div className="grid grid-cols-7 gap-1">
              {/* Padding days */}
              {paddingDays.map((_, index) => (
                <div key={`padding-${index}`} className="aspect-square" />
              ))}
              
              {/* Actual days */}
              {days.map((day, index) => {
                const activity = activities.find((a) => a.date === format(day, "yyyy-MM-dd"));
                const config = dayStateConfig[activity?.status || "future"];
                const StateIcon = config.icon;

                return (
                  <Tooltip key={index}>
                    <TooltipTrigger asChild>
                      <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: index * 0.01 }}
                        className={`
                          aspect-square rounded-md flex items-center justify-center text-xs
                          cursor-pointer transition-all hover:ring-2 hover:ring-primary/50
                          ${config.color}
                          ${isToday(day) ? "ring-2 ring-primary" : ""}
                        `}
                      >
                        {StateIcon ? (
                          <StateIcon className="w-3 h-3 text-muted-foreground" />
                        ) : activity?.status === "achieved" ? (
                          <span className="text-white font-medium">{day.getDate()}</span>
                        ) : (
                          <span className="text-muted-foreground">{day.getDate()}</span>
                        )}
                      </motion.div>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="max-w-[200px]">
                      <div className="space-y-1">
                        <p className="font-medium">{format(day, "EEEE, MMM d")}</p>
                        <p className="text-xs text-muted-foreground">{config.label}</p>
                        {activity && activity.status === "achieved" && (
                          <>
                            <p className="text-xs">
                              Solved {activity.problemsSolved} problem{activity.problemsSolved !== 1 ? "s" : ""}
                            </p>
                            {activity.patterns.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-1">
                                {activity.patterns.slice(0, 2).map((pattern) => (
                                  <Badge key={pattern} variant="secondary" className="text-[10px] px-1 py-0">
                                    {pattern}
                                  </Badge>
                                ))}
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    </TooltipContent>
                  </Tooltip>
                );
              })}
            </div>
          </TooltipProvider>

          {/* Legend */}
          <div className="flex flex-wrap gap-4 mt-6 pt-4 border-t">
            {Object.entries(dayStateConfig).filter(([key]) => key !== "future").map(([key, config]) => {
              const StateIcon = config.icon;
              return (
                <div key={key} className="flex items-center gap-2 text-xs text-muted-foreground">
                  <div className={`w-4 h-4 rounded-sm ${config.color} flex items-center justify-center`}>
                    {StateIcon && <StateIcon className="w-3 h-3" />}
                  </div>
                  <span>{config.label}</span>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}