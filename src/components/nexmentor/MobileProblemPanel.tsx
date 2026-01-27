import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ExternalLink, Building2, Lightbulb, ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface Example {
  input: string;
  output: string;
  explanation?: string;
}

interface MobileProblemPanelProps {
  title: string;
  difficulty: string;
  description: string;
  examples: Example[];
  constraints: string[];
  hints: string[];
  companies: string[];
  leetcodeLink?: string;
  isLeetcodeUnlocked: boolean;
}

const difficultyConfig = {
  easy: { label: "Easy", color: "text-emerald-500 bg-emerald-500/10 border-emerald-500/30" },
  medium: { label: "Medium", color: "text-amber-500 bg-amber-500/10 border-amber-500/30" },
  hard: { label: "Hard", color: "text-red-500 bg-red-500/10 border-red-500/30" },
};

export function MobileProblemPanel({
  title,
  difficulty,
  description,
  examples,
  constraints,
  hints,
  companies,
  leetcodeLink,
  isLeetcodeUnlocked,
}: MobileProblemPanelProps) {
  const [showHints, setShowHints] = useState(false);
  const [expandedHint, setExpandedHint] = useState<number | null>(null);

  const diffConfig = difficultyConfig[difficulty as keyof typeof difficultyConfig] || difficultyConfig.medium;

  // Clean description - remove constraints section if shown separately
  const cleanedDescription = description
    ?.replace(/Constraints?:\s*[\s\S]*$/i, '')
    .trim();

  return (
    <ScrollArea className="h-full">
      <div className="p-4 space-y-4">
        {/* Title & Difficulty */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="outline" className={cn("text-xs", diffConfig.color)}>
              {diffConfig.label}
            </Badge>
            {companies.slice(0, 2).map((company, idx) => (
              <Badge key={idx} variant="secondary" className="text-xs">
                <Building2 className="w-3 h-3 mr-1" />
                {company}
              </Badge>
            ))}
          </div>
          <h1 className="text-lg font-bold text-foreground">{title}</h1>
        </div>

        {/* Description */}
        <div className="prose prose-sm dark:prose-invert max-w-none">
          <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
            {cleanedDescription}
          </p>
        </div>

        {/* Examples */}
        {examples.length > 0 && (
          <div className="space-y-3">
            <h3 className="font-semibold text-sm">Examples</h3>
            {examples.map((example, idx) => (
              <div key={idx} className="bg-muted/50 rounded-lg p-3 border border-border/50 space-y-2">
                <div>
                  <span className="text-xs font-medium text-muted-foreground">Input:</span>
                  <pre className="text-xs mt-1 bg-background/50 p-2 rounded overflow-x-auto">
                    {example.input}
                  </pre>
                </div>
                <div>
                  <span className="text-xs font-medium text-muted-foreground">Output:</span>
                  <pre className="text-xs mt-1 bg-background/50 p-2 rounded overflow-x-auto">
                    {example.output}
                  </pre>
                </div>
                {example.explanation && (
                  <div>
                    <span className="text-xs font-medium text-muted-foreground">Explanation:</span>
                    <p className="text-xs mt-1 text-muted-foreground">{example.explanation}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Constraints */}
        {constraints.length > 0 && (
          <div className="space-y-2">
            <h3 className="font-semibold text-sm">Constraints</h3>
            <ul className="space-y-1">
              {constraints.map((constraint, idx) => (
                <li key={idx} className="text-xs text-muted-foreground flex items-start gap-2">
                  <span className="text-primary">•</span>
                  <code className="bg-muted px-1 rounded">{constraint}</code>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Hints Toggle */}
        {hints.length > 0 && (
          <div className="space-y-2">
            <button
              onClick={() => setShowHints(!showHints)}
              className="flex items-center gap-2 text-sm font-semibold text-primary hover:underline"
            >
              <Lightbulb className="w-4 h-4" />
              <span>Hints ({hints.length})</span>
              {showHints ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>

            <AnimatePresence>
              {showHints && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="space-y-2 overflow-hidden"
                >
                  {hints.map((hint, idx) => (
                    <div key={idx} className="bg-amber-500/10 border border-amber-500/30 rounded-lg">
                      <button
                        onClick={() => setExpandedHint(expandedHint === idx ? null : idx)}
                        className="w-full px-3 py-2 flex items-center justify-between text-left"
                      >
                        <span className="text-xs font-medium text-amber-600 dark:text-amber-400">
                          Hint {idx + 1}
                        </span>
                        {expandedHint === idx ? (
                          <ChevronUp className="w-4 h-4 text-amber-500" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-amber-500" />
                        )}
                      </button>
                      <AnimatePresence>
                        {expandedHint === idx && (
                          <motion.div
                            initial={{ height: 0 }}
                            animate={{ height: "auto" }}
                            exit={{ height: 0 }}
                            className="overflow-hidden"
                          >
                            <p className="px-3 pb-3 text-xs text-muted-foreground">
                              {hint}
                            </p>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* LeetCode Link */}
        {isLeetcodeUnlocked && leetcodeLink && (
          <a
            href={leetcodeLink}
            target="_blank"
            rel="noopener noreferrer"
            className="block"
          >
            <Button variant="outline" size="sm" className="w-full">
              <ExternalLink className="w-4 h-4 mr-2" />
              Open on LeetCode
            </Button>
          </a>
        )}

        {/* Bottom padding for mobile */}
        <div className="h-4" />
      </div>
    </ScrollArea>
  );
}
