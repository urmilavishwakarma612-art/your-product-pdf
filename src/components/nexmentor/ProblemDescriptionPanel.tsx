import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronDown,
  ChevronRight,
  HelpCircle,
  Lightbulb,
  ExternalLink,
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

interface Example {
  input: string;
  output: string;
  explanation?: string;
}

interface ProblemDescriptionPanelProps {
  title: string;
  difficulty: "easy" | "medium" | "hard";
  description: string;
  examples: Example[];
  constraints?: string[];
  hints?: string[];
  companies?: string[];
  leetcodeLink?: string;
}

const difficultyConfig = {
  easy: { label: "Easy", color: "text-emerald-500 bg-emerald-500/10 border-emerald-500/30" },
  medium: { label: "Medium", color: "text-amber-500 bg-amber-500/10 border-amber-500/30" },
  hard: { label: "Hard", color: "text-red-500 bg-red-500/10 border-red-500/30" },
};

export function ProblemDescriptionPanel({
  title,
  difficulty,
  description,
  examples,
  constraints,
  hints,
  companies,
  leetcodeLink,
}: ProblemDescriptionPanelProps) {
  const [hintsOpen, setHintsOpen] = useState(false);
  const [hintsRevealed, setHintsRevealed] = useState<number[]>([]);

  const revealHint = (index: number) => {
    if (!hintsRevealed.includes(index)) {
      setHintsRevealed([...hintsRevealed, index]);
    }
  };

  return (
    <ScrollArea className="h-full">
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="space-y-3">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-2 text-muted-foreground">
              <HelpCircle className="w-4 h-4" />
              <span className="text-sm font-medium">Problem Description</span>
            </div>
            {leetcodeLink && (
              <a
                href={leetcodeLink}
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <ExternalLink className="w-4 h-4" />
              </a>
            )}
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-bold text-foreground">{title}</h2>
              <Badge variant="outline" className={difficultyConfig[difficulty].color}>
                {difficultyConfig[difficulty].label}
              </Badge>
            </div>
          </div>
        </div>

        {/* Description */}
        <div className="prose prose-sm dark:prose-invert max-w-none">
          <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">
            {description}
          </p>
        </div>

        {/* Examples */}
        {examples && examples.length > 0 && (
          <div className="space-y-4">
            <h3 className="font-semibold text-foreground">Examples</h3>
            {examples.map((example, idx) => (
              <div
                key={idx}
                className="p-4 rounded-lg bg-muted/30 border border-border/50 space-y-2"
              >
                <div className="font-mono text-sm">
                  <span className="text-muted-foreground">Input: </span>
                  <span className="text-foreground">{example.input}</span>
                </div>
                <div className="font-mono text-sm">
                  <span className="text-muted-foreground">Output: </span>
                  <span className="text-primary font-medium">{example.output}</span>
                </div>
                {example.explanation && (
                  <div className="text-sm text-muted-foreground pt-2 border-t border-border/30">
                    <span className="font-medium">Explanation: </span>
                    {example.explanation}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Constraints */}
        {constraints && constraints.length > 0 && (
          <div className="space-y-2">
            <h3 className="font-semibold text-foreground">Constraints</h3>
            <ul className="space-y-1">
              {constraints.map((constraint, idx) => (
                <li key={idx} className="text-sm text-muted-foreground font-mono">
                  • {constraint}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Hints */}
        {hints && hints.length > 0 && (
          <Collapsible open={hintsOpen} onOpenChange={setHintsOpen}>
            <CollapsibleTrigger asChild>
              <Button
                variant="ghost"
                className="w-full justify-between h-auto py-3 px-4 bg-primary/5 hover:bg-primary/10 border border-primary/20 rounded-lg"
              >
                <div className="flex items-center gap-2">
                  <Lightbulb className="w-4 h-4 text-amber-500" />
                  <span className="font-medium">Hints</span>
                  <Badge variant="secondary" className="text-xs">
                    {hints.length}
                  </Badge>
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
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className="relative"
                >
                  {hintsRevealed.includes(idx) ? (
                    <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-sm">
                      <span className="text-amber-500 font-medium">Hint {idx + 1}: </span>
                      <span className="text-muted-foreground">{hint}</span>
                    </div>
                  ) : (
                    <Button
                      variant="ghost"
                      className="w-full justify-start h-auto py-3 px-4 bg-muted/30 hover:bg-muted/50 text-muted-foreground"
                      onClick={() => revealHint(idx)}
                    >
                      <Lightbulb className="w-4 h-4 mr-2 text-amber-500" />
                      Reveal Hint {idx + 1}
                    </Button>
                  )}
                </motion.div>
              ))}
            </CollapsibleContent>
          </Collapsible>
        )}

        {/* Companies */}
        {companies && companies.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-muted-foreground">Asked by</h4>
            <div className="flex flex-wrap gap-2">
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
