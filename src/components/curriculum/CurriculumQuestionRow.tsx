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

        {/* LeetCode & YouTube */}
        <div className="flex items-center gap-0.5 shrink-0">
          {question.leetcode_link && (
            <a
              href={question.leetcode_link}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 px-1.5 sm:px-2 py-1 rounded-md hover:bg-muted transition-colors text-[#FFA116]"
              title="LeetCode"
            >
              <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M13.483 0a1.374 1.374 0 0 0-.961.438L7.116 6.226l-3.854 4.126a5.266 5.266 0 0 0-1.209 2.104 5.35 5.35 0 0 0-.125.513 5.527 5.527 0 0 0 .062 2.362 5.83 5.83 0 0 0 .349 1.017 5.938 5.938 0 0 0 1.271 1.818l4.277 4.193.039.038c2.248 2.165 5.852 2.133 8.063-.074l2.396-2.392c.54-.54.54-1.414.003-1.955a1.378 1.378 0 0 0-1.951-.003l-2.396 2.392a3.021 3.021 0 0 1-4.205.038l-.02-.019-4.276-4.193c-.652-.64-.972-1.469-.948-2.263a2.68 2.68 0 0 1 .066-.523 2.545 2.545 0 0 1 .619-1.164L9.13 8.114c1.058-1.134 3.204-1.27 4.43-.278l3.501 2.831c.593.48 1.461.387 1.94-.207a1.384 1.384 0 0 0-.207-1.943l-3.5-2.831c-.8-.647-1.766-1.045-2.774-1.202l2.015-2.158A1.384 1.384 0 0 0 13.483 0zm-2.866 12.815a1.38 1.38 0 0 0-1.38 1.382 1.38 1.38 0 0 0 1.38 1.382H20.79a1.38 1.38 0 0 0 1.38-1.382 1.38 1.38 0 0 0-1.38-1.382z"/>
              </svg>
              <span className="text-[10px] sm:text-xs font-medium hidden sm:inline">LC</span>
            </a>
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
