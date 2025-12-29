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
  Filter,
  X,
  Bookmark,
  BookmarkCheck
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/hooks/useAuth";
import { Navbar } from "@/components/landing/Navbar";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { OverallProgress } from "@/components/patterns/OverallProgress";
import { AIMentor } from "@/components/patterns/AIMentor";

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
  companies: string[] | null;
}

interface UserProgress {
  question_id: string;
  is_solved: boolean;
}

interface Bookmark {
  question_id: string;
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
  const [difficultyFilter, setDifficultyFilter] = useState<Set<string>>(new Set());
  const [topicFilter, setTopicFilter] = useState<Set<string>>(new Set());
  const [companyFilter, setCompanyFilter] = useState<Set<string>>(new Set());
  const [bookmarkFilter, setBookmarkFilter] = useState(false);
  const [selectedQuestionForMentor, setSelectedQuestionForMentor] = useState<Question | null>(null);

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

  const { data: companiesData } = useQuery({
    queryKey: ["companies"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("companies")
        .select("name, logo_url")
        .order("name", { ascending: true });
      
      if (error) throw error;
      return data as { name: string; logo_url: string | null }[];
    },
  });

  // Create a map for quick company logo lookup
  const companyLogoMap = companiesData?.reduce((acc, company) => {
    acc[company.name] = company.logo_url;
    return acc;
  }, {} as Record<string, string | null>) || {};

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

