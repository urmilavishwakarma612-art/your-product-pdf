import { useState, useMemo, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import { AppLayout } from "@/components/layout/AppLayout";
import { UnifiedLevelCard } from "@/components/curriculum/UnifiedLevelCard";
import { CurriculumOverallProgress } from "@/components/curriculum/CurriculumOverallProgress";
import { CurriculumFilters } from "@/components/curriculum/CurriculumFilters";
import { WeekTimeline } from "@/components/curriculum/WeekTimeline";
import { AIMentor } from "@/components/patterns/AIMentor";
import { SpacedRepetition } from "@/components/patterns/SpacedRepetition";
import { UpgradeBanner } from "@/components/premium/UpgradeBanner";
import { UpgradeModal } from "@/components/premium/UpgradeModal";
import { useAuth } from "@/hooks/useAuth";
import { useSubscription } from "@/hooks/useSubscription";
import { Helmet } from "react-helmet-async";
import { BookOpen, Target, Brain, Zap } from "lucide-react";
import { toast } from "sonner";

interface CurriculumLevel {
  id: string;
  level_number: number;
  name: string;
  description: string | null;
  color: string | null;
  icon: string | null;
  week_start: number | null;
  week_end: number | null;
  is_free: boolean;
  display_order: number;
}

interface CurriculumModule {
  id: string;
  level_id: string;
  pattern_id: string | null;
  module_number: number;
  name: string;
  subtitle: string | null;
  estimated_hours: number;
  display_order: number;
}

interface Question {
  id: string;
  title: string;
  difficulty: "easy" | "medium" | "hard";
  leetcode_link: string | null;
  youtube_link: string | null;
  pattern_id: string;
  practice_tier: string | null;
  companies: string[] | null;
}

const Curriculum = () => {
  const { user } = useAuth();
  const { isPremium } = useSubscription();
  const queryClient = useQueryClient();
  const location = useLocation();

  // Filters state
  const [searchQuery, setSearchQuery] = useState("");
  const [difficultyFilter, setDifficultyFilter] = useState<Set<string>>(new Set());
  const [statusFilter, setStatusFilter] = useState<"all" | "solved" | "unsolved">("all");
  const [bookmarkFilter, setBookmarkFilter] = useState(false);
  const [selectedQuestionForMentor, setSelectedQuestionForMentor] = useState<Question | null>(null);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  // Handle scroll to level from hash
  useEffect(() => {
    const hash = location.hash;
    if (hash && hash.startsWith("#level-")) {
      const levelNumber = hash.replace("#level-", "");
      setTimeout(() => {
        const element = document.getElementById(`level-${levelNumber}`);
        if (element) {
          element.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      }, 500);
    }
  }, [location.hash]);

  // Fetch curriculum levels
  const { data: levels = [], isLoading: levelsLoading } = useQuery({
    queryKey: ["curriculum-levels"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("curriculum_levels")
        .select("*")
        .order("display_order", { ascending: true });
      if (error) throw error;
      return data as CurriculumLevel[];
    },
  });

  // Fetch curriculum modules
  const { data: modules = [] } = useQuery({
    queryKey: ["curriculum-modules"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("curriculum_modules")
        .select("*")
        .order("display_order", { ascending: true });
      if (error) throw error;
      return data as CurriculumModule[];
    },
  });

  // Fetch all questions
  const { data: questions = [] } = useQuery({
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

  // Fetch companies for logos
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

  // Fetch user progress
  const { data: userProgress = [] } = useQuery({
    queryKey: ["user-progress", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("user_progress")
        .select("question_id, is_solved")
        .eq("user_id", user.id);
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  // Fetch user bookmarks
  const { data: userBookmarks = [] } = useQuery({
    queryKey: ["user-bookmarks", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("bookmarks")
        .select("question_id")
        .eq("user_id", user.id);
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  // Company logo map
  const companyLogoMap = useMemo(() => 
    companiesData?.reduce((acc, company) => {
      acc[company.name] = company.logo_url;
      return acc;
    }, {} as Record<string, string | null>) || {},
  [companiesData]);

  // Toggle solved mutation
  const toggleSolvedMutation = useMutation({
    mutationFn: async ({ questionId, isSolved }: { questionId: string; isSolved: boolean }) => {
      if (!user) throw new Error("Not authenticated");

      const existingProgress = userProgress.find(p => p.question_id === questionId);

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

  // Toggle bookmark mutation
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
          .insert({ user_id: user.id, question_id: questionId });
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

  // Handlers
  const handleToggleSolved = (questionId: string, currentlySolved: boolean) => {
    if (!user) {
      toast.error("Please login to track progress");
      return;
    }
    toggleSolvedMutation.mutate({ questionId, isSolved: !currentlySolved });
  };

  const handleToggleBookmark = (questionId: string, isBookmarked: boolean) => {
    if (!user) {
      toast.error("Please login to bookmark questions");
      return;
    }
    toggleBookmarkMutation.mutate({ questionId, isBookmarked });
  };

  // Filter function
  const filterQuestion = (question: Question) => {
    const matchesSearch = !searchQuery || question.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDifficulty = difficultyFilter.size === 0 || difficultyFilter.has(question.difficulty);
    const matchesBookmark = !bookmarkFilter || userBookmarks.some(b => b.question_id === question.id);
    const isSolved = userProgress.some(p => p.question_id === question.id && p.is_solved);
    const matchesStatus = statusFilter === "all" || 
      (statusFilter === "solved" && isSolved) ||
      (statusFilter === "unsolved" && !isSolved);
    return matchesSearch && matchesDifficulty && matchesBookmark && matchesStatus;
  };

  const hasActiveFilters = difficultyFilter.size > 0 || !!searchQuery || bookmarkFilter || statusFilter !== "all";

  // Calculate progress stats
  const solvedQuestionIds = new Set(userProgress.filter(p => p.is_solved).map(p => p.question_id));
  const totalQuestions = questions.length;
  const totalSolved = questions.filter(q => solvedQuestionIds.has(q.id)).length;
  
  const easyQuestions = questions.filter(q => q.difficulty === "easy");
  const mediumQuestions = questions.filter(q => q.difficulty === "medium");
  const hardQuestions = questions.filter(q => q.difficulty === "hard");
  
  const easySolved = easyQuestions.filter(q => solvedQuestionIds.has(q.id)).length;
  const mediumSolved = mediumQuestions.filter(q => solvedQuestionIds.has(q.id)).length;
  const hardSolved = hardQuestions.filter(q => solvedQuestionIds.has(q.id)).length;

  const getModulesForLevel = (levelId: string) =>
    modules.filter((m) => m.level_id === levelId);

  const philosophyItems = [
    {
      icon: Target,
      title: "Pattern Recognition",
      description: "Learn to identify patterns in < 5 seconds, not memorize solutions",
    },
    {
      icon: Brain,
      title: "Mental Models",
      description: "Build visual thinking frameworks for each pattern type",
    },
    {
      icon: BookOpen,
      title: "Why Before How",
      description: "Understand WHY patterns work before learning implementation",
    },
    {
      icon: Zap,
      title: "Interview Ready",
      description: "Practice ladder from confidence → thinking → interview twists",
    },
  ];

  return (
    <>
      <Helmet>
        <title>DSA Curriculum - Pattern-First Learning | NexAlgoTrix</title>
        <meta
          name="description"
          content="18-week structured DSA curriculum with pattern-first learning. Stop memorizing, start recognizing patterns."
        />
      </Helmet>

      <AppLayout>
        {/* Upgrade Banner for free users */}
        {!isPremium && user && (
          <UpgradeBanner 
            onUpgradeClick={() => setShowUpgradeModal(true)}
            completedPhase1={false}
          />
        )}

        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-8 sm:mb-12"
        >
          <span className="inline-block px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium mb-4 sm:mb-6">
            Pattern-First Learning
          </span>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-3 sm:mb-4">
            <span className="gradient-text">18-Week DSA</span>{" "}
            <span className="text-foreground">Curriculum</span>
          </h1>
          <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto">
            Stop memorizing solutions. Start recognizing patterns.
            Build interview intuition that lasts.
          </p>
        </motion.div>

        {/* Philosophy Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-8">
          {philosophyItems.map((item, index) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="glass-card p-4 sm:p-5"
            >
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-2 sm:mb-3">
                <item.icon className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
              </div>
              <h3 className="font-semibold text-sm sm:text-base mb-1">{item.title}</h3>
              <p className="text-xs sm:text-sm text-muted-foreground">{item.description}</p>
            </motion.div>
          ))}
        </div>

        {/* Overall Progress */}
        {user && (
          <CurriculumOverallProgress
            totalSolved={totalSolved}
            totalQuestions={totalQuestions}
            easySolved={easySolved}
            easyTotal={easyQuestions.length}
            mediumSolved={mediumSolved}
            mediumTotal={mediumQuestions.length}
            hardSolved={hardSolved}
            hardTotal={hardQuestions.length}
          />
        )}

        {/* Spaced Repetition */}
        <SpacedRepetition />

        {/* Week Timeline */}
        <WeekTimeline levels={levels} />

        {/* Filters */}
        <div className="mt-8">
          <h2 className="text-xl sm:text-2xl font-bold mb-4">Learning Path</h2>
          <CurriculumFilters
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            difficultyFilter={difficultyFilter}
            setDifficultyFilter={setDifficultyFilter}
            statusFilter={statusFilter}
            setStatusFilter={setStatusFilter}
            bookmarkFilter={bookmarkFilter}
            setBookmarkFilter={setBookmarkFilter}
            totalQuestions={totalQuestions}
            totalSolved={totalSolved}
            difficultyCounts={{
              easy: easyQuestions.length,
              medium: mediumQuestions.length,
              hard: hardQuestions.length,
            }}
          />
        </div>

        {/* Levels */}
        {levelsLoading ? (
          <div className="space-y-4 sm:space-y-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 sm:h-32 bg-card/50 animate-pulse rounded-xl" />
            ))}
          </div>
        ) : levels.length === 0 ? (
          <div className="text-center py-16 sm:py-20">
            <p className="text-muted-foreground">Curriculum coming soon...</p>
          </div>
        ) : (
          <div className="space-y-4 sm:space-y-6">
            {levels.map((level, index) => (
              <UnifiedLevelCard
                key={level.id}
                level={level}
                modules={getModulesForLevel(level.id)}
                questions={questions}
                index={index}
                userProgress={userProgress}
                userBookmarks={userBookmarks}
                companyLogoMap={companyLogoMap}
                onToggleSolved={handleToggleSolved}
                onToggleBookmark={handleToggleBookmark}
                onOpenAIMentor={setSelectedQuestionForMentor}
                filterQuestion={filterQuestion}
                hasActiveFilters={hasActiveFilters}
              />
            ))}
          </div>
        )}
      </AppLayout>

      {/* AI Mentor */}
      <AIMentor 
        questionTitle={selectedQuestionForMentor?.title || "General DSA Question"}
        questionDescription={selectedQuestionForMentor?.title}
        isOpen={!!selectedQuestionForMentor}
        onClose={() => setSelectedQuestionForMentor(null)}
      />

      {/* Upgrade Modal */}
      <UpgradeModal 
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        triggerContext={"curriculum"}
      />
    </>
  );
};

export default Curriculum;