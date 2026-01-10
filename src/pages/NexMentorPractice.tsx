import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import {
  Clock,
  Circle,
  ChevronLeft,
  Code2,
  User,
  Sparkles,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import logoImage from "@/assets/logo.png";
import { Link } from "react-router-dom";
import { NexMentorPanel } from "@/components/nexmentor/NexMentorPanel";
import { NexMentorCodeEditor, LANGUAGE_CONFIG } from "@/components/nexmentor/NexMentorCodeEditor";
import { ProblemDescriptionPanel } from "@/components/nexmentor/ProblemDescriptionPanel";
import { ThemeToggle } from "@/components/ThemeToggle";
import { ProfileDropdown } from "@/components/landing/ProfileDropdown";

const demoQuestions = [
  {
    id: "demo-1",
    title: "Two Sum",
    pattern: "Two Pointers",
    difficulty: "medium" as const,
    description: `Given an array of integers numbers sorted in non-decreasing order, find two numbers that add up to a target number. Return the indices of the two numbers (as an array of length 2). You may assume that each input would have exactly one solution, and you may not use the element twice.`,
    examples: [
      {
        input: "numbers = [2, 7, 11, 15], target = 9",
        output: "[0, 1]",
        explanation: "The numbers at indices 0 and 1 add up to 9: 2 + 7 = 9.",
      },
      {
        input: "numbers = [2, 3, 4], target = 6",
        output: "[0, 2]",
        explanation: "The numbers at indices 0 and 2 add up to 6: 2 + 4 = 6.",
      },
    ],
    constraints: [
      "2 <= numbers.length <= 3 * 10^4",
      "-1000 <= numbers[i] <= 1000",
      "numbers is sorted in non-decreasing order",
      "-1000 <= target <= 1000",
    ],
    hints: [
      "Think about what the sorted property of the array gives you.",
      "Can you use two pointers to find the answer efficiently?",
      "Consider starting one pointer at the beginning and one at the end.",
    ],
    companies: ["Google", "Amazon", "Microsoft", "Facebook"],
  },
];

export default function NexMentorPractice() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const questionId = searchParams.get("q") || "demo-1";

  const [sessionTime, setSessionTime] = useState(0);
  const [isSessionActive, setIsSessionActive] = useState(true);
  const [language, setLanguage] = useState("python");
  const [code, setCode] = useState(LANGUAGE_CONFIG["python"].template);
  const [isMentorMinimized, setIsMentorMinimized] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch real question if ID provided
  const { data: question } = useQuery({
    queryKey: ["practice-question", questionId],
    queryFn: async () => {
      if (questionId.startsWith("demo")) {
        return demoQuestions.find((q) => q.id === questionId) || demoQuestions[0];
      }
      const { data, error } = await supabase
        .from("questions")
        .select("*, patterns(name)")
        .eq("id", questionId)
        .single();
      if (error) throw error;
      return {
        ...data,
        pattern: data.patterns?.name || "Unknown",
        examples: [],
        constraints: [],
        hints: data.hints || [],
        companies: data.companies || [],
      };
    },
  });

  // Session timer
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isSessionActive) {
      interval = setInterval(() => {
        setSessionTime((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isSessionActive]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const handleRunCode = async () => {
    setIsRunning(true);
    // Simulate code run
    await new Promise((resolve) => setTimeout(resolve, 1500));
    toast.success("Code executed successfully");
    setIsRunning(false);
  };

  const handleSubmitCode = async () => {
    setIsSubmitting(true);
    // Simulate submission
    await new Promise((resolve) => setTimeout(resolve, 2000));
    toast.success("Code submitted for review");
    setIsSubmitting(false);
  };

  const handleEndSession = () => {
    setIsSessionActive(false);
    navigate("/curriculum");
  };

  const currentQuestion = question || demoQuestions[0];

  return (
    <div className="min-h-screen bg-[#0A0E14] text-foreground flex flex-col">
      {/* Top Navigation */}
      <header className="bg-[#0D1117] border-b border-border/30 px-4 py-2">
        <div className="flex items-center justify-between">
          {/* Left - Logo and Nav */}
          <div className="flex items-center gap-6">
            <Link to="/" className="flex items-center gap-2.5 group">
              <motion.div
                whileHover={{ scale: 1.05, rotate: 5 }}
                whileTap={{ scale: 0.95 }}
                className="w-8 h-8 flex items-center justify-center"
              >
                <img src={logoImage} alt="NexAlgoTrix" className="w-8 h-8 object-contain" />
              </motion.div>
              <span className="font-bold text-lg tracking-tight text-foreground">
                NexAlgoTrix
              </span>
            </Link>

            <nav className="hidden md:flex items-center gap-1">
              <Link
                to="/curriculum"
                className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-white/5"
              >
                Practice
              </Link>
              <Link
                to="/curriculum"
                className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-white/5"
              >
                Curriculum
              </Link>
              <Link
                to="/interview"
                className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-white/5"
              >
                Interview
              </Link>
            </nav>
          </div>

          {/* Center - Problem info */}
          <div className="hidden lg:flex items-center gap-3">
            <Badge variant="outline" className="text-xs bg-muted/30">
              <Code2 className="w-3 h-3 mr-1" />
              Practice
            </Badge>
            <span className="text-muted-foreground">|</span>
            <span className="text-sm text-muted-foreground">Code 100</span>
            <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30">
              {language === "python" ? "Python" : language}
            </Badge>
            <span className="text-muted-foreground">|</span>
            <span className="font-medium text-foreground">{currentQuestion.title}</span>
            <Badge
              variant="outline"
              className={
                currentQuestion.difficulty === "easy"
                  ? "text-emerald-500 border-emerald-500/30 bg-emerald-500/10"
                  : currentQuestion.difficulty === "medium"
                  ? "text-amber-500 border-amber-500/30 bg-amber-500/10"
                  : "text-red-500 border-red-500/30 bg-red-500/10"
              }
            >
              {currentQuestion.difficulty.charAt(0).toUpperCase() + currentQuestion.difficulty.slice(1)}
            </Badge>
          </div>

          {/* Right - Timer, Status, User */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 bg-muted/30 px-3 py-1.5 rounded-full border border-border/30">
              <Clock className="w-4 h-4 text-muted-foreground" />
              <span className="font-mono text-sm">{formatTime(sessionTime)}</span>
              <span className="text-xs text-muted-foreground">remaining</span>
            </div>

            <div className="flex items-center gap-2 bg-emerald-500/10 px-3 py-1.5 rounded-full border border-emerald-500/30">
              <Circle className="w-2 h-2 fill-emerald-500 text-emerald-500" />
              <span className="text-sm text-emerald-500 font-medium">Live NexMentor</span>
            </div>

            <Button
              variant="outline"
              size="sm"
              className="bg-primary/10 border-primary/30 text-primary hover:bg-primary/20"
            >
              Session
            </Button>

            <ThemeToggle />

            {user ? (
              <ProfileDropdown />
            ) : (
              <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center">
                <User className="w-5 h-5 text-muted-foreground" />
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content - 3 Panel Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel - Problem Description */}
        <div className="w-[340px] border-r border-border/30 bg-[#0D1117] flex-shrink-0">
          <ProblemDescriptionPanel
            title={currentQuestion.title}
            difficulty={(currentQuestion.difficulty as "easy" | "medium" | "hard") || "medium"}
            description={currentQuestion.description || ""}
            examples={currentQuestion.examples || []}
            constraints={currentQuestion.constraints}
            hints={currentQuestion.hints as string[]}
            companies={currentQuestion.companies as string[]}
          />
        </div>

        {/* Center Panel - Code Editor */}
        <div className="flex-1 min-w-0">
          <NexMentorCodeEditor
            language={language}
            onLanguageChange={setLanguage}
            code={code}
            onCodeChange={setCode}
            onRunCode={handleRunCode}
            onSubmitCode={handleSubmitCode}
            isRunning={isRunning}
            isSubmitting={isSubmitting}
          />
        </div>

        {/* Right Panel - NexMentor Chat */}
        <div className="w-[380px] flex-shrink-0 relative">
          <NexMentorPanel
            questionId={currentQuestion.id}
            questionTitle={currentQuestion.title}
            questionDescription={currentQuestion.description}
            patternName={currentQuestion.pattern}
            userCode={code}
            isMinimized={isMentorMinimized}
            onToggleMinimize={() => setIsMentorMinimized(!isMentorMinimized)}
            onClose={handleEndSession}
          />
        </div>
      </div>
    </div>
  );
}
