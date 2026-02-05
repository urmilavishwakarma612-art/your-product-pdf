import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Search, Filter, Bookmark, CheckCircle2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ProgressSummaryBar } from "./ProgressSummaryBar";
import { LevelTimeline } from "./LevelTimeline";
import { UnifiedLevelCard } from "@/components/curriculum/UnifiedLevelCard";
import { UpgradeModal } from "@/components/premium/UpgradeModal";
import { AIMentor } from "@/components/patterns/AIMentor";
import { toast } from "sonner";

interface CurriculumLevel {
  id: string;
  level_number: number;
  name: string;
  description: string | null;
  is_free: boolean;
  week_start: number | null;
  week_end: number | null;
  icon: string | null;
  color: string | null;
  display_order: number;
}

interface CurriculumModule {
  id: string;
  name: string;
  level_id: string;
  module_number: number;
  pattern_id: string | null;
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

interface HomeCenterPanelProps {
  searchQuery: string;
}

export function HomeCenterPanel({ searchQuery }: HomeCenterPanelProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [localSearch, setLocalSearch] = useState("");
  const [difficultyFilter, setDifficultyFilter] = useState<Set<string>>(new Set());
  const [statusFilter, setStatusFilter] = useState<"all" | "solved" | "unsolved">("all");
  const [showBookmarked, setShowBookmarked] = useState(false);
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);
  const [selectedQuestionForMentor, setSelectedQuestionForMentor] = useState<Question | null>(null);

  const handleUpgradeClick = () => {
    setUpgradeModalOpen(true);
    // Navigate to pricing after a short delay to show the modal first
    setTimeout(() => {
      navigate("/pricing");
    }, 300);
  };

