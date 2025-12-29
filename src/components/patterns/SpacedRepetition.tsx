import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import { 
  Clock, 
  RotateCcw, 
  CheckCircle2, 
  X, 
  ChevronDown, 
  ChevronUp,
  Calendar,
  Flame,
  Brain
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";

interface ReviewQuestion {
  id: string;
  question_id: string;
  next_review_at: string;
  review_count: number;
  ease_factor: number;
  interval_days: number;
  question: {
    id: string;
    title: string;
    difficulty: string;
    pattern_id: string;
  };
}

// SM-2 Algorithm inspired intervals
const calculateNextReview = (
  quality: number, // 0-5, where 3+ is correct recall
  reviewCount: number,
  easeFactor: number,
  intervalDays: number
): { nextReviewAt: Date; newEaseFactor: number; newInterval: number } => {
  let newEaseFactor = easeFactor;
  let newInterval = intervalDays;

  if (quality >= 3) {
    // Correct response
    if (reviewCount === 0) {
      newInterval = 1;
    } else if (reviewCount === 1) {
      newInterval = 3;
    } else {
      newInterval = Math.round(intervalDays * easeFactor);
    }
    
    // Update ease factor
    newEaseFactor = easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
    if (newEaseFactor < 1.3) newEaseFactor = 1.3;
  } else {
    // Incorrect response - reset
    newInterval = 1;
    newEaseFactor = Math.max(1.3, easeFactor - 0.2);
  }

  const nextReviewAt = new Date();
  nextReviewAt.setDate(nextReviewAt.getDate() + newInterval);

  return { nextReviewAt, newEaseFactor, newInterval };
};

const formatTimeUntilReview = (reviewDate: string): string => {
  const now = new Date();
  const review = new Date(reviewDate);
  const diffMs = review.getTime() - now.getTime();
  
  if (diffMs <= 0) return "Due now";
  
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffHours / 24);
  
  if (diffDays > 0) return `In ${diffDays}d`;
  if (diffHours > 0) return `In ${diffHours}h`;
  return "Due soon";
};

const difficultyConfig = {
  easy: { text: "text-emerald-500", label: "Easy" },
  medium: { text: "text-amber-500", label: "Medium" },
  hard: { text: "text-red-500", label: "Hard" },
};

