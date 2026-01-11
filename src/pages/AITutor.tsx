import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useVoiceRecognition } from "@/hooks/useVoiceRecognition";
import {
  Clock,
  Circle,
  Code2,
  User,
  Sparkles,
  ChevronDown,
  ChevronRight,
  HelpCircle,
  Lightbulb,
  ExternalLink,
  Mic,
  MicOff,
  Send,
  Loader2,
  Volume2,
  VolumeX,
  X,
  RotateCcw,
  Play,
  ArrowLeft,
  Settings,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
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
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import Editor from "@monaco-editor/react";
import { cn } from "@/lib/utils";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface Example {
  input: string;
  output: string;
  explanation?: string;
}

interface Question {
  id: string;
  title: string;
  pattern: string;
  difficulty: "easy" | "medium" | "hard";
  description: string;
  examples: Example[];
  constraints: string[];
  hints: string[];
  companies: string[];
  leetcodeLink?: string;
}

const LANGUAGE_CONFIG: Record<string, { monacoLang: string; template: string }> = {
  python: {
    monacoLang: "python",
    template: `class Solution:
    def twoSum(self, numbers: List[int], target: int) -> List[int]:
        # Your approach here
        # Think: What does the sorted nature of the array tell us?
        
        return []`,
  },
  javascript: {
    monacoLang: "javascript",
    template: `class Solution {
    twoSum(numbers, target) {
        // Your approach here
        // Think: What does the sorted nature of the array tell us?
        
        return [];
    }
}`,
  },
  java: {
    monacoLang: "java",
    template: `class Solution {
    public int[] twoSum(int[] numbers, int target) {
        // Your approach here
        // Think: What does the sorted nature of the array tell us?
        
        return new int[]{};
    }
}`,
  },
  cpp: {
    monacoLang: "cpp",
    template: `class Solution {
public:
    vector<int> twoSum(vector<int>& numbers, int target) {
        // Your approach here
        // Think: What does the sorted nature of the array tell us?
        
        return {};
    }
};`,
  },
};

const LANGUAGES = [
  { value: "python", label: "Python" },
  { value: "javascript", label: "JavaScript" },
  { value: "java", label: "Java" },
  { value: "cpp", label: "C++" },
];

const demoQuestions: Question[] = [
  {
    id: "demo-1",
    title: "Two Sum II - Input Array Is Sorted",
    pattern: "Two Pointers",
    difficulty: "medium",
    description: `Given a 1-indexed array of integers numbers that is already sorted in non-decreasing order, find two numbers such that they add up to a specific target number.

Let these two numbers be numbers[index1] and numbers[index2] where 1 <= index1 < index2 <= numbers.length.

Return the indices of the two numbers, index1 and index2, added by one as an integer array [index1, index2] of length 2.

The tests are generated such that there is exactly one solution. You may not use the same element twice.

Your solution must use only constant extra space.`,
    examples: [
      {
        input: "numbers = [2,7,11,15], target = 9",
        output: "[1,2]",
        explanation: "The sum of 2 and 7 is 9. Therefore, index1 = 1, index2 = 2. We return [1, 2].",
      },
      {
        input: "numbers = [2,3,4], target = 6",
        output: "[1,3]",
        explanation: "The sum of 2 and 4 is 6. Therefore index1 = 1, index2 = 3. We return [1, 3].",
      },
      {
        input: "numbers = [-1,0], target = -1",
        output: "[1,2]",
        explanation: "The sum of -1 and 0 is -1. Therefore index1 = 1, index2 = 2. We return [1, 2].",
      },
    ],
    constraints: [
      "2 <= numbers.length <= 3 * 10^4",
      "-1000 <= numbers[i] <= 1000",
      "numbers is sorted in non-decreasing order",
      "-1000 <= target <= 1000",
      "The tests are generated such that there is exactly one solution.",
    ],
    hints: [
      "Think about what the sorted property of the array gives you.",
      "Can you use two pointers to find the answer efficiently?",
      "Consider starting one pointer at the beginning and one at the end.",
    ],
    companies: ["Google", "Amazon", "Microsoft", "Facebook"],
    leetcodeLink: "https://leetcode.com/problems/two-sum-ii-input-array-is-sorted/",
  },
];

const difficultyConfig = {
  easy: { label: "Easy", color: "text-emerald-500 bg-emerald-500/10 border-emerald-500/30" },
  medium: { label: "Medium", color: "text-amber-500 bg-amber-500/10 border-amber-500/30" },
  hard: { label: "Hard", color: "text-red-500 bg-red-500/10 border-red-500/30" },
};

export default function AITutor() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const questionId = searchParams.get("q") || "demo-1";

  // Session state
  const [sessionTime, setSessionTime] = useState(0);
  const [isSessionActive, setIsSessionActive] = useState(true);
  
  // Code editor state
  const [language, setLanguage] = useState("python");
  const [code, setCode] = useState(LANGUAGE_CONFIG["python"].template);
  const [isRunning, setIsRunning] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Chat state
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSpeechEnabled, setIsSpeechEnabled] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Panel state
  const [hintsOpen, setHintsOpen] = useState(false);
  const [hintsRevealed, setHintsRevealed] = useState<number[]>([]);
  
  // Voice recognition
  const {
    isListening,
    transcript,
    startListening,
    stopListening,
    isSupported: isVoiceSupported,
  } = useVoiceRecognition({
    onResult: (result) => {
      setInputMessage((prev) => prev + " " + result);
    },
    onError: (error) => {
      toast.error(error);
    },
    continuous: true,
    interimResults: true,
  });

  // Fetch real question if ID provided
  const { data: fetchedQuestion } = useQuery({
    queryKey: ["nexmentor-question", questionId],
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
        id: data.id,
        title: data.title,
        pattern: data.patterns?.name || "Unknown",
        difficulty: data.difficulty as "easy" | "medium" | "hard",
        description: data.description || "",
        examples: [],
        constraints: [],
        hints: (data.hints as string[]) || [],
        companies: data.companies || [],
        leetcodeLink: data.leetcode_link,
      };
    },
  });

  const currentQuestion = fetchedQuestion || demoQuestions[0];

  // Initialize welcome message
  useEffect(() => {
    if (messages.length === 0 && currentQuestion) {
      setMessages([{
        id: "welcome",
        role: "assistant",
        content: `Welcome! I'm NEXMENTOR. Let's work on "${currentQuestion.title}" together.\n\nBefore we start coding — the array is sorted. What approach are you considering? What pattern might work here?`,
        timestamp: new Date(),
      }]);
    }
  }, [currentQuestion]);

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

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Update input when voice transcript changes
  useEffect(() => {
    if (transcript) {
      setInputMessage(transcript);
    }
  }, [transcript]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const revealHint = (index: number) => {
    if (!hintsRevealed.includes(index)) {
      setHintsRevealed([...hintsRevealed, index]);
    }
  };

  const handleEditorDidMount = (editor: any, monaco: any) => {
    monaco.editor.defineTheme("nexmentor-dark", {
      base: "vs-dark",
      inherit: true,
      rules: [
        { token: "comment", foreground: "6A737D", fontStyle: "italic" },
        { token: "keyword", foreground: "C792EA" },
        { token: "string", foreground: "C3E88D" },
        { token: "number", foreground: "F78C6C" },
        { token: "function", foreground: "82AAFF" },
        { token: "class", foreground: "FFCB6B" },
      ],
      colors: {
        "editor.background": "#0D1117",
        "editor.foreground": "#C9D1D9",
        "editorLineNumber.foreground": "#484F58",
        "editorLineNumber.activeForeground": "#8B949E",
        "editor.lineHighlightBackground": "#161B22",
        "editor.selectionBackground": "#264F7844",
        "editorCursor.foreground": "#58A6FF",
      },
    });
    monaco.editor.setTheme("nexmentor-dark");
  };

  const handleLanguageChange = (newLang: string) => {
    setLanguage(newLang);
    setCode(LANGUAGE_CONFIG[newLang]?.template || "");
  };

  const handleReset = () => {
    setCode(LANGUAGE_CONFIG[language]?.template || "");
    toast.info("Code reset to template");
  };

  const handleRunCode = async () => {
    setIsRunning(true);
    await new Promise((resolve) => setTimeout(resolve, 1500));
    toast.success("Code executed successfully");
    setIsRunning(false);
  };

  const handleSubmitCode = async () => {
    setIsSubmitting(true);
    await new Promise((resolve) => setTimeout(resolve, 2000));
    toast.success("Code submitted for review");
    setIsSubmitting(false);
  };

  const sendMessage = async (content?: string) => {
    const messageContent = content || inputMessage.trim();
    if (!messageContent || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: messageContent,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputMessage("");
    setIsLoading(true);

    if (isListening) {
      stopListening();
    }

    try {
      const context = {
        skillLevel: "intermediate" as const,
        patternStrengths: [],
        patternWeaknesses: [],
        pastMistakes: [],
        conversationHistory: messages.slice(-6).map((m) => ({
          role: m.role === "assistant" ? "tutor" : "user",
          content: m.content,
        })),
        tutorPreferences: {},
      };

      const { data, error } = await supabase.functions.invoke("ai-tutor", {
        body: {
          mode: "custom",
          question: messageContent,
          questionTitle: currentQuestion.title,
          questionDescription: currentQuestion.description?.substring(0, 1000),
          patternName: currentQuestion.pattern,
          userCode: code?.substring(0, 2000),
          context,
          sessionId: "nexmentor-session",
        },
      });

      if (error) throw error;

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.response,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);

      // Text-to-speech if enabled
      if (isSpeechEnabled && "speechSynthesis" in window) {
        const utterance = new SpeechSynthesisUtterance(data.response);
        utterance.rate = 0.9;
        utterance.pitch = 1;
        window.speechSynthesis.speak(utterance);
      }
    } catch (error) {
      console.error("NexMentor error:", error);
      toast.error("Failed to get response. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const toggleVoice = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  const handleEndSession = () => {
    setIsSessionActive(false);
    navigate("/curriculum");
  };

  return (
    <div className="min-h-screen bg-[#0A0E14] text-foreground flex flex-col">
      {/* Top Navigation */}
      <header className="bg-[#0D1117] border-b border-border/30 px-4 py-2 flex-shrink-0">
        <div className="flex items-center justify-between">
          {/* Left - Logo and Nav */}
          <div className="flex items-center gap-4 lg:gap-6">
            <Link to="/" className="flex items-center gap-2 group">
              <motion.div
                whileHover={{ scale: 1.05, rotate: 5 }}
                whileTap={{ scale: 0.95 }}
                className="w-7 h-7 lg:w-8 lg:h-8 flex items-center justify-center"
              >
                <img src={logoImage} alt="NexAlgoTrix" className="w-7 h-7 lg:w-8 lg:h-8 object-contain" />
              </motion.div>
              <span className="hidden sm:block font-bold text-base lg:text-lg tracking-tight text-foreground">
                NexAlgoTrix
              </span>
            </Link>

            <nav className="hidden lg:flex items-center gap-1">
              <Link
                to="/curriculum"
                className="px-3 py-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-white/5"
              >
                Curriculum
              </Link>
              <Link
                to="/interview"
                className="px-3 py-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-white/5"
              >
                Interview
              </Link>
              <Link
                to="/dashboard"
                className="px-3 py-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-white/5"
              >
                Dashboard
              </Link>
            </nav>
          </div>

          {/* Center - Problem info */}
          <div className="hidden md:flex items-center gap-2 lg:gap-3">
            <Badge variant="outline" className="text-xs bg-primary/10 text-primary border-primary/30">
              <Sparkles className="w-3 h-3 mr-1" />
              NEXMENTOR
            </Badge>
            <span className="text-muted-foreground hidden lg:inline">|</span>
            <span className="font-medium text-foreground text-sm truncate max-w-[200px]">
              {currentQuestion.title}
            </span>
            <Badge variant="outline" className={cn("text-xs", difficultyConfig[currentQuestion.difficulty].color)}>
              {difficultyConfig[currentQuestion.difficulty].label}
            </Badge>
          </div>

          {/* Right - Timer, Status, User */}
          <div className="flex items-center gap-2 lg:gap-4">
            <div className="hidden sm:flex items-center gap-2 bg-muted/30 px-2 lg:px-3 py-1 lg:py-1.5 rounded-full border border-border/30">
              <Clock className="w-3.5 h-3.5 lg:w-4 lg:h-4 text-muted-foreground" />
              <span className="font-mono text-xs lg:text-sm">{formatTime(sessionTime)}</span>
            </div>

            <div className="flex items-center gap-1.5 bg-emerald-500/10 px-2 lg:px-3 py-1 lg:py-1.5 rounded-full border border-emerald-500/30">
              <Circle className="w-2 h-2 fill-emerald-500 text-emerald-500 animate-pulse" />
              <span className="text-xs lg:text-sm text-emerald-500 font-medium hidden sm:inline">Live</span>
            </div>

            <ThemeToggle />

            {user ? (
              <ProfileDropdown />
            ) : (
              <Link to="/auth">
                <Button size="sm" variant="outline" className="text-xs">
                  Login
                </Button>
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Mobile Problem Title */}
      <div className="md:hidden bg-[#0D1117] border-b border-border/30 px-4 py-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs bg-primary/10 text-primary border-primary/30">
              <Sparkles className="w-3 h-3 mr-1" />
              NEXMENTOR
            </Badge>
            <span className="font-medium text-foreground text-sm truncate max-w-[180px]">
              {currentQuestion.title}
            </span>
          </div>
          <Badge variant="outline" className={cn("text-xs", difficultyConfig[currentQuestion.difficulty].color)}>
            {difficultyConfig[currentQuestion.difficulty].label}
          </Badge>
        </div>
      </div>

      {/* Main Content - Responsive 3 Panel Layout */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Left Panel - Problem Description */}
        <div className="lg:w-[320px] xl:w-[360px] border-b lg:border-b-0 lg:border-r border-border/30 bg-[#0D1117] flex-shrink-0 h-[35vh] lg:h-auto overflow-hidden">
          <ScrollArea className="h-full">
            <div className="p-4 lg:p-6 space-y-4 lg:space-y-6">
              {/* Header */}
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <HelpCircle className="w-4 h-4" />
                    <span className="text-sm font-medium">Problem</span>
                  </div>
                  {currentQuestion.leetcodeLink && (
                    <a
                      href={currentQuestion.leetcodeLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  )}
                </div>
              </div>

              {/* Description */}
              <div className="prose prose-sm dark:prose-invert max-w-none">
                <p className="text-muted-foreground leading-relaxed text-sm whitespace-pre-wrap">
                  {currentQuestion.description}
                </p>
              </div>

              {/* Examples */}
              {currentQuestion.examples && currentQuestion.examples.length > 0 && (
                <div className="space-y-3">
                  <h3 className="font-semibold text-foreground text-sm">Examples</h3>
                  {currentQuestion.examples.map((example, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-lg bg-muted/30 border border-border/50 space-y-1.5"
                    >
                      <div className="font-mono text-xs">
                        <span className="text-muted-foreground">Input: </span>
                        <span className="text-foreground">{example.input}</span>
                      </div>
                      <div className="font-mono text-xs">
                        <span className="text-muted-foreground">Output: </span>
                        <span className="text-primary font-medium">{example.output}</span>
                      </div>
                      {example.explanation && (
                        <div className="text-xs text-muted-foreground pt-1.5 border-t border-border/30">
                          <span className="font-medium">Explanation: </span>
                          {example.explanation}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Constraints */}
              {currentQuestion.constraints && currentQuestion.constraints.length > 0 && (
                <div className="space-y-2">
                  <h3 className="font-semibold text-foreground text-sm">Constraints</h3>
                  <ul className="space-y-1">
                    {currentQuestion.constraints.map((constraint, idx) => (
                      <li key={idx} className="text-xs text-muted-foreground font-mono">
                        • {constraint}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Hints */}
              {currentQuestion.hints && currentQuestion.hints.length > 0 && (
                <Collapsible open={hintsOpen} onOpenChange={setHintsOpen}>
                  <CollapsibleTrigger asChild>
                    <Button
                      variant="ghost"
                      className="w-full justify-between h-auto py-2.5 px-3 bg-primary/5 hover:bg-primary/10 border border-primary/20 rounded-lg text-sm"
                    >
                      <div className="flex items-center gap-2">
                        <Lightbulb className="w-4 h-4 text-amber-500" />
                        <span className="font-medium">Hints</span>
                        <Badge variant="secondary" className="text-xs">
                          {currentQuestion.hints.length}
                        </Badge>
                      </div>
                      {hintsOpen ? (
                        <ChevronDown className="w-4 h-4" />
                      ) : (
                        <ChevronRight className="w-4 h-4" />
                      )}
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="mt-2 space-y-2">
                    {currentQuestion.hints.map((hint, idx) => (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        className="relative"
                      >
                        {hintsRevealed.includes(idx) ? (
                          <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs">
                            <span className="text-amber-500 font-medium">Hint {idx + 1}: </span>
                            <span className="text-muted-foreground">{hint}</span>
                          </div>
                        ) : (
                          <Button
                            variant="ghost"
                            className="w-full justify-start h-auto py-2 px-3 bg-muted/30 hover:bg-muted/50 text-muted-foreground text-xs"
                            onClick={() => revealHint(idx)}
                          >
                            <Lightbulb className="w-3.5 h-3.5 mr-2 text-amber-500" />
                            Reveal Hint {idx + 1}
                          </Button>
                        )}
                      </motion.div>
                    ))}
                  </CollapsibleContent>
                </Collapsible>
              )}

              {/* Companies */}
              {currentQuestion.companies && currentQuestion.companies.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-medium text-muted-foreground">Asked by</h4>
                  <div className="flex flex-wrap gap-1.5">
                    {currentQuestion.companies.map((company, idx) => (
                      <Badge key={idx} variant="secondary" className="text-xs">
                        {company}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>
        </div>

        {/* Center Panel - Code Editor */}
        <div className="flex-1 min-w-0 flex flex-col h-[30vh] lg:h-auto">
          {/* Editor Header */}
          <div className="flex items-center justify-between px-3 lg:px-4 py-2 border-b border-border/30 bg-[#161B22] flex-shrink-0">
            <div className="flex items-center gap-2 lg:gap-3">
              <Select value={language} onValueChange={handleLanguageChange}>
                <SelectTrigger className="w-[100px] lg:w-[120px] h-7 lg:h-8 bg-[#21262D] border-border/50 text-xs lg:text-sm">
                  <SelectValue placeholder="Language" />
                </SelectTrigger>
                <SelectContent>
                  {LANGUAGES.map((lang) => (
                    <SelectItem key={lang.value} value={lang.value}>
                      {lang.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 lg:h-8 px-2 text-muted-foreground hover:text-foreground"
                onClick={handleReset}
              >
                <RotateCcw className="w-3.5 h-3.5 lg:w-4 lg:h-4" />
              </Button>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="h-7 lg:h-8 text-xs bg-[#21262D] border-border/50 hover:bg-[#30363D]"
                onClick={handleRunCode}
                disabled={isRunning}
              >
                {isRunning ? (
                  <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                ) : (
                  <Play className="w-3.5 h-3.5 mr-1.5 fill-current" />
                )}
                Run
              </Button>
              <Button
                size="sm"
                className="h-7 lg:h-8 text-xs bg-primary hover:bg-primary/90"
                onClick={handleSubmitCode}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                ) : (
                  <Send className="w-3.5 h-3.5 mr-1.5" />
                )}
                Submit
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
              onMount={handleEditorDidMount}
              theme="vs-dark"
              options={{
                minimap: { enabled: false },
                fontSize: 13,
                lineNumbers: "on",
                scrollBeyondLastLine: false,
                automaticLayout: true,
                tabSize: 4,
                wordWrap: "on",
                padding: { top: 12 },
                quickSuggestions: true,
                suggestOnTriggerCharacters: true,
                acceptSuggestionOnEnter: "on",
                bracketPairColorization: { enabled: true },
                folding: true,
                renderLineHighlight: "all",
                fontFamily: "'JetBrains Mono', 'Fira Code', 'Consolas', monospace",
                fontLigatures: true,
              }}
              loading={
                <div className="flex items-center justify-center h-full bg-[#0D1117]">
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                </div>
              }
            />
          </div>
        </div>

        {/* Right Panel - NexMentor Chat */}
        <div className="lg:w-[340px] xl:w-[380px] flex-shrink-0 flex flex-col bg-card/50 backdrop-blur-sm border-t lg:border-t-0 lg:border-l border-border/50 h-[35vh] lg:h-auto">
          {/* Chat Header */}
          <div className="p-3 lg:p-4 border-b border-border/50 flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-2 lg:gap-3">
              {/* Avatar with glow effect */}
              <div className="relative">
                <div className="w-10 h-10 lg:w-12 lg:h-12 rounded-full bg-gradient-to-br from-primary via-purple-600 to-pink-500 flex items-center justify-center ring-2 ring-primary/30 ring-offset-2 ring-offset-background">
                  <Sparkles className="w-5 h-5 lg:w-6 lg:h-6 text-white" />
                </div>
                <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-background animate-pulse" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground text-sm lg:text-base flex items-center gap-2">
                  NexMentor
                  <Badge variant="outline" className="text-[10px] bg-emerald-500/10 text-emerald-500 border-emerald-500/30">
                    Live
                  </Badge>
                </h3>
                <p className="text-[10px] lg:text-xs text-muted-foreground">Your Coding Mentor</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 lg:h-8 lg:w-8"
                onClick={() => setIsSpeechEnabled(!isSpeechEnabled)}
              >
                {isSpeechEnabled ? (
                  <Volume2 className="w-3.5 h-3.5 lg:w-4 lg:h-4 text-primary" />
                ) : (
                  <VolumeX className="w-3.5 h-3.5 lg:w-4 lg:h-4 text-muted-foreground" />
                )}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 lg:h-8 lg:w-8 text-red-500 hover:text-red-400 hover:bg-red-500/10"
                onClick={handleEndSession}
              >
                <X className="w-3.5 h-3.5 lg:w-4 lg:h-4" />
              </Button>
            </div>
          </div>

          {/* Messages */}
          <ScrollArea className="flex-1 p-3 lg:p-4">
            <div className="space-y-3 lg:space-y-4">
              {messages.map((msg) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={cn("flex gap-2 lg:gap-3", msg.role === "user" ? "justify-end" : "justify-start")}
                >
                  {msg.role === "assistant" && (
                    <div className="w-7 h-7 lg:w-8 lg:h-8 rounded-full bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center flex-shrink-0">
                      <Sparkles className="w-3.5 h-3.5 lg:w-4 lg:h-4 text-white" />
                    </div>
                  )}
                  <div
                    className={cn(
                      "max-w-[85%] rounded-2xl px-3 lg:px-4 py-2 lg:py-3",
                      msg.role === "user"
                        ? "bg-primary/20 border border-primary/30 text-foreground"
                        : "bg-muted/80 border border-border/50"
                    )}
                  >
                    {msg.role === "assistant" && (
                      <p className="text-[10px] lg:text-xs font-medium text-primary mb-1">NexMentor:</p>
                    )}
                    <p className="text-xs lg:text-sm whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                  </div>
                  {msg.role === "user" && (
                    <div className="w-7 h-7 lg:w-8 lg:h-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                      <User className="w-3.5 h-3.5 lg:w-4 lg:h-4 text-muted-foreground" />
                    </div>
                  )}
                </motion.div>
              ))}
              {isLoading && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex gap-2 lg:gap-3"
                >
                  <div className="w-7 h-7 lg:w-8 lg:h-8 rounded-full bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center">
                    <Sparkles className="w-3.5 h-3.5 lg:w-4 lg:h-4 text-white" />
                  </div>
                  <div className="bg-muted/80 rounded-2xl px-3 lg:px-4 py-2 lg:py-3 border border-border/50">
                    <div className="flex items-center gap-2">
                      <div className="flex gap-1">
                        <span className="w-1.5 h-1.5 lg:w-2 lg:h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: "0ms" }} />
                        <span className="w-1.5 h-1.5 lg:w-2 lg:h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: "150ms" }} />
                        <span className="w-1.5 h-1.5 lg:w-2 lg:h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: "300ms" }} />
                      </div>
                      <span className="text-xs lg:text-sm text-muted-foreground">Thinking...</span>
                    </div>
                  </div>
                </motion.div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>

          {/* Input Area */}
          <div className="p-3 lg:p-4 border-t border-border/50 space-y-2 lg:space-y-3 flex-shrink-0">
            <div className="relative">
              <Textarea
                placeholder="I'm thinking: two pointers might work..."
                className="min-h-[50px] lg:min-h-[60px] pr-20 lg:pr-24 resize-none bg-muted/50 border-border/50 rounded-xl text-xs lg:text-sm"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={isLoading}
              />
              <div className="absolute right-2 bottom-2 flex gap-1">
                {isVoiceSupported && (
                  <Button
                    size="icon"
                    variant={isListening ? "default" : "ghost"}
                    className={cn(
                      "h-7 w-7 lg:h-8 lg:w-8 rounded-lg transition-all",
                      isListening && "bg-red-500 hover:bg-red-600 animate-pulse"
                    )}
                    onClick={toggleVoice}
                  >
                    {isListening ? (
                      <MicOff className="w-3.5 h-3.5 lg:w-4 lg:h-4" />
                    ) : (
                      <Mic className="w-3.5 h-3.5 lg:w-4 lg:h-4" />
                    )}
                  </Button>
                )}
                <Button
                  size="icon"
                  className="h-7 w-7 lg:h-8 lg:w-8 rounded-lg"
                  onClick={() => sendMessage()}
                  disabled={!inputMessage.trim() || isLoading}
                >
                  <Send className="w-3.5 h-3.5 lg:w-4 lg:h-4" />
                </Button>
              </div>
            </div>

            {/* Voice indicator */}
            <AnimatePresence>
              {isListening && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="flex items-center gap-2 text-xs text-muted-foreground"
                >
                  <div className="flex gap-0.5 items-end h-4">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <motion.div
                        key={i}
                        className="w-1 bg-primary rounded-full"
                        animate={{ height: [4, 16, 8, 12, 4] }}
                        transition={{
                          duration: 0.8,
                          repeat: Infinity,
                          delay: i * 0.1,
                        }}
                      />
                    ))}
                  </div>
                  <span>Listening... Speak now</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Quick action buttons */}
            <div className="flex items-center justify-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                className="rounded-full h-9 w-9 lg:h-10 lg:w-10 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30"
                onClick={toggleVoice}
              >
                <Mic className={cn("w-4 h-4", isListening ? "text-red-500" : "text-emerald-500")} />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="rounded-full h-9 w-9 lg:h-10 lg:w-10 bg-muted hover:bg-muted/80"
                onClick={() => setIsSpeechEnabled(!isSpeechEnabled)}
              >
                {isSpeechEnabled ? (
                  <Volume2 className="w-4 h-4 text-primary" />
                ) : (
                  <VolumeX className="w-4 h-4 text-muted-foreground" />
                )}
              </Button>
              {/* Voice visualizer */}
              <div className="flex items-center gap-0.5 px-3 lg:px-4 py-2 rounded-full bg-muted/50 border border-border/50">
                {[1, 2, 3, 4, 5].map((i) => (
                  <motion.div
                    key={i}
                    className={cn(
                      "w-1 rounded-full transition-all",
                      isListening ? "bg-primary" : "bg-muted-foreground/30"
                    )}
                    animate={isListening ? { height: [4, 16, 8, 12, 4] } : { height: 4 }}
                    transition={{
                      duration: 0.8,
                      repeat: isListening ? Infinity : 0,
                      delay: i * 0.1,
                    }}
                    style={{ height: 4 }}
                  />
                ))}
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="rounded-full h-9 w-9 lg:h-10 lg:w-10 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30"
                onClick={handleEndSession}
              >
                <X className="w-4 h-4 text-red-500" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
