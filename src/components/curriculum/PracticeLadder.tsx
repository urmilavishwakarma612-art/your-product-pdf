import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Target, ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface Question {
  id: string;
  title: string;
  difficulty: string;
  practice_tier: string | null;
  leetcode_link: string | null;
}

interface PracticeLadderProps {
  questions: Question[];
  patternId: string | null;
}

export const PracticeLadder = ({ questions, patternId }: PracticeLadderProps) => {
  const tiers = [
    { key: "confidence", label: "🟢 Confidence", description: "Build familiarity", color: "text-success" },
    { key: "thinking", label: "🟡 Thinking", description: "Develop intuition", color: "text-warning" },
    { key: "interview_twist", label: "🔴 Interview Twist", description: "Master variations", color: "text-destructive" },
  ];

  const getQuestionsForTier = (tier: string) =>
    questions.filter((q) => (q.practice_tier || "thinking") === tier);

  const getDifficultyBadge = (difficulty: string) => {
    const variants: Record<string, string> = {
      easy: "difficulty-easy",
      medium: "difficulty-medium",
      hard: "difficulty-hard",
    };
    return variants[difficulty.toLowerCase()] || "";
  };

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="glass-card p-6"
    >
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
          <Target className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h2 className="text-xl font-bold">Practice Ladder</h2>
          <p className="text-sm text-muted-foreground">Progress from confidence to interview-ready</p>
        </div>
      </div>

      <div className="space-y-6">
        {tiers.map((tier) => {
          const tierQuestions = getQuestionsForTier(tier.key);
          if (tierQuestions.length === 0) return null;

          return (
            <div key={tier.key}>
              <div className="flex items-center gap-2 mb-3">
                <span className={`font-semibold ${tier.color}`}>{tier.label}</span>
                <span className="text-xs text-muted-foreground">— {tier.description}</span>
              </div>

              <div className="space-y-2">
                {tierQuestions.map((question) => (
                  <Link
                    key={question.id}
                    to={`/question/${question.id}`}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors group"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium group-hover:text-primary transition-colors">
                        {question.title}
                      </span>
                      <Badge variant="outline" className={`text-xs ${getDifficultyBadge(question.difficulty)}`}>
                        {question.difficulty}
                      </Badge>
                    </div>

                    {question.leetcode_link && (
                      <a
                        href={question.leetcode_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="text-muted-foreground hover:text-primary transition-colors"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    )}
                  </Link>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {patternId && (
        <div className="mt-6 pt-4 border-t border-border">
          <Link
            to={`/patterns?pattern=${patternId}`}
            className="text-sm text-primary hover:underline"
          >
            View all pattern questions →
          </Link>
        </div>
      )}
    </motion.section>
  );
};
