import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, XCircle, ChevronDown, ChevronUp, Code } from "lucide-react";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

export interface TestCaseResult {
  name: string;
  passed: boolean;
  input: string;
  expected: string;
  actual: string;
  type: "basic" | "edge" | "stress";
}

interface TestCaseResultsProps {
  results: TestCaseResult[];
  passed: number;
  total: number;
  isLoading?: boolean;
}

export function TestCaseResults({ results, passed, total, isLoading }: TestCaseResultsProps) {
  const [expandedCases, setExpandedCases] = useState<Set<number>>(new Set());

  const toggleCase = (index: number) => {
    setExpandedCases(prev => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  };

  const passRate = total > 0 ? Math.round((passed / total) * 100) : 0;
  const allPassed = passed === total && total > 0;

  return (
    <Card className={`border-2 ${allPassed ? "border-emerald-500/50" : "border-amber-500/50"}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Code className="w-4 h-4" />
            Test Results
          </CardTitle>
          <Badge 
            variant={allPassed ? "default" : "outline"}
            className={allPassed ? "bg-emerald-500" : "border-amber-500 text-amber-500"}
          >
            {passed}/{total} Passed ({passRate}%)
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {isLoading ? (
          <div className="text-center py-4 text-muted-foreground">
            Running test cases...
          </div>
        ) : (
          <AnimatePresence>
            {results.map((testCase, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ delay: index * 0.05 }}
              >
                <Collapsible open={expandedCases.has(index)}>
                  <CollapsibleTrigger asChild>
                    <Button
                      variant="ghost"
                      className={`w-full justify-between p-3 h-auto rounded-lg ${
                        testCase.passed 
                          ? "bg-emerald-500/10 hover:bg-emerald-500/20" 
                          : "bg-destructive/10 hover:bg-destructive/20"
                      }`}
                      onClick={() => toggleCase(index)}
                    >
                      <div className="flex items-center gap-3">
                        {testCase.passed ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                        ) : (
                          <XCircle className="w-4 h-4 text-destructive" />
                        )}
                        <span className="text-sm font-medium">{testCase.name}</span>
                        <Badge variant="secondary" className="text-xs">
                          {testCase.type}
                        </Badge>
                      </div>
                      {expandedCases.has(index) ? (
                        <ChevronUp className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className="mt-2 p-3 bg-muted/50 rounded-lg text-sm space-y-2 font-mono">
                      <div>
                        <span className="text-muted-foreground">Input: </span>
                        <span className="text-foreground">{testCase.input}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Expected: </span>
                        <span className="text-emerald-500">{testCase.expected}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Your Output: </span>
                        <span className={testCase.passed ? "text-emerald-500" : "text-destructive"}>
                          {testCase.actual}
                        </span>
                      </div>
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </CardContent>
    </Card>
  );
}