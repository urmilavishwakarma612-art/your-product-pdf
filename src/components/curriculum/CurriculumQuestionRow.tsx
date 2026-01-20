import { Link } from "react-router-dom";
import { 
  Youtube, 
  FileText, 
  Code2, 
  Bot, 
  Bookmark, 
  BookmarkCheck 
} from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";

interface Question {
  id: string;
  title: string;
  difficulty: "easy" | "medium" | "hard";
  leetcode_link: string | null;
  youtube_link: string | null;
  practice_tier: string | null;
  companies: string[] | null;
}

interface CurriculumQuestionRowProps {
  question: Question;
  isSolved: boolean;
  isBookmarked: boolean;
  onToggleSolved: () => void;
  onToggleBookmark: () => void;
  onOpenAIMentor: () => void;
  companyLogoMap: Record<string, string | null>;
  isLocked?: boolean;
}

const difficultyConfig = {
  easy: { text: "text-emerald-500", label: "Easy" },
  medium: { text: "text-amber-500", label: "Medium" },
  hard: { text: "text-red-500", label: "Hard" },
};

const tierConfig: Record<string, { color: string; label: string }> = {
  confidence: { color: "bg-emerald-500/10 text-emerald-500 border-emerald-500/30", label: "Confidence" },
  thinking: { color: "bg-amber-500/10 text-amber-500 border-amber-500/30", label: "Thinking" },
  interview: { color: "bg-red-500/10 text-red-500 border-red-500/30", label: "Interview" },
};

