import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import {
  Clock,
  Code2,
  ChevronRight,
  Send,
  Loader2,
  ArrowLeft,
  Search,
  BookOpen,
  Brain,
  CheckCircle,
  Target,
  Lightbulb,
  Zap,
  Trophy,
  Save,
  RotateCcw,
  History,
  Play,
  Upload,
  ExternalLink,
  Copy,
  Check,
  Lock,
  GripVertical,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import logoImage from "@/assets/logo.png";
import { Link } from "react-router-dom";
import { ThemeToggle } from "@/components/ThemeToggle";
import { ProfileDropdown } from "@/components/landing/ProfileDropdown";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import Editor from "@monaco-editor/react";
import { cn } from "@/lib/utils";
import { Json } from "@/integrations/supabase/types";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { LeetCodeProblemPanel } from "@/components/nexmentor/LeetCodeProblemPanel";

// SIMPLIFIED 4-STEP FLOW
const STEPS = [
  { id: 1, name: "Decode + Pattern", icon: Brain, description: "Understand & identify pattern" },
  { id: 2, name: "Brute Force", icon: Target, description: "Brute approach + complexity" },
  { id: 3, name: "Optimal", icon: Zap, description: "Optimize solution" },
  { id: 4, name: "Code & Verify", icon: Code2, description: "Implement & verify" },
];

const LANGUAGE_CONFIG: Record<string, { monacoLang: string; template: string }> = {
  python: {
    monacoLang: "python",
    template: `# Write your solution here\n\ndef solution():\n    pass`,
  },
  javascript: {
    monacoLang: "javascript",
    template: `// Write your solution here\n\nfunction solution() {\n    \n}`,
  },
  java: {
    monacoLang: "java",
    template: `// Write your solution here\n\nclass Solution {\n    public void solve() {\n        \n    }\n}`,
  },
  cpp: {
    monacoLang: "cpp",
    template: `// Write your solution here\n\nclass Solution {\npublic:\n    void solve() {\n        \n    }\n};`,
  },
};

const LANGUAGES = [
  { value: "python", label: "Python" },
  { value: "javascript", label: "JavaScript" },
  { value: "java", label: "Java" },
  { value: "cpp", label: "C++" },
];

const difficultyConfig = {
  easy: { label: "Easy", color: "text-emerald-500 bg-emerald-500/10 border-emerald-500/30" },
  medium: { label: "Medium", color: "text-amber-500 bg-amber-500/10 border-amber-500/30" },
  hard: { label: "Hard", color: "text-red-500 bg-red-500/10 border-red-500/30" },
};

type Message = {
  role: "user" | "assistant";
  content: string;
  step?: number;
};

type ViewMode = "selection" | "session";

type SavedSession = {
  id: string;
  question_id: string;
  current_step: number;
  messages: Message[];
  user_code: string | null;
  language: string | null;
  leetcode_unlocked: boolean | null;
  time_spent: number | null;
  created_at: string | null;
  ended_at: string | null;
  problem_solved: boolean | null;
};

// Helper functions to parse question data
function parseTestCasesToExamples(testCases: any): { input: string; output: string; explanation?: string }[] {
  if (!testCases || !Array.isArray(testCases)) return [];
  return testCases.map((tc: any) => ({
    input: tc.input || "",
    output: tc.output || "",
    explanation: tc.explanation,
  }));
}

function parseConstraints(description: string): string[] {
  const constraints: string[] = [];
  const constraintMatch = description?.match(/Constraints?:\s*([\s\S]*?)(?=\n\n|$)/i);
  if (constraintMatch) {
    const lines = constraintMatch[1].split('\n');
    lines.forEach(line => {
      const cleaned = line.replace(/^[\s•-]+/, '').trim();
      if (cleaned) constraints.push(cleaned);
    });
  }
  return constraints;
}

function parseHintsArray(hints: any): string[] {
  if (!hints) return [];
  if (Array.isArray(hints)) {
    return hints.map(h => typeof h === 'string' ? h : h?.text || '').filter(Boolean);
  }
  if (typeof hints === 'object') {
    return Object.values(hints).map(h => typeof h === 'string' ? h : '').filter(Boolean);
  }
  return [];
}

export default function NexMentor() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const questionId = searchParams.get("q");
  const sessionIdParam = searchParams.get("session");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // View state
  const [viewMode, setViewMode] = useState<ViewMode>(questionId ? "session" : "selection");
  const [selectedQuestion, setSelectedQuestion] = useState<any>(null);
  const [showSessionsDialog, setShowSessionsDialog] = useState(false);
  const [showLeetCodeCelebration, setShowLeetCodeCelebration] = useState(false);
  const [codeCopied, setCodeCopied] = useState(false);

  // Session state
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(sessionIdParam);
  const [currentStep, setCurrentStep] = useState(1);
  const [sessionTime, setSessionTime] = useState(0);
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [leetcodeUnlocked, setLeetcodeUnlocked] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);

  // Code editor state
  const [language, setLanguage] = useState("python");
  const [code, setCode] = useState(LANGUAGE_CONFIG["python"].template);

  // Filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [difficultyFilter, setDifficultyFilter] = useState<string>("all");
  const [patternFilter, setPatternFilter] = useState<string>("all");

  // Fetch all questions
  const { data: questions, isLoading: isLoadingQuestions } = useQuery({
    queryKey: ["nexmentor-questions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("questions")
        .select("*, patterns(name, slug)")
        .order("display_order", { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  // Fetch patterns for filter
  const { data: patterns } = useQuery({
    queryKey: ["patterns-filter"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("patterns")
        .select("id, name, slug")
        .order("display_order", { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  // Fetch saved sessions
  const { data: savedSessions } = useQuery({
    queryKey: ["nexmentor-sessions", questionId, user?.id],
    queryFn: async () => {
      if (!user?.id || !questionId) return [];
      const { data, error } = await supabase
        .from("tutor_sessions")
        .select("*")
        .eq("user_id", user.id)
        .eq("question_id", questionId)
        .eq("session_type", "nexmentor")
        .order("created_at", { ascending: false })
        .limit(5);
      if (error) throw error;
      return data as unknown as SavedSession[];
    },
    enabled: !!user?.id && !!questionId,
  });

  // Create session mutation
  const createSessionMutation = useMutation({
    mutationFn: async (question: any) => {
      if (!user?.id) throw new Error("User not authenticated");
      const { data, error } = await supabase
        .from("tutor_sessions")
        .insert({
          user_id: user.id,
          question_id: question.id,
          pattern_id: question.pattern_id,
          session_type: "nexmentor",
          current_step: 1,
          messages: [] as unknown as Json,
          language: "python",
          user_code: LANGUAGE_CONFIG["python"].template,
          leetcode_unlocked: false,
          time_spent: 0,
          started_at: new Date().toISOString(),
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      setCurrentSessionId(data.id);
      queryClient.invalidateQueries({ queryKey: ["nexmentor-sessions"] });
    },
  });

  // Update session mutation
  const updateSessionMutation = useMutation({
    mutationFn: async (updates: Partial<SavedSession>) => {
      if (!currentSessionId) throw new Error("No session ID");
      const { error } = await supabase
        .from("tutor_sessions")
        .update({
          ...updates,
          messages: updates.messages as unknown as Json,
        })
        .eq("id", currentSessionId);
      if (error) throw error;
    },
  });

  // Mark question as solved mutation
  const markQuestionSolvedMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id || !selectedQuestion) throw new Error("Missing data");
      
      // Check if progress exists
      const { data: existingProgress } = await supabase
        .from("user_progress")
        .select("*")
        .eq("user_id", user.id)
        .eq("question_id", selectedQuestion.id)
        .single();

      if (existingProgress?.is_solved) {
        return existingProgress;
      }

      const xpEarned = selectedQuestion.xp_reward || 10;

      if (existingProgress) {
        // Update existing progress
        const { data, error } = await supabase
          .from("user_progress")
          .update({
            is_solved: true,
            solved_at: new Date().toISOString(),
            xp_earned: xpEarned,
          })
          .eq("id", existingProgress.id)
          .select()
          .single();
        if (error) throw error;
        return data;
      } else {
        // Create new progress
        const { data, error } = await supabase
          .from("user_progress")
          .insert({
            user_id: user.id,
            question_id: selectedQuestion.id,
            is_solved: true,
            solved_at: new Date().toISOString(),
            xp_earned: xpEarned,
          })
          .select()
          .single();
        if (error) throw error;
        return data;
      }
    },
    onSuccess: async (data) => {
      // Update profile XP and streak
      const { data: profile } = await supabase
        .from("profiles")
        .select("total_xp, current_streak, longest_streak, last_solved_at")
        .eq("id", user!.id)
        .single();

      if (profile) {
        const today = new Date().toDateString();
        const lastSolvedDate = profile.last_solved_at 
          ? new Date(profile.last_solved_at).toDateString() 
          : null;
        
        let newStreak = profile.current_streak;
        if (lastSolvedDate !== today) {
          const yesterday = new Date();
          yesterday.setDate(yesterday.getDate() - 1);
          if (lastSolvedDate === yesterday.toDateString()) {
            newStreak = profile.current_streak + 1;
          } else if (lastSolvedDate !== today) {
            newStreak = 1;
          }
        }

        await supabase
          .from("profiles")
          .update({
            total_xp: profile.total_xp + (data.xp_earned || 0),
            current_streak: newStreak,
            longest_streak: Math.max(profile.longest_streak, newStreak),
            last_solved_at: new Date().toISOString(),
          })
          .eq("id", user!.id);
      }

      // Mark session as completed
      if (currentSessionId) {
        await supabase
          .from("tutor_sessions")
          .update({
            problem_solved: true,
            ended_at: new Date().toISOString(),
          })
          .eq("id", currentSessionId);
      }

      queryClient.invalidateQueries({ queryKey: ["user-progress"] });
      toast.success(`+${data.xp_earned || 10} XP earned!`);
    },
  });

  // Auto-save session
  const saveSession = useCallback(() => {
    if (!currentSessionId || !user?.id) return;
    
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(() => {
      updateSessionMutation.mutate({
        current_step: currentStep,
        messages,
        user_code: code,
        language,
        leetcode_unlocked: leetcodeUnlocked,
        time_spent: sessionTime,
      });
    }, 2000);
  }, [currentSessionId, user?.id, currentStep, messages, code, language, leetcodeUnlocked, sessionTime]);

  useEffect(() => {
    if (isSessionActive && currentSessionId) {
      saveSession();
    }
  }, [messages, code, currentStep, leetcodeUnlocked]);

  // Load existing session
  const loadSession = useCallback((session: SavedSession, question: any) => {
    setCurrentSessionId(session.id);
    setCurrentStep(session.current_step || 1);
    setMessages((session.messages as unknown as Message[]) || []);
    setCode(session.user_code || LANGUAGE_CONFIG[session.language || "python"].template);
    setLanguage(session.language || "python");
    setLeetcodeUnlocked(session.leetcode_unlocked || false);
    setSessionTime(session.time_spent || 0);
    setSelectedQuestion(question);
    setViewMode("session");
    setIsSessionActive(true);
    setShowSessionsDialog(false);
    setSearchParams({ q: question.id, session: session.id });
  }, [setSearchParams]);

  // Fetch selected question
  useEffect(() => {
    if (questionId && questions) {
      const question = questions.find((q) => q.id === questionId);
      if (question) {
        setSelectedQuestion(question);
        setViewMode("session");
        
        if (sessionIdParam && savedSessions) {
          const session = savedSessions.find((s) => s.id === sessionIdParam);
          if (session) {
            loadSession(session, question);
            return;
          }
        }
        
        if (!currentSessionId && user) {
          startSession(question);
        }
      }
    }
  }, [questionId, questions, sessionIdParam, savedSessions, user]);

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

  // Auto-scroll messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // Filter questions
  const filteredQuestions = questions?.filter((q) => {
    const matchesSearch =
      q.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      q.patterns?.name?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDifficulty = difficultyFilter === "all" || q.difficulty === difficultyFilter;
    const matchesPattern = patternFilter === "all" || q.pattern_id === patternFilter;
    return matchesSearch && matchesDifficulty && matchesPattern;
  });

  const startSession = async (question: any) => {
    if (!user) {
      toast.error("Please login to start a session");
      navigate("/auth");
      return;
    }

    try {
      const session = await createSessionMutation.mutateAsync(question);
      setCurrentSessionId(session.id);
      setIsSessionActive(true);
      setCurrentStep(1);
      setMessages([
        {
          role: "assistant",
          content: `Chalo shuru karte hain! 🚀\n\n**[Step 1/4: Decode + Pattern]**\n\n"${question.title}" - Dekho yaar:\n1. Question exactly kya puchh raha hai?\n2. Kaunsa pattern lagta hai - Array, Two Pointer, Sliding Window, etc.? Kyu?`,
          step: 1,
        },
      ]);
      setSearchParams({ q: question.id, session: session.id });
    } catch (error) {
      console.error("Failed to create session:", error);
      toast.error("Failed to start session");
    }
  };

  const handleSelectQuestion = async (question: any) => {
    setSelectedQuestion(question);
    setSearchParams({ q: question.id });
    setViewMode("session");
    setSessionTime(0);
    setCode(LANGUAGE_CONFIG[language].template);
    setLeetcodeUnlocked(false);
    setCurrentSessionId(null);
    setIsCompleted(false);

    if (user) {
      const { data: existingSessions } = await supabase
        .from("tutor_sessions")
        .select("*")
        .eq("user_id", user.id)
        .eq("question_id", question.id)
        .eq("session_type", "nexmentor")
        .is("ended_at", null)
        .order("created_at", { ascending: false })
        .limit(1);

      if (existingSessions && existingSessions.length > 0) {
        setShowSessionsDialog(true);
        return;
      }
    }

    startSession(question);
  };

  const handleBackToSelection = () => {
    if (currentSessionId) {
      updateSessionMutation.mutate({
        current_step: currentStep,
        messages,
        user_code: code,
        language,
        leetcode_unlocked: leetcodeUnlocked,
        time_spent: sessionTime,
      });
    }

    setViewMode("selection");
    setSelectedQuestion(null);
    setSearchParams({});
    setSessionTime(0);
    setIsSessionActive(false);
    setMessages([]);
    setCurrentStep(1);
    setLeetcodeUnlocked(false);
    setCurrentSessionId(null);
    setIsCompleted(false);
  };

  const sendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage = inputMessage.trim();
    setInputMessage("");
    setMessages((prev) => [...prev, { role: "user", content: userMessage, step: currentStep }]);
    setIsLoading(true);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/nexmentor-thinking`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            step: currentStep,
            questionTitle: selectedQuestion?.title,
            questionDescription: selectedQuestion?.description,
            userMessage,
            conversationHistory: messages.map((m) => ({ role: m.role, content: m.content })),
            userCode: currentStep >= 4 ? code : undefined,
          }),
        }
      );

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || "Failed to get response");
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let assistantMessage = "";

      setMessages((prev) => [...prev, { role: "assistant", content: "", step: currentStep }]);

      while (reader) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (line.startsWith("data: ") && line !== "data: [DONE]") {
            try {
              const json = JSON.parse(line.slice(6));
              const content = json.choices?.[0]?.delta?.content;
              if (content) {
                assistantMessage += content;
                setMessages((prev) => {
                  const updated = [...prev];
                  updated[updated.length - 1] = {
                    role: "assistant",
                    content: assistantMessage,
                    step: currentStep,
                  };
                  return updated;
                });
              }
            } catch (e) {
              // Skip invalid JSON
            }
          }
        }
      }

      checkStepProgression(assistantMessage);
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error(error instanceof Error ? error.message : "Failed to send message");
      setMessages((prev) => prev.slice(0, -1));
    } finally {
      setIsLoading(false);
    }
  };

  const checkStepProgression = (response: string) => {
    const lowerResponse = response.toLowerCase();

    // Detect step changes
    for (let i = 1; i <= 4; i++) {
      if (lowerResponse.includes(`[step ${i}/4]`) || lowerResponse.includes(`step ${i}:`)) {
        if (i > currentStep) {
          setCurrentStep(i);
        }
        break;
      }
    }

    // Check for completion
    if (lowerResponse.includes("leetcode pe submit") || lowerResponse.includes("🎉")) {
      setLeetcodeUnlocked(true);
      setIsCompleted(true);
      markQuestionSolvedMutation.mutate();
      setShowLeetCodeCelebration(true);
    }
  };

  const handleLanguageChange = (newLang: string) => {
    setLanguage(newLang);
    setCode(LANGUAGE_CONFIG[newLang]?.template || "");
  };

  const handleManualSave = () => {
    if (!currentSessionId) return;
    updateSessionMutation.mutate({
      current_step: currentStep,
      messages,
      user_code: code,
      language,
      leetcode_unlocked: leetcodeUnlocked,
      time_spent: sessionTime,
    });
    toast.success("Session saved!");
  };

  const handleStartNewSession = () => {
    setShowSessionsDialog(false);
    startSession(selectedQuestion);
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(code);
    setCodeCopied(true);
    setTimeout(() => setCodeCopied(false), 2000);
    toast.success("Code copied!");
  };

  // QUESTION SELECTION VIEW
  if (viewMode === "selection") {
    return (
      <div className="min-h-screen bg-background text-foreground">
        {/* Header */}
        <header className="bg-card border-b border-border px-4 py-3 sticky top-0 z-50">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link to="/" className="flex items-center gap-2 group">
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="w-8 h-8">
                  <img src={logoImage} alt="NexAlgoTrix" className="w-8 h-8 object-contain" />
                </motion.div>
                <span className="hidden sm:block font-bold text-lg">NexAlgoTrix</span>
              </Link>
              <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30">
                <Brain className="w-3 h-3 mr-1" />
                NexMentor
              </Badge>
            </div>

            <div className="flex items-center gap-3">
              <ThemeToggle />
              {user ? (
                <ProfileDropdown />
              ) : (
                <Link to="/auth">
                  <Button size="sm" variant="outline">Login</Button>
                </Link>
              )}
            </div>
          </div>
        </header>

        {/* Hero Section */}
        <div className="bg-gradient-to-b from-primary/5 to-transparent py-8 sm:py-12 px-4">
          <div className="max-w-4xl mx-auto text-center space-y-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/30"
            >
              <Brain className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-primary">4-Step Thinking Flow</span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-2xl sm:text-3xl md:text-4xl font-bold"
            >
              Learn to <span className="text-primary">THINK</span> Solutions
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-muted-foreground max-w-2xl mx-auto text-sm sm:text-base"
            >
              Train here. Submit on LeetCode. Simple 4-step flow with your AI mentor.
            </motion.p>

            {/* Flow Overview */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="flex flex-wrap justify-center gap-2 pt-4"
            >
              {STEPS.map((step, idx) => (
                <div key={step.id} className="flex items-center gap-1">
                  <Badge variant="secondary" className="text-xs py-1">
                    <step.icon className="w-3 h-3 mr-1" />
                    {step.name}
                  </Badge>
                  {idx < STEPS.length - 1 && <ChevronRight className="w-3 h-3 text-muted-foreground" />}
                </div>
              ))}
            </motion.div>
          </div>
        </div>

        {/* Filters */}
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search problems..."
                className="pl-10 bg-muted/50 border-border/50"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Select value={difficultyFilter} onValueChange={setDifficultyFilter}>
              <SelectTrigger className="w-full sm:w-[140px] bg-muted/50 border-border/50">
                <SelectValue placeholder="Difficulty" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Levels</SelectItem>
                <SelectItem value="easy">Easy</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="hard">Hard</SelectItem>
              </SelectContent>
            </Select>
            <Select value={patternFilter} onValueChange={setPatternFilter}>
              <SelectTrigger className="w-full sm:w-[160px] bg-muted/50 border-border/50">
                <SelectValue placeholder="Pattern" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Patterns</SelectItem>
                {patterns?.map((p) => (
                  <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Questions Grid */}
          {isLoadingQuestions ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              {filteredQuestions?.map((question, index) => (
                <motion.div
                  key={question.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.03 }}
                  className="group relative bg-card border border-border rounded-xl p-4 sm:p-5 hover:border-primary/50 transition-all cursor-pointer"
                  onClick={() => handleSelectQuestion(question)}
                >
                  <div className="flex items-start justify-between mb-3">
                    <Badge
                      variant="outline"
                      className={cn("text-xs", difficultyConfig[question.difficulty as keyof typeof difficultyConfig]?.color)}
                    >
                      {difficultyConfig[question.difficulty as keyof typeof difficultyConfig]?.label}
                    </Badge>
                    <Badge variant="secondary" className="text-xs">
                      {question.patterns?.name || "Unknown"}
                    </Badge>
                  </div>

                  <h3 className="font-semibold text-foreground mb-2 group-hover:text-primary transition-colors line-clamp-2 text-sm sm:text-base">
                    {question.title}
                  </h3>

                  {question.companies && question.companies.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-3">
                      {question.companies.slice(0, 3).map((company: string, idx: number) => (
                        <span key={idx} className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                          {company}
                        </span>
                      ))}
                      {question.companies.length > 3 && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                          +{question.companies.length - 3}
                        </span>
                      )}
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          )}

          {filteredQuestions?.length === 0 && (
            <div className="text-center py-20">
              <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No problems found</h3>
              <p className="text-muted-foreground">Try adjusting your filters</p>
            </div>
          )}
        </div>

        {/* Resume Session Dialog */}
        <Dialog open={showSessionsDialog} onOpenChange={setShowSessionsDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <History className="w-5 h-5 text-primary" />
                Resume Previous Session?
              </DialogTitle>
              <DialogDescription>
                You have an incomplete session. Continue where you left off?
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3 mt-4">
              {savedSessions?.filter(s => !s.ended_at).map((session) => (
                <div
                  key={session.id}
                  className="p-3 border border-border rounded-lg hover:border-primary/50 cursor-pointer transition-colors"
                  onClick={() => loadSession(session, selectedQuestion)}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium">Step {session.current_step || 1}/4</span>
                    <span className="text-xs text-muted-foreground">
                      {formatTime(session.time_spent || 0)} spent
                    </span>
                  </div>
                  <Progress value={((session.current_step || 1) / 4) * 100} className="h-1.5" />
                  <p className="text-xs text-muted-foreground mt-2">
                    {session.created_at ? new Date(session.created_at).toLocaleDateString() : "Unknown"}
                  </p>
                </div>
              ))}
              <Button variant="outline" className="w-full" onClick={handleStartNewSession}>
                <RotateCcw className="w-4 h-4 mr-2" />
                Start Fresh
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  // SESSION VIEW - 3-Section Resizable Layout
  return (
    <div className="h-screen bg-background text-foreground flex flex-col overflow-hidden">
      {/* Top Navigation */}
      <header className="bg-card border-b border-border px-3 sm:px-4 py-2 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-3">
            <Button variant="ghost" size="sm" className="h-8 px-2" onClick={handleBackToSelection}>
              <ArrowLeft className="w-4 h-4 sm:mr-1" />
              <span className="hidden sm:inline">Back</span>
            </Button>
            <Link to="/" className="hidden sm:flex items-center gap-2">
              <img src={logoImage} alt="NexAlgoTrix" className="w-7 h-7 object-contain" />
            </Link>
          </div>

          <div className="hidden md:flex items-center gap-2 flex-1 justify-center max-w-xl">
            <span className="font-medium text-sm truncate">{selectedQuestion?.title}</span>
            <Badge
              variant="outline"
              className={cn("text-xs", difficultyConfig[selectedQuestion?.difficulty as keyof typeof difficultyConfig]?.color)}
            >
              {difficultyConfig[selectedQuestion?.difficulty as keyof typeof difficultyConfig]?.label}
            </Badge>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 px-2"
              onClick={handleManualSave}
              disabled={updateSessionMutation.isPending}
            >
              {updateSessionMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              <span className="hidden sm:inline ml-1">Save</span>
            </Button>
            <div className="flex items-center gap-2 bg-muted/50 px-2 sm:px-3 py-1.5 rounded-full border border-border/30">
              <Clock className="w-4 h-4 text-muted-foreground" />
              <span className="font-mono text-xs sm:text-sm">{formatTime(sessionTime)}</span>
            </div>
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Step Progress */}
      <div className="bg-card border-b border-border px-4 py-2 flex-shrink-0">
        <div className="flex items-center justify-between gap-4 overflow-x-auto">
          {STEPS.map((step) => (
            <div
              key={step.id}
              className={cn(
                "flex items-center gap-2 min-w-fit",
                step.id <= currentStep ? "text-primary" : "text-muted-foreground"
              )}
            >
              <div
                className={cn(
                  "w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium",
                  step.id < currentStep ? "bg-primary text-primary-foreground" :
                  step.id === currentStep ? "bg-primary/20 text-primary border-2 border-primary" :
                  "bg-muted text-muted-foreground"
                )}
              >
                {step.id < currentStep ? <CheckCircle className="w-4 h-4" /> : step.id}
              </div>
              <span className="text-xs font-medium hidden sm:inline">{step.name}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Main Content - 3 Section Resizable Layout */}
      <ResizablePanelGroup direction="horizontal" className="flex-1">
        {/* LEFT: Problem Description */}
        <ResizablePanel defaultSize={25} minSize={20} maxSize={40}>
          <div className="h-full overflow-hidden border-r border-border">
            <LeetCodeProblemPanel
              title={selectedQuestion?.title || ""}
              difficulty={selectedQuestion?.difficulty || "medium"}
              description={selectedQuestion?.description || ""}
              examples={parseTestCasesToExamples(selectedQuestion?.test_cases)}
              constraints={parseConstraints(selectedQuestion?.description)}
              hints={parseHintsArray(selectedQuestion?.hints)}
              companies={selectedQuestion?.companies || []}
              leetcodeLink={selectedQuestion?.leetcode_link}
              isLeetcodeUnlocked={leetcodeUnlocked}
              userCode={code}
            />
          </div>
        </ResizablePanel>

        <ResizableHandle withHandle />

        {/* MIDDLE: Code Editor (Fixed, locked until step 4) */}
        <ResizablePanel defaultSize={40} minSize={30} maxSize={50}>
          <div className="h-full flex flex-col bg-[#1e1e1e] relative">
            {/* Lock Overlay for Steps 1-3 */}
            {currentStep < 4 && (
              <div className="absolute inset-0 z-10 bg-black/70 backdrop-blur-sm flex items-center justify-center p-6">
                <div className="bg-slate-800/90 p-6 rounded-xl border border-slate-700 text-center max-w-sm">
                  <div className="w-16 h-16 rounded-full bg-amber-500/20 flex items-center justify-center mx-auto mb-4">
                    <Lock className="w-8 h-8 text-amber-500" />
                  </div>
                  <h3 className="text-white font-bold text-lg mb-2">Code Editor Locked</h3>
                  <p className="text-slate-300 text-sm mb-4">
                    Complete the thinking flow (Steps 1-3) to unlock the code editor.
                  </p>
                  <div className="space-y-2">
                    {STEPS.slice(0, 3).map((step) => (
                      <div 
                        key={step.id}
                        className={cn(
                          "flex items-center gap-2 text-sm px-3 py-2 rounded-lg",
                          step.id < currentStep ? "bg-emerald-500/20 text-emerald-400" :
                          step.id === currentStep ? "bg-primary/20 text-primary" :
                          "bg-slate-700/50 text-slate-400"
                        )}
                      >
                        {step.id < currentStep ? (
                          <CheckCircle className="w-4 h-4" />
                        ) : (
                          <step.icon className="w-4 h-4" />
                        )}
                        <span>{step.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Editor Header */}
            <div className="flex items-center justify-between px-4 py-2 border-b border-border/30 bg-[#252526] flex-shrink-0">
              <Select value={language} onValueChange={handleLanguageChange}>
                <SelectTrigger className="w-[120px] h-8 bg-transparent border-border/50 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LANGUAGES.map((lang) => (
                    <SelectItem key={lang.value} value={lang.value}>
                      {lang.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs bg-transparent border-border/50 text-white hover:bg-white/10"
                  onClick={handleCopyCode}
                  disabled={currentStep < 4}
                >
                  {codeCopied ? <Check className="w-3 h-3 mr-1" /> : <Copy className="w-3 h-3 mr-1" />}
                  Copy
                </Button>
              </div>
            </div>

            {/* Monaco Editor */}
            <div className="flex-1 min-h-0">
              <Editor
                height="100%"
                language={LANGUAGE_CONFIG[language]?.monacoLang || "python"}
                value={code}
                onChange={(value) => setCode(value || "")}
                theme="vs-dark"
                options={{
                  minimap: { enabled: false },
                  fontSize: 14,
                  lineNumbers: "on",
                  scrollBeyondLastLine: false,
                  automaticLayout: true,
                  tabSize: 4,
                  wordWrap: "on",
                  padding: { top: 16 },
                  readOnly: currentStep < 4,
                }}
              />
            </div>

            {/* Action Buttons for Step 4 */}
            {currentStep >= 4 && (
              <div className="p-3 bg-[#252526] border-t border-border/30 flex gap-2 flex-shrink-0">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 bg-transparent border-border/50 text-white hover:bg-white/10"
                >
                  <Play className="w-4 h-4 mr-2" />
                  Run
                </Button>
                <Button
                  size="sm"
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
                  disabled={!isCompleted}
                  onClick={() => setShowLeetCodeCelebration(true)}
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Submit
                </Button>
              </div>
            )}
          </div>
        </ResizablePanel>

        <ResizableHandle withHandle />

        {/* RIGHT: NexMentor Chat */}
        <ResizablePanel defaultSize={35} minSize={25} maxSize={45}>
          <div className="h-full flex flex-col bg-card">
            {/* Chat Header */}
            <div className="px-4 py-3 border-b border-border flex-shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                  <Brain className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm">NexMentor</h3>
                  <p className="text-xs text-muted-foreground">Step {currentStep}/4 • {STEPS[currentStep - 1]?.name}</p>
                </div>
              </div>
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4">
                {messages.map((message, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={cn(
                      "flex",
                      message.role === "user" ? "justify-end" : "justify-start"
                    )}
                  >
                    <div
                      className={cn(
                        "max-w-[90%] rounded-2xl px-4 py-3",
                        message.role === "user"
                          ? "bg-primary text-primary-foreground rounded-br-md"
                          : "bg-muted rounded-bl-md"
                      )}
                    >
                      <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                    </div>
                  </motion.div>
                ))}
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="bg-muted rounded-2xl rounded-bl-md px-4 py-3">
                      <Loader2 className="w-5 h-5 animate-spin text-primary" />
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            {/* Input */}
            <div className="p-4 border-t border-border flex-shrink-0">
              <div className="flex gap-2">
                <Textarea
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  placeholder="Type your answer..."
                  className="min-h-[50px] max-h-[100px] resize-none bg-muted/50"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      sendMessage();
                    }
                  }}
                />
                <Button
                  onClick={sendMessage}
                  disabled={isLoading || !inputMessage.trim()}
                  className="h-auto px-4"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>

      {/* LeetCode Celebration Dialog */}
      <Dialog open={showLeetCodeCelebration} onOpenChange={setShowLeetCodeCelebration}>
        <DialogContent className="max-w-md text-center">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="py-4"
          >
            <div className="w-20 h-20 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trophy className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-2xl font-bold mb-2">🎉 Congratulations!</h2>
            <p className="text-muted-foreground mb-6">
              You've completed the thinking flow! Now submit your solution on LeetCode.
            </p>
            
            <div className="space-y-3">
              <Button
                className="w-full"
                onClick={handleCopyCode}
              >
                {codeCopied ? <Check className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
                {codeCopied ? "Code Copied!" : "Copy Code"}
              </Button>
              
              {selectedQuestion?.leetcode_link && (
                <a
                  href={selectedQuestion.leetcode_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block"
                >
                  <Button variant="outline" className="w-full">
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Open LeetCode Problem
                  </Button>
                </a>
              )}
              
              <Button
                variant="ghost"
                className="w-full"
                onClick={handleBackToSelection}
              >
                Practice Another Problem
              </Button>
            </div>
          </motion.div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