  // Fetch curriculum levels
  const { data: levels = [], isLoading: levelsLoading } = useQuery({
    queryKey: ["home-curriculum-levels"],
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
    queryKey: ["home-curriculum-modules"],
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
    queryKey: ["home-questions"],
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
    queryKey: ["home-companies"],
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
    queryKey: ["home-user-progress", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data } = await supabase
        .from("user_progress")
        .select("question_id, is_solved")
        .eq("user_id", user.id);
      return data || [];
    },
    enabled: !!user?.id,
  });

  // Fetch user bookmarks
  const { data: userBookmarks = [] } = useQuery({
    queryKey: ["home-user-bookmarks", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data } = await supabase
        .from("bookmarks")
        .select("question_id")
        .eq("user_id", user.id);
      return data || [];
    },
    enabled: !!user?.id,
  });

  // Company logo map
  const companyLogoMap = useMemo(() =>
    companiesData?.reduce((acc, company) => {
      acc[company.name] = company.logo_url;
      return acc;
    }, {} as Record<string, string | null>) || {},
    [companiesData]
  );

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
      queryClient.invalidateQueries({ queryKey: ["home-user-progress"] });
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
      queryClient.invalidateQueries({ queryKey: ["home-user-bookmarks"] });
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

  const getModulesForLevel = (levelId: string) =>
    modules.filter((m) => m.level_id === levelId);

  const handleLevelClick = (level: CurriculumLevel) => {
    const element = document.getElementById(`level-${level.level_number}`);
    element?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const combinedSearch = searchQuery || localSearch;

  // Filter function for questions
  const filterQuestion = (question: Question) => {
    const matchesSearch = !combinedSearch || question.title.toLowerCase().includes(combinedSearch.toLowerCase());
    const matchesDifficulty = difficultyFilter.size === 0 || difficultyFilter.has(question.difficulty);
    const matchesBookmark = !showBookmarked || userBookmarks.some(b => b.question_id === question.id);
    const isSolved = userProgress.some(p => p.question_id === question.id && p.is_solved);
    const matchesStatus = statusFilter === "all" ||
      (statusFilter === "solved" && isSolved) ||
      (statusFilter === "unsolved" && !isSolved);
    return matchesSearch && matchesDifficulty && matchesBookmark && matchesStatus;
  };

  const hasActiveFilters = difficultyFilter.size > 0 || !!combinedSearch || showBookmarked || statusFilter !== "all";

  // Filter levels by search
  const filteredLevels = levels.filter((level) => {
    if (!combinedSearch) return true;
    const levelModules = getModulesForLevel(level.id);
    const matchesLevel = level.name.toLowerCase().includes(combinedSearch.toLowerCase());
    const matchesModule = levelModules.some((m) =>
      m.name.toLowerCase().includes(combinedSearch.toLowerCase())
    );
    // Check if any question in level matches
    const patternIds = levelModules.map(m => m.pattern_id).filter(Boolean);
    const matchesQuestion = questions.some(q =>
      patternIds.includes(q.pattern_id) &&
      q.title.toLowerCase().includes(combinedSearch.toLowerCase())
    );
    return matchesLevel || matchesModule || matchesQuestion;
  });

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Progress Summary */}
      <ProgressSummaryBar />

      {/* Level Timeline */}
      <LevelTimeline levels={levels} onLevelClick={handleLevelClick} onUpgradeClick={handleUpgradeClick} />

      {/* Filters Header */}
      <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
        <div className="flex-1 min-w-[140px] sm:min-w-[200px]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              placeholder="Search..."
              className="pl-10 h-9 text-sm"
            />
          </div>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="gap-1.5 h-9 text-xs sm:text-sm">
              <Filter className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Difficulty</span>
              {difficultyFilter.size > 0 && (
                <Badge variant="secondary" className="ml-1 h-4 px-1 text-[10px]">
                  {difficultyFilter.size}
                </Badge>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            {["easy", "medium", "hard"].map((diff) => (
              <DropdownMenuCheckboxItem
                key={diff}
                checked={difficultyFilter.has(diff)}
                onCheckedChange={(checked) => {
                  setDifficultyFilter((prev) => {
                    const newSet = new Set(prev);
                    if (checked) {
                      newSet.add(diff);
                    } else {
                      newSet.delete(diff);
                    }
                    return newSet;
                  });
                }}
              >
                {diff.charAt(0).toUpperCase() + diff.slice(1)}
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="gap-1.5 h-9 text-xs sm:text-sm">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Status</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            {[
              { value: "all", label: "All" },
              { value: "solved", label: "Solved" },
              { value: "unsolved", label: "Unsolved" },
            ].map((status) => (
              <DropdownMenuCheckboxItem
                key={status.value}
                checked={statusFilter === status.value}
                onCheckedChange={() => setStatusFilter(status.value as typeof statusFilter)}
              >
                {status.label}
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <Button
          variant={showBookmarked ? "default" : "outline"}
          size="sm"
          onClick={() => setShowBookmarked(!showBookmarked)}
          className="gap-1.5 h-9 text-xs sm:text-sm"
        >
          <Bookmark className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Saved</span>
        </Button>
      </div>

      {/* Learning Path Title */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg sm:text-xl font-bold">Learning Path</h2>
        <span className="text-xs sm:text-sm text-muted-foreground">
          {filteredLevels.length} levels
        </span>
      </div>

      {/* Level Cards - Using UnifiedLevelCard from Curriculum */}
      <div className="space-y-3 sm:space-y-4">
        {levelsLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 sm:h-24 bg-card/50 animate-pulse rounded-xl" />
            ))}
          </div>
        ) : filteredLevels.length > 0 ? (
          filteredLevels.map((level, index) => (
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
              onUpgradeClick={handleUpgradeClick}
            />
          ))
        ) : (
          <div className="text-center py-8 sm:py-12 text-muted-foreground">
            No levels match your search
          </div>
        )}
      </div>

      <UpgradeModal isOpen={upgradeModalOpen} onClose={() => setUpgradeModalOpen(false)} />

      {/* AI Mentor */}
      <AIMentor
        questionTitle={selectedQuestionForMentor?.title || "General DSA Question"}
        questionDescription={selectedQuestionForMentor?.title}
        isOpen={!!selectedQuestionForMentor}
        onClose={() => setSelectedQuestionForMentor(null)}
      />
    </div>
  );
}
