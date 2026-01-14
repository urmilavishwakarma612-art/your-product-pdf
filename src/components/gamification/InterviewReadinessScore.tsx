import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { 
  Target, TrendingUp, Brain, Flame, 
  ChevronRight, Share2, Linkedin 
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { toast } from "sonner";

interface ScoreBreakdown {
  patternCoverage: number;
  difficultyRatio: number;
  interviewPerformance: number;
  consistency: number;
}

export function InterviewReadinessScore() {
  const { user } = useAuth();

  const { data: scoreData, isLoading } = useQuery({
    queryKey: ["interview-readiness", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;

      // Get pattern coverage
      const { data: patterns } = await supabase
        .from("patterns")
        .select("id, name, slug");
      
      const { data: userProgress } = await supabase
        .from("user_progress")
        .select(`
          is_solved,
          questions!inner (
            pattern_id,
            difficulty
          )
        `)
        .eq("user_id", user.id)
        .eq("is_solved", true);

      // Calculate pattern coverage
      const solvedPatterns = new Set<string>();
      let mediumHardCount = 0;
      let totalSolved = 0;

      userProgress?.forEach((p: any) => {
        if (p.questions?.pattern_id) {
          solvedPatterns.add(p.questions.pattern_id);
        }
        if (p.questions?.difficulty === "Medium" || p.questions?.difficulty === "Hard") {
          mediumHardCount++;
        }
        totalSolved++;
      });

      const patternCoverage = patterns?.length 
        ? Math.min((solvedPatterns.size / patterns.length) * 100, 100)
        : 0;

      // Calculate difficulty ratio (Medium + Hard / Total)
      const difficultyRatio = totalSolved > 0 
        ? Math.min((mediumHardCount / totalSolved) * 100, 100)
        : 0;

      // Get interview performance
      const { data: interviews } = await supabase
        .from("interview_sessions")
        .select("total_score, status")
        .eq("user_id", user.id)
        .eq("status", "completed");

      const avgInterviewScore = interviews?.length 
        ? interviews.reduce((sum, i) => sum + (i.total_score || 0), 0) / interviews.length
        : 0;

      // Get consistency (last 21 days streak)
      const { data: profile } = await supabase
        .from("profiles")
        .select("current_streak, longest_streak")
        .eq("id", user.id)
        .single();

      const consistencyScore = Math.min((profile?.current_streak || 0) / 21 * 100, 100);

      // Calculate overall score
      const breakdown: ScoreBreakdown = {
        patternCoverage: Math.round(patternCoverage),
        difficultyRatio: Math.round(difficultyRatio),
        interviewPerformance: Math.round(avgInterviewScore),
        consistency: Math.round(consistencyScore),
      };

      const overallScore = Math.round(
        breakdown.patternCoverage * 0.3 +
        breakdown.difficultyRatio * 0.25 +
        breakdown.interviewPerformance * 0.25 +
        breakdown.consistency * 0.2
      );

      return {
        score: overallScore,
        breakdown,
        totalPatterns: patterns?.length || 0,
        coveredPatterns: solvedPatterns.size,
        totalSolved,
        interviewsCompleted: interviews?.length || 0,
        currentStreak: profile?.current_streak || 0,
      };
    },
    enabled: !!user?.id,
  });

  const getScoreLabel = (score: number) => {
    if (score >= 80) return { label: "Interview Ready", color: "text-green-500" };
    if (score >= 60) return { label: "Good Progress", color: "text-primary" };
    if (score >= 40) return { label: "Building Skills", color: "text-yellow-500" };
    return { label: "Getting Started", color: "text-muted-foreground" };
  };

  const handleShare = async () => {
    if (!scoreData) return;
    const text = `Interview Readiness Score: ${scoreData.score}/100 — Actively improving core DSA patterns on NexAlgoTrix. #DSA #CodingInterview`;
    
    await navigator.clipboard.writeText(text);
    toast.success("Share text copied to clipboard!");
  };

  if (isLoading || !scoreData) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-24 bg-muted rounded-lg" />
            <div className="h-4 bg-muted rounded w-3/4" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const scoreInfo = getScoreLabel(scoreData.score);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card className="overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-primary/10 to-purple-500/10 border-b">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5 text-primary" />
              Interview Readiness Score
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={handleShare}>
              <Share2 className="w-4 h-4 mr-1" />
              Share
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          {/* Main Score Display */}
          <div className="flex items-center gap-6 mb-6">
            <div className="relative">
              <svg className="w-28 h-28 transform -rotate-90">
                <circle
                  cx="56"
                  cy="56"
                  r="48"
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="none"
                  className="text-muted"
                />
                <motion.circle
                  cx="56"
                  cy="56"
                  r="48"
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="none"
                  strokeLinecap="round"
                  className="text-primary"
                  initial={{ strokeDasharray: "0 302" }}
                  animate={{ 
                    strokeDasharray: `${(scoreData.score / 100) * 302} 302` 
                  }}
                  transition={{ duration: 1, delay: 0.3 }}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  className="text-2xl font-bold"
                >
                  {scoreData.score}
                </motion.span>
                <span className="text-xs text-muted-foreground">/100</span>
              </div>
            </div>
            
            <div className="flex-1">
              <h3 className={`text-lg font-semibold ${scoreInfo.color}`}>
                {scoreInfo.label}
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                {scoreData.score >= 60 
                  ? "You're on track for technical interviews!"
                  : "Keep practicing to improve your readiness."}
              </p>
              <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                <span>{scoreData.totalSolved} problems solved</span>
                <span>{scoreData.coveredPatterns}/{scoreData.totalPatterns} patterns</span>
              </div>
            </div>
          </div>

          {/* Score Breakdown */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium text-muted-foreground">Score Breakdown</h4>
            
            <TooltipProvider>
              {[
                { 
                  key: "patternCoverage", 
                  label: "Pattern Coverage", 
                  icon: Brain, 
                  value: scoreData.breakdown.patternCoverage,
                  weight: "30%",
                  tooltip: "How many different patterns you've practiced"
                },
                { 
                  key: "difficultyRatio", 
                  label: "Difficulty Mix", 
                  icon: TrendingUp, 
                  value: scoreData.breakdown.difficultyRatio,
                  weight: "25%",
                  tooltip: "Ratio of Medium/Hard problems solved"
                },
                { 
                  key: "interviewPerformance", 
                  label: "Interview Performance", 
                  icon: Target, 
                  value: scoreData.breakdown.interviewPerformance,
                  weight: "25%",
                  tooltip: "Average score from interview simulations"
                },
                { 
                  key: "consistency", 
                  label: "21-Day Consistency", 
                  icon: Flame, 
                  value: scoreData.breakdown.consistency,
                  weight: "20%",
                  tooltip: "Current streak towards 21-day goal"
                },
              ].map((metric) => (
                <Tooltip key={metric.key}>
                  <TooltipTrigger asChild>
                    <div className="space-y-1 cursor-help">
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <metric.icon className="w-4 h-4 text-muted-foreground" />
                          <span>{metric.label}</span>
                          <span className="text-xs text-muted-foreground">({metric.weight})</span>
                        </div>
                        <span className="font-medium">{metric.value}%</span>
                      </div>
                      <Progress value={metric.value} className="h-2" />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>{metric.tooltip}</TooltipContent>
                </Tooltip>
              ))}
            </TooltipProvider>
          </div>

          {/* Quick Actions */}
          <div className="mt-6 pt-4 border-t">
            <p className="text-xs text-muted-foreground mb-3">Improve your score:</p>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" className="text-xs">
                Practice New Patterns <ChevronRight className="w-3 h-3 ml-1" />
              </Button>
              <Button variant="outline" size="sm" className="text-xs">
                Try Interview Mode <ChevronRight className="w-3 h-3 ml-1" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