  // Fetch user bookmarks
  const { data: userBookmarks } = useQuery({
    queryKey: ["user-bookmarks", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("bookmarks")
        .select("question_id")
        .eq("user_id", user.id);
      
      if (error) throw error;
      return data as Bookmark[];
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

  const toggleBookmarkMutation = useMutation({
    mutationFn: async ({ questionId, isBookmarked }: { questionId: string; isBookmarked: boolean }) => {
      if (!user) throw new Error("Not authenticated");

      if (isBookmarked) {
        const { error } = await supabase
          .from("bookmarks")
          .delete()
          .eq("user_id", user.id)
          .eq("question_id", questionId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("bookmarks")
          .insert({
            user_id: user.id,
            question_id: questionId,
          });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-bookmarks"] });
    },
    onError: () => {
      toast.error("Failed to update bookmark");
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

  const isQuestionBookmarked = (questionId: string) => {
    return userBookmarks?.some(b => b.question_id === questionId);
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

  const handleBookmarkToggle = (questionId: string, isBookmarked: boolean) => {
    if (!user) {
      toast.error("Please login to bookmark questions");
      return;
    }
    toggleBookmarkMutation.mutate({ questionId, isBookmarked });
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

  // Get all unique companies from questions
  const allCompanies = [...new Set(questions?.flatMap(q => q.companies || []) || [])].sort();

  // Filter questions based on search and filters
  const filterQuestion = (question: Question) => {
    const matchesSearch = !searchQuery || question.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDifficulty = difficultyFilter.size === 0 || difficultyFilter.has(question.difficulty);
    const matchesCompany = companyFilter.size === 0 || (question.companies || []).some(c => companyFilter.has(c));
    const matchesBookmark = !bookmarkFilter || isQuestionBookmarked(question.id);
    return matchesSearch && matchesDifficulty && matchesCompany && matchesBookmark;
  };

  // Filter patterns based on topic filter
  const filterPattern = (pattern: Pattern) => {
    if (topicFilter.size === 0) return true;
    const topicIndex = pattern.phase - 1;
    const topic = TOPICS[topicIndex];
    return topic && topicFilter.has(topic.id);
  };

  const clearFilters = () => {
    setDifficultyFilter(new Set());
    setTopicFilter(new Set());
    setCompanyFilter(new Set());
    setSearchQuery("");
    setBookmarkFilter(false);
  };

  const hasActiveFilters = difficultyFilter.size > 0 || topicFilter.size > 0 || companyFilter.size > 0 || searchQuery || bookmarkFilter;

  // Calculate overall progress stats
  const totalQuestions = questions?.length || 0;
  const solvedQuestionIds = new Set(userProgress?.filter(p => p.is_solved).map(p => p.question_id) || []);
  const totalSolved = questions?.filter(q => solvedQuestionIds.has(q.id)).length || 0;
  
  const easyQuestions = questions?.filter(q => q.difficulty === "easy") || [];
  const mediumQuestions = questions?.filter(q => q.difficulty === "medium") || [];
  const hardQuestions = questions?.filter(q => q.difficulty === "hard") || [];
  
  const easySolved = easyQuestions.filter(q => solvedQuestionIds.has(q.id)).length;
  const mediumSolved = mediumQuestions.filter(q => solvedQuestionIds.has(q.id)).length;
  const hardSolved = hardQuestions.filter(q => solvedQuestionIds.has(q.id)).length;

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
        {/* Overall Progress */}
        <OverallProgress
          totalSolved={totalSolved}
          totalQuestions={totalQuestions}
          easySolved={easySolved}
          easyTotal={easyQuestions.length}
          mediumSolved={mediumSolved}
          mediumTotal={mediumQuestions.length}
          hardSolved={hardSolved}
          hardTotal={hardQuestions.length}
        />

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Pattern Wise Sheet</h1>
          <p className="text-muted-foreground">
            Master data structures and algorithms topic by topic
          </p>
        </div>

        {/* Search & Filters */}
        <div className="flex flex-wrap items-center gap-3 mb-8">
          <div className="relative flex-1 min-w-[200px] max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search problems..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-card border-border"
            />
          </div>
          
          {/* Difficulty Filter */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="gap-2">
                Difficulty
                {difficultyFilter.size > 0 && (
                  <Badge variant="secondary" className="ml-1 h-5 px-1.5">{difficultyFilter.size}</Badge>
                )}
                <ChevronDown className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              {["easy", "medium", "hard"].map((diff) => (
                <DropdownMenuCheckboxItem
                  key={diff}
                  checked={difficultyFilter.has(diff)}
                  onCheckedChange={(checked) => {
                    const newSet = new Set(difficultyFilter);
                    if (checked) newSet.add(diff);
                    else newSet.delete(diff);
                    setDifficultyFilter(newSet);
                  }}
                >
                  <span className="capitalize">{diff}</span>
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Topic Filter */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="gap-2">
                Topic
                {topicFilter.size > 0 && (
                  <Badge variant="secondary" className="ml-1 h-5 px-1.5">{topicFilter.size}</Badge>
                )}
                <ChevronDown className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              {TOPICS.map((topic) => (
                <DropdownMenuCheckboxItem
                  key={topic.id}
                  checked={topicFilter.has(topic.id)}
                  onCheckedChange={(checked) => {
                    const newSet = new Set(topicFilter);
                    if (checked) newSet.add(topic.id);
                    else newSet.delete(topic.id);
                    setTopicFilter(newSet);
                  }}
                >
                  {topic.name}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Company Filter */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="gap-2">
                Company
                {companyFilter.size > 0 && (
                  <Badge variant="secondary" className="ml-1 h-5 px-1.5">{companyFilter.size}</Badge>
                )}
                <ChevronDown className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="max-h-60 overflow-y-auto">
              {allCompanies.length === 0 ? (
                <div className="px-2 py-1.5 text-sm text-muted-foreground">No companies yet</div>
              ) : (
                allCompanies.map((company) => (
                  <DropdownMenuCheckboxItem
                    key={company}
                    checked={companyFilter.has(company)}
                    onCheckedChange={(checked) => {
                      const newSet = new Set(companyFilter);
                      if (checked) newSet.add(company);
                      else newSet.delete(company);
                      setCompanyFilter(newSet);
                    }}
                  >
                    {company}
                  </DropdownMenuCheckboxItem>
                ))
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Bookmark Filter */}
          <Button 
            variant={bookmarkFilter ? "default" : "outline"} 
            className="gap-2"
            onClick={() => setBookmarkFilter(!bookmarkFilter)}
          >
            <BookmarkCheck className="w-4 h-4" />
            Bookmarked
          </Button>

          {/* Clear Filters */}
          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={clearFilters} className="gap-1 text-muted-foreground">
              <X className="w-4 h-4" />
              Clear
            </Button>
          )}
        </div>

        {/* Topics */}
        <div className="space-y-12">
          {Object.entries(groupedPatterns).map(([phase, phasePatterns]) => {
            const topicIndex = Number(phase) - 1;
            const topic = TOPICS[topicIndex] || { 
              id: `phase-${phase}`,
              name: `Phase ${phase}`, 
              description: "Collection of patterns and techniques." 
            };

            // Apply topic filter
            if (topicFilter.size > 0 && !topicFilter.has(topic.id)) {
              return null;
            }

            // Filter patterns that have matching questions
            const filteredPhasePatterns = phasePatterns.filter(pattern => {
              const patternQuestions = getPatternQuestions(pattern.id);
              return patternQuestions.some(filterQuestion);
            });

            // Skip if no patterns match after filtering (only when filters are active)
            if (hasActiveFilters && filteredPhasePatterns.length === 0) {
              return null;
            }

            const patternsToShow = hasActiveFilters ? filteredPhasePatterns : phasePatterns;

            return (
              <section key={phase}>
                {/* Topic Header */}
                <div className="mb-4">
                  <h2 className="text-xl font-bold text-foreground mb-1">{topic.name}</h2>
                  <p className="text-sm text-muted-foreground">{topic.description}</p>
                </div>

                {/* Patterns List */}
                <div className="space-y-2">
                  {patternsToShow.map((pattern) => {
                    const allPatternQuestions = getPatternQuestions(pattern.id);
                    const patternQuestions = hasActiveFilters 
                      ? allPatternQuestions.filter(filterQuestion)
                      : allPatternQuestions;
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
                            {hasActiveFilters && (
                              <Badge variant="secondary" className="text-xs">
                                {patternQuestions.length} match
                              </Badge>
                            )}
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
                                    {hasActiveFilters ? "No matching questions." : "No questions added yet."}
                                  </div>
                                ) : (
                                  patternQuestions.map((question) => {
                                    const solved = isQuestionSolved(question.id);
                                    const difficulty = difficultyConfig[question.difficulty];
                                    
                                    return (
                                      <div
                                        key={question.id}
                                        className={`px-4 py-3 flex items-center gap-4 border-b border-border/50 last:border-0 hover:bg-muted/20 transition-colors ${
                                          solved ? "bg-success/5" : ""
                                        }`}
                                      >
                                        {/* Checkbox */}
                                        <Checkbox
                                          checked={solved}
                                          onCheckedChange={() => handleCheckboxChange(question.id, !!solved)}
                                          className="h-5 w-5 rounded border-2 border-muted-foreground/40 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                                        />

                                        {/* Title & Company Tags */}
                                        <div className="flex-1 min-w-0">
                                          <Link 
                                            to={`/question/${question.id}`}
                                            className="font-medium text-foreground hover:text-primary transition-colors"
                                          >
                                            {question.title}
                                          </Link>
                                          {/* Company Tags - Circular pills */}
                                          {question.companies && question.companies.length > 0 && (
                                            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                                              {question.companies.slice(0, 5).map((company) => {
                                                const logoUrl = companyLogoMap[company];
                                                return (
                                                  <span 
                                                    key={company} 
                                                    className="inline-flex items-center gap-1.5 text-xs px-2 py-1 rounded-full border border-border bg-background text-muted-foreground"
                                                  >
                                                    {logoUrl ? (
                                                      <img 
                                                        src={logoUrl} 
                                                        alt="" 
                                                        className="w-4 h-4 rounded-full object-contain" 
                                                      />
                                                    ) : (
                                                      <span className="w-4 h-4 rounded-full bg-muted flex items-center justify-center text-[10px] font-medium">
                                                        {company.charAt(0)}
                                                      </span>
                                                    )}
                                                    {company}
                                                  </span>
                                                );
                                              })}
                                              {question.companies.length > 5 && (
                                                <span className="text-xs text-muted-foreground">
                                                  +{question.companies.length - 5}
                                                </span>
                                              )}
                                            </div>
                                          )}
                                        </div>

                                        {/* Difficulty Badge */}
                                        <Badge 
                                          variant="outline" 
                                          className={`${difficulty.text} border-current bg-transparent font-medium px-3 py-1`}
                                        >
                                          {difficulty.label}
                                        </Badge>

                                        {/* Action Icons */}
                                        <div className="flex items-center gap-1">
                                          {question.leetcode_link && (
                                            <a
                                              href={question.leetcode_link}
                                              target="_blank"
                                              rel="noopener noreferrer"
                                              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg hover:bg-muted transition-colors text-[#FFA116]"
                                              title="Solve on LeetCode"
                                            >
                                              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                                                <path d="M13.483 0a1.374 1.374 0 0 0-.961.438L7.116 6.226l-3.854 4.126a5.266 5.266 0 0 0-1.209 2.104 5.35 5.35 0 0 0-.125.513 5.527 5.527 0 0 0 .062 2.362 5.83 5.83 0 0 0 .349 1.017 5.938 5.938 0 0 0 1.271 1.818l4.277 4.193.039.038c2.248 2.165 5.852 2.133 8.063-.074l2.396-2.392c.54-.54.54-1.414.003-1.955a1.378 1.378 0 0 0-1.951-.003l-2.396 2.392a3.021 3.021 0 0 1-4.205.038l-.02-.019-4.276-4.193c-.652-.64-.972-1.469-.948-2.263a2.68 2.68 0 0 1 .066-.523 2.545 2.545 0 0 1 .619-1.164L9.13 8.114c1.058-1.134 3.204-1.27 4.43-.278l3.501 2.831c.593.48 1.461.387 1.94-.207a1.384 1.384 0 0 0-.207-1.943l-3.5-2.831c-.8-.647-1.766-1.045-2.774-1.202l2.015-2.158A1.384 1.384 0 0 0 13.483 0zm-2.866 12.815a1.38 1.38 0 0 0-1.38 1.382 1.38 1.38 0 0 0 1.38 1.382H20.79a1.38 1.38 0 0 0 1.38-1.382 1.38 1.38 0 0 0-1.38-1.382z"/>
                                              </svg>
                                              <span className="text-xs font-medium">LeetCode</span>
                                            </a>
                                          )}
                                          {question.youtube_link && (
                                            <a
                                              href={question.youtube_link}
                                              target="_blank"
                                              rel="noopener noreferrer"
                                              className="p-2 rounded-lg hover:bg-muted transition-colors"
                                              title="Watch Video"
                                            >
                                              <Youtube className="w-5 h-5 text-red-500" />
                                            </a>
                                          )}
                                          <Link
                                            to={`/question/${question.id}`}
                                            className="p-2 rounded-lg hover:bg-muted transition-colors"
                                            title="Read Notes"
                                          >
                                            <FileText className="w-5 h-5 text-amber-500" />
                                          </Link>
                                          <Link
                                            to={`/question/${question.id}`}
                                            className="p-2 rounded-lg hover:bg-muted transition-colors"
                                            title="View Solution"
                                          >
                                            <Code2 className="w-5 h-5 text-emerald-500" />
                                          </Link>
                                          <button
                                            onClick={() => handleBookmarkToggle(question.id, !!isQuestionBookmarked(question.id))}
                                            className="p-2 rounded-lg hover:bg-muted transition-colors"
                                            title={isQuestionBookmarked(question.id) ? "Remove Bookmark" : "Bookmark"}
                                          >
                                            {isQuestionBookmarked(question.id) ? (
                                              <BookmarkCheck className="w-5 h-5 text-primary" />
                                            ) : (
                                              <Bookmark className="w-5 h-5 text-muted-foreground" />
                                            )}
                                          </button>
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

      {/* AI Mentor */}
      <AIMentor 
        questionTitle={selectedQuestionForMentor?.title || "General DSA Question"}
        questionDescription={selectedQuestionForMentor?.title}
      />
    </div>
  );
};

export default Patterns;
