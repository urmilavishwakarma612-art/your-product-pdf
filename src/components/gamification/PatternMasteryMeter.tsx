import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Brain, ChevronRight, Award, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";

interface PatternProgress {
  id: string;
  name: string;
  slug: string;
  totalQuestions: number;
  solved: number;
  masteryLevel: "beginner" | "practicing" | "interview-ready" | "mastered";
  percentage: number;
  color: string;
}

const masteryConfig = {
  beginner: { label: "Beginner", color: "text-muted-foreground", bg: "bg-muted" },
  practicing: { label: "Practicing", color: "text-yellow-500", bg: "bg-yellow-500/10" },
  "interview-ready": { label: "Interview Ready", color: "text-primary", bg: "bg-primary/10" },
  mastered: { label: "Mastered", color: "text-green-500", bg: "bg-green-500/10" },
};

export function PatternMasteryMeter() {
  const { user } = useAuth();

  const { data, isLoading } = useQuery({
    queryKey: ["pattern-mastery", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;

      // Get all patterns with question counts
      const { data: patterns } = await supabase
        .from("patterns")
        .select("id, name, slug, color, total_questions")
        .order("display_order");

      // Get user's solved questions per pattern
      const { data: userProgress } = await supabase
        .from("user_progress")
        .select(`
          question_id,
          is_solved,
          questions!inner (
            pattern_id
          )
        `)
        .eq("user_id", user.id)
        .eq("is_solved", true);

      // Calculate progress per pattern
      const patternSolvedCount: Record<string, number> = {};
      userProgress?.forEach((p: any) => {
        const patternId = p.questions?.pattern_id;
        if (patternId) {
          patternSolvedCount[patternId] = (patternSolvedCount[patternId] || 0) + 1;
        }
      });

      const patternsProgress: PatternProgress[] = (patterns || []).map((pattern) => {
        const solved = patternSolvedCount[pattern.id] || 0;
        const total = pattern.total_questions || 1;
        const percentage = Math.min(Math.round((solved / total) * 100), 100);

        let masteryLevel: PatternProgress["masteryLevel"] = "beginner";
        if (percentage >= 80) masteryLevel = "mastered";
        else if (percentage >= 50) masteryLevel = "interview-ready";
        else if (percentage >= 20) masteryLevel = "practicing";

        return {
          id: pattern.id,
          name: pattern.name,
          slug: pattern.slug,
          totalQuestions: total,
          solved,
          masteryLevel,
          percentage,
          color: pattern.color || "#6366f1",
        };
      });

      // Find weak patterns (less than 30% completion)
      const weakPatterns = patternsProgress.filter((p) => p.percentage < 30 && p.percentage > 0);
      const strongPatterns = patternsProgress.filter((p) => p.percentage >= 50);

      return {
        patterns: patternsProgress,
        weakPatterns,
        strongPatterns,
        overallMastery: Math.round(
          patternsProgress.reduce((sum, p) => sum + p.percentage, 0) / patternsProgress.length
        ),
      };
    },
    enabled: !!user?.id,
  });

  if (isLoading || !data) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-6 bg-muted rounded w-1/3" />
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-12 bg-muted rounded" />
              ))}
            </div>
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
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Brain className="w-5 h-5 text-primary" />
              Pattern Mastery
            </CardTitle>
            <Badge variant="outline" className="text-xs">
              {data.overallMastery}% Overall
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Weak Patterns Alert */}
          {data.weakPatterns.length > 0 && (
            <div className="p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-yellow-500 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-yellow-600 dark:text-yellow-500">
                    Weak Sub-patterns Detected
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Focus on: {data.weakPatterns.map((p) => p.name).join(", ")}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Pattern List */}
          <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
            {data.patterns.map((pattern, index) => {
              const config = masteryConfig[pattern.masteryLevel];
              
              return (
                <motion.div
                  key={pattern.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="group p-3 rounded-lg border hover:border-primary/30 transition-colors"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: pattern.color }}
                      />
                      <span className="font-medium text-sm">{pattern.name}</span>
                    </div>
                    <Badge 
                      variant="secondary" 
                      className={`text-xs ${config.color} ${config.bg}`}
                    >
                      {config.label}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <Progress 
                      value={pattern.percentage} 
                      className="flex-1 h-2"
                    />
                    <span className="text-xs text-muted-foreground w-16 text-right">
                      {pattern.solved}/{pattern.totalQuestions}
                    </span>
                  </div>
                  
                  {pattern.masteryLevel === "mastered" && (
                    <div className="flex items-center gap-1 mt-2 text-green-500">
                      <Award className="w-3 h-3" />
                      <span className="text-xs">Pattern Mastered!</span>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>

          {/* Strong Patterns Summary */}
          {data.strongPatterns.length > 0 && (
            <div className="pt-4 border-t">
              <p className="text-xs text-muted-foreground mb-2">Your Strengths:</p>
              <div className="flex flex-wrap gap-2">
                {data.strongPatterns.slice(0, 5).map((pattern) => (
                  <Badge
                    key={pattern.id}
                    variant="outline"
                    className="text-xs"
                    style={{ borderColor: pattern.color, color: pattern.color }}
                  >
                    {pattern.name}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Action Button */}
          <Button variant="outline" className="w-full text-sm" asChild>
            <a href="/curriculum">
              Improve Weakest Pattern <ChevronRight className="w-4 h-4 ml-1" />
            </a>
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  );
}
