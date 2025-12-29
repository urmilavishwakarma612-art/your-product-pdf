import { useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import { 
  ArrowLeft, 
  ExternalLink, 
  Youtube, 
  BookOpen,
  Lightbulb,
  Target,
  Code,
  CheckCircle2,
  Loader2,
  Sparkles,
  Lock,
  Crown
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useSubscription } from "@/hooks/useSubscription";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

interface Question {
  id: string;
  title: string;
  description: string | null;
  difficulty: "easy" | "medium" | "hard";
  leetcode_link: string | null;
  youtube_link: string | null;
  article_link: string | null;
  hints: string[];
  approach: string | null;
  brute_force: string | null;
  optimal_solution: string | null;
  xp_reward: number;
  pattern_id: string;
}

interface Pattern {
  id: string;
  name: string;
  is_free: boolean;
  phase: number;
}

interface UserProgress {
  id: string;
  is_solved: boolean;
  hints_used: number;
  approach_viewed: boolean;
  brute_force_viewed: boolean;
  solution_viewed: boolean;
  notes: string | null;
  xp_earned: number;
}

const Question = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { canAccessPattern } = useSubscription();
  const { toast } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [notes, setNotes] = useState("");
  const [hintsRevealed, setHintsRevealed] = useState(0);

  const { data: question, isLoading } = useQuery({
    queryKey: ["question", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("questions")
        .select("*")
        .eq("id", id)
        .single();
      
      if (error) throw error;
      return data as Question;
    },
    enabled: !!id,
  });

  const { data: pattern } = useQuery({
    queryKey: ["pattern", question?.pattern_id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("patterns")
        .select("id, name, is_free, phase")
        .eq("id", question?.pattern_id)
        .single();
      
      if (error) throw error;
      return data as Pattern;
    },
    enabled: !!question?.pattern_id,
  });

  // Check if user can access this question's pattern
  const isLocked = pattern ? !canAccessPattern(pattern) : false;

  const { data: progress, refetch: refetchProgress } = useQuery({
    queryKey: ["question-progress", id, user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from("user_progress")
        .select("*")
        .eq("question_id", id)
        .eq("user_id", user.id)
        .maybeSingle();
      
      if (error) throw error;
      if (data) setNotes(data.notes || "");
      return data as UserProgress | null;
    },
    enabled: !!user && !!id,
  });

  const updateProgressMutation = useMutation({
    mutationFn: async (updates: Partial<UserProgress>) => {
      if (!user || !id) throw new Error("Not authenticated");
      
      if (progress) {
        const { error } = await supabase
          .from("user_progress")
          .update(updates)
          .eq("id", progress.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("user_progress")
          .insert({
            user_id: user.id,
            question_id: id,
            ...updates,
          });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      refetchProgress();
      queryClient.invalidateQueries({ queryKey: ["user-progress"] });
    },
  });

  const markSolvedMutation = useMutation({
    mutationFn: async () => {
      if (!user || !id || !question) throw new Error("Not authenticated");
      
      // Calculate XP based on hints/solutions used
      let xpMultiplier = 1;
      if (progress?.solution_viewed) xpMultiplier = 0.25;
      else if (progress?.brute_force_viewed) xpMultiplier = 0.5;
      else if (progress?.approach_viewed) xpMultiplier = 0.75;
      else if (hintsRevealed > 0) xpMultiplier = 0.9;
      
      const xpEarned = Math.round(question.xp_reward * xpMultiplier);
      
      // Schedule first review for tomorrow (spaced repetition)
      const nextReviewAt = new Date();
      nextReviewAt.setDate(nextReviewAt.getDate() + 1);

      const progressData = {
        is_solved: true,
        solved_at: new Date().toISOString(),
        xp_earned: xpEarned,
        notes: notes,
        hints_used: hintsRevealed,
        next_review_at: nextReviewAt.toISOString(),
        review_count: 0,
        ease_factor: 2.5,
        interval_days: 1,
      };

      if (progress) {
        await supabase
          .from("user_progress")
          .update(progressData)
          .eq("id", progress.id);
      } else {
        await supabase
          .from("user_progress")
          .insert({
            user_id: user.id,
            question_id: id,
            ...progressData,
          });
      }

      // Update user's total XP
      const { data: profile } = await supabase
        .from("profiles")
        .select("total_xp, current_streak, last_solved_at")
        .eq("id", user.id)
        .single();

      if (profile) {
        const now = new Date();
        const lastSolved = profile.last_solved_at ? new Date(profile.last_solved_at) : null;
        const daysSinceLastSolved = lastSolved 
          ? Math.floor((now.getTime() - lastSolved.getTime()) / (1000 * 60 * 60 * 24))
          : null;

        let newStreak = profile.current_streak;
        if (daysSinceLastSolved === null || daysSinceLastSolved > 1) {
          newStreak = 1;
        } else if (daysSinceLastSolved === 1) {
          newStreak += 1;
        }

        await supabase
          .from("profiles")
          .update({
            total_xp: profile.total_xp + xpEarned,
            current_streak: newStreak,
            last_solved_at: now.toISOString(),
          })
          .eq("id", user.id);
      }

      return xpEarned;
    },
    onSuccess: (xpEarned) => {
      toast({
        title: "Question Solved! 🎉",
        description: `You earned ${xpEarned} XP! Review scheduled for tomorrow.`,
      });
      refetchProgress();
      queryClient.invalidateQueries({ queryKey: ["user-progress"] });
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      queryClient.invalidateQueries({ queryKey: ["review-questions"] });
      queryClient.invalidateQueries({ queryKey: ["upcoming-reviews"] });
      queryClient.invalidateQueries({ queryKey: ["total-scheduled"] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const revealHint = () => {
    const hints = question?.hints || [];
    if (hintsRevealed < hints.length) {
      setHintsRevealed(prev => prev + 1);
      updateProgressMutation.mutate({ hints_used: hintsRevealed + 1 });
    }
  };

  const difficultyConfig = {
    easy: { color: "bg-success/20 text-success border-success/30", label: "Easy" },
    medium: { color: "bg-warning/20 text-warning border-warning/30", label: "Medium" },
    hard: { color: "bg-destructive/20 text-destructive border-destructive/30", label: "Hard" },
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!question) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">Question not found</p>
          <Link to="/patterns">
            <Button>Back to Patterns</Button>
          </Link>
        </div>
      </div>
    );
  }

  // Show locked state if pattern is premium and user doesn't have access
  if (isLocked) {
    return (
      <div className="min-h-screen bg-background bg-grid">
        <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-8 max-w-4xl">
          <Link to="/patterns" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6">
            <ArrowLeft className="w-4 h-4" /> Back to Patterns
          </Link>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card p-8 sm:p-12 text-center"
          >
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/20 mb-6">
              <Lock className="w-10 h-10 text-primary" />
            </div>
            
            <h1 className="text-2xl sm:text-3xl font-bold mb-3">{question.title}</h1>
            
            <div className="flex items-center justify-center gap-2 mb-6">
              {pattern && (
                <Badge variant="outline" className="text-primary border-primary/30">
                  {pattern.name}
                </Badge>
              )}
              <span className="pro-badge">
                <Crown className="w-3 h-3" />
                Pro Content
              </span>
            </div>
            
            <p className="text-muted-foreground mb-8 max-w-md mx-auto">
              This question is part of our advanced curriculum. Upgrade to Pro to unlock all 100+ premium problems and master advanced patterns.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link to="/#pricing">
                <Button size="lg" className="btn-primary-glow">
                  <Sparkles className="w-4 h-4 mr-2" />
                  Upgrade to Pro
                </Button>
              </Link>
              <Link to="/patterns">
                <Button variant="outline" size="lg">
                  Continue with Free Content
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  const hints = Array.isArray(question.hints) ? question.hints : [];

  return (
    <div className="min-h-screen bg-background bg-grid">
      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-8 max-w-4xl">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <Link to="/patterns" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-3 sm:mb-4">
            <ArrowLeft className="w-4 h-4" /> Back to Patterns
          </Link>
          
          <div className="space-y-3 sm:space-y-0 sm:flex sm:items-start sm:justify-between sm:flex-wrap sm:gap-4">
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-2">
                {pattern && (
                  <Badge variant="outline" className="text-primary border-primary/30 text-xs">
                    {pattern.name}
                  </Badge>
                )}
                <Badge variant="outline" className={`${difficultyConfig[question.difficulty].color} text-xs`}>
                  {difficultyConfig[question.difficulty].label}
                </Badge>
                {progress?.is_solved && (
                  <Badge className="bg-success text-success-foreground text-xs">
                    <CheckCircle2 className="w-3 h-3 mr-1" /> Solved
                  </Badge>
                )}
              </div>
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold mb-2">{question.title}</h1>
              <p className="text-sm text-muted-foreground">
                Reward: <span className="xp-badge">+{question.xp_reward} XP</span>
              </p>
            </div>
            
            <div className="flex flex-wrap gap-2">
              {question.youtube_link && (
                <a href={question.youtube_link} target="_blank" rel="noopener noreferrer">
                  <Button variant="outline" size="sm" className="text-xs sm:text-sm">
                    <Youtube className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2 text-destructive" /> Video
                  </Button>
                </a>
              )}
              {question.article_link && (
                <a href={question.article_link} target="_blank" rel="noopener noreferrer">
                  <Button variant="outline" size="sm" className="text-xs sm:text-sm">
                    <BookOpen className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2 text-primary" /> Article
                  </Button>
                </a>
              )}
              {question.leetcode_link && (
                <a href={question.leetcode_link} target="_blank" rel="noopener noreferrer">
                  <Button variant="default" size="sm" className="btn-primary-glow text-xs sm:text-sm">
                    <ExternalLink className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" /> LeetCode
                  </Button>
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Description */}
        {question.description && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card p-4 sm:p-6 mb-4 sm:mb-6"
          >
            <h2 className="text-base sm:text-lg font-semibold mb-2 sm:mb-3">Problem Description</h2>
            <p className="text-sm sm:text-base text-muted-foreground whitespace-pre-wrap">{question.description}</p>
          </motion.div>
        )}

        {/* Hints */}
        {hints.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="glass-card p-4 sm:p-6 mb-4 sm:mb-6"
          >
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
              <h2 className="text-base sm:text-lg font-semibold flex items-center gap-2">
                <Lightbulb className="w-4 h-4 sm:w-5 sm:h-5 text-warning" /> Hints
              </h2>
              <Button
                variant="outline"
                size="sm"
                onClick={revealHint}
                disabled={hintsRevealed >= hints.length}
                className="text-xs sm:text-sm"
              >
                {hintsRevealed >= hints.length ? "All Revealed" : `Reveal Hint (${hintsRevealed}/${hints.length})`}
              </Button>
            </div>
            <div className="space-y-2 sm:space-y-3">
              {hints.slice(0, hintsRevealed).map((hint, idx) => (
                <div key={idx} className="p-2 sm:p-3 bg-warning/10 rounded-lg border border-warning/20">
                  <span className="font-medium text-warning text-sm">Hint {idx + 1}:</span>{" "}
                  <span className="text-sm text-muted-foreground">{hint}</span>
                </div>
              ))}
              {hintsRevealed === 0 && (
                <p className="text-xs sm:text-sm text-muted-foreground">Click "Reveal Hint" to get a hint. Using hints reduces XP reward slightly.</p>
              )}
            </div>
          </motion.div>
        )}

        {/* Solutions Accordion */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass-card p-4 sm:p-6 mb-4 sm:mb-6"
        >
          <h2 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4 flex items-center gap-2">
            <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-primary" /> AI Mentor Solutions
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground mb-3 sm:mb-4">
            Revealing solutions will reduce your XP reward. Try solving it yourself first!
          </p>
          
          <Accordion type="single" collapsible className="space-y-2">
            {question.approach && (
              <AccordionItem value="approach" className="border border-border/50 rounded-lg px-3 sm:px-4">
                <AccordionTrigger 
                  className="hover:no-underline"
                  onClick={() => {
                    if (!progress?.approach_viewed) {
                      updateProgressMutation.mutate({ approach_viewed: true });
                    }
                  }}
                >
                  <div className="flex items-center gap-2 text-sm">
                    <Target className="w-3 h-3 sm:w-4 sm:h-4 text-primary" />
                    <span>Approach (-25% XP)</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {question.approach}
                </AccordionContent>
              </AccordionItem>
            )}

            {question.brute_force && (
              <AccordionItem value="brute" className="border border-border/50 rounded-lg px-3 sm:px-4">
                <AccordionTrigger 
                  className="hover:no-underline text-sm"
                  onClick={() => {
                    if (!progress?.brute_force_viewed) {
                      updateProgressMutation.mutate({ brute_force_viewed: true });
                    }
                  }}
                >
                  <div className="flex items-center gap-2 text-sm">
                    <Code className="w-3 h-3 sm:w-4 sm:h-4 text-warning" />
                    <span>Brute Force (-50% XP)</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <pre className="bg-muted/50 p-3 sm:p-4 rounded-lg overflow-x-auto text-xs sm:text-sm">
                    {question.brute_force}
                  </pre>
                </AccordionContent>
              </AccordionItem>
            )}

            {question.optimal_solution && (
              <AccordionItem value="optimal" className="border border-border/50 rounded-lg px-3 sm:px-4">
                <AccordionTrigger 
                  className="hover:no-underline text-sm"
                  onClick={() => {
                    if (!progress?.solution_viewed) {
                      updateProgressMutation.mutate({ solution_viewed: true });
                    }
                  }}
                >
                  <div className="flex items-center gap-2 text-sm">
                    <Sparkles className="w-3 h-3 sm:w-4 sm:h-4 text-success" />
                    <span>Optimal Solution (-75% XP)</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <pre className="bg-muted/50 p-3 sm:p-4 rounded-lg overflow-x-auto text-xs sm:text-sm">
                    {question.optimal_solution}
                  </pre>
                </AccordionContent>
              </AccordionItem>
            )}
          </Accordion>
        </motion.div>

        {/* Notes */}
        {user && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="glass-card p-4 sm:p-6 mb-4 sm:mb-6"
          >
            <h2 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">Your Notes</h2>
            <Textarea
              placeholder="Write your notes, approach, or key learnings here..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={4}
              className="mb-3 text-sm"
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => updateProgressMutation.mutate({ notes })}
              disabled={updateProgressMutation.isPending}
              className="text-xs sm:text-sm"
            >
              {updateProgressMutation.isPending ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : null}
              Save Notes
            </Button>
          </motion.div>
        )}

        {/* Mark as Solved */}
        {user && !progress?.is_solved && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-center"
          >
            <Button
              size="lg"
              className="btn-primary-glow"
              onClick={() => markSolvedMutation.mutate()}
              disabled={markSolvedMutation.isPending}
            >
              {markSolvedMutation.isPending ? (
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              ) : (
                <CheckCircle2 className="w-5 h-5 mr-2" />
              )}
              Mark as Solved
            </Button>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default Question;
