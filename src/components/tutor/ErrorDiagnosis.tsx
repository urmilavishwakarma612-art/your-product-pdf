import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  AlertTriangle,
  Bug,
  CheckCircle,
  Code,
  Loader2,
  Lightbulb,
  X,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

interface ErrorDiagnosisProps {
  isOpen: boolean;
  onClose: () => void;
  userCode: string;
  questionTitle: string;
  onFixSuggestion: (suggestion: string) => void;
}

interface DetectedIssue {
  type: string;
  severity: "error" | "warning" | "info";
  line?: number;
  description: string;
  suggestion: string;
}

const errorPatterns = [
  {
    type: "index_out_of_bounds",
    patterns: [/\[i\s*\+\s*1\]/, /\[i\s*-\s*1\]/, /\[j\s*\+\s*1\]/, /\[j\s*-\s*1\]/],
    severity: "error" as const,
    description: "Potential array index out of bounds",
    suggestion: "Check if i+1 or i-1 is within array bounds before accessing",
  },
  {
    type: "infinite_loop",
    patterns: [/while\s*\(\s*true\s*\)/, /while\s*\(\s*1\s*\)/, /for\s*\(\s*;\s*;\s*\)/],
    severity: "error" as const,
    description: "Possible infinite loop detected",
    suggestion: "Ensure there's a break condition or loop termination logic",
  },
  {
    type: "null_check_missing",
    patterns: [/\.length(?!\s*[=!><])/, /\.val\b/, /\.next\b/, /\.left\b/, /\.right\b/],
    severity: "warning" as const,
    description: "Accessing property without null check",
    suggestion: "Add null/undefined check before accessing object properties",
  },
  {
    type: "hardcoded_values",
    patterns: [/return\s+\d+\s*;/, /return\s+['"][^'"]+['"]\s*;/],
    severity: "info" as const,
    description: "Hardcoded return value detected",
    suggestion: "Replace hardcoded values with computed results",
  },
  {
    type: "empty_array_check",
    patterns: [/\[\s*0\s*\](?!\s*=)/],
    severity: "warning" as const,
    description: "Accessing first element without empty array check",
    suggestion: "Check if array is empty before accessing elements",
  },
  {
    type: "division_by_zero",
    patterns: [/\/\s*\w+(?!\s*[!=])/, /\/\s*\(.*\)/],
    severity: "warning" as const,
    description: "Potential division by zero",
    suggestion: "Add check to ensure denominator is not zero",
  },
  {
    type: "comparison_instead_assignment",
    patterns: [/if\s*\([^=]*=[^=]/],
    severity: "error" as const,
    description: "Assignment in condition (should be ==?)",
    suggestion: "Use == or === for comparison, not = for assignment",
  },
  {
    type: "off_by_one",
    patterns: [/<=\s*\w+\.length/, />=\s*0\s*;/],
    severity: "warning" as const,
    description: "Possible off-by-one error in loop bounds",
    suggestion: "Check if loop should use < instead of <= or vice versa",
  },
];

export const ErrorDiagnosis = ({
  isOpen,
  onClose,
  userCode,
  questionTitle,
  onFixSuggestion,
}: ErrorDiagnosisProps) => {
  const [issues, setIssues] = useState<DetectedIssue[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  useEffect(() => {
    if (isOpen && userCode) {
      analyzeCode();
    }
  }, [isOpen, userCode]);

  const analyzeCode = () => {
    setIsAnalyzing(true);

    // Simulate analysis delay for UX
    setTimeout(() => {
      const detected: DetectedIssue[] = [];
      const lines = userCode.split("\n");

      lines.forEach((line, lineNum) => {
        errorPatterns.forEach((pattern) => {
          pattern.patterns.forEach((regex) => {
            if (regex.test(line)) {
              // Avoid duplicates
              if (!detected.some((d) => d.type === pattern.type && d.line === lineNum + 1)) {
                detected.push({
                  type: pattern.type,
                  severity: pattern.severity,
                  line: lineNum + 1,
                  description: pattern.description,
                  suggestion: pattern.suggestion,
                });
              }
            }
          });
        });
      });

      // Sort by severity
      detected.sort((a, b) => {
        const order = { error: 0, warning: 1, info: 2 };
        return order[a.severity] - order[b.severity];
      });

      setIssues(detected);
      setIsAnalyzing(false);
    }, 800);
  };

  const severityColors = {
    error: "bg-destructive/10 text-destructive border-destructive/30",
    warning: "bg-amber-500/10 text-amber-500 border-amber-500/30",
    info: "bg-blue-500/10 text-blue-500 border-blue-500/30",
  };

  const severityIcons = {
    error: <Bug className="w-4 h-4" />,
    warning: <AlertTriangle className="w-4 h-4" />,
    info: <Lightbulb className="w-4 h-4" />,
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center">
              <Bug className="w-5 h-5 text-white" />
            </div>
            <div>
              <DialogTitle>Code Analysis</DialogTitle>
              <DialogDescription>
                Checking for common issues and potential bugs
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="pt-4">
          {isAnalyzing ? (
            <div className="flex flex-col items-center justify-center py-8">
              <Loader2 className="w-8 h-8 animate-spin text-primary mb-3" />
              <p className="text-sm text-muted-foreground">Analyzing your code...</p>
            </div>
          ) : issues.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center justify-center py-8"
            >
              <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center mb-4">
                <CheckCircle className="w-8 h-8 text-success" />
              </div>
              <h3 className="font-semibold text-lg mb-1">No Issues Detected</h3>
              <p className="text-sm text-muted-foreground text-center max-w-xs">
                Your code looks good! No common errors found. If you're still stuck, try
                asking for a hint.
              </p>
            </motion.div>
          ) : (
            <ScrollArea className="max-h-[400px]">
              <div className="space-y-3">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-sm text-muted-foreground">
                    Found {issues.length} potential issue{issues.length > 1 ? "s" : ""}
                  </p>
                  <div className="flex gap-2">
                    <Badge variant="outline" className={severityColors.error}>
                      {issues.filter((i) => i.severity === "error").length} errors
                    </Badge>
                    <Badge variant="outline" className={severityColors.warning}>
                      {issues.filter((i) => i.severity === "warning").length} warnings
                    </Badge>
                  </div>
                </div>

                {issues.map((issue, idx) => (
                  <motion.div
                    key={`${issue.type}-${issue.line}`}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    className={`rounded-lg border p-4 ${severityColors[issue.severity]}`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="shrink-0 mt-0.5">{severityIcons[issue.severity]}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-sm">{issue.description}</span>
                          {issue.line && (
                            <Badge variant="outline" className="text-xs py-0">
                              Line {issue.line}
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm opacity-80 mb-2">{issue.suggestion}</p>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-xs h-7 px-2"
                          onClick={() => onFixSuggestion(issue.suggestion)}
                        >
                          Get Help
                          <ArrowRight className="w-3 h-3 ml-1" />
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </ScrollArea>
          )}

          {/* Action buttons */}
          <div className="flex justify-end gap-2 pt-4 border-t mt-4">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
            {issues.length > 0 && (
              <Button
                className="btn-primary-glow"
                onClick={() => onFixSuggestion("Help me fix the issues in my code")}
              >
                <Lightbulb className="w-4 h-4 mr-2" />
                Get Fix Suggestions
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