export const CurriculumQuestionRow = ({
  question,
  isSolved,
  isBookmarked,
  onToggleSolved,
  onToggleBookmark,
  onOpenAIMentor,
  companyLogoMap,
  isLocked = false,
}: CurriculumQuestionRowProps) => {
  const difficulty = difficultyConfig[question.difficulty];
  const tier = question.practice_tier ? tierConfig[question.practice_tier] : null;

  return (
    <div
      className={`px-3 sm:px-4 py-2.5 sm:py-3 border-b border-border/50 last:border-0 hover:bg-muted/20 transition-colors ${
        isSolved ? "bg-success/5" : ""
      }`}
    >
      {/* Row 1: Title + Difficulty + LeetCode & YouTube */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Checkbox */}
        <Checkbox
          checked={isSolved}
          onCheckedChange={onToggleSolved}
          disabled={isLocked}
          className="h-4 w-4 sm:h-5 sm:w-5 rounded border-2 border-muted-foreground/40 data-[state=checked]:bg-primary data-[state=checked]:border-primary shrink-0"
        />

        {/* Title + Badges */}
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <Link 
            to={isLocked ? "#" : `/question/${question.id}`}
            className={`font-medium text-sm sm:text-base hover:text-primary transition-colors truncate ${
              isLocked ? "text-muted-foreground pointer-events-none" : "text-foreground"
            }`}
          >
            {question.title}
          </Link>
          <Badge 
            variant="outline" 
            className={`${difficulty.text} border-current bg-transparent font-medium text-[10px] sm:text-xs px-1.5 sm:px-2 py-0 sm:py-0.5 shrink-0`}
          >
            {difficulty.label}
          </Badge>
          {tier && (
            <Badge 
              variant="outline" 
              className={`${tier.color} font-medium text-[10px] sm:text-xs px-1.5 sm:px-2 py-0 sm:py-0.5 shrink-0 hidden sm:inline-flex`}
            >
              {tier.label}
            </Badge>
          )}
        </div>

        {/* Practice (Tutor) & YouTube */}
        <div className="flex items-center gap-0.5 shrink-0">
          {!isLocked && (
            <Link
              to={`/tutor?q=${question.id}`}
              className="flex items-center gap-1 px-1.5 sm:px-2 py-1 rounded-md hover:bg-primary/10 transition-colors text-primary"
              title="Practice with NexMentor"
            >
              <Bot className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span className="text-[10px] sm:text-xs font-medium hidden sm:inline">Practice</span>
            </Link>
          )}
          {question.youtube_link && (
            <a
              href={question.youtube_link}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 px-1.5 sm:px-2 py-1 rounded-md hover:bg-muted transition-colors"
              title="Video"
            >
              <Youtube className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-red-500" />
              <span className="text-[10px] sm:text-xs font-medium text-red-500 hidden sm:inline">YT</span>
            </a>
          )}
        </div>
      </div>

      {/* Row 2: Notes, AI Mentor, Solution, Bookmark */}
      <div className="flex items-center gap-1 mt-1.5 ml-6 sm:ml-8">
        <Link
          to={isLocked ? "#" : `/question/${question.id}`}
          className={`flex items-center gap-1 px-1.5 sm:px-2 py-0.5 rounded-md hover:bg-muted transition-colors text-amber-500 ${
            isLocked ? "pointer-events-none opacity-50" : ""
          }`}
          title="Notes"
        >
          <FileText className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
          <span className="text-[10px] sm:text-xs font-medium">Notes</span>
        </Link>
        <button
          onClick={onOpenAIMentor}
          disabled={isLocked}
          className={`flex items-center gap-1 px-1.5 sm:px-2 py-0.5 rounded-md hover:bg-muted transition-colors text-primary ${
            isLocked ? "opacity-50 cursor-not-allowed" : ""
          }`}
          title="AI Mentor"
        >
          <Bot className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
          <span className="text-[10px] sm:text-xs font-medium">AI</span>
        </button>
        <Link
          to={isLocked ? "#" : `/question/${question.id}`}
          className={`flex items-center gap-1 px-1.5 sm:px-2 py-0.5 rounded-md hover:bg-muted transition-colors text-emerald-500 ${
            isLocked ? "pointer-events-none opacity-50" : ""
          }`}
          title="Solution"
        >
          <Code2 className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
          <span className="text-[10px] sm:text-xs font-medium">Solution</span>
        </Link>
        <button
          onClick={onToggleBookmark}
          disabled={isLocked}
          className={`flex items-center gap-1 px-1.5 sm:px-2 py-0.5 rounded-md hover:bg-muted transition-colors ${
            isBookmarked ? 'text-primary' : 'text-muted-foreground'
          } ${isLocked ? "opacity-50 cursor-not-allowed" : ""}`}
          title={isBookmarked ? "Remove Bookmark" : "Bookmark"}
        >
          {isBookmarked ? (
            <BookmarkCheck className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
          ) : (
            <Bookmark className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
          )}
          <span className="text-[10px] sm:text-xs font-medium">Save</span>
        </button>
      </div>

      {/* Row 3: Company Tags */}
      {question.companies && question.companies.length > 0 && (
        <div className="flex items-center gap-1.5 mt-1.5 ml-6 sm:ml-8 flex-wrap">
          {question.companies.slice(0, 4).map((company) => {
            const trimmedCompany = company.trim();
            const logoUrl = companyLogoMap[trimmedCompany];
            return (
              <span 
                key={trimmedCompany} 
                className="inline-flex items-center gap-1 text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 rounded-full border border-border bg-background/50 text-muted-foreground"
              >
                {logoUrl ? (
                  <img 
                    src={logoUrl} 
                    alt="" 
                    className="w-3 h-3 sm:w-3.5 sm:h-3.5 rounded-full object-contain shrink-0" 
                  />
                ) : (
                  <span className="w-3 h-3 sm:w-3.5 sm:h-3.5 rounded-full bg-muted flex items-center justify-center text-[7px] sm:text-[8px] font-medium shrink-0">
                    {trimmedCompany.charAt(0)}
                  </span>
                )}
                <span className="truncate max-w-[50px] sm:max-w-[80px]">{trimmedCompany}</span>
              </span>
            );
          })}
          {question.companies.length > 4 && (
            <span className="text-[10px] sm:text-xs text-muted-foreground shrink-0">
              +{question.companies.length - 4}
            </span>
          )}
        </div>
      )}
    </div>
  );
};
