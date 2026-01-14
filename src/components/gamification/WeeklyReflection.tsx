import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { 
  Calendar, TrendingUp, AlertCircle, Target, 
  ChevronRight, CheckCircle, BookOpen, Share2, Linkedin
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { format, startOfWeek, endOfWeek, subWeeks } from "date-fns";
import { toast } from "sonner";

interface WeeklyStats {
  problemsSolved: number;
  patternsWorked: string[];
  timeSpent: number;
  streakDays: number;
  difficultySplit: { easy: number; medium: number; hard: number };
  strengths: string[];
  areasToImprove: string[];
  suggestedFocus: string;
}

export function WeeklyReflection() {
  const { user } = useAuth();
  const [reflectionModalOpen, setReflectionModalOpen] = useState(false);
  const [reflected, setReflected] = useState(false);

  const today = new Date();
  const weekStart = startOfWeek(today, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(today, { weekStartsOn: 1 });
  const lastWeekStart = startOfWeek(subWeeks(today, 1), { weekStartsOn: 1 });

  const { data: weeklyData, isLoading } = useQuery({
    queryKey: ["weekly-reflection", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;

      // Get this week's progress
      const { data: thisWeekProgress } = await supabase
        .from("user_progress")
        .select(`
          is_solved,
          solved_at,
          questions!inner (
            difficulty,
            pattern_id,
            patterns!inner (
              name
            )
          )
        `)
        .eq("user_id", user.id)
        .eq("is_solved", true)
        .gte("solved_at", lastWeekStart.toISOString());

      // Calculate stats
      const patternCounts: Record<string, number> = {};
      let easy = 0, medium = 0, hard = 0;

      thisWeekProgress?.forEach((p: any) => {
        const patternName = p.questions?.patterns?.name;
        if (patternName) {
          patternCounts[patternName] = (patternCounts[patternName] || 0) + 1;
        }
        
        const difficulty = p.questions?.difficulty;
        if (difficulty === "Easy") easy++;
        else if (difficulty === "Medium") medium++;
        else if (difficulty === "Hard") hard++;
      });

      // Get profile for streak
      const { data: profile } = await supabase
        .from("profiles")
        .select("current_streak")
        .eq("id", user.id)
        .single();

      // Analyze patterns
      const sortedPatterns = Object.entries(patternCounts)
        .sort(([, a], [, b]) => b - a);
      
      const strengths = sortedPatterns.slice(0, 3).map(([name]) => name);
      const patternsWorked = sortedPatterns.map(([name]) => name);
      
      // Suggest focus based on what wasn't practiced
      const { data: allPatterns } = await supabase
        .from("patterns")
        .select("name")
        .limit(10);

      const notPracticed = (allPatterns || [])
        .filter((p) => !patternCounts[p.name])
        .map((p) => p.name);

      const stats: WeeklyStats = {
        problemsSolved: thisWeekProgress?.length || 0,
        patternsWorked,
        timeSpent: 0, // Would need to track this separately
        streakDays: profile?.current_streak || 0,
        difficultySplit: { easy, medium, hard },
        strengths,
        areasToImprove: notPracticed.slice(0, 3),
        suggestedFocus: notPracticed[0] || "Continue with your current patterns",
      };

      return stats;
    },
    enabled: !!user?.id,
  });

  const handleReflect = () => {
    setReflectionModalOpen(true);
  };

  const handleCompleteReflection = () => {
    setReflected(true);
    setReflectionModalOpen(false);
    toast.success("🧘 Weekly reflection complete!", {
      description: "Great job taking time to reflect on your progress.",
    });
  };

  const handleShare = async () => {
    if (!weeklyData) return;
    const text = `📊 This week on NexAlgoTrix:\n• ${weeklyData.problemsSolved} problems solved\n• ${weeklyData.patternsWorked.length} patterns practiced\n• ${weeklyData.streakDays}-day streak\n\n#DSA #CodingInterview #NexAlgoTrix`;
    
    await navigator.clipboard.writeText(text);
    toast.success("Weekly report copied to clipboard!");
  };

  if (isLoading || !weeklyData) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-6 bg-muted rounded w-1/3" />
            <div className="h-24 bg-muted rounded" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card className="overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border-b">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-primary" />
              Weekly Reflection
            </CardTitle>
            <Badge variant="outline" className="text-xs">
              {format(weekStart, "MMM d")} - {format(weekEnd, "MMM d")}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          {/* Quick Stats */}
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-3 rounded-lg bg-muted/50">
              <p className="text-2xl font-bold text-primary">{weeklyData.problemsSolved}</p>
              <p className="text-xs text-muted-foreground">Problems Solved</p>
            </div>
            <div className="text-center p-3 rounded-lg bg-muted/50">
              <p className="text-2xl font-bold text-primary">{weeklyData.patternsWorked.length}</p>
              <p className="text-xs text-muted-foreground">Patterns Covered</p>
            </div>
            <div className="text-center p-3 rounded-lg bg-muted/50">
              <p className="text-2xl font-bold text-primary">{weeklyData.streakDays}</p>
              <p className="text-xs text-muted-foreground">Day Streak</p>
            </div>
          </div>

          {/* Difficulty Breakdown */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Difficulty Distribution</h4>
            <div className="flex items-center gap-2 h-4 rounded-full overflow-hidden bg-muted">
              {weeklyData.difficultySplit.easy > 0 && (
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ 
                    width: `${(weeklyData.difficultySplit.easy / weeklyData.problemsSolved) * 100}%` 
                  }}
                  className="h-full bg-green-500"
                />
              )}
              {weeklyData.difficultySplit.medium > 0 && (
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ 
                    width: `${(weeklyData.difficultySplit.medium / weeklyData.problemsSolved) * 100}%` 
                  }}
                  className="h-full bg-yellow-500"
                />
              )}
              {weeklyData.difficultySplit.hard > 0 && (
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ 
                    width: `${(weeklyData.difficultySplit.hard / weeklyData.problemsSolved) * 100}%` 
                  }}
                  className="h-full bg-red-500"
                />
              )}
            </div>
            <div className="flex justify-between text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 bg-green-500 rounded-full" />
                Easy: {weeklyData.difficultySplit.easy}
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 bg-yellow-500 rounded-full" />
                Medium: {weeklyData.difficultySplit.medium}
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 bg-red-500 rounded-full" />
                Hard: {weeklyData.difficultySplit.hard}
              </span>
            </div>
          </div>

          {/* Strengths & Areas to Improve */}
          <div className="grid grid-cols-2 gap-4">
            {weeklyData.strengths.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-1 text-sm font-medium text-green-600">
                  <TrendingUp className="w-4 h-4" />
                  Strengths
                </div>
                <div className="flex flex-wrap gap-1">
                  {weeklyData.strengths.map((s) => (
                    <Badge key={s} variant="secondary" className="text-xs bg-green-500/10 text-green-600">
                      {s}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            
            {weeklyData.areasToImprove.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-1 text-sm font-medium text-yellow-600">
                  <AlertCircle className="w-4 h-4" />
                  To Improve
                </div>
                <div className="flex flex-wrap gap-1">
                  {weeklyData.areasToImprove.map((a) => (
                    <Badge key={a} variant="secondary" className="text-xs bg-yellow-500/10 text-yellow-600">
                      {a}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Suggested Focus */}
          <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4 text-primary" />
              <p className="text-sm">
                <span className="font-medium">Suggested Focus:</span>{" "}
                <span className="text-muted-foreground">{weeklyData.suggestedFocus}</span>
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <Button 
              variant={reflected ? "secondary" : "default"} 
              className="flex-1"
              onClick={handleReflect}
              disabled={reflected}
            >
              {reflected ? (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Reflected
                </>
              ) : (
                <>
                  <BookOpen className="w-4 h-4 mr-2" />
                  Reflect Now
                </>
              )}
            </Button>
            <Button variant="outline" onClick={handleShare}>
              <Share2 className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Reflection Modal */}
      <Dialog open={reflectionModalOpen} onOpenChange={setReflectionModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-primary" />
              Weekly Reflection
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Take a moment to reflect on your week. This helps reinforce learning and identify growth areas.
            </p>

            <div className="space-y-3">
              <div className="p-3 rounded-lg bg-muted/50 space-y-2">
                <p className="text-sm font-medium">🎯 What went well this week?</p>
                <p className="text-xs text-muted-foreground">
                  You solved {weeklyData.problemsSolved} problems and worked on {weeklyData.patternsWorked.length} patterns.
                  {weeklyData.strengths.length > 0 && ` You showed strength in ${weeklyData.strengths.join(", ")}.`}
                </p>
              </div>

              <div className="p-3 rounded-lg bg-muted/50 space-y-2">
                <p className="text-sm font-medium">🔍 What could improve?</p>
                <p className="text-xs text-muted-foreground">
                  {weeklyData.areasToImprove.length > 0 
                    ? `Consider focusing on ${weeklyData.areasToImprove.join(", ")} next week.`
                    : "Keep up the great work! Try challenging yourself with harder problems."}
                </p>
              </div>

              <div className="p-3 rounded-lg bg-primary/5 border border-primary/20 space-y-2">
                <p className="text-sm font-medium">📋 Next Week's Goal</p>
                <p className="text-xs text-muted-foreground">
                  Focus on: <span className="font-medium text-primary">{weeklyData.suggestedFocus}</span>
                </p>
              </div>
            </div>

            <Button className="w-full" onClick={handleCompleteReflection}>
              <CheckCircle className="w-4 h-4 mr-2" />
              Complete Reflection
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
