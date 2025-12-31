import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  ChevronLeft,
  ChevronRight,
  Flag,
  SkipForward,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Lightbulb,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import type { SessionConfig, InterviewQuestion, QuestionResult } from "@/pages/InterviewSimulator";

interface InterviewSessionProps {
  sessionId: string;
  config: SessionConfig;
  questions: InterviewQuestion[];
  onEnd: (results: QuestionResult[]) => void;
}

interface QuestionState {
  time_spent: number;
  is_solved: boolean;
  hints_used: number;
  skipped: boolean;
  flagged: boolean;
}

export function InterviewSession({ sessionId, config, questions, onEnd }: InterviewSessionProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(config.timeLimit);
  const [questionStates, setQuestionStates] = useState<Record<string, QuestionState>>(() => {
    const initial: Record<string, QuestionState> = {};
    questions.forEach(q => {
      initial[q.id] = { time_spent: 0, is_solved: false, hints_used: 0, skipped: false, flagged: false };
    });
    return initial;
  });
  const [showEndDialog, setShowEndDialog] = useState(false);
  const [questionStartTime, setQuestionStartTime] = useState(Date.now());

  const currentQuestion = questions[currentIndex];
  const currentState = questionStates[currentQuestion?.id];

  // Timer
  useEffect(() => {
    const interval = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          handleForceEnd();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Track time spent on current question
  useEffect(() => {
    setQuestionStartTime(Date.now());
    
    return () => {
      const spent = Math.round((Date.now() - questionStartTime) / 1000);
      if (currentQuestion) {
        setQuestionStates(prev => ({
          ...prev,
          [currentQuestion.id]: {
            ...prev[currentQuestion.id],
            time_spent: prev[currentQuestion.id].time_spent + spent,
          },
        }));
      }
    };
  }, [currentIndex]);

  const saveCurrentQuestionTime = useCallback(() => {
    const spent = Math.round((Date.now() - questionStartTime) / 1000);
    setQuestionStates(prev => ({
      ...prev,
      [currentQuestion.id]: {
        ...prev[currentQuestion.id],
        time_spent: prev[currentQuestion.id].time_spent + spent,
      },
    }));
    setQuestionStartTime(Date.now());
  }, [currentQuestion?.id, questionStartTime]);

  const endSessionMutation = useMutation({
    mutationFn: async (finalStates: Record<string, QuestionState>) => {
      // Update session
      const totalScore = Object.values(finalStates).filter(s => s.is_solved).length * 100;
      
      await supabase
        .from("interview_sessions")
        .update({
          status: "completed",
          completed_at: new Date().toISOString(),
          total_score: totalScore,
        })
        .eq("id", sessionId);

      // Update individual results
      for (const [questionId, state] of Object.entries(finalStates)) {
        await supabase
          .from("interview_results")
          .update({
            time_spent: state.time_spent,
            is_solved: state.is_solved,
            hints_used: state.hints_used,
            skipped: state.skipped,
            flagged: state.flagged,
            submitted_at: new Date().toISOString(),
          })
          .eq("session_id", sessionId)
          .eq("question_id", questionId);
      }

      return finalStates;
    },
    onSuccess: (finalStates) => {
      const results: QuestionResult[] = questions.map(q => ({
        question_id: q.id,
        question_title: q.title,
        difficulty: q.difficulty,
        ...finalStates[q.id],
      }));
      onEnd(results);
    },
    onError: () => {
      toast.error("Failed to save results");
    },
  });

  const handleForceEnd = () => {
    saveCurrentQuestionTime();
    endSessionMutation.mutate(questionStates);
  };

  const handleEndSession = () => {
    setShowEndDialog(true);
  };

  const confirmEnd = () => {
    saveCurrentQuestionTime();
    endSessionMutation.mutate(questionStates);
  };

  const updateState = (update: Partial<QuestionState>) => {
    setQuestionStates(prev => ({
      ...prev,
      [currentQuestion.id]: { ...prev[currentQuestion.id], ...update },
    }));
  };

  const handleMarkSolved = () => {
    updateState({ is_solved: !currentState.is_solved });
    toast.success(currentState.is_solved ? "Unmarked as solved" : "Marked as solved!");
  };

  const handleSkip = () => {
    updateState({ skipped: true });
    if (currentIndex < questions.length - 1) {
      saveCurrentQuestionTime();
      setCurrentIndex(prev => prev + 1);
    }
  };

  const handleFlag = () => {
    updateState({ flagged: !currentState.flagged });
  };

  const handleUseHint = () => {
    updateState({ hints_used: currentState.hints_used + 1 });
    toast.info(`Hint ${currentState.hints_used + 1} used`);
  };

  const navigateTo = (index: number) => {
    saveCurrentQuestionTime();
    setCurrentIndex(index);
  };

  // Format time
  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const urgencyColor = timeRemaining < 60 ? "text-destructive" : timeRemaining < 300 ? "text-warning" : "text-foreground";

  const difficultyConfig = {
    easy: "bg-emerald-500/20 text-emerald-500 border-emerald-500/30",
    medium: "bg-amber-500/20 text-amber-500 border-amber-500/30",
    hard: "bg-red-500/20 text-red-500 border-red-500/30",
  };

  const solvedCount = Object.values(questionStates).filter(s => s.is_solved).length;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      {/* Timer Bar */}
      <Card className={`border-2 ${timeRemaining < 60 ? "border-destructive animate-pulse" : "border-border"}`}>
        <CardContent className="py-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Clock className={`w-5 h-5 ${urgencyColor}`} />
              <span className={`text-2xl font-mono font-bold ${urgencyColor}`}>
                {formatTime(timeRemaining)}
              </span>
              {timeRemaining < 60 && (
                <AlertTriangle className="w-5 h-5 text-destructive animate-bounce" />
              )}
            </div>
            <div className="text-sm text-muted-foreground">
              {solvedCount}/{questions.length} solved
            </div>
          </div>
          <Progress value={((config.timeLimit - timeRemaining) / config.timeLimit) * 100} />
        </CardContent>
      </Card>

      {/* Question Navigator */}
      <div className="flex flex-wrap gap-2 justify-center">
        {questions.map((q, idx) => {
          const state = questionStates[q.id];
          return (
            <Button
              key={q.id}
              variant={idx === currentIndex ? "default" : "outline"}
              size="sm"
              className={`w-10 h-10 p-0 relative ${
                state.is_solved ? "bg-emerald-500 hover:bg-emerald-600 border-emerald-500" :
                state.skipped ? "bg-muted" : ""
              }`}
              onClick={() => navigateTo(idx)}
            >
              {idx + 1}
              {state.flagged && (
                <Flag className="w-3 h-3 absolute -top-1 -right-1 text-warning fill-warning" />
              )}
            </Button>
          );
        })}
      </div>

      {/* Current Question */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentQuestion.id}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
        >
          <Card className="glass-card">
            <CardHeader>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="outline" className="text-primary border-primary/30">
                      Q{currentIndex + 1}/{questions.length}
                    </Badge>
                    <Badge variant="outline" className={difficultyConfig[currentQuestion.difficulty]}>
                      {currentQuestion.difficulty}
                    </Badge>
                    {currentQuestion.pattern_name && (
                      <Badge variant="secondary">{currentQuestion.pattern_name}</Badge>
                    )}
                  </div>
                  <CardTitle className="text-xl">{currentQuestion.title}</CardTitle>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant={currentState.flagged ? "default" : "outline"}
                    size="icon"
                    onClick={handleFlag}
                    className={currentState.flagged ? "bg-warning hover:bg-warning/80" : ""}
                  >
                    <Flag className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Action Buttons */}
              <div className="flex flex-wrap gap-3">
                <Button
                  variant={currentState.is_solved ? "default" : "outline"}
                  onClick={handleMarkSolved}
                  className={currentState.is_solved ? "bg-emerald-500 hover:bg-emerald-600" : ""}
                >
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  {currentState.is_solved ? "Solved" : "Mark as Solved"}
                </Button>
                <Button variant="outline" onClick={handleUseHint}>
                  <Lightbulb className="w-4 h-4 mr-2" />
                  Use Hint ({currentState.hints_used})
                </Button>
                <Button variant="outline" onClick={handleSkip}>
                  <SkipForward className="w-4 h-4 mr-2" />
                  Skip
                </Button>
                <a 
                  href={`/question/${currentQuestion.id}`} 
                  target="_blank" 
                  rel="noopener noreferrer"
                >
                  <Button variant="outline">
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Open Question
                  </Button>
                </a>
              </div>

              {/* Time spent */}
              <div className="text-sm text-muted-foreground">
                Time on this question: {formatTime(currentState.time_spent + Math.round((Date.now() - questionStartTime) / 1000))}
              </div>

              {/* Navigation */}
              <div className="flex justify-between items-center pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={() => navigateTo(currentIndex - 1)}
                  disabled={currentIndex === 0}
                >
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  Previous
                </Button>
                
                {currentIndex === questions.length - 1 ? (
                  <Button 
                    className="btn-primary-glow" 
                    onClick={handleEndSession}
                  >
                    Finish Interview
                  </Button>
                ) : (
                  <Button
                    onClick={() => navigateTo(currentIndex + 1)}
                  >
                    Next
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </AnimatePresence>

      {/* End Session Button */}
      <div className="text-center">
        <Button variant="destructive" onClick={handleEndSession}>
          End Interview Early
        </Button>
      </div>

      {/* Confirmation Dialog */}
      <AlertDialog open={showEndDialog} onOpenChange={setShowEndDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>End Interview?</AlertDialogTitle>
            <AlertDialogDescription>
              You've solved {solvedCount} out of {questions.length} questions. 
              Are you sure you want to end the interview?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Continue</AlertDialogCancel>
            <AlertDialogAction onClick={confirmEnd}>
              End & View Results
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </motion.div>
  );
}
