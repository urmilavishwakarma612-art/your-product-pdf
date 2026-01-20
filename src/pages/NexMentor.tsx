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
import { LeetCodeProblemPanel } from "@/components/nexmentor/LeetCodeProblemPanel";
import { ScrollArea } from "@/components/ui/scroll-area";

// Step definitions for the 7-step flow
const STEPS = [
  { id: 0, name: "Decode", icon: Target, description: "Understand the question" },
  { id: 1, name: "Pattern", icon: Brain, description: "Identify the pattern" },
  { id: 2, name: "Brute Force", icon: Code2, description: "Write brute force" },
  { id: 3, name: "Optimize", icon: Zap, description: "Find bottleneck" },
  { id: 4, name: "Approach", icon: Lightbulb, description: "Optimal logic" },
  { id: 5, name: "Code", icon: Code2, description: "Implementation" },
  { id: 6, name: "Verify", icon: CheckCircle, description: "Complexity check" },
  { id: 7, name: "Explain", icon: Trophy, description: "Interview ready" },
];

const LANGUAGE_CONFIG: Record<string, { monacoLang: string; template: string }> = {
  python: {
    monacoLang: "python",
    template: `# Write your solution here\n# Think through each step before coding\n\ndef solution():\n    pass`,
  },
  javascript: {
    monacoLang: "javascript",
    template: `// Write your solution here\n// Think through each step before coding\n\nfunction solution() {\n    \n}`,
  },
  java: {
    monacoLang: "java",
    template: `// Write your solution here\n// Think through each step before coding\n\nclass Solution {\n    public void solve() {\n        \n    }\n}`,
  },
  cpp: {
    monacoLang: "cpp",
    template: `// Write your solution here\n// Think through each step before coding\n\nclass Solution {\npublic:\n    void solve() {\n        \n    }\n};`,
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
};

// Helper: Parse hints JSON to examples array (if hints contains examples)
function parseHintsToExamples(hints: any): { input: string; output: string; explanation?: string }[] {
  if (!hints) return [];
  
  // If hints is an array with example objects
  if (Array.isArray(hints)) {
    return hints
      .filter((h: any) => h.input && h.output)
      .map((h: any) => ({
        input: h.input,
        output: h.output,
        explanation: h.explanation,
      }));
  }
  
  return [];
}

// Helper: Parse constraints from description
function parseConstraints(description: string | undefined): string[] {
  if (!description) return [];
  
  const constraints: string[] = [];
  const constraintMatch = description.match(/Constraints?:\s*\n?((?:[\s•\-*]*[^\n]+\n?)+)/i);
  
  if (constraintMatch) {
    const lines = constraintMatch[1].split('\n');
    for (const line of lines) {
      const cleaned = line.replace(/^[\s•\-*]+/, '').trim();
      if (cleaned && cleaned.length > 2) {
        constraints.push(cleaned);
      }
    }
  }
  
  return constraints;
}

// Helper: Parse hints array from JSON hints field
function parseHintsArray(hints: any): string[] {
  if (!hints) return [];
  
  // If it's already an array of strings
  if (Array.isArray(hints)) {
    return hints
      .filter((h: any) => typeof h === 'string')
      .map((h: string) => h);
  }
  
  // If it's an object with hint properties
  if (typeof hints === 'object') {
    return Object.values(hints)
      .filter((h: any) => typeof h === 'string')
      .map((h: any) => h as string);
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

  // Session state
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(sessionIdParam);
  const [currentStep, setCurrentStep] = useState(0);
  const [sessionTime, setSessionTime] = useState(0);
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [leetcodeUnlocked, setLeetcodeUnlocked] = useState(false);

  // Code editor state
  const [language, setLanguage] = useState("python");
  const [code, setCode] = useState(LANGUAGE_CONFIG["python"].template);
  const [showEditor, setShowEditor] = useState(false);

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

  // Fetch saved sessions for the current question
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
          current_step: 0,
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

  // Auto-save session (debounced)
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
    }, 2000); // Save after 2 seconds of inactivity
  }, [currentSessionId, user?.id, currentStep, messages, code, language, leetcodeUnlocked, sessionTime]);

  // Trigger auto-save when session state changes
  useEffect(() => {
    if (isSessionActive && currentSessionId) {
      saveSession();
    }
  }, [messages, code, currentStep, leetcodeUnlocked]);

  // Load existing session
  const loadSession = useCallback((session: SavedSession, question: any) => {
    setCurrentSessionId(session.id);
    setCurrentStep(session.current_step || 0);
    setMessages((session.messages as unknown as Message[]) || []);
    setCode(session.user_code || LANGUAGE_CONFIG[session.language || "python"].template);
    setLanguage(session.language || "python");
    setLeetcodeUnlocked(session.leetcode_unlocked || false);
    setSessionTime(session.time_spent || 0);
    setShowEditor((session.current_step || 0) >= 5);
    setSelectedQuestion(question);
    setViewMode("session");
    setIsSessionActive(true);
    setShowSessionsDialog(false);
    setSearchParams({ q: question.id, session: session.id });
  }, [setSearchParams]);

  // Fetch selected question if ID is in URL
  useEffect(() => {
    if (questionId && questions) {
      const question = questions.find((q) => q.id === questionId);
      if (question) {
        setSelectedQuestion(question);
        setViewMode("session");
        
        // If there's a session ID in URL, load that session
        if (sessionIdParam && savedSessions) {
          const session = savedSessions.find((s) => s.id === sessionIdParam);
          if (session) {
            loadSession(session, question);
            return;
          }
        }
        
        // Otherwise start new session
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

  // Cleanup on unmount
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
      setCurrentStep(0);
      setMessages([
        {
          role: "assistant",
          content: `Chalo shuru karte hain! 🚀\n\n**[Step 0/7: Question Decode]**\n\nBefore we jump into solving, let me ask you:\n\n**"${question.title}" - is question mein exactly kya puchha ja raha hai?**\n\nInput kya hai, output kya expect hai, aur constraints kya hain - apne words mein samjhao.`,
          step: 0,
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
    setShowEditor(false);
    setCurrentSessionId(null);

    // Check for existing sessions
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
    // Save session before leaving
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
    setCurrentStep(0);
    setLeetcodeUnlocked(false);
    setShowEditor(false);
    setCurrentSessionId(null);
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
            userCode: showEditor ? code : undefined,
          }),
        }
      );

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || "Failed to get response");
      }

      // Stream the response
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

      // Check for step progression cues in the response
      checkStepProgression(assistantMessage);
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error(error instanceof Error ? error.message : "Failed to send message");
      setMessages((prev) => prev.slice(0, -1)); // Remove the empty assistant message
    } finally {
      setIsLoading(false);
    }
  };

  const checkStepProgression = (response: string) => {
    const lowerResponse = response.toLowerCase();

    // Auto-unlock features based on progress
    if (currentStep < 5 && (lowerResponse.includes("step 5") || lowerResponse.includes("code implementation"))) {
      setShowEditor(true);
      setCurrentStep(5);
    } else if (currentStep === 7 || lowerResponse.includes("step 7")) {
      setLeetcodeUnlocked(true);
    }

    // Detect step changes from AI response
    for (let i = 0; i <= 7; i++) {
      if (lowerResponse.includes(`[step ${i}/7]`) || lowerResponse.includes(`step ${i}:`)) {
        if (i > currentStep) {
          setCurrentStep(i);
          if (i >= 5) setShowEditor(true);
          if (i === 7) setLeetcodeUnlocked(true);
        }
        break;
      }
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
              <span className="text-sm font-medium text-primary">Thinking Training System</span>
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
              Not copy them. 7-step guided flow with your AI mentor who never gives direct answers.
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
                You have an incomplete session for this problem. Would you like to continue where you left off?
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
                    <span className="text-sm font-medium">Step {(session.current_step || 0) + 1}/8</span>
                    <span className="text-xs text-muted-foreground">
                      {formatTime(session.time_spent || 0)} spent
                    </span>
                  </div>
                  <Progress value={((session.current_step || 0) + 1) / 8 * 100} className="h-1.5" />
                  <p className="text-xs text-muted-foreground mt-2">
                    {session.created_at ? new Date(session.created_at).toLocaleDateString() : "Unknown date"}
                  </p>
                </div>
              ))}
              <Button variant="outline" className="w-full" onClick={handleStartNewSession}>
                <RotateCcw className="w-4 h-4 mr-2" />
                Start Fresh Session
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  // SESSION VIEW
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
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

      {/* Mobile Problem Title */}
      <div className="md:hidden bg-card border-b border-border px-4 py-2">
        <span className="font-medium text-sm truncate block">{selectedQuestion?.title}</span>
      </div>

      {/* Step Progress Bar */}
      <div className="bg-card border-b border-border px-4 py-3">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-muted-foreground">Step {currentStep + 1} of 8</span>
            <span className="text-xs font-medium text-primary">{STEPS[currentStep]?.name}</span>
          </div>
          <Progress value={((currentStep + 1) / 8) * 100} className="h-2" />
          <div className="flex justify-between mt-2 overflow-x-auto pb-1">
            {STEPS.map((step) => (
              <div
                key={step.id}
                className={cn(
                  "flex flex-col items-center min-w-[50px]",
                  step.id <= currentStep ? "text-primary" : "text-muted-foreground"
                )}
              >
                <div
                  className={cn(
                    "w-6 h-6 rounded-full flex items-center justify-center text-xs mb-1",
                    step.id < currentStep
                      ? "bg-primary text-primary-foreground"
                      : step.id === currentStep
                      ? "bg-primary/20 border-2 border-primary"
                      : "bg-muted"
                  )}
                >
                  {step.id < currentStep ? <CheckCircle className="w-3 h-3" /> : step.id + 1}
                </div>
                <span className="text-[10px] hidden sm:block">{step.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Left Panel - LeetCode-Identical Problem Description */}
        <div className="lg:w-[360px] xl:w-[400px] border-b lg:border-b-0 lg:border-r border-border bg-card flex-shrink-0 h-[30vh] lg:h-auto overflow-hidden">
          <LeetCodeProblemPanel
            title={selectedQuestion?.title || "Loading..."}
            difficulty={selectedQuestion?.difficulty || "medium"}
            description={selectedQuestion?.description || "No description available."}
            examples={parseHintsToExamples(selectedQuestion?.hints)}
            constraints={parseConstraints(selectedQuestion?.description)}
            hints={parseHintsArray(selectedQuestion?.hints)}
            companies={selectedQuestion?.companies || []}
            leetcodeLink={selectedQuestion?.leetcode_link}
            isLeetcodeUnlocked={leetcodeUnlocked}
            userCode={code}
          />
        </div>

        {/* Center/Right - Chat & Code Editor */}
        <div className="flex-1 flex flex-col lg:flex-row min-w-0">
          {/* Chat Panel */}
          <div className={cn("flex-1 flex flex-col min-w-0", showEditor ? "lg:w-1/2" : "w-full")}>
            {/* Messages */}
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4 max-w-2xl mx-auto">
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
                        "max-w-[85%] rounded-2xl px-4 py-3",
                        message.role === "user"
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted"
                      )}
                    >
                      <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                    </div>
                  </motion.div>
                ))}
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="bg-muted rounded-2xl px-4 py-3">
                      <Loader2 className="w-5 h-5 animate-spin" />
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            {/* Input */}
            <div className="p-3 sm:p-4 border-t border-border bg-card">
              <div className="max-w-2xl mx-auto flex gap-2">
                <Textarea
                  placeholder="Type your response..."
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      sendMessage();
                    }
                  }}
                  className="min-h-[44px] max-h-32 resize-none"
                  rows={1}
                />
                <Button
                  size="icon"
                  onClick={sendMessage}
                  disabled={!inputMessage.trim() || isLoading}
                >
                  {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                </Button>
              </div>
            </div>
          </div>

          {/* Code Editor Panel - Only visible from Step 5 */}
          <AnimatePresence>
            {showEditor && (
              <motion.div
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: "50%", opacity: 1 }}
                exit={{ width: 0, opacity: 0 }}
                className="hidden lg:flex flex-col border-l border-border"
              >
                <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-muted/50">
                  <Select value={language} onValueChange={handleLanguageChange}>
                    <SelectTrigger className="w-[120px] h-8 bg-background border-border text-sm">
                      <SelectValue placeholder="Language" />
                    </SelectTrigger>
                    <SelectContent>
                      {LANGUAGES.map((lang) => (
                        <SelectItem key={lang.value} value={lang.value}>{lang.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Badge variant="outline" className="text-xs">
                    <Code2 className="w-3 h-3 mr-1" />
                    Step 5+
                  </Badge>
                </div>
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
                      padding: { top: 12 },
                    }}
                    loading={
                      <div className="flex items-center justify-center h-full">
                        <Loader2 className="w-6 h-6 animate-spin text-primary" />
                      </div>
                    }
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Mobile Code Editor Toggle */}
      {showEditor && (
        <div className="lg:hidden fixed bottom-20 right-4 z-50">
          <Button
            size="icon"
            variant="secondary"
            className="rounded-full w-12 h-12 shadow-lg"
            onClick={() => toast.info("Use desktop for code editor")}
          >
            <Code2 className="w-5 h-5" />
          </Button>
        </div>
      )}
    </div>
  );
}
