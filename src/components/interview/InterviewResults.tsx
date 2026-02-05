import { useState } from "react";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Trophy,
  Clock,
  Target,
  Lightbulb,
  CheckCircle2,
  XCircle,
  SkipForward,
  Flag,
  RotateCcw,
  Bot,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Link } from "react-router-dom";
import type { SessionConfig, QuestionResult } from "@/types/interview";

interface InterviewResultsProps {
  sessionId: string;
  config: SessionConfig;
  results: QuestionResult[];
  onNewSession: () => void;
}

export function InterviewResults({ sessionId, config, results, onNewSession }: InterviewResultsProps) {
  const [showAIFeedback, setShowAIFeedback] = useState(false);

  // Calculate stats
  const totalQuestions = results.length;
  const solvedCount = results.filter(r => r.is_solved).length;
  const skippedCount = results.filter(r => r.skipped).length;
  const totalTimeSpent = results.reduce((sum, r) => sum + r.time_spent, 0);
  const totalHints = results.reduce((sum, r) => sum + r.hints_used, 0);
  const avgTimePerQuestion = Math.round(totalTimeSpent / totalQuestions);
  const scorePercent = Math.round((solvedCount / totalQuestions) * 100);

  // Get AI feedback
  const { data: aiFeedback, isLoading: feedbackLoading, refetch: fetchFeedback } = useQuery({
    queryKey: ["interview-feedback", sessionId],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("interview-feedback", {
        body: {
          sessionData: {
            session_type: config.type,
            time_limit: config.timeLimit,
          },
          results: results.map(r => ({
            question_title: r.question_title,
            difficulty: r.difficulty,
            is_solved: r.is_solved,
            time_spent: r.time_spent,
            hints_used: r.hints_used,
            skipped: r.skipped,
          })),
        },
      });
      if (error) throw error;
      return data?.feedback as string;
    },
    enabled: showAIFeedback,
  });

  const handleGetFeedback = () => {
    setShowAIFeedback(true);
    if (!aiFeedback) {
      fetchFeedback();
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const difficultyConfig = {
    easy: "bg-emerald-500/20 text-emerald-500",
    medium: "bg-amber-500/20 text-amber-500",
    hard: "bg-red-500/20 text-red-500",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8"
    >
      {/* Header */}
      <div className="text-center">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", delay: 0.2 }}
          className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/20 mb-4"
        >
          <Trophy className="w-10 h-10 text-primary" />
        </motion.div>
        <h1 className="text-3xl font-bold mb-2">Interview Complete!</h1>
        <p className="text-muted-foreground">
          {config.type === "quick" ? "Quick Practice" :
           config.type === "full" ? "Full Interview" :
           config.type === "pattern" ? "Pattern Deep-Dive" : "Company Prep"} Session
        </p>
      </div>

      {/* Score Card */}
      <Card className="glass-card">
        <CardContent className="pt-6">
          <div className="text-center mb-6">
            <div className="text-6xl font-bold text-primary mb-2">{scorePercent}%</div>
            <p className="text-muted-foreground">
              {solvedCount} of {totalQuestions} questions solved
            </p>
          </div>
          <Progress value={scorePercent} className="h-3 mb-6" />
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 rounded-lg bg-muted/50">
              <Clock className="w-6 h-6 mx-auto mb-2 text-primary" />
              <div className="text-2xl font-bold">{formatTime(totalTimeSpent)}</div>
              <div className="text-xs text-muted-foreground">Total Time</div>
            </div>
            <div className="text-center p-4 rounded-lg bg-muted/50">
              <Target className="w-6 h-6 mx-auto mb-2 text-emerald-500" />
              <div className="text-2xl font-bold">{solvedCount}</div>
              <div className="text-xs text-muted-foreground">Solved</div>
            </div>
            <div className="text-center p-4 rounded-lg bg-muted/50">
              <SkipForward className="w-6 h-6 mx-auto mb-2 text-amber-500" />
              <div className="text-2xl font-bold">{skippedCount}</div>
              <div className="text-xs text-muted-foreground">Skipped</div>
            </div>
            <div className="text-center p-4 rounded-lg bg-muted/50">
              <Lightbulb className="w-6 h-6 mx-auto mb-2 text-violet-500" />
              <div className="text-2xl font-bold">{totalHints}</div>
              <div className="text-xs text-muted-foreground">Hints Used</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Question Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Question Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {results.map((result, idx) => (
              <motion.div
                key={result.question_id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="flex items-center gap-4 p-3 rounded-lg bg-muted/30"
              >
                <div className="flex-shrink-0">
                  {result.is_solved ? (
                    <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                  ) : result.skipped ? (
                    <SkipForward className="w-6 h-6 text-amber-500" />
                  ) : (
                    <XCircle className="w-6 h-6 text-destructive" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <Link 
                    to={`/question/${result.question_id}`}
                    className="font-medium hover:text-primary truncate block"
                  >
                    {result.question_title}
                  </Link>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="outline" className={difficultyConfig[result.difficulty as keyof typeof difficultyConfig]}>
                      {result.difficulty}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {formatTime(result.time_spent)}
                    </span>
                    {result.hints_used > 0 && (
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Lightbulb className="w-3 h-3" /> {result.hints_used}
                      </span>
                    )}
                    {result.flagged && (
                      <Flag className="w-3 h-3 text-warning" />
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* AI Feedback */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bot className="w-5 h-5 text-primary" />
            AI Performance Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!showAIFeedback ? (
            <div className="text-center py-6">
              <p className="text-muted-foreground mb-4">
                Get personalized feedback and recommendations from our AI coach
              </p>
              <Button onClick={handleGetFeedback} className="btn-primary-glow">
                <Bot className="w-4 h-4 mr-2" />
                Get AI Feedback
              </Button>
            </div>
          ) : feedbackLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-primary mr-2" />
              <span>Analyzing your performance...</span>
            </div>
          ) : (
            <div className="prose prose-sm dark:prose-invert max-w-none">
              <div 
                className="whitespace-pre-wrap"
                dangerouslySetInnerHTML={{ __html: aiFeedback?.replace(/\n/g, '<br/>') || '' }}
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <Button size="lg" onClick={onNewSession} className="btn-primary-glow">
          <RotateCcw className="w-4 h-4 mr-2" />
          Start New Session
        </Button>
        <Link to="/interview">
          <Button size="lg" variant="outline">
            Back to Interview
          </Button>
        </Link>
      </div>
    </motion.div>
  );
}
