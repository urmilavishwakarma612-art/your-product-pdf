import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import { 
  ChevronRight, 
  ChevronDown,
  Youtube,
  BookOpen,
  Code2,
  FileText,
  CheckCircle2,
  Search,
  Filter
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/hooks/useAuth";
import { Navbar } from "@/components/landing/Navbar";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

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

// Topic structure for grouping patterns
const TOPICS = [
  { 
    id: "array", 
    name: "Array", 
    description: "Fundamental collection of elements stored at contiguous memory locations." 
  },
  { 
    id: "strings", 
    name: "Strings", 
    description: "Sequence of characters and common string manipulation patterns." 
  },
  { 
    id: "binary-search", 
    name: "Binary Search", 
    description: "Efficient search algorithm that divides the search interval in half." 
  },
  { 
    id: "linked-list", 
    name: "Linked List", 
    description: "Linear data structure with elements connected via pointers." 
  },
  { 
    id: "trees", 
    name: "Trees", 
    description: "Hierarchical data structures with root and child nodes." 
  },
  { 
    id: "graphs", 
    name: "Graphs", 
    description: "Non-linear data structures with vertices and edges." 
  },
  { 
    id: "dynamic-programming", 
    name: "Dynamic Programming", 
    description: "Optimization technique using memoization and tabulation." 
  },
  { 
    id: "backtracking", 
    name: "Backtracking", 
    description: "Algorithmic technique for finding all solutions by exploring possibilities." 
  },
];

const Patterns = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [expandedPatterns, setExpandedPatterns] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");

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

  const toggleSolvedMutation = useMutation({
    mutationFn: async ({ questionId, isSolved }: { questionId: string; isSolved: boolean }) => {
      if (!user) throw new Error("Not authenticated");

      const existingProgress = userProgress?.find(p => p.question_id === questionId);

      if (existingProgress) {
        const { error } = await supabase
          .from("user_progress")
          .update({ is_solved: isSolved, solved_at: isSolved ? new Date().toISOString() : null })
          .eq("user_id", user.id)
          .eq("question_id", questionId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("user_progress")
          .insert({
            user_id: user.id,
            question_id: questionId,
            is_solved: isSolved,
            solved_at: isSolved ? new Date().toISOString() : null,
          });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-progress"] });
    },
    onError: () => {
      toast.error("Failed to update progress");
    },
  });

  const getPatternQuestions = (patternId: string) => {
    return questions?.filter(q => q.pattern_id === patternId) || [];
  };

  const getPatternProgress = (patternId: string) => {
    const patternQuestions = getPatternQuestions(patternId);
    if (patternQuestions.length === 0) return { solved: 0, total: 0 };
    
    const solvedCount = patternQuestions.filter(q => 
      userProgress?.some(p => p.question_id === q.id && p.is_solved)
    ).length;
    
    return { solved: solvedCount, total: patternQuestions.length };
  };

  const isQuestionSolved = (questionId: string) => {
    return userProgress?.some(p => p.question_id === questionId && p.is_solved);
  };

  const togglePattern = (patternId: string) => {
    setExpandedPatterns(prev => {
      const newSet = new Set(prev);
      if (newSet.has(patternId)) {
        newSet.delete(patternId);
      } else {
        newSet.add(patternId);
      }
      return newSet;
    });
  };

  const handleCheckboxChange = (questionId: string, currentlySolved: boolean) => {
    if (!user) {
      toast.error("Please login to track progress");
      return;
    }
    toggleSolvedMutation.mutate({ questionId, isSolved: !currentlySolved });
  };

  const difficultyConfig = {
    easy: { 
      bg: "bg-emerald-500/10", 
      text: "text-emerald-500", 
      border: "border-emerald-500/30",
      label: "Easy" 
    },
    medium: { 
      bg: "bg-amber-500/10", 
      text: "text-amber-500", 
      border: "border-amber-500/30",
      label: "Medium" 
    },
    hard: { 
      bg: "bg-red-500/10", 
      text: "text-red-500", 
      border: "border-red-500/30",
      label: "Hard" 
    },
  };

  // Group patterns by phase (treating phase as topic for now)
  const groupedPatterns = patterns?.reduce((acc, pattern) => {
    const phase = pattern.phase;
    if (!acc[phase]) acc[phase] = [];
    acc[phase].push(pattern);
    return acc;
  }, {} as Record<number, Pattern[]>) || {};

  // Filter questions based on search
  const filteredQuestions = searchQuery 
    ? questions?.filter(q => q.title.toLowerCase().includes(searchQuery.toLowerCase()))
    : questions;

  if (patternsLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading patterns...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container mx-auto px-4 pt-24 pb-12 max-w-5xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Pattern Wise Sheet</h1>
          <p className="text-muted-foreground">
            Master data structures and algorithms topic by topic
          </p>
        </div>

        {/* Search & Filters */}
        <div className="flex items-center gap-3 mb-8">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search problems..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-card border-border"
            />
          </div>
          <button className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border hover:bg-muted/50 transition-colors">
            <Filter className="w-4 h-4" />
            <span className="text-sm">Difficulty</span>
          </button>
        </div>

        {/* Topics */}
        <div className="space-y-12">
          {Object.entries(groupedPatterns).map(([phase, phasePatterns]) => {
            const topic = TOPICS[Number(phase) - 1] || { 
              name: `Phase ${phase}`, 
              description: "Collection of patterns and techniques." 
            };

            return (
              <section key={phase}>
                {/* Topic Header */}
                <div className="mb-4">
                  <h2 className="text-xl font-bold text-foreground mb-1">{topic.name}</h2>
                  <p className="text-sm text-muted-foreground">{topic.description}</p>
                </div>

                {/* Patterns List */}
                <div className="space-y-2">
                  {phasePatterns.map((pattern) => {
                    const patternQuestions = getPatternQuestions(pattern.id);
                    const { solved, total } = getPatternProgress(pattern.id);
                    const isExpanded = expandedPatterns.has(pattern.id);
                    const progressPercent = total > 0 ? (solved / total) * 100 : 0;

                    return (
                      <div
                        key={pattern.id}
                        className="rounded-lg border border-border bg-card overflow-hidden"
                      >
                        {/* Pattern Header */}
                        <button
                          onClick={() => togglePattern(pattern.id)}
                          className="w-full px-4 py-3 flex items-center justify-between hover:bg-muted/30 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <ChevronRight 
                              className={`w-4 h-4 text-muted-foreground transition-transform duration-200 ${
                                isExpanded ? "rotate-90" : ""
                              }`}
                            />
                            <span className="font-medium text-foreground">{pattern.name}</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-sm text-muted-foreground">{solved}/{total}</span>
                            <div className="w-24 h-1.5 bg-muted rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-primary rounded-full transition-all duration-300"
                                style={{ width: `${progressPercent}%` }}
                              />
                            </div>
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
                                  <div className="px-4 py-6 text-center text-muted-foreground text-sm">
                                    No questions added yet.
                                  </div>
                                ) : (
                                  patternQuestions.map((question) => {
                                    const solved = isQuestionSolved(question.id);
                                    const difficulty = difficultyConfig[question.difficulty];
                                    
                                    return (
                                      <div
                                        key={question.id}
                                        className={`px-4 py-3 flex items-center justify-between border-b border-border/50 last:border-0 hover:bg-muted/20 transition-colors ${
                                          solved ? "bg-success/5" : ""
                                        }`}
                                      >
                                        {/* Left: Checkbox, Title, Company Tags */}
                                        <div className="flex items-center gap-3 flex-1 min-w-0">
                                          <Checkbox
                                            checked={solved}
                                            onCheckedChange={() => handleCheckboxChange(question.id, !!solved)}
                                            className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                                          />
                                          <div className="flex-1 min-w-0">
                                            <Link 
                                              to={`/question/${question.id}`}
                                              className="font-medium text-foreground hover:text-primary transition-colors line-clamp-1"
                                            >
                                              {question.title}
                                            </Link>
                                            {/* Company Tags Placeholder */}
                                            <div className="flex items-center gap-1.5 mt-1">
                                              <span className="text-xs px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-500">Amazon</span>
                                              <span className="text-xs px-1.5 py-0.5 rounded bg-green-500/10 text-green-500">Google</span>
                                              <span className="text-xs px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-500">Meta</span>
                                            </div>
                                          </div>
                                        </div>

                                        {/* Center: Difficulty Badge */}
                                        <div className="px-4">
                                          <Badge 
                                            variant="outline" 
                                            className={`${difficulty.bg} ${difficulty.text} ${difficulty.border} border`}
                                          >
                                            {difficulty.label}
                                          </Badge>
                                        </div>

                                        {/* Right: Action Icons */}
                                        <div className="flex items-center gap-1">
                                          {question.youtube_link && (
                                            <a
                                              href={question.youtube_link}
                                              target="_blank"
                                              rel="noopener noreferrer"
                                              className="p-2 rounded-lg hover:bg-muted transition-colors"
                                              title="Watch Video"
                                            >
                                              <Youtube className="w-4 h-4 text-red-500" />
                                            </a>
                                          )}
                                          <a
                                            href={question.article_link || "#"}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className={`p-2 rounded-lg hover:bg-muted transition-colors ${!question.article_link ? "opacity-30" : ""}`}
                                            title="Read Notes"
                                          >
                                            <FileText className="w-4 h-4 text-amber-500" />
                                          </a>
                                          <Link
                                            to={`/question/${question.id}`}
                                            className="p-2 rounded-lg hover:bg-muted transition-colors"
                                            title="View Solution"
                                          >
                                            <Code2 className="w-4 h-4 text-emerald-500" />
                                          </Link>
                                          {question.leetcode_link && (
                                            <a
                                              href={question.leetcode_link}
                                              target="_blank"
                                              rel="noopener noreferrer"
                                              className="p-2 rounded-lg hover:bg-muted transition-colors"
                                              title="Solve on LeetCode"
                                            >
                                              <BookOpen className="w-4 h-4 text-orange-500" />
                                            </a>
                                          )}
                                        </div>
                                      </div>
                                    );
                                  })
                                )}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>

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
