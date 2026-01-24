import { useState } from "react";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
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
import { HomeLevelCard } from "./HomeLevelCard";
import { UpgradeModal } from "@/components/premium/UpgradeModal";

interface CurriculumLevel {
  id: string;
  level_number: number;
  name: string;
  description: string | null;
  is_free: boolean | null;
  week_start: number | null;
  week_end: number | null;
  icon: string | null;
  color: string | null;
}

interface CurriculumModule {
  id: string;
  name: string;
  level_id: string | null;
  module_number: number;
  pattern_id: string | null;
  subtitle: string | null;
}

interface HomeCenterPanelProps {
  searchQuery: string;
}

export function HomeCenterPanel({ searchQuery }: HomeCenterPanelProps) {
  const { user } = useAuth();
  const [localSearch, setLocalSearch] = useState("");
  const [difficultyFilter, setDifficultyFilter] = useState<string[]>([]);
  const [statusFilter, setStatusFilter] = useState<"all" | "solved" | "unsolved">("all");
  const [showBookmarked, setShowBookmarked] = useState(false);
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);

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

  // Fetch user progress
  const { data: userProgress = [] } = useQuery({
    queryKey: ["home-user-progress", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data } = await supabase
        .from("user_progress")
        .select("question_id, is_solved")
        .eq("user_id", user.id)
        .eq("is_solved", true);
      return data || [];
    },
    enabled: !!user?.id,
  });

  // Fetch questions for progress calculation
  const { data: questions = [] } = useQuery({
    queryKey: ["home-questions-progress"],
    queryFn: async () => {
      const { data } = await supabase
        .from("questions")
        .select("id, pattern_id");
      return data || [];
    },
  });

  const getModulesForLevel = (levelId: string) =>
    modules.filter((m) => m.level_id === levelId);

  const getLevelProgress = (levelId: string) => {
    const levelModules = getModulesForLevel(levelId);
    const patternIds = levelModules.map((m) => m.pattern_id).filter(Boolean);
    const levelQuestions = questions.filter((q) => patternIds.includes(q.pattern_id));
    const solvedIds = new Set(userProgress.map((p) => p.question_id));
    const solved = levelQuestions.filter((q) => solvedIds.has(q.id)).length;
    return { solved, total: levelQuestions.length };
  };

  const handleLevelClick = (level: CurriculumLevel) => {
    const element = document.getElementById(`level-${level.level_number}`);
    element?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const combinedSearch = searchQuery || localSearch;

  // Filter levels by search
  const filteredLevels = levels.filter((level) => {
    if (!combinedSearch) return true;
    const levelModules = getModulesForLevel(level.id);
    const matchesLevel = level.name.toLowerCase().includes(combinedSearch.toLowerCase());
    const matchesModule = levelModules.some((m) =>
      m.name.toLowerCase().includes(combinedSearch.toLowerCase())
    );
    return matchesLevel || matchesModule;
  });

  return (
    <div className="space-y-6">
      {/* Progress Summary */}
      <ProgressSummaryBar />

      {/* Level Timeline */}
      <LevelTimeline levels={levels} onLevelClick={handleLevelClick} />

      {/* Filters Header */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex-1 min-w-[200px]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              placeholder="Search levels, modules..."
              className="pl-10"
            />
          </div>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2">
              <Filter className="w-4 h-4" />
              Difficulty
              {difficultyFilter.length > 0 && (
                <Badge variant="secondary" className="ml-1 h-5 px-1.5">
                  {difficultyFilter.length}
                </Badge>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            {["easy", "medium", "hard"].map((diff) => (
              <DropdownMenuCheckboxItem
                key={diff}
                checked={difficultyFilter.includes(diff)}
                onCheckedChange={(checked) => {
                  setDifficultyFilter((prev) =>
                    checked ? [...prev, diff] : prev.filter((d) => d !== diff)
                  );
                }}
              >
                {diff.charAt(0).toUpperCase() + diff.slice(1)}
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2">
              <CheckCircle2 className="w-4 h-4" />
              Status
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
                onCheckedChange={() => setStatusFilter(status.value as any)}
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
          className="gap-2"
        >
          <Bookmark className="w-4 h-4" />
          <span className="hidden sm:inline">Bookmarks</span>
        </Button>
      </div>

      {/* Level Cards */}
      <div className="space-y-4">
        {levelsLoading ? (
          <div className="text-center py-12 text-muted-foreground">
            Loading curriculum...
          </div>
        ) : filteredLevels.length > 0 ? (
          filteredLevels.map((level) => (
            <HomeLevelCard
              key={level.id}
              level={level}
              modules={getModulesForLevel(level.id)}
              progress={user ? getLevelProgress(level.id) : undefined}
              onUpgradeClick={() => setUpgradeModalOpen(true)}
              searchQuery={combinedSearch}
            />
          ))
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            No levels match your search
          </div>
        )}
      </div>

      <UpgradeModal isOpen={upgradeModalOpen} onClose={() => setUpgradeModalOpen(false)} />
    </div>
  );
}
