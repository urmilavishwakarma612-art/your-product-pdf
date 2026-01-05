import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Target, CheckCircle, Clock, ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";

export const DailyChallenge = () => {
  const { user } = useAuth();
  const today = new Date().toISOString().split("T")[0];

  const { data: challenge, isLoading } = useQuery({
    queryKey: ["daily-challenge", user?.id, today],
    queryFn: async () => {
      if (!user) return null;

      // Check if challenge exists for today
      const { data: existingChallenge, error: fetchError } = await supabase
        .from("daily_challenges")
        .select(`
          *,
          questions (
            id,
            title,
            difficulty,
            pattern_id,
            patterns (name)
          )
        `)
        .eq("user_id", user.id)
        .eq("challenge_date", today)
        .maybeSingle();

      if (fetchError) throw fetchError;

      if (existingChallenge) {
        return existingChallenge;
      }

      // Get user's current curriculum level
      const { data: profile } = await supabase
        .from("profiles")
        .select("curriculum_level")
        .eq("id", user.id)
        .single();

      const currLevel = profile?.curriculum_level || 0;

      // Get modules for current level
      const { data: modules } = await supabase
        .from("curriculum_modules")
        .select("pattern_id, curriculum_levels!inner(level_number)")
        .lte("curriculum_levels.level_number", currLevel + 1);

      const patternIds = modules?.map(m => m.pattern_id).filter(Boolean) || [];

      // Get a random question from those patterns
      let questionQuery = supabase
        .from("questions")
        .select("id, title, difficulty, pattern_id, patterns(name)");

      if (patternIds.length > 0) {
        questionQuery = questionQuery.in("pattern_id", patternIds);
      }

      const { data: questions } = await questionQuery.limit(50);

      if (!questions || questions.length === 0) return null;

      // Pick random question
      const randomQuestion = questions[Math.floor(Math.random() * questions.length)];

      // Create new challenge
      const { data: newChallenge, error: createError } = await supabase
        .from("daily_challenges")
        .insert({
          user_id: user.id,
          challenge_date: today,
          question_id: randomQuestion.id,
        })
        .select()
        .single();

      if (createError) throw createError;

      return {
        ...newChallenge,
        questions: randomQuestion,
      };
    },
    enabled: !!user,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  if (isLoading) {
    return (
      <div className="glass-card p-4 animate-pulse">
        <div className="h-6 w-32 bg-card rounded mb-3" />
        <div className="h-16 bg-card rounded" />
      </div>
    );
  }

  if (!challenge || !challenge.questions) {
    return null;
  }

  const question = challenge.questions as any;
  const isCompleted = challenge.completed;

  const difficultyColors: Record<string, string> = {
    easy: "bg-emerald-500/10 text-emerald-500 border-emerald-500/30",
    medium: "bg-amber-500/10 text-amber-500 border-amber-500/30",
    hard: "bg-red-500/10 text-red-500 border-red-500/30",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`glass-card p-4 relative overflow-hidden ${
        isCompleted ? "border-success/30" : "border-primary/30"
      }`}
    >
      {!isCompleted && (
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-primary/10 rounded-full blur-2xl" />
      )}

      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
            isCompleted ? "bg-success/10" : "bg-primary/10"
          }`}>
            {isCompleted ? (
              <CheckCircle className="w-4 h-4 text-success" />
            ) : (
              <Target className="w-4 h-4 text-primary" />
            )}
          </div>
          <div>
            <h3 className="font-semibold text-sm">Daily Challenge</h3>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <Clock className="w-3 h-3" />
              Today's Pattern Practice
            </p>
          </div>
        </div>
        {isCompleted && (
          <Badge variant="outline" className="bg-success/10 text-success border-success/30">
            <CheckCircle className="w-3 h-3 mr-1" />
            Completed
          </Badge>
        )}
      </div>

      <div className="bg-card/50 rounded-lg p-3 mb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h4 className="font-medium truncate">{question.title}</h4>
            <div className="flex items-center gap-2 mt-1.5">
              <Badge variant="outline" className={difficultyColors[question.difficulty]}>
                {question.difficulty}
              </Badge>
              {question.patterns?.name && (
                <span className="text-xs text-muted-foreground">
                  {question.patterns.name}
                </span>
              )}
            </div>
          </div>
          {!isCompleted && (
            <Sparkles className="w-5 h-5 text-primary shrink-0" />
          )}
        </div>
      </div>

      {!isCompleted && (
        <Link to={`/question/${question.id}`}>
          <Button className="w-full btn-primary-glow" size="sm">
            Start Challenge
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </Link>
      )}

      {isCompleted && (
        <div className="text-center text-sm text-muted-foreground">
          <span className="text-success">+25 XP</span> earned! Come back tomorrow.
        </div>
      )}
    </motion.div>
  );
};