export const SpacedRepetition = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isExpanded, setIsExpanded] = useState(true);

  // Fetch questions due for review
  const { data: reviewQuestions, isLoading } = useQuery({
    queryKey: ["review-questions", user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from("user_progress")
        .select(`
          id,
          question_id,
          next_review_at,
          review_count,
          ease_factor,
          interval_days,
          question:questions(id, title, difficulty, pattern_id)
        `)
        .eq("user_id", user.id)
        .eq("is_solved", true)
        .not("next_review_at", "is", null)
        .lte("next_review_at", new Date().toISOString())
        .order("next_review_at", { ascending: true })
        .limit(10);
      
      if (error) throw error;
      return (data || []).filter(d => d.question) as unknown as ReviewQuestion[];
    },
    enabled: !!user,
  });

  // Fetch upcoming reviews (not yet due)
  const { data: upcomingReviews } = useQuery({
    queryKey: ["upcoming-reviews", user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from("user_progress")
        .select(`
          id,
          question_id,
          next_review_at,
          review_count,
          question:questions(id, title, difficulty)
        `)
        .eq("user_id", user.id)
        .eq("is_solved", true)
        .not("next_review_at", "is", null)
        .gt("next_review_at", new Date().toISOString())
        .order("next_review_at", { ascending: true })
        .limit(5);
      
      if (error) throw error;
      return (data || []).filter(d => d.question) as unknown as ReviewQuestion[];
    },
    enabled: !!user,
  });

  // Count total scheduled reviews
  const { data: totalScheduled } = useQuery({
    queryKey: ["total-scheduled", user?.id],
    queryFn: async () => {
      if (!user) return 0;
      
      const { count, error } = await supabase
        .from("user_progress")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("is_solved", true)
        .not("next_review_at", "is", null);
      
      if (error) throw error;
      return count || 0;
    },
    enabled: !!user,
  });

  // Handle review response
  const reviewMutation = useMutation({
    mutationFn: async ({ progressId, quality }: { progressId: string; quality: number }) => {
      const review = reviewQuestions?.find(r => r.id === progressId);
      if (!review) throw new Error("Review not found");

      const { nextReviewAt, newEaseFactor, newInterval } = calculateNextReview(
        quality,
        review.review_count,
        review.ease_factor,
        review.interval_days
      );

      const { error } = await supabase
        .from("user_progress")
        .update({
          next_review_at: nextReviewAt.toISOString(),
          review_count: review.review_count + 1,
          ease_factor: newEaseFactor,
          interval_days: newInterval,
        })
        .eq("id", progressId);

      if (error) throw error;
      return { newInterval };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["review-questions"] });
      queryClient.invalidateQueries({ queryKey: ["upcoming-reviews"] });
      toast.success(`Next review in ${data.newInterval} day${data.newInterval > 1 ? 's' : ''}`);
    },
    onError: () => {
      toast.error("Failed to update review");
    },
  });

  if (!user) return null;
  if (isLoading) return null;

  const dueCount = reviewQuestions?.length || 0;
  const hasReviews = dueCount > 0 || (upcomingReviews?.length || 0) > 0;

  if (!hasReviews && (totalScheduled || 0) === 0) return null;

  return (
    <div className="mb-8 rounded-xl border border-border bg-card overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-5 py-4 flex items-center justify-between hover:bg-muted/30 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Brain className="w-5 h-5 text-primary" />
          </div>
          <div className="text-left">
            <h3 className="font-semibold text-foreground flex items-center gap-2">
              Spaced Repetition
              {dueCount > 0 && (
                <Badge variant="destructive" className="text-xs">
                  {dueCount} Due
                </Badge>
              )}
            </h3>
            <p className="text-xs text-muted-foreground">
              {totalScheduled || 0} problems scheduled for review
            </p>
          </div>
        </div>
        {isExpanded ? (
          <ChevronUp className="w-5 h-5 text-muted-foreground" />
        ) : (
          <ChevronDown className="w-5 h-5 text-muted-foreground" />
        )}
      </button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-5 border-t border-border pt-4">
              {/* Due for Review */}
              {dueCount > 0 && (
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
                    <Flame className="w-4 h-4 text-orange-500" />
                    Due for Review
                  </h4>
                  <div className="space-y-2">
                    {reviewQuestions?.map((review) => {
                      const difficulty = difficultyConfig[review.question.difficulty as keyof typeof difficultyConfig] || difficultyConfig.medium;
                      
                      return (
                        <div
                          key={review.id}
                          className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border/50"
                        >
                          <div className="flex-1 min-w-0">
                            <Link
                              to={`/question/${review.question.id}`}
                              className="font-medium text-sm text-foreground hover:text-primary transition-colors truncate block"
                            >
                              {review.question.title}
                            </Link>
                            <div className="flex items-center gap-2 mt-1">
                              <span className={`text-xs ${difficulty.text}`}>
                                {difficulty.label}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                • Reviewed {review.review_count}x
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 ml-3">
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8 px-2 text-red-500 hover:text-red-600 hover:bg-red-500/10"
                              onClick={() => reviewMutation.mutate({ progressId: review.id, quality: 2 })}
                              title="Forgot - Review again soon"
                            >
                              <X className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8 px-2 text-amber-500 hover:text-amber-600 hover:bg-amber-500/10"
                              onClick={() => reviewMutation.mutate({ progressId: review.id, quality: 3 })}
                              title="Hard - Short interval"
                            >
                              <RotateCcw className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8 px-2 text-emerald-500 hover:text-emerald-600 hover:bg-emerald-500/10"
                              onClick={() => reviewMutation.mutate({ progressId: review.id, quality: 5 })}
                              title="Easy - Longer interval"
                            >
                              <CheckCircle2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Upcoming Reviews */}
              {(upcomingReviews?.length || 0) > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-blue-500" />
                    Upcoming Reviews
                  </h4>
                  <div className="space-y-1">
                    {upcomingReviews?.map((review) => (
                      <div
                        key={review.id}
                        className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-muted/20 transition-colors"
                      >
                        <span className="text-sm text-muted-foreground truncate">
                          {review.question.title}
                        </span>
                        <Badge variant="outline" className="text-xs shrink-0 ml-2">
                          <Clock className="w-3 h-3 mr-1" />
                          {formatTimeUntilReview(review.next_review_at)}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {dueCount === 0 && (upcomingReviews?.length || 0) === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  All caught up! Solve more problems to add them to your review queue.
                </p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
