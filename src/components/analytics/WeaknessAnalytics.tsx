import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { motion } from "framer-motion";
import { TrendingDown, Target, Brain, Zap, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { WeakPatternCard } from "./WeakPatternCard";
import { DifficultyChart } from "./DifficultyChart";
import { RetentionScore } from "./RetentionScore";

interface PatternStats {
  pattern_id: string;
  pattern_name: string;
  total_questions: number;
  solved_count: number;
  solve_rate: number;
  avg_hints_used: number;
  avg_ease_factor: number;
}

interface DifficultyStats {
  difficulty: string;
  total: number;
  solved: number;
  solve_rate: number;
}

export function WeaknessAnalytics() {
  const { user } = useAuth();

  // Fetch user progress with pattern info
  const { data: progressData, isLoading } = useQuery({
    queryKey: ["weakness-analytics", user?.id],
    queryFn: async () => {
      if (!user) return null;

      // Get all user progress
      const { data: progress, error: progressError } = await supabase
        .from("user_progress")
        .select(`
          *,
          questions!inner(
            id,
            difficulty,
            pattern_id,
            patterns!inner(id, name)
          )
        `)
        .eq("user_id", user.id);

      if (progressError) throw progressError;

      // Get all patterns for comparison
      const { data: patterns, error: patternsError } = await supabase
        .from("patterns")
        .select("id, name, total_questions");

      if (patternsError) throw patternsError;

      return { progress: progress || [], patterns: patterns || [] };
    },
    enabled: !!user,
  });

  if (isLoading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-48 bg-muted rounded-lg" />
        <div className="h-64 bg-muted rounded-lg" />
      </div>
    );
  }

  if (!progressData || progressData.progress.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="py-12 text-center">
          <Brain className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Analytics Yet</h3>
          <p className="text-muted-foreground">
            Start solving problems to see your weakness analysis!
          </p>
        </CardContent>
      </Card>
    );
  }

  // Calculate pattern statistics
  const patternStatsMap = new Map<string, PatternStats>();
  
  progressData.patterns.forEach((pattern) => {
    patternStatsMap.set(pattern.id, {
      pattern_id: pattern.id,
      pattern_name: pattern.name,
      total_questions: pattern.total_questions,
      solved_count: 0,
      solve_rate: 0,
      avg_hints_used: 0,
      avg_ease_factor: 2.5,
    });
  });

  // Aggregate progress data by pattern
  const patternProgressMap = new Map<string, { solved: number; hints: number[]; ease: number[] }>();
  
  progressData.progress.forEach((p: any) => {
    const patternId = p.questions?.pattern_id;
    if (!patternId) return;

    if (!patternProgressMap.has(patternId)) {
      patternProgressMap.set(patternId, { solved: 0, hints: [], ease: [] });
    }

    const stats = patternProgressMap.get(patternId)!;
    if (p.is_solved) stats.solved++;
    stats.hints.push(p.hints_used || 0);
    stats.ease.push(p.ease_factor || 2.5);
  });

  // Update pattern stats with progress data
  patternProgressMap.forEach((data, patternId) => {
    const stats = patternStatsMap.get(patternId);
    if (stats) {
      stats.solved_count = data.solved;
      stats.solve_rate = stats.total_questions > 0 
        ? (data.solved / stats.total_questions) * 100 
        : 0;
      stats.avg_hints_used = data.hints.length > 0
        ? data.hints.reduce((a, b) => a + b, 0) / data.hints.length
        : 0;
      stats.avg_ease_factor = data.ease.length > 0
        ? data.ease.reduce((a, b) => a + b, 0) / data.ease.length
        : 2.5;
    }
  });

  const patternStats = Array.from(patternStatsMap.values());
  
  // Get weak patterns (solve rate < 50% or high hint usage)
  const weakPatterns = patternStats
    .filter((p) => p.total_questions > 0 && (p.solve_rate < 50 || p.avg_hints_used > 1))
    .sort((a, b) => a.solve_rate - b.solve_rate)
    .slice(0, 5);

  // Calculate difficulty breakdown
  const difficultyMap = new Map<string, { total: number; solved: number }>();
  ["easy", "medium", "hard"].forEach((d) => difficultyMap.set(d, { total: 0, solved: 0 }));

  progressData.progress.forEach((p: any) => {
    const difficulty = p.questions?.difficulty?.toLowerCase() || "medium";
    const stats = difficultyMap.get(difficulty);
    if (stats) {
      stats.total++;
      if (p.is_solved) stats.solved++;
    }
  });

  const difficultyStats: DifficultyStats[] = Array.from(difficultyMap.entries()).map(
    ([difficulty, stats]) => ({
      difficulty,
      total: stats.total,
      solved: stats.solved,
      solve_rate: stats.total > 0 ? (stats.solved / stats.total) * 100 : 0,
    })
  );

  // Calculate overall retention score
  const avgEaseFactor =
    progressData.progress.reduce((sum: number, p: any) => sum + (p.ease_factor || 2.5), 0) /
    progressData.progress.length;
  const retentionScore = Math.min(100, Math.round((avgEaseFactor / 2.5) * 100));

  // Calculate overall stats
  const totalSolved = progressData.progress.filter((p: any) => p.is_solved).length;
  const totalAttempted = progressData.progress.length;
  const overallSolveRate = totalAttempted > 0 ? (totalSolved / totalAttempted) * 100 : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Target className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Solve Rate</p>
                <p className="text-2xl font-bold">{overallSolveRate.toFixed(0)}%</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/10">
                <Zap className="w-5 h-5 text-green-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Problems Solved</p>
                <p className="text-2xl font-bold">{totalSolved}/{totalAttempted}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-500/10">
                <AlertTriangle className="w-5 h-5 text-amber-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Weak Areas</p>
                <p className="text-2xl font-bold">{weakPatterns.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-500/10">
                <Brain className="w-5 h-5 text-purple-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Retention</p>
                <p className="text-2xl font-bold">{retentionScore}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Weak Patterns */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingDown className="w-5 h-5 text-destructive" />
              Areas Needing Improvement
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {weakPatterns.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">
                Great job! No weak areas detected.
              </p>
            ) : (
              weakPatterns.map((pattern) => (
                <WeakPatternCard key={pattern.pattern_id} pattern={pattern} />
              ))
            )}
          </CardContent>
        </Card>

        {/* Difficulty Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Difficulty Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <DifficultyChart stats={difficultyStats} />
          </CardContent>
        </Card>
      </div>

      {/* Retention Score Details */}
      <RetentionScore score={retentionScore} avgEaseFactor={avgEaseFactor} />
    </motion.div>
  );
}
