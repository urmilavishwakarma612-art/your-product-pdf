import { Search, Filter, ChevronDown, X, BookmarkCheck } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface CurriculumFiltersProps {
  searchQuery: string;
  setSearchQuery: (value: string) => void;
  difficultyFilter: Set<string>;
  setDifficultyFilter: (value: Set<string>) => void;
  statusFilter: "all" | "solved" | "unsolved";
  setStatusFilter: (value: "all" | "solved" | "unsolved") => void;
  bookmarkFilter: boolean;
  setBookmarkFilter: (value: boolean) => void;
  totalQuestions: number;
  totalSolved: number;
  difficultyCounts: { easy: number; medium: number; hard: number };
}

export const CurriculumFilters = ({
  searchQuery,
  setSearchQuery,
  difficultyFilter,
  setDifficultyFilter,
  statusFilter,
  setStatusFilter,
  bookmarkFilter,
  setBookmarkFilter,
  totalQuestions,
  totalSolved,
  difficultyCounts,
}: CurriculumFiltersProps) => {
  const hasActiveFilters = difficultyFilter.size > 0 || searchQuery || bookmarkFilter || statusFilter !== "all";

  const clearFilters = () => {
    setDifficultyFilter(new Set());
    setSearchQuery("");
    setBookmarkFilter(false);
    setStatusFilter("all");
  };

  return (
    <div className="flex flex-col gap-3 mb-6">
      {/* Search Bar */}
      <div className="relative w-full">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search problems..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 bg-card border-border text-sm"
        />
      </div>

      {/* Filter Row */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Difficulty Filter */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="gap-1.5 text-xs sm:text-sm h-9 whitespace-nowrap shrink-0">
              <Filter className="w-3 h-3" />
              Difficulty
              {difficultyFilter.size > 0 && (
                <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-[10px]">{difficultyFilter.size}</Badge>
              )}
              <ChevronDown className="w-3 h-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="z-50 bg-popover">
            {(["easy", "medium", "hard"] as const).map((diff) => {
              const count = difficultyCounts[diff];
              return (
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
                  <span className="flex items-center justify-between w-full">
                    <span className="capitalize">{diff}</span>
                    <span className="text-muted-foreground text-xs ml-2">({count})</span>
                  </span>
                </DropdownMenuCheckboxItem>
              );
            })}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Status Filter */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="gap-1.5 text-xs sm:text-sm h-9 whitespace-nowrap shrink-0">
              Status
              {statusFilter !== "all" && (
                <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-[10px]">1</Badge>
              )}
              <ChevronDown className="w-3 h-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="z-50 bg-popover">
            {[
              { value: "all" as const, label: "All", count: totalQuestions },
              { value: "solved" as const, label: "Solved", count: totalSolved },
              { value: "unsolved" as const, label: "Unsolved", count: totalQuestions - totalSolved }
            ].map((status) => (
              <DropdownMenuCheckboxItem
                key={status.value}
                checked={statusFilter === status.value}
                onCheckedChange={(checked) => {
                  if (checked) setStatusFilter(status.value);
                }}
              >
                <span className="flex items-center justify-between w-full">
                  <span>{status.label}</span>
                  <span className="text-muted-foreground text-xs ml-2">({status.count})</span>
                </span>
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Bookmark Filter */}
        <Button 
          variant={bookmarkFilter ? "default" : "outline"} 
          size="sm"
          className="gap-1.5 text-xs sm:text-sm h-9 whitespace-nowrap shrink-0"
          onClick={() => setBookmarkFilter(!bookmarkFilter)}
        >
          <BookmarkCheck className="w-3 h-3" />
          Bookmarked
        </Button>

        {/* Clear Filters */}
        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters} className="gap-1 text-muted-foreground h-9 text-xs whitespace-nowrap shrink-0">
            <X className="w-3 h-3" />
            Clear
          </Button>
        )}
      </div>
    </div>
  );
};
