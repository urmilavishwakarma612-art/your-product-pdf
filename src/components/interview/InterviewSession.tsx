import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  ChevronLeft,
  ChevronRight,
  Flag,
  SkipForward,
  Clock,
  AlertTriangle,
  Lightbulb,
  Send,
  Loader2,
  Code,
  Play,
  Shield,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "@/components/ui/resizable";
import { toast } from "sonner";
import { CodeEditor, LANGUAGE_CONFIG } from "./CodeEditor";
import { ProblemPanel } from "./ProblemPanel";
import { SubmissionResult, EvaluationResult } from "./SubmissionResult";
import { TestCaseResults, TestCaseResult } from "./TestCaseResults";
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
  code: string;
  language: string;
  first_keystroke_at: Date | null;
  code_snapshots: Array<{ time: number; code: string }>;
  evaluation_result: EvaluationResult | null;
  run_count: number;
  paste_detected: boolean;
  test_results: TestCaseResult[] | null;
  question_load_time: number;
}

export function InterviewSession({ sessionId, config, questions, onEnd }: InterviewSessionProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(config.timeLimit);
  const [questionStates, setQuestionStates] = useState<Record<string, QuestionState>>(() => {
    const initial: Record<string, QuestionState> = {};
    questions.forEach(q => {
      initial[q.id] = { 
        time_spent: 0, 
        is_solved: false, 
        hints_used: 0, 
        skipped: false, 
        flagged: false,
        code: LANGUAGE_CONFIG.python.template,
        language: "python",
        first_keystroke_at: null,
        code_snapshots: [],
        evaluation_result: null,
        run_count: 0,
        paste_detected: false,
        test_results: null,
        question_load_time: Date.now(),
      };
    });
    return initial;
  });
  const [showEndDialog, setShowEndDialog] = useState(false);
  const [showSkipDialog, setShowSkipDialog] = useState(false);
  const [showHintDialog, setShowHintDialog] = useState(false);
  const [currentHintIndex, setCurrentHintIndex] = useState(0);
  const [questionStartTime, setQuestionStartTime] = useState(Date.now());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [showSubmissionResult, setShowSubmissionResult] = useState(false);
  const [showTestResults, setShowTestResults] = useState(false);
  const snapshotIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const isInterviewMode = config.mode !== "practice";
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
    setShowSubmissionResult(false);
    setShowTestResults(false);
    
    // Update question load time for new question
    setQuestionStates(prev => ({
      ...prev,
      [currentQuestion.id]: {
        ...prev[currentQuestion.id],
        question_load_time: Date.now(),
      },
    }));
    
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

  // Code snapshots every 2 minutes
  useEffect(() => {
    if (snapshotIntervalRef.current) {
      clearInterval(snapshotIntervalRef.current);
    }

    snapshotIntervalRef.current = setInterval(() => {
      if (currentQuestion && currentState?.code) {
        const snapshot = {
          time: Date.now(),
          code: currentState.code,
        };
        setQuestionStates(prev => ({
          ...prev,
          [currentQuestion.id]: {
            ...prev[currentQuestion.id],
            code_snapshots: [...prev[currentQuestion.id].code_snapshots.slice(-5), snapshot],
          },
        }));
      }
    }, 120000); // 2 minutes

    return () => {
      if (snapshotIntervalRef.current) {
        clearInterval(snapshotIntervalRef.current);
      }
    };
  }, [currentQuestion?.id, currentState?.code]);

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
      const totalScore = Object.values(finalStates).filter(s => s.is_solved).length * 100;
      
      await supabase
        .from("interview_sessions")
        .update({
          status: "completed",
          completed_at: new Date().toISOString(),
          total_score: totalScore,
        })
        .eq("id", sessionId);

      for (const [questionId, state] of Object.entries(finalStates)) {
        await supabase
          .from("interview_results")
          .update({
            time_spent: state.time_spent,
            is_solved: state.is_solved,
            hints_used: state.hints_used,
            skipped: state.skipped,
            flagged: state.flagged,
            submitted_code: state.code,
            selected_language: state.language,
            first_keystroke_at: state.first_keystroke_at?.toISOString() || null,
            code_snapshots: JSON.parse(JSON.stringify(state.code_snapshots)),
            evaluation_result: state.evaluation_result ? JSON.parse(JSON.stringify(state.evaluation_result)) : null,
            submitted_at: new Date().toISOString(),
            run_count: state.run_count,
            paste_detected: state.paste_detected,
            run_before_submit: state.run_count > 0,
            code_quality_score: state.evaluation_result?.code_quality_score || 0,
            interview_performance_score: state.evaluation_result?.interview_performance_score || 0,
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
        time_spent: finalStates[q.id].time_spent,
        is_solved: finalStates[q.id].is_solved,
        hints_used: finalStates[q.id].hints_used,
        skipped: finalStates[q.id].skipped,
        flagged: finalStates[q.id].flagged,
        submitted_code: finalStates[q.id].code,
        evaluation_result: finalStates[q.id].evaluation_result,
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

  // Run code for testing
  const handleRunCode = async () => {
    if (!currentState.code || currentState.code.trim().length < 20) {
      toast.error("Please write more code before running tests");
      return;
    }

    setIsRunning(true);

    try {
      const { data, error } = await supabase.functions.invoke("run-test-cases", {
        body: {
          code: currentState.code,
          language: currentState.language,
          questionTitle: currentQuestion.title,
          difficulty: currentQuestion.difficulty,
        },
      });

      if (error) throw error;

      updateState({
        run_count: currentState.run_count + 1,
        test_results: data.results,
      });

      setShowTestResults(true);
      setShowSubmissionResult(false);

      const passed = data.passed || 0;
      const total = data.total || 0;
      
      if (passed === total && total > 0) {
        toast.success(`All ${total} test cases passed! Ready to submit.`);
      } else {
        toast.info(`${passed}/${total} test cases passed. Review the results.`);
      }
    } catch (err) {
      console.error("Run error:", err);
      toast.error("Failed to run tests. Try again.");
    } finally {
      setIsRunning(false);
    }
  };

  // Submit code for evaluation
  const handleSubmitCode = async () => {
    if (!currentState.code || currentState.code.trim().length < 20) {
      toast.error("Please write more code before submitting");
      return;
    }

    // Check if ran at least once in interview mode
    if (isInterviewMode && currentState.run_count === 0) {
      toast.warning("Run your code at least once before submitting!", {
        description: "Interviewers expect you to test your code.",
      });
    }

    setIsSubmitting(true);
    saveCurrentQuestionTime();

    try {
      // Calculate thinking time: from question load to first keystroke
      const thinkingTime = currentState.first_keystroke_at 
        ? Math.round((currentState.first_keystroke_at.getTime() - currentState.question_load_time) / 1000)
        : 0;
      // Coding time: from first keystroke to now
      const codingTime = currentState.first_keystroke_at
        ? Math.round((Date.now() - currentState.first_keystroke_at.getTime()) / 1000)
        : currentState.time_spent;

      const { data, error } = await supabase.functions.invoke("evaluate-code", {
        body: {
          code: currentState.code,
          language: currentState.language,
          questionTitle: currentQuestion.title,
          difficulty: currentQuestion.difficulty,
          patternName: currentQuestion.pattern_name,
          thinkingTime,
          codingTime,
          runCount: currentState.run_count,
          pasteDetected: currentState.paste_detected,
          hintsUsed: currentState.hints_used,
          expectedTime: Math.floor(config.timeLimit / questions.length),
        },
      });

      if (error) throw error;

      const evaluation = data.evaluation as EvaluationResult;
      
      updateState({
        is_solved: evaluation.is_correct,
        evaluation_result: evaluation,
      });

      setShowSubmissionResult(true);
      setShowTestResults(false);
      
      if (evaluation.is_correct && (evaluation.interview_performance_score || 0) >= 70) {
        toast.success("Great Job! Interview Ready!");
      } else if (evaluation.is_correct) {
        toast.success("Code Correct! But review interview signals.");
      } else {
        toast.info("Submission recorded. Review the feedback.");
      }
    } catch (err) {
      console.error("Submission error:", err);
      toast.error("Failed to evaluate code. Try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSkip = () => {
    setShowSkipDialog(true);
  };

  const confirmSkip = () => {
    updateState({ skipped: true });
    setShowSkipDialog(false);
    if (currentIndex < questions.length - 1) {
      saveCurrentQuestionTime();
      setCurrentIndex(prev => prev + 1);
    }
    toast.warning("Question skipped");
  };

  const handleFlag = () => {
    updateState({ flagged: !currentState.flagged });
  };

  const handleUseHint = () => {
    setShowHintDialog(true);
    setCurrentHintIndex(currentState.hints_used);
  };

  const confirmHint = () => {
    updateState({ hints_used: currentState.hints_used + 1 });
    setShowHintDialog(false);
    toast.info(`Hint ${currentState.hints_used + 1} used (-5 XP penalty)`);
  };

  const handleCodeChange = (code: string) => {
    updateState({ code });
  };

  const handleLanguageChange = (language: string) => {
    updateState({ language, code: LANGUAGE_CONFIG[language]?.template || "" });
  };

  const handleFirstKeystroke = () => {
    if (!currentState.first_keystroke_at) {
      updateState({ first_keystroke_at: new Date() });
    }
  };

  const handlePasteAttempt = () => {
    if (isInterviewMode) {
      updateState({ paste_detected: true });
    }
  };

  const navigateTo = (index: number) => {
    saveCurrentQuestionTime();
    setCurrentIndex(index);
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const urgencyColor = timeRemaining < 60 ? "text-destructive" : timeRemaining < 300 ? "text-amber-500" : "text-foreground";
  const timePercent = (timeRemaining / config.timeLimit) * 100;

  const solvedCount = Object.values(questionStates).filter(s => s.is_solved).length;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-4 h-[calc(100vh-120px)]"
    >
      {/* Timer Bar */}
      <Card className={`border-2 ${timeRemaining < 60 ? "border-destructive animate-pulse" : timeRemaining < 300 ? "border-amber-500" : "border-border"}`}>
        <CardContent className="py-3">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <Clock className={`w-5 h-5 ${urgencyColor}`} />
              <span className={`text-2xl font-mono font-bold ${urgencyColor}`}>
                {formatTime(timeRemaining)}
              </span>
              {timeRemaining < 60 && (
                <AlertTriangle className="w-5 h-5 text-destructive animate-bounce" />
              )}
              {timeRemaining < 300 && timeRemaining >= 60 && (
                <Badge variant="outline" className="text-amber-500 border-amber-500">
                  5 min warning!
                </Badge>
              )}
              {isInterviewMode && (
                <Badge variant="outline" className="text-primary border-primary/30">
                  <Shield className="w-3 h-3 mr-1" />
                  Interview
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-4">
              <div className="text-sm text-muted-foreground">
                {solvedCount}/{questions.length} solved
              </div>
              <div className="text-sm text-muted-foreground">
                Runs: {currentState.run_count} | Q{currentIndex + 1}
              </div>
            </div>
          </div>
          <Progress value={timePercent} className={timeRemaining < 60 ? "bg-destructive/20" : ""} />
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
              className={`w-10 h-10 p-0 relative transition-all ${
                state.is_solved ? "bg-emerald-500 hover:bg-emerald-600 border-emerald-500 text-white" :
                state.skipped ? "bg-muted text-muted-foreground" : ""
              }`}
              onClick={() => navigateTo(idx)}
            >
              {idx + 1}
              {state.flagged && (
                <Flag className="w-3 h-3 absolute -top-1 -right-1 text-amber-500 fill-amber-500" />
              )}
              {state.paste_detected && (
                <div className="w-2 h-2 absolute -bottom-1 -right-1 bg-destructive rounded-full" />
              )}
            </Button>
          );
        })}
      </div>

      {/* Main Content: Split Pane */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentQuestion.id}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="flex-1 h-[calc(100%-180px)]"
        >
          <Card className="h-full overflow-hidden">
            <ResizablePanelGroup direction="horizontal" className="h-full">
              {/* Problem Panel */}
              <ResizablePanel defaultSize={40} minSize={30}>
                <ProblemPanel 
                  question={currentQuestion}
                  questionNumber={currentIndex + 1}
                  totalQuestions={questions.length}
                />
              </ResizablePanel>

              <ResizableHandle withHandle />

              {/* Code Editor Panel */}
              <ResizablePanel defaultSize={60} minSize={40}>
                <div className="flex flex-col h-full">
                  {showSubmissionResult && currentState.evaluation_result ? (
                    <div className="flex-1 overflow-auto p-4">
                      <SubmissionResult 
                        result={currentState.evaluation_result}
                        questionTitle={currentQuestion.title}
                      />
                      <div className="mt-4 flex justify-center gap-3">
                        <Button variant="outline" onClick={() => setShowSubmissionResult(false)}>
                          <Code className="w-4 h-4 mr-2" />
                          Edit Code
                        </Button>
                        {currentIndex < questions.length - 1 && (
                          <Button onClick={() => navigateTo(currentIndex + 1)}>
                            Next Question
                            <ChevronRight className="w-4 h-4 ml-2" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ) : showTestResults && currentState.test_results ? (
                    <div className="flex-1 overflow-auto p-4">
                      <TestCaseResults
                        results={currentState.test_results}
                        passed={currentState.test_results.filter(r => r.passed).length}
                        total={currentState.test_results.length}
                      />
                      <div className="mt-4 flex justify-center gap-3">
                        <Button variant="outline" onClick={() => setShowTestResults(false)}>
                          <Code className="w-4 h-4 mr-2" />
                          Back to Code
                        </Button>
                        <Button 
                          onClick={handleSubmitCode}
                          disabled={isSubmitting}
                          className="btn-primary-glow"
                        >
                          {isSubmitting ? (
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          ) : (
                            <Send className="w-4 h-4 mr-2" />
                          )}
                          Submit
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <CodeEditor
                      questionId={currentQuestion.id}
                      language={currentState.language}
                      onLanguageChange={handleLanguageChange}
                      code={currentState.code}
                      onCodeChange={handleCodeChange}
                      onFirstKeystroke={handleFirstKeystroke}
                      hasStartedTyping={!!currentState.first_keystroke_at}
                      disabled={isSubmitting || isRunning}
                      isInterviewMode={isInterviewMode}
                      onPasteAttempt={handlePasteAttempt}
                    />
                  )}

                  {/* Action Bar */}
                  {!showSubmissionResult && !showTestResults && (
                    <div className="flex items-center justify-between p-3 border-t bg-muted/30">
                      <div className="flex items-center gap-2">
                        <Button
                          variant={currentState.flagged ? "default" : "outline"}
                          size="sm"
                          onClick={handleFlag}
                          className={currentState.flagged ? "bg-amber-500 hover:bg-amber-600" : ""}
                        >
                          <Flag className="w-4 h-4 mr-1" />
                          Flag
                        </Button>
                        <Button variant="outline" size="sm" onClick={handleUseHint}>
                          <Lightbulb className="w-4 h-4 mr-1" />
                          Hint ({currentState.hints_used})
                        </Button>
                        <Button variant="outline" size="sm" onClick={handleSkip}>
                          <SkipForward className="w-4 h-4 mr-1" />
                          Skip
                        </Button>
                      </div>

                      <div className="flex items-center gap-2">
                        {/* Run Button */}
                        <Button
                          variant="outline"
                          onClick={handleRunCode}
                          disabled={isRunning || isSubmitting}
                          className="border-emerald-500/50 text-emerald-500 hover:bg-emerald-500/10"
                        >
                          {isRunning ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Running...
                            </>
                          ) : (
                            <>
                              <Play className="w-4 h-4 mr-2" />
                              Run Code
                            </>
                          )}
                        </Button>

                        {/* Submit Button */}
                        <Button
                          onClick={handleSubmitCode}
                          disabled={isSubmitting || currentState.is_solved}
                          className={currentState.is_solved ? "bg-emerald-500" : "btn-primary-glow"}
                        >
                          {isSubmitting ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Evaluating...
                            </>
                          ) : currentState.is_solved ? (
                            "✓ Solved"
                          ) : (
                            <>
                              <Send className="w-4 h-4 mr-2" />
                              Submit
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </ResizablePanel>
            </ResizablePanelGroup>
          </Card>
        </motion.div>
      </AnimatePresence>

      {/* Navigation */}
      <div className="flex justify-between items-center">
        <Button
          variant="outline"
          onClick={() => navigateTo(currentIndex - 1)}
          disabled={currentIndex === 0}
        >
          <ChevronLeft className="w-4 h-4 mr-1" />
          Previous
        </Button>
        
        <Button variant="destructive" onClick={handleEndSession}>
          End Interview
        </Button>

        {currentIndex === questions.length - 1 ? (
          <Button 
            className="btn-primary-glow" 
            onClick={handleEndSession}
          >
            Finish Interview
          </Button>
        ) : (
          <Button onClick={() => navigateTo(currentIndex + 1)}>
            Next
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        )}
      </div>

      {/* End Confirmation Dialog */}
      <AlertDialog open={showEndDialog} onOpenChange={setShowEndDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>End Interview?</AlertDialogTitle>
            <AlertDialogDescription>
              You've solved {solvedCount} out of {questions.length} questions. 
              {questions.length - solvedCount - Object.values(questionStates).filter(s => s.skipped).length > 0 && (
                <span className="block mt-2 text-amber-500">
                  Warning: {questions.length - solvedCount - Object.values(questionStates).filter(s => s.skipped).length} question(s) not attempted!
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Continue Interview</AlertDialogCancel>
            <AlertDialogAction onClick={confirmEnd}>
              End & View Results
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Skip Confirmation Dialog */}
      <AlertDialog open={showSkipDialog} onOpenChange={setShowSkipDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Skip Question?</AlertDialogTitle>
            <AlertDialogDescription>
              Skipping this question will mark it as incomplete. You can return to it later, but this affects your score.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep Trying</AlertDialogCancel>
            <AlertDialogAction onClick={confirmSkip} className="bg-amber-500 hover:bg-amber-600">
              Skip Question
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Hint Dialog */}
      <AlertDialog open={showHintDialog} onOpenChange={setShowHintDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Use Hint?</AlertDialogTitle>
            <AlertDialogDescription>
              Using a hint will cost 5 XP. You've used {currentState?.hints_used || 0} hint(s) on this question.
              <span className="block mt-2 text-muted-foreground text-sm">
                Hints will be shown after you confirm.
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmHint}>
              <Lightbulb className="w-4 h-4 mr-2" />
              Use Hint (-5 XP)
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </motion.div>
  );
}