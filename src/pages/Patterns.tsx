import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import { 
  ArrowLeft, 
  Lock, 
  CheckCircle2, 
  ChevronDown,
  ExternalLink,
  Youtube,
  BookOpen,
  Zap,
  Target,
  Flame
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/hooks/useAuth";
import { Navbar } from "@/components/landing/Navbar";

interface Pattern {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  phase: number;
  icon: string | null;
  color: string | null;
  is_free: boolean;
  total_questions: number;
  display_order: number;
}

interface Question {
  id: string;
  title: string;
  difficulty: "easy" | "medium" | "hard";
  leetcode_link: string | null;
  youtube_link: string | null;
  article_link: string | null;
  xp_reward: number;
  display_order: number;
  pattern_id: string;
}

interface UserProgress {
  question_id: string;
  is_solved: boolean;
}

const Patterns = () => {
  const { user } = useAuth();
  const [expandedPattern, setExpandedPattern] = useState<string | null>(null);

  const { data: patterns, isLoading: patternsLoading } = useQuery({
    queryKey: ["patterns"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("patterns")
        .select("*")
        .order("phase", { ascending: true })
        .order("display_order", { ascending: true });
      
      if (error) throw error;
      return data as Pattern[];
    },
  });

  const { data: questions } = useQuery({
    queryKey: ["questions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("questions")
        .select("*")
        .order("display_order", { ascending: true });
      
      if (error) throw error;
      return data as Question[];
    },
  });

  const { data: userProgress } = useQuery({
    queryKey: ["user-progress", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("user_progress")
        .select("question_id, is_solved")
        .eq("user_id", user.id);
      
      if (error) throw error;
      return data as UserProgress[];
    },
    enabled: !!user,
  });

  const getPatternQuestions = (patternId: string) => {
    return questions?.filter(q => q.pattern_id === patternId) || [];
  };

  const getPatternProgress = (patternId: string) => {
    const patternQuestions = getPatternQuestions(patternId);
    if (patternQuestions.length === 0) return 0;
    
    const solvedCount = patternQuestions.filter(q => 
      userProgress?.some(p => p.question_id === q.id && p.is_solved)
    ).length;
    
    return Math.round((solvedCount / patternQuestions.length) * 100);
  };

  const isQuestionSolved = (questionId: string) => {
    return userProgress?.some(p => p.question_id === questionId && p.is_solved);
  };

  const difficultyConfig = {
    easy: { color: "bg-success/20 text-success border-success/30", label: "Easy" },
    medium: { color: "bg-warning/20 text-warning border-warning/30", label: "Medium" },
    hard: { color: "bg-destructive/20 text-destructive border-destructive/30", label: "Hard" },
  };

  const phaseColors = [
    "from-emerald-500/20 to-emerald-600/10",
    "from-primary/20 to-secondary/10",
    "from-amber-500/20 to-orange-500/10",
  ];

  const groupedPatterns = patterns?.reduce((acc, pattern) => {
    const phase = pattern.phase;
    if (!acc[phase]) acc[phase] = [];
    acc[phase].push(pattern);
    return acc;
  }, {} as Record<number, Pattern[]>) || {};

  if (patternsLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading patterns...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background bg-grid">
      <Navbar />
      
      <main className="container mx-auto px-4 pt-24 pb-12">
        <div className="mb-8">
          <Link to="/dashboard" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-4">
            <ArrowLeft className="w-4 h-4" /> Back to Dashboard
          </Link>
          <h1 className="text-4xl font-bold mb-2">DSA Patterns</h1>
          <p className="text-muted-foreground text-lg">
            Master Data Structures & Algorithms through pattern-based learning
          </p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="glass-card p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
              <Target className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Patterns</p>
              <p className="text-2xl font-bold">{patterns?.length || 0}</p>
            </div>
          </div>
          <div className="glass-card p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-secondary/20 flex items-center justify-center">
              <Zap className="w-6 h-6 text-secondary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Questions</p>
              <p className="text-2xl font-bold">{questions?.length || 0}</p>
            </div>
          </div>
          <div className="glass-card p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-success/20 flex items-center justify-center">
              <Flame className="w-6 h-6 text-success" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Questions Solved</p>
              <p className="text-2xl font-bold">
                {userProgress?.filter(p => p.is_solved).length || 0}
              </p>
            </div>
          </div>
        </div>

        {/* Phases */}
        {Object.entries(groupedPatterns).map(([phase, phasePatterns]) => (
          <motion.section
            key={phase}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-12"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className={`px-4 py-2 rounded-full bg-gradient-to-r ${phaseColors[Number(phase) - 1] || phaseColors[0]}`}>
                <span className="font-semibold">Phase {phase}</span>
              </div>
              <div className="h-px flex-1 bg-border" />
            </div>

            <div className="space-y-4">
              {phasePatterns.map((pattern) => {
                const patternQuestions = getPatternQuestions(pattern.id);
                const progress = getPatternProgress(pattern.id);
                const isExpanded = expandedPattern === pattern.id;

                return (
                  <motion.div
                    key={pattern.id}
                    layout
                    className="glass-card overflow-hidden"
                  >
                    {/* Pattern Header */}
                    <button
                      onClick={() => setExpandedPattern(isExpanded ? null : pattern.id)}
                      className="w-full p-6 flex items-center justify-between hover:bg-white/5 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div 
                          className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
                          style={{ background: pattern.color || 'hsl(var(--primary) / 0.2)' }}
                        >
                          {pattern.icon || "📚"}
                        </div>
                        <div className="text-left">
                          <div className="flex items-center gap-2">
                            <h3 className="text-lg font-semibold">{pattern.name}</h3>
                            {!pattern.is_free && (
                              <Lock className="w-4 h-4 text-warning" />
                            )}
                            {pattern.is_free && (
                              <Badge variant="outline" className="text-success border-success/30">
                                Free
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {patternQuestions.length} questions • {progress}% complete
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="w-32 hidden sm:block">
                          <Progress value={progress} className="h-2" />
                        </div>
                        <ChevronDown 
                          className={`w-5 h-5 text-muted-foreground transition-transform ${
                            isExpanded ? "rotate-180" : ""
                          }`}
                        />
                      </div>
                    </button>

                    {/* Questions List */}
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden"
                        >
                          <div className="border-t border-border">
                            {patternQuestions.length === 0 ? (
                              <div className="p-6 text-center text-muted-foreground">
                                No questions added yet for this pattern.
                              </div>
                            ) : (
                              patternQuestions.map((question, idx) => {
                                const solved = isQuestionSolved(question.id);
                                
                                return (
                                  <div
                                    key={question.id}
                                    className={`p-4 flex items-center justify-between border-b border-border/50 last:border-0 ${
                                      solved ? "bg-success/5" : "hover:bg-white/5"
                                    } transition-colors`}
                                  >
                                    <div className="flex items-center gap-4">
                                      <span className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-sm font-medium">
                                        {idx + 1}
                                      </span>
                                      <div>
                                        <div className="flex items-center gap-2">
                                          <span className="font-medium">{question.title}</span>
                                          {solved && (
                                            <CheckCircle2 className="w-4 h-4 text-success" />
                                          )}
                                        </div>
                                        <div className="flex items-center gap-2 mt-1">
                                          <Badge 
                                            variant="outline" 
                                            className={difficultyConfig[question.difficulty].color}
                                          >
                                            {difficultyConfig[question.difficulty].label}
                                          </Badge>
                                          <span className="xp-badge text-xs">+{question.xp_reward} XP</span>
                                        </div>
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      {question.youtube_link && (
                                        <a
                                          href={question.youtube_link}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                                          title="Watch Video"
                                        >
                                          <Youtube className="w-5 h-5 text-destructive" />
                                        </a>
                                      )}
                                      {question.article_link && (
                                        <a
                                          href={question.article_link}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                                          title="Read Article"
                                        >
                                          <BookOpen className="w-5 h-5 text-primary" />
                                        </a>
                                      )}
                                      {question.leetcode_link && (
                                        <a
                                          href={question.leetcode_link}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                                          title="Solve on LeetCode"
                                        >
                                          <ExternalLink className="w-5 h-5 text-warning" />
                                        </a>
                                      )}
                                      <Link to={`/question/${question.id}`}>
                                        <Button size="sm" variant="outline">
                                          {solved ? "Review" : "Start"}
                                        </Button>
                                      </Link>
                                    </div>
                                  </div>
                                );
                              })
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })}
            </div>
          </motion.section>
        ))}

        {(!patterns || patterns.length === 0) && (
          <div className="text-center py-16">
            <p className="text-muted-foreground text-lg">No patterns available yet.</p>
            <p className="text-sm text-muted-foreground mt-2">Check back soon!</p>
          </div>
        )}
      </main>
    </div>
  );
};

export default Patterns;
