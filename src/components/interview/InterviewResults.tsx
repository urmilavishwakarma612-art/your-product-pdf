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
  TrendingUp,
  AlertTriangle,
  BookOpen,
  Calendar,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Link } from "react-router-dom";
import { ScrollArea } from "@/components/ui/scroll-area";
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

  // Time analysis
  const avgTimeEasy = results.filter(r => r.difficulty === 'easy');
  const avgTimeMedium = results.filter(r => r.difficulty === 'medium');
  const avgTimeHard = results.filter(r => r.difficulty === 'hard');

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
            submitted_code: r.submitted_code,
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

  // Parse AI feedback into sections for better rendering
  const renderFeedback = (feedback: string) => {
    const sections = feedback.split(/### /g).filter(Boolean);
    
    const getSectionIcon = (title: string) => {
      if (title.includes('PERFORMANCE') || title.includes('VERDICT')) return <Trophy className="w-5 h-5 text-primary" />;
      if (title.includes('TIME')) return <Clock className="w-5 h-5 text-blue-500" />;
      if (title.includes('PROBLEM') || title.includes('PATTERN')) return <Target className="w-5 h-5 text-purple-500" />;
      if (title.includes('TECHNICAL') || title.includes('GAP')) return <AlertTriangle className="w-5 h-5 text-amber-500" />;
      if (title.includes('IMPROVEMENT') || title.includes('ROADMAP')) return <TrendingUp className="w-5 h-5 text-emerald-500" />;
      if (title.includes('NEXT') || title.includes('RECOMMENDATION')) return <Sparkles className="w-5 h-5 text-pink-500" />;
      return <BookOpen className="w-5 h-5 text-muted-foreground" />;
    };

    const getSectionColor = (title: string) => {
      if (title.includes('PERFORMANCE') || title.includes('VERDICT')) return 'border-primary/30 bg-primary/5';
      if (title.includes('TIME')) return 'border-blue-500/30 bg-blue-500/5';
      if (title.includes('PROBLEM') || title.includes('PATTERN')) return 'border-purple-500/30 bg-purple-500/5';
      if (title.includes('TECHNICAL') || title.includes('GAP')) return 'border-amber-500/30 bg-amber-500/5';
      if (title.includes('IMPROVEMENT') || title.includes('ROADMAP')) return 'border-emerald-500/30 bg-emerald-500/5';
      if (title.includes('NEXT') || title.includes('RECOMMENDATION')) return 'border-pink-500/30 bg-pink-500/5';
      return 'border-border bg-muted/30';
    };

    return (
      <div className="space-y-4">
        {sections.map((section, idx) => {
          const lines = section.split('\n');
          const title = lines[0]?.trim() || '';
          const content = lines.slice(1).join('\n').trim();
          
          return (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className={`rounded-xl border p-4 ${getSectionColor(title)}`}
            >
              <div className="flex items-center gap-2 mb-3">
                {getSectionIcon(title)}
                <h4 className="font-semibold text-sm">{title.replace(/[📊⏱️💡🔧📈🎯]/g, '').trim()}</h4>
              </div>
              <div className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                {content.split('\n').map((line, lineIdx) => {
                  // Style bullet points
                  if (line.trim().startsWith('-')) {
                    return (
                      <div key={lineIdx} className="flex gap-2 mb-1">
                        <span className="text-primary">•</span>
                        <span>{line.replace(/^-\s*/, '')}</span>
                      </div>
                    );
                  }
                  // Style day plans
                  if (line.trim().match(/^Day \d/i)) {
                    return (
                      <div key={lineIdx} className="flex items-center gap-2 mb-1 font-medium text-foreground">
                        <Calendar className="w-3 h-3" />
                        <span>{line}</span>
                      </div>
                    );
                  }
                  return <p key={lineIdx} className="mb-1">{line}</p>;
                })}
              </div>
            </motion.div>
          );
        })}
      </div>
    );
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
            Senior Mentor Analysis
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Detailed performance review with actionable improvement roadmap
          </p>
        </CardHeader>
        <CardContent>
          {!showAIFeedback ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Bot className="w-8 h-8 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">Get Expert Feedback</h3>
              <p className="text-muted-foreground mb-4">
                Our AI mentor will analyze your time management, problem-solving patterns, and provide a personalized improvement roadmap
              </p>
              <Button onClick={handleGetFeedback} className="btn-primary-glow">
                <Sparkles className="w-4 h-4 mr-2" />
                Generate Mentor Report
              </Button>
            </div>
          ) : feedbackLoading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="relative">
                <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center">
                  <Bot className="w-8 h-8 text-primary" />
                </div>
                <div className="absolute inset-0 rounded-full border-2 border-primary border-t-transparent animate-spin" />
              </div>
              <p className="mt-4 font-medium">Analyzing Your Performance...</p>
              <p className="text-sm text-muted-foreground mt-1">
                Reviewing time patterns, problem-solving approach, and code quality
              </p>
            </div>
          ) : (
            <ScrollArea className="max-h-[600px] pr-4">
              {aiFeedback && renderFeedback(aiFeedback)}
            </ScrollArea>
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
