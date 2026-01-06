import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Brain, Send, X, Lightbulb, Target, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

interface ThoughtCoachProps {
  isOpen: boolean;
  onClose: () => void;
  onRespond: (response: string) => void;
  questionTitle: string;
  skillLevel: "beginner" | "intermediate" | "advanced";
}

const coachingQuestions: Record<string, string[]> = {
  beginner: [
    "What's the first thing you notice about this problem?",
    "Can you identify what input you're given and what output you need?",
    "Have you seen a similar problem before? What was different?",
    "If you had to explain this problem to a friend, what would you say?",
    "What's the simplest example you can think of for this problem?",
  ],
  intermediate: [
    "What pattern do you think this problem might follow?",
    "What are the edge cases you should consider?",
    "Can you break this problem into smaller subproblems?",
    "What's the time complexity you're aiming for?",
    "What data structure would help you solve this efficiently?",
  ],
  advanced: [
    "Is there a mathematical insight that could simplify this?",
    "How would you optimize your current approach?",
    "What's the space-time tradeoff you're considering?",
    "Could this be solved with a different paradigm (DP, greedy, divide & conquer)?",
    "What makes this problem harder than similar ones you've solved?",
  ],
};

export const ThoughtCoach = ({
  isOpen,
  onClose,
  onRespond,
  questionTitle,
  skillLevel,
}: ThoughtCoachProps) => {
  const [response, setResponse] = useState("");
  const [currentQuestion, setCurrentQuestion] = useState(() => {
    const questions = coachingQuestions[skillLevel];
    return questions[Math.floor(Math.random() * questions.length)];
  });

  const handleSubmit = () => {
    if (response.trim()) {
      onRespond(response);
      setResponse("");
    }
  };

  const handleNewQuestion = () => {
    const questions = coachingQuestions[skillLevel];
    const newQ = questions[Math.floor(Math.random() * questions.length)];
    setCurrentQuestion(newQ);
  };

  const handleSkip = () => {
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
              <Brain className="w-5 h-5 text-white" />
            </div>
            <div>
              <DialogTitle>Let's Think Together</DialogTitle>
              <DialogDescription>
                Verbalizing your thought process helps build problem-solving skills
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 pt-4">
          {/* Coaching Question */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-xl p-4 border border-purple-500/20"
          >
            <div className="flex items-start gap-3">
              <HelpCircle className="w-5 h-5 text-purple-500 shrink-0 mt-0.5" />
              <p className="text-sm font-medium">{currentQuestion}</p>
            </div>
          </motion.div>

          {/* Response Input */}
          <div className="space-y-2">
            <Textarea
              value={response}
              onChange={(e) => setResponse(e.target.value)}
              placeholder="Think out loud... What's your approach?"
              className="min-h-[100px] resize-none"
              onKeyDown={(e) => {
                if (e.key === "Enter" && e.metaKey) {
                  e.preventDefault();
                  handleSubmit();
                }
              }}
            />
            <p className="text-xs text-muted-foreground">
              💡 Explaining your thinking helps identify gaps in understanding
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between pt-2">
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={handleNewQuestion}>
                <Lightbulb className="w-4 h-4 mr-1" />
                Different Question
              </Button>
              <Button variant="ghost" size="sm" onClick={handleSkip}>
                Skip
              </Button>
            </div>
            <Button
              onClick={handleSubmit}
              disabled={!response.trim()}
              className="btn-primary-glow"
            >
              <Send className="w-4 h-4 mr-2" />
              Share Thinking
            </Button>
          </div>

          {/* Gamification hint */}
          <div className="text-center text-xs text-muted-foreground pt-2 border-t">
            <span className="text-purple-500">+5 XP</span> for explaining your approach
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
