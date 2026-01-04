import { motion } from "framer-motion";
import { Brain, Target, CheckCircle2, AlertTriangle, XCircle, Zap, Clock, Clipboard, Lightbulb } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

interface ScoreBreakdown {
  correctness: number;
  optimality: number;
  clean_code?: number;
  cleanCode?: number;
  edge_cases?: number;
  edgeCases?: number;
}

interface InterviewBreakdown {
  time_efficiency?: number;
  timeEfficiency?: number;
  run_discipline?: number;
  runDiscipline?: number;
  no_paste?: number;
  noPaste?: number;
  thinking_ratio?: number;
  thinkingRatio?: number;
  hint_penalty?: number;
  hintPenalty?: number;
}

interface InterviewScoreCardProps {
  codeQualityScore: number;
  interviewPerformanceScore: number;
  codeBreakdown?: ScoreBreakdown;
  interviewBreakdown?: InterviewBreakdown;
  isCodeCorrect: boolean;
  interviewInsight?: string;
}

export function InterviewScoreCard({
  codeQualityScore,
  interviewPerformanceScore,
  codeBreakdown,
  interviewBreakdown,
  isCodeCorrect,
  interviewInsight,
}: InterviewScoreCardProps) {
  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-emerald-500";
    if (score >= 60) return "text-amber-500";
    return "text-destructive";
  };

  const getScoreBg = (score: number) => {
    if (score >= 80) return "bg-emerald-500";
    if (score >= 60) return "bg-amber-500";
    return "bg-destructive";
  };

  const getVerdict = () => {
    if (isCodeCorrect && interviewPerformanceScore >= 70) {
      return { 
        text: "Great Job! Interview Ready", 
        icon: CheckCircle2, 
        color: "text-emerald-500",
        bg: "bg-emerald-500/20"
      };
    }
    if (isCodeCorrect && interviewPerformanceScore < 70) {
      return { 
        text: "Code Correct, Interview Needs Work", 
        icon: AlertTriangle, 
        color: "text-amber-500",
        bg: "bg-amber-500/20"
      };
    }
    return { 
      text: "Needs Improvement", 
      icon: XCircle, 
      color: "text-destructive",
      bg: "bg-destructive/20"
    };
  };

  const verdict = getVerdict();
  const VerdictIcon = verdict.icon;

  return (
    <Card className="border-2 border-border">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Target className="w-4 h-4" />
          Performance Analysis
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Verdict */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className={`p-4 rounded-xl ${verdict.bg} flex items-center gap-3`}
        >
          <VerdictIcon className={`w-6 h-6 ${verdict.color}`} />
          <span className={`font-semibold ${verdict.color}`}>{verdict.text}</span>
        </motion.div>

        {/* Two-Level Scores */}
        <div className="grid grid-cols-2 gap-4">
          {/* Code Quality Score */}
          <div className="p-4 rounded-xl bg-muted/50 space-y-3">
            <div className="flex items-center gap-2">
              <Brain className={`w-5 h-5 ${getScoreColor(codeQualityScore)}`} />
              <span className="font-medium text-sm">Code Quality</span>
            </div>
            <div className="text-3xl font-bold">{codeQualityScore}<span className="text-lg text-muted-foreground">/100</span></div>
            <Progress value={codeQualityScore} className={`h-2 ${getScoreBg(codeQualityScore)}`} />
            
            {codeBreakdown && (
              <div className="space-y-1 text-xs text-muted-foreground">
                <div className="flex justify-between">
                  <span>Correctness</span>
                  <span>{codeBreakdown.correctness}/40</span>
                </div>
                <div className="flex justify-between">
                  <span>Optimality</span>
                  <span>{codeBreakdown.optimality}/25</span>
                </div>
                <div className="flex justify-between">
                  <span>Clean Code</span>
                  <span>{codeBreakdown.cleanCode ?? codeBreakdown.clean_code ?? 0}/20</span>
                </div>
                <div className="flex justify-between">
                  <span>Edge Cases</span>
                  <span>{codeBreakdown.edgeCases ?? codeBreakdown.edge_cases ?? 0}/15</span>
                </div>
              </div>
            )}
          </div>

          {/* Interview Performance Score */}
          <div className="p-4 rounded-xl bg-muted/50 space-y-3">
            <div className="flex items-center gap-2">
              <Zap className={`w-5 h-5 ${getScoreColor(interviewPerformanceScore)}`} />
              <span className="font-medium text-sm">Interview Score</span>
            </div>
            <div className="text-3xl font-bold">{interviewPerformanceScore}<span className="text-lg text-muted-foreground">/100</span></div>
            <Progress value={interviewPerformanceScore} className={`h-2 ${getScoreBg(interviewPerformanceScore)}`} />
            
            {interviewBreakdown && (
              <div className="space-y-1 text-xs text-muted-foreground">
                <div className="flex justify-between">
                  <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> Time</span>
                  <span>{interviewBreakdown.timeEfficiency ?? interviewBreakdown.time_efficiency ?? 0}/30</span>
                </div>
                <div className="flex justify-between">
                  <span className="flex items-center gap-1"><Target className="w-3 h-3" /> Test First</span>
                  <span>{interviewBreakdown.runDiscipline ?? interviewBreakdown.run_discipline ?? 0}/20</span>
                </div>
                <div className="flex justify-between">
                  <span className="flex items-center gap-1"><Clipboard className="w-3 h-3" /> No Paste</span>
                  <span>{interviewBreakdown.noPaste ?? interviewBreakdown.no_paste ?? 0}/20</span>
                </div>
                <div className="flex justify-between">
                  <span className="flex items-center gap-1"><Brain className="w-3 h-3" /> Think</span>
                  <span>{interviewBreakdown.thinkingRatio ?? interviewBreakdown.thinking_ratio ?? 0}/15</span>
                </div>
                <div className="flex justify-between">
                  <span className="flex items-center gap-1"><Lightbulb className="w-3 h-3" /> Hints</span>
                  <span>{interviewBreakdown.hintPenalty ?? interviewBreakdown.hint_penalty ?? 0}/15</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Interview Insight */}
        {interviewInsight && (
          <>
            <Separator />
            <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
              <p className="text-sm text-muted-foreground italic">
                💡 {interviewInsight}
              </p>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}