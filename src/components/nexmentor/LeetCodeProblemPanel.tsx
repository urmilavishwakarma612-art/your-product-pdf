import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronDown,
  ChevronRight,
  Lightbulb,
  ExternalLink,
  Lock,
  Building2,
  AlertCircle,
  Copy,
  Check,
  Sparkles,
  Trophy,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface Example {
  input: string;
  output: string;
  explanation?: string;
}

interface LeetCodeProblemPanelProps {
  title: string;
  difficulty: "easy" | "medium" | "hard";
  description: string;
  examples?: Example[];
  constraints?: string[];
  hints?: string[];
  companies?: string[];
  leetcodeLink?: string;
  isLeetcodeUnlocked: boolean;
  userCode?: string;
}

const difficultyConfig = {
  easy: { label: "Easy", color: "text-emerald-500 bg-emerald-500/10 border-emerald-500/30" },
  medium: { label: "Medium", color: "text-amber-500 bg-amber-500/10 border-amber-500/30" },
  hard: { label: "Hard", color: "text-red-500 bg-red-500/10 border-red-500/30" },
};

export function LeetCodeProblemPanel({
  title,
  difficulty,
  description,
  examples = [],
  constraints = [],
  hints = [],
  companies = [],
  leetcodeLink,
  isLeetcodeUnlocked,
  userCode,
}: LeetCodeProblemPanelProps) {
  const [hintsOpen, setHintsOpen] = useState(false);
  const [hintsRevealed, setHintsRevealed] = useState<number[]>([]);
  const [codeCopied, setCodeCopied] = useState(false);

  const revealHint = (index: number) => {
    if (!hintsRevealed.includes(index)) {
      setHintsRevealed([...hintsRevealed, index]);
    }
  };

  const handleCopyCode = async () => {
    if (!userCode) return;
    try {
      await navigator.clipboard.writeText(userCode);
      setCodeCopied(true);
      toast.success("Code copied to clipboard!");
      setTimeout(() => setCodeCopied(false), 2000);
    } catch {
      toast.error("Failed to copy code");
    }
  };

  // Parse examples from description if not provided separately
  const parsedExamples = examples.length > 0 ? examples : parseExamplesFromDescription(description);
  const cleanDescription = removeExamplesFromDescription(description);

  return (
    <ScrollArea className="h-full">
      <div className="p-4 sm:p-5 space-y-5">
        {/* Title & Difficulty */}
        <div className="space-y-2">
          <h2 className="text-lg sm:text-xl font-bold text-foreground leading-tight">{title}</h2>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className={cn("text-xs", difficultyConfig[difficulty]?.color)}>
              {difficultyConfig[difficulty]?.label}
            </Badge>
          </div>
        </div>

        {/* LeetCode Submit Section - Shows prominently when unlocked */}
        <AnimatePresence mode="wait">
          {isLeetcodeUnlocked && leetcodeLink ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="p-4 rounded-xl bg-gradient-to-r from-emerald-500/10 via-primary/10 to-emerald-500/10 border-2 border-emerald-500/50 space-y-3"
            >
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center">
                  <Trophy className="w-4 h-4 text-emerald-500" />
                </div>
                <div>
                  <h3 className="font-semibold text-emerald-600 dark:text-emerald-400">
                    🎉 Flow Complete!
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    You thought it through. Now submit on LeetCode.
                  </p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-2">
                {userCode && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={handleCopyCode}
                  >
                    {codeCopied ? (
                      <>
                        <Check className="w-4 h-4 mr-2 text-emerald-500" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4 mr-2" />
                        Copy Code
                      </>
                    )}
                  </Button>
                )}
                <a
                  href={leetcodeLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1"
                >
                  <Button
                    className="w-full bg-gradient-to-r from-[#FFA116] to-[#FF8C00] hover:from-[#FF8C00] hover:to-[#FFA116] text-white"
                    size="sm"
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Submit on LeetCode
                  </Button>
                </a>
              </div>

              <p className="text-[10px] text-muted-foreground text-center">
                👉 Train here. Perform there.
              </p>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="p-3 rounded-lg bg-muted/50 border border-border flex items-center gap-2"
            >
              <Lock className="w-4 h-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">
                Complete all 7 steps to unlock LeetCode submission
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Description */}
        <div className="prose prose-sm dark:prose-invert max-w-none">
          <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
            {cleanDescription}
          </p>
        </div>

        {/* Examples - LeetCode Style */}
        {parsedExamples.length > 0 && (
          <div className="space-y-3">
            <h3 className="font-semibold text-foreground text-sm">Examples</h3>
            {parsedExamples.map((example, idx) => (
              <div
                key={idx}
                className="rounded-lg bg-muted/30 border border-border/50 overflow-hidden"
              >
                <div className="px-3 py-2 bg-muted/50 border-b border-border/50">
                  <span className="text-xs font-medium text-muted-foreground">
                    Example {idx + 1}
                  </span>
                </div>
                <div className="p-3 space-y-2 font-mono text-xs sm:text-sm">
                  <div>
                    <span className="text-muted-foreground">Input: </span>
                    <span className="text-foreground">{example.input}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Output: </span>
                    <span className="text-primary font-semibold">{example.output}</span>
                  </div>
                  {example.explanation && (
                    <div className="pt-2 border-t border-border/30 text-muted-foreground">
                      <span className="font-medium text-foreground">Explanation: </span>
                      {example.explanation}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Constraints */}
        {constraints.length > 0 && (
          <div className="space-y-2">
            <h3 className="font-semibold text-foreground text-sm flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-500" />
              Constraints
            </h3>
            <ul className="space-y-1.5 pl-1">
              {constraints.map((constraint, idx) => (
                <li key={idx} className="text-xs text-muted-foreground font-mono flex items-start gap-2">
                  <span className="text-primary">•</span>
                  <span>{constraint}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Hints - Progressive Reveal */}
        {hints.length > 0 && (
          <Collapsible open={hintsOpen} onOpenChange={setHintsOpen}>
            <CollapsibleTrigger asChild>
              <Button
                variant="ghost"
                className="w-full justify-between h-auto py-2.5 px-3 bg-amber-500/5 hover:bg-amber-500/10 border border-amber-500/20 rounded-lg"
              >
                <div className="flex items-center gap-2">
                  <Lightbulb className="w-4 h-4 text-amber-500" />
                  <span className="text-sm font-medium">Hints</span>
                  <Badge variant="secondary" className="text-xs">{hints.length}</Badge>
                </div>
                {hintsOpen ? (
                  <ChevronDown className="w-4 h-4" />
                ) : (
                  <ChevronRight className="w-4 h-4" />
                )}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-2 space-y-2">
              {hints.map((hint, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                >
                  {hintsRevealed.includes(idx) ? (
                    <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs sm:text-sm">
                      <span className="text-amber-600 dark:text-amber-400 font-medium">
                        Hint {idx + 1}:{" "}
                      </span>
                      <span className="text-muted-foreground">{hint}</span>
                    </div>
                  ) : (
                    <Button
                      variant="ghost"
                      className="w-full justify-start h-auto py-2.5 px-3 bg-muted/30 hover:bg-muted/50 text-muted-foreground text-sm"
                      onClick={() => revealHint(idx)}
                    >
                      <Lightbulb className="w-4 h-4 mr-2 text-amber-500/50" />
                      Reveal Hint {idx + 1}
                    </Button>
                  )}
                </motion.div>
              ))}
            </CollapsibleContent>
          </Collapsible>
        )}

        {/* Companies */}
        {companies.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5" />
              Asked by
            </h4>
            <div className="flex flex-wrap gap-1.5">
              {companies.map((company, idx) => (
                <Badge key={idx} variant="secondary" className="text-xs">
                  {company}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </div>
    </ScrollArea>
  );
}

// Helper: Parse examples from description text if not provided
function parseExamplesFromDescription(description: string): Example[] {
  const examples: Example[] = [];
  const exampleRegex = /Example\s*\d*[:\s]*\n*Input:\s*([^\n]+)\n*Output:\s*([^\n]+)(?:\n*Explanation:\s*([^\n]+))?/gi;
  
  let match;
  while ((match = exampleRegex.exec(description)) !== null) {
    examples.push({
      input: match[1].trim(),
      output: match[2].trim(),
      explanation: match[3]?.trim(),
    });
  }
  
  return examples;
}

// Helper: Remove examples section from description for cleaner display
function removeExamplesFromDescription(description: string): string {
  // Remove example blocks from description
  return description
    .replace(/Example\s*\d*[:\s]*\n*Input:\s*[^\n]+\n*Output:\s*[^\n]+(?:\n*Explanation:\s*[^\n]+)?/gi, "")
    .replace(/Constraints:\s*(?:\n*•[^\n]+)+/gi, "")
    .trim();
}
