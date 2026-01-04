import { motion } from "framer-motion";
import { CheckCircle2, XCircle, AlertTriangle, Clock, Brain, Zap, Code, Target, Clipboard } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { InterviewScoreCard } from "./InterviewScoreCard";

export interface EvaluationResult {
  is_correct: boolean;
  approach_used: "brute_force" | "optimal" | "suboptimal" | "unknown";
  pattern_detected: string | null;
  complexity_analysis: {
    time: string;
    space: string;
    optimal_time?: string;
    optimal_space?: string;
  };
  thinking_time: number;
  coding_time: number;
  quality_score: number;
  code_quality_score?: number;
  interview_performance_score?: number;
  code_breakdown?: {
    correctness: number;
    optimality: number;
    clean_code: number;
    edge_cases: number;
  };
  interview_breakdown?: {
    time_efficiency: number;
    run_discipline: number;
    no_paste: number;
    thinking_ratio: number;
    hint_penalty: number;
  };
  feedback: string;
  interview_insight?: string;
  suggestions: string[];
  run_count?: number;
  paste_detected?: boolean;
  run_before_submit?: boolean;
}

interface SubmissionResultProps {
  result: EvaluationResult;
  questionTitle: string;
}

export function SubmissionResult({ result, questionTitle }: SubmissionResultProps) {
  const approachConfig = {
    optimal: { label: "Optimal", color: "text-emerald-500 bg-emerald-500/20", icon: Zap },
    suboptimal: { label: "Sub-optimal", color: "text-amber-500 bg-amber-500/20", icon: AlertTriangle },
    brute_force: { label: "Brute Force", color: "text-red-500 bg-red-500/20", icon: Code },
    unknown: { label: "Unknown", color: "text-muted-foreground bg-muted", icon: Code },
  };

  const approach = approachConfig[result.approach_used] || approachConfig.unknown;
  const ApproachIcon = approach.icon;

  const codeQualityScore = result.code_quality_score || result.quality_score || 0;
  const interviewScore = result.interview_performance_score || 50;
  const interviewPassed = interviewScore >= 70;

  // Determine verdict message
  const getVerdictMessage = () => {
    if (result.is_correct && interviewPassed) {
      return { title: "Great Job! Interview Ready ✅", subtitle: "Both code and interview performance are strong" };
    }
    if (result.is_correct && !interviewPassed) {
      return { title: "Code Correct ✅", subtitle: "Interview Signals: ⚠ Review Needed" };
    }
    return { title: "Needs Improvement", subtitle: "Review the feedback below" };
  };

  const verdict = getVerdictMessage();

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="space-y-4"
    >
      {/* Main Result */}
      <Card className={`border-2 ${result.is_correct ? "border-emerald-500/50" : "border-destructive/50"}`}>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4 mb-4">
            {result.is_correct ? (
              <div className="p-3 rounded-full bg-emerald-500/20">
                <CheckCircle2 className="w-8 h-8 text-emerald-500" />
              </div>
            ) : (
              <div className="p-3 rounded-full bg-destructive/20">
                <XCircle className="w-8 h-8 text-destructive" />
              </div>
            )}
            <div>
              <h3 className="text-xl font-bold">{verdict.title}</h3>
              <p className="text-muted-foreground text-sm">{verdict.subtitle}</p>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
            <div className="p-3 rounded-lg bg-muted/50 text-center">
              <ApproachIcon className={`w-5 h-5 mx-auto mb-1 ${approach.color.split(' ')[0]}`} />
              <Badge variant="outline" className={approach.color}>
                {approach.label}
              </Badge>
            </div>
            <div className="p-3 rounded-lg bg-muted/50 text-center">
              <Brain className="w-5 h-5 mx-auto mb-1 text-violet-500" />
              <div className="text-sm font-medium">{result.thinking_time}s</div>
              <div className="text-xs text-muted-foreground">Thinking</div>
            </div>
            <div className="p-3 rounded-lg bg-muted/50 text-center">
              <Clock className="w-5 h-5 mx-auto mb-1 text-blue-500" />
              <div className="text-sm font-medium">{result.coding_time}s</div>
              <div className="text-xs text-muted-foreground">Coding</div>
            </div>
            <div className="p-3 rounded-lg bg-muted/50 text-center">
              <Zap className="w-5 h-5 mx-auto mb-1 text-primary" />
              <div className="text-sm font-medium">{result.complexity_analysis.time}</div>
              <div className="text-xs text-muted-foreground">Complexity</div>
            </div>
          </div>

          {/* Run/Paste Status Badges */}
          <div className="flex flex-wrap gap-2 mb-4">
            {result.run_before_submit ? (
              <Badge variant="outline" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/30">
                <Target className="w-3 h-3 mr-1" /> Tested Before Submit
              </Badge>
            ) : (
              <Badge variant="outline" className="bg-amber-500/10 text-amber-500 border-amber-500/30">
                <AlertTriangle className="w-3 h-3 mr-1" /> No Test Before Submit
              </Badge>
            )}
            {result.paste_detected && (
              <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/30">
                <Clipboard className="w-3 h-3 mr-1" /> Paste Detected
              </Badge>
            )}
            {result.run_count !== undefined && result.run_count > 0 && (
              <Badge variant="secondary">
                Runs: {result.run_count}
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Two-Level Score Card */}
      {(result.code_quality_score !== undefined || result.interview_performance_score !== undefined) && (
        <InterviewScoreCard
          codeQualityScore={codeQualityScore}
          interviewPerformanceScore={interviewScore}
          codeBreakdown={result.code_breakdown}
          interviewBreakdown={result.interview_breakdown}
          isCodeCorrect={result.is_correct}
          interviewInsight={result.interview_insight}
        />
      )}

      {/* Feedback */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">AI Feedback</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm">{result.feedback}</p>
          
          {result.suggestions.length > 0 && (
            <div>
              <h4 className="text-sm font-medium mb-2">Suggestions:</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                {result.suggestions.map((suggestion, idx) => (
                  <li key={idx}>• {suggestion}</li>
                ))}
              </ul>
            </div>
          )}

          {result.pattern_detected && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Pattern Detected:</span>
              <Badge variant="secondary">{result.pattern_detected}</Badge>
            </div>
          )}

          {result.complexity_analysis.optimal_time && (
            <div className="text-xs text-muted-foreground">
              Optimal: {result.complexity_analysis.optimal_time} time, {result.complexity_analysis.optimal_space} space
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}