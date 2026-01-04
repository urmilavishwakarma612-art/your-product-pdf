import { useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, ChevronRight, Clock, Lock, Unlock, BookOpen, Crown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useSubscription } from "@/hooks/useSubscription";
import { CurriculumQuestionRow } from "./CurriculumQuestionRow";

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

interface UnifiedLevelCardProps {
  level: CurriculumLevel;
  modules: CurriculumModule[];
  questions: Question[];
  index: number;
  userProgress: { question_id: string; is_solved: boolean }[];
  userBookmarks: { question_id: string }[];
  companyLogoMap: Record<string, string | null>;
  onToggleSolved: (questionId: string, isSolved: boolean) => void;
  onToggleBookmark: (questionId: string, isBookmarked: boolean) => void;
  onOpenAIMentor: (question: Question) => void;
  filterQuestion: (question: Question) => boolean;
  hasActiveFilters: boolean;
}

const levelColors: Record<number, string> = {
  0: "from-emerald-500/20 to-emerald-600/10 border-emerald-500/30",
  1: "from-green-500/20 to-green-600/10 border-green-500/30",
  2: "from-yellow-500/20 to-yellow-600/10 border-yellow-500/30",
  3: "from-orange-500/20 to-orange-600/10 border-orange-500/30",
  4: "from-blue-500/20 to-blue-600/10 border-blue-500/30",
  5: "from-purple-500/20 to-purple-600/10 border-purple-500/30",
  6: "from-red-500/20 to-red-600/10 border-red-500/30",
  7: "from-pink-500/20 to-pink-600/10 border-pink-500/30",
  8: "from-indigo-500/20 to-indigo-600/10 border-indigo-500/30",
  9: "from-cyan-500/20 to-cyan-600/10 border-cyan-500/30",
};

export const UnifiedLevelCard = ({
  level,
  modules,
  questions,
  index,
  userProgress,
  userBookmarks,
  companyLogoMap,
  onToggleSolved,
  onToggleBookmark,
  onOpenAIMentor,
  filterQuestion,
  hasActiveFilters,
}: UnifiedLevelCardProps) => {
  const [isExpanded, setIsExpanded] = useState(index === 0);
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());
  const { isPremium, canAccessPattern } = useSubscription();
  const isLevelLocked = !isPremium && !level.is_free;

  const getModuleQuestions = (patternId: string | null) => {
    if (!patternId) return [];
    return questions.filter(q => q.pattern_id === patternId);
  };

  const getModuleProgress = (patternId: string | null) => {
    const moduleQuestions = getModuleQuestions(patternId);
    if (moduleQuestions.length === 0) return { solved: 0, total: 0 };
    const solved = moduleQuestions.filter(q => 
      userProgress.some(p => p.question_id === q.id && p.is_solved)
    ).length;
    return { solved, total: moduleQuestions.length };
  };

  const getLevelProgress = () => {
    let totalSolved = 0;
    let totalQuestions = 0;
    modules.forEach(m => {
      const { solved, total } = getModuleProgress(m.pattern_id);
      totalSolved += solved;
      totalQuestions += total;
    });
    return { solved: totalSolved, total: totalQuestions };
  };

  const toggleModule = (moduleId: string, patternId: string | null) => {
    if (isLevelLocked) return;
    if (!patternId) return; // No pattern linked, navigate to module detail instead
    
    setExpandedModules(prev => {
      const newSet = new Set(prev);
      if (newSet.has(moduleId)) {
        newSet.delete(moduleId);
      } else {
        newSet.add(moduleId);
      }
      return newSet;
    });
  };

  const isQuestionSolved = (questionId: string) => 
    userProgress.some(p => p.question_id === questionId && p.is_solved);
  
  const isQuestionBookmarked = (questionId: string) => 
    userBookmarks.some(b => b.question_id === questionId);

  const colorClass = levelColors[level.level_number] || levelColors[0];
  const { solved: levelSolved, total: levelTotal } = getLevelProgress();
  const levelProgressPercent = levelTotal > 0 ? (levelSolved / levelTotal) * 100 : 0;

  return (
    <motion.div
      id={`level-${level.level_number}`}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
    >
      <div
        className={`rounded-xl border bg-gradient-to-br ${colorClass} overflow-hidden transition-all duration-300 ${
          isLevelLocked ? "opacity-75" : ""
        }`}
      >
        {/* Level Header */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full p-4 sm:p-5 flex items-center justify-between text-left"
        >
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-background/50 backdrop-blur flex items-center justify-center font-bold text-base sm:text-lg">
              {level.level_number}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-bold text-base sm:text-lg">{level.name}</h3>
                {level.is_free ? (
                  <Badge variant="outline" className="text-[10px] sm:text-xs bg-success/10 text-success border-success/30">
                    <Unlock className="w-2.5 h-2.5 sm:w-3 sm:h-3 mr-1" />
                    Free
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-[10px] sm:text-xs bg-primary/10 text-primary border-primary/30">
                    <Crown className="w-2.5 h-2.5 sm:w-3 sm:h-3 mr-1" />
                    Pro
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-3 sm:gap-4 text-xs sm:text-sm text-muted-foreground mt-1">
                <span className="flex items-center gap-1">
                  <BookOpen className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                  {modules.length} modules
                </span>
                {level.week_start && level.week_end && (
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                    Week {level.week_start}-{level.week_end}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 sm:gap-4">
            {/* Progress */}
            {levelTotal > 0 && (
              <div className="hidden sm:flex items-center gap-2">
                <div className="w-20 sm:w-24 h-2 bg-background/50 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full transition-all"
                    style={{ width: `${levelProgressPercent}%` }}
                  />
                </div>
                <span className="text-xs text-muted-foreground">
                  {levelSolved}/{levelTotal}
                </span>
              </div>
            )}

            <motion.div
              animate={{ rotate: isExpanded ? 180 : 0 }}
              transition={{ duration: 0.2 }}
            >
              <ChevronDown className="w-5 h-5 text-muted-foreground" />
            </motion.div>
          </div>
        </button>

        {/* Expanded Modules */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden"
            >
              <div className="px-4 sm:px-5 pb-4 sm:pb-5 pt-0">
                {level.description && (
                  <p className="text-xs sm:text-sm text-muted-foreground mb-4">{level.description}</p>
                )}

                {modules.length === 0 ? (
                  <p className="text-sm text-muted-foreground italic">Modules coming soon...</p>
                ) : (
                  <div className="space-y-2">
                    {modules.map((module) => {
                      const allModuleQuestions = getModuleQuestions(module.pattern_id);
                      const filteredQuestions = hasActiveFilters 
                        ? allModuleQuestions.filter(filterQuestion)
                        : allModuleQuestions;
                      const { solved, total } = getModuleProgress(module.pattern_id);
                      const isModuleExpanded = expandedModules.has(module.id);
                      const progressPercent = total > 0 ? (solved / total) * 100 : 0;
                      const hasQuestions = module.pattern_id && allModuleQuestions.length > 0;

                      // Skip modules with no matching questions when filters are active
                      if (hasActiveFilters && filteredQuestions.length === 0 && hasQuestions) {
                        return null;
                      }

                      return (
                        <div
                          key={module.id}
                          className={`rounded-lg border bg-card overflow-hidden transition-all ${
                            isLevelLocked 
                              ? "border-border/50 opacity-60" 
                              : "border-border hover:border-primary/30"
                          }`}
                        >
                          {/* Module Header */}
                          <div className="flex items-center">
                            {hasQuestions ? (
                              <button
                                onClick={() => toggleModule(module.id, module.pattern_id)}
                                disabled={isLevelLocked}
                                className={`flex-1 px-3 sm:px-4 py-2.5 sm:py-3 flex items-center justify-between text-left ${
                                  isLevelLocked ? "" : "hover:bg-muted/30"
                                } transition-colors`}
                              >
                                <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                                  {isLevelLocked ? (
                                    <Lock className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                                  ) : (
                                    <ChevronRight 
                                      className={`w-3.5 h-3.5 text-muted-foreground transition-transform duration-200 shrink-0 ${
                                        isModuleExpanded ? "rotate-90" : ""
                                      }`}
                                    />
                                  )}
                                  <div className="min-w-0">
                                    <span className="font-medium text-sm sm:text-base truncate block">
                                      {module.name}
                                      <span className="text-muted-foreground font-normal ml-1">
                                        ({allModuleQuestions.length})
                                      </span>
                                    </span>
                                    {module.subtitle && (
                                      <span className="text-xs text-muted-foreground block truncate">
                                        {module.subtitle}
                                      </span>
                                    )}
                                  </div>
                                </div>

                                <div className="flex items-center gap-2 sm:gap-3 shrink-0 ml-2">
                                  <span className="text-xs text-muted-foreground">{solved}/{total}</span>
                                  <div className="w-12 sm:w-20 h-1.5 bg-muted rounded-full overflow-hidden">
                                    <div 
                                      className={`h-full rounded-full transition-all duration-300 ${
                                        isLevelLocked ? "bg-muted-foreground/30" : "bg-primary"
                                      }`}
                                      style={{ width: `${progressPercent}%` }}
                                    />
                                  </div>
                                </div>
                              </button>
                            ) : (
                              <Link
                                to={isLevelLocked ? "#" : `/curriculum/module/${module.id}`}
                                className={`flex-1 px-3 sm:px-4 py-2.5 sm:py-3 flex items-center justify-between ${
                                  isLevelLocked ? "pointer-events-none" : "hover:bg-muted/30"
                                } transition-colors`}
                              >
                                <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                                  {isLevelLocked ? (
                                    <Lock className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                                  ) : (
                                    <ChevronRight className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                                  )}
                                  <div className="min-w-0">
                                    <span className="font-medium text-sm sm:text-base truncate block">
                                      {module.name}
                                    </span>
                                    {module.subtitle && (
                                      <span className="text-xs text-muted-foreground block truncate">
                                        {module.subtitle}
                                      </span>
                                    )}
                                  </div>
                                </div>
                                <span className="text-xs text-muted-foreground shrink-0">
                                  ~{module.estimated_hours}h
                                </span>
                              </Link>
                            )}

                            {/* View Module Detail Link */}
                            {hasQuestions && !isLevelLocked && (
                              <Link
                                to={`/curriculum/module/${module.id}`}
                                className="px-3 py-2 text-xs text-primary hover:underline shrink-0 hidden sm:block"
                              >
                                Details →
                              </Link>
                            )}
                          </div>

                          {/* Questions List */}
                          <AnimatePresence>
                            {isModuleExpanded && !isLevelLocked && hasQuestions && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: "auto", opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.2 }}
                                className="overflow-hidden"
                              >
                                <div className="border-t border-border">
                                  {filteredQuestions.length === 0 ? (
                                    <div className="px-4 py-6 text-center text-muted-foreground text-sm">
                                      {hasActiveFilters ? "No matching questions." : "No questions added yet."}
                                    </div>
                                  ) : (
                                    filteredQuestions.map((question) => (
                                      <CurriculumQuestionRow
                                        key={question.id}
                                        question={question}
                                        isSolved={isQuestionSolved(question.id)}
                                        isBookmarked={isQuestionBookmarked(question.id)}
                                        onToggleSolved={() => onToggleSolved(question.id, isQuestionSolved(question.id))}
                                        onToggleBookmark={() => onToggleBookmark(question.id, isQuestionBookmarked(question.id))}
                                        onOpenAIMentor={() => onOpenAIMentor(question)}
                                        companyLogoMap={companyLogoMap}
                                      />
                                    ))
                                  )}
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};
