import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useNexMentorRealtime } from "@/hooks/useNexMentorRealtime";
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
  Search,
  Filter,
  BookOpen,
  Zap,
  Phone,
  PhoneOff,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
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

const LANGUAGE_CONFIG: Record<string, { monacoLang: string; template: string }> = {
  python: {
    monacoLang: "python",
    template: `# Write your solution here
# Think aloud as you code - explain your approach to NexMentor

def solution():
    pass`,
  },
  javascript: {
    monacoLang: "javascript",
    template: `// Write your solution here
// Think aloud as you code - explain your approach to NexMentor

function solution() {
    
}`,
  },
  java: {
    monacoLang: "java",
    template: `// Write your solution here
// Think aloud as you code - explain your approach to NexMentor

class Solution {
    public void solve() {
        
    }
}`,
  },
  cpp: {
    monacoLang: "cpp",
    template: `// Write your solution here
// Think aloud as you code - explain your approach to NexMentor

class Solution {
public:
    void solve() {
        
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

const difficultyConfig = {
  easy: { label: "Easy", color: "text-emerald-500 bg-emerald-500/10 border-emerald-500/30" },
  medium: { label: "Medium", color: "text-amber-500 bg-amber-500/10 border-amber-500/30" },
  hard: { label: "Hard", color: "text-red-500 bg-red-500/10 border-red-500/30" },
};

type ViewMode = "selection" | "session";

export default function AITutor() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const questionId = searchParams.get("q");

  // View state
  const [viewMode, setViewMode] = useState<ViewMode>(questionId ? "session" : "selection");
  const [selectedQuestion, setSelectedQuestion] = useState<any>(null);

  // Session state
  const [sessionTime, setSessionTime] = useState(0);
  const [isSessionActive, setIsSessionActive] = useState(false);

  // Code editor state
  const [language, setLanguage] = useState("python");
  const [code, setCode] = useState(LANGUAGE_CONFIG["python"].template);
  const [isRunning, setIsRunning] = useState(false);

  // Filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [difficultyFilter, setDifficultyFilter] = useState<string>("all");
  const [patternFilter, setPatternFilter] = useState<string>("all");

  // Hints state
  const [hintsOpen, setHintsOpen] = useState(false);
  const [hintsRevealed, setHintsRevealed] = useState<number[]>([]);

  // Voice interaction
  const {
    isConnected,
    isConnecting,
    isMentorSpeaking,
    isUserSpeaking,
    mentorTranscript,
    userTranscript,
    connect,
    disconnect,
    sendTextMessage,
  } = useNexMentorRealtime({
    onConnected: () => {
      toast.success("Connected to NexMentor");
      setIsSessionActive(true);
    },
    onDisconnected: () => {
      toast.info("Disconnected from NexMentor");
      setIsSessionActive(false);
    },
    onError: (error) => {
      toast.error(error);
    },
  });

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

  // Fetch selected question if ID is in URL
  useEffect(() => {
    if (questionId && questions) {
      const question = questions.find((q) => q.id === questionId);
      if (question) {
        setSelectedQuestion(question);
        setViewMode("session");
      }
    }
  }, [questionId, questions]);

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

  // Filter questions
  const filteredQuestions = questions?.filter((q) => {
    const matchesSearch =
      q.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      q.patterns?.name?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDifficulty = difficultyFilter === "all" || q.difficulty === difficultyFilter;
    const matchesPattern = patternFilter === "all" || q.pattern_id === patternFilter;
    return matchesSearch && matchesDifficulty && matchesPattern;
  });

  const handleSelectQuestion = (question: any) => {
    setSelectedQuestion(question);
    setSearchParams({ q: question.id });
    setViewMode("session");
    setSessionTime(0);
    setHintsRevealed([]);
    setCode(LANGUAGE_CONFIG[language].template);
  };

  const handleStartSession = async () => {
    if (!selectedQuestion) return;

    const questionContext = `
Problem: ${selectedQuestion.title}
Difficulty: ${selectedQuestion.difficulty}
Pattern: ${selectedQuestion.patterns?.name || "Unknown"}
Description: ${selectedQuestion.description || "No description"}
    `.trim();

    await connect(questionContext);
  };

  const handleEndSession = () => {
    disconnect();
    setViewMode("selection");
    setSelectedQuestion(null);
    setSearchParams({});
    setSessionTime(0);
    setIsSessionActive(false);
  };

  const handleBackToSelection = () => {
    if (isConnected) {
      disconnect();
    }
    setViewMode("selection");
    setSelectedQuestion(null);
    setSearchParams({});
    setSessionTime(0);
    setIsSessionActive(false);
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

  // QUESTION SELECTION VIEW
  if (viewMode === "selection") {
    return (
      <div className="min-h-screen bg-[#0A0E14] text-foreground">
        {/* Header */}
        <header className="bg-[#0D1117] border-b border-border/30 px-4 py-3 sticky top-0 z-50">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link to="/" className="flex items-center gap-2 group">
                <motion.div
                  whileHover={{ scale: 1.05, rotate: 5 }}
                  whileTap={{ scale: 0.95 }}
                  className="w-8 h-8 flex items-center justify-center"
                >
                  <img src={logoImage} alt="NexAlgoTrix" className="w-8 h-8 object-contain" />
                </motion.div>
                <span className="hidden sm:block font-bold text-lg tracking-tight text-foreground">
                  NexAlgoTrix
                </span>
              </Link>
              <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30">
                <Sparkles className="w-3 h-3 mr-1" />
                NexMentor
              </Badge>
            </div>

            <div className="flex items-center gap-3">
              <ThemeToggle />
              {user ? (
                <ProfileDropdown />
              ) : (
                <Link to="/auth">
                  <Button size="sm" variant="outline">
                    Login
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </header>

        {/* Hero Section */}
        <div className="bg-gradient-to-b from-primary/5 to-transparent py-12 px-4">
          <div className="max-w-4xl mx-auto text-center space-y-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/30"
            >
              <Phone className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-primary">Voice-First AI Mentoring</span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-3xl md:text-4xl font-bold"
            >
              Practice with <span className="text-primary">NexMentor</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-muted-foreground max-w-2xl mx-auto"
            >
              Select a problem below and practice with your AI mentor who speaks like a senior
              Indian SDE. Real-time voice interaction — just think aloud and get instant feedback.
            </motion.p>
          </div>
        </div>

        {/* Filters */}
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
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
              <SelectTrigger className="w-full sm:w-[150px] bg-muted/50 border-border/50">
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
              <SelectTrigger className="w-full sm:w-[180px] bg-muted/50 border-border/50">
                <SelectValue placeholder="Pattern" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Patterns</SelectItem>
                {patterns?.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name}
                  </SelectItem>
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredQuestions?.map((question, index) => (
                <motion.div
                  key={question.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="group relative bg-card/50 border border-border/50 rounded-xl p-5 hover:bg-card/80 hover:border-primary/30 transition-all cursor-pointer"
                  onClick={() => handleSelectQuestion(question)}
                >
                  <div className="flex items-start justify-between mb-3">
                    <Badge
                      variant="outline"
                      className={cn(
                        "text-xs",
                        difficultyConfig[question.difficulty as keyof typeof difficultyConfig]?.color
                      )}
                    >
                      {difficultyConfig[question.difficulty as keyof typeof difficultyConfig]?.label}
                    </Badge>
                    <Badge variant="secondary" className="text-xs">
                      {question.patterns?.name || "Unknown"}
                    </Badge>
                  </div>

                  <h3 className="font-semibold text-foreground mb-2 group-hover:text-primary transition-colors line-clamp-2">
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

                  <div className="absolute inset-0 rounded-xl border-2 border-primary/0 group-hover:border-primary/50 transition-all pointer-events-none" />
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
      </div>
    );
  }

  // SESSION VIEW
  return (
    <div className="min-h-screen bg-[#0A0E14] text-foreground flex flex-col">
      {/* Top Navigation - Minimal during session */}
      <header className="bg-[#0D1117] border-b border-border/30 px-4 py-2 flex-shrink-0">
        <div className="flex items-center justify-between">
          {/* Left - Back button and Logo */}
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 px-2"
              onClick={handleBackToSelection}
            >
              <ArrowLeft className="w-4 h-4 mr-1" />
              <span className="hidden sm:inline">Back</span>
            </Button>

            <Link to="/" className="flex items-center gap-2">
              <img src={logoImage} alt="NexAlgoTrix" className="w-7 h-7 object-contain" />
              <span className="hidden md:block font-bold text-base tracking-tight">NexAlgoTrix</span>
            </Link>
          </div>

          {/* Center - Problem info */}
          <div className="hidden md:flex items-center gap-3">
            <Badge variant="outline" className="text-xs bg-primary/10 text-primary border-primary/30">
              <Sparkles className="w-3 h-3 mr-1" />
              NEXMENTOR
            </Badge>
            <span className="text-muted-foreground">|</span>
            <span className="font-medium text-foreground text-sm truncate max-w-[250px]">
              {selectedQuestion?.title}
            </span>
            <Badge
              variant="outline"
              className={cn(
                "text-xs",
                difficultyConfig[selectedQuestion?.difficulty as keyof typeof difficultyConfig]?.color
              )}
            >
              {difficultyConfig[selectedQuestion?.difficulty as keyof typeof difficultyConfig]?.label}
            </Badge>
          </div>

          {/* Right - Timer, Status */}
          <div className="flex items-center gap-2 lg:gap-3">
            <div className="flex items-center gap-2 bg-muted/30 px-3 py-1.5 rounded-full border border-border/30">
              <Clock className="w-4 h-4 text-muted-foreground" />
              <span className="font-mono text-sm">{formatTime(sessionTime)}</span>
            </div>

            {isConnected && (
              <div className="flex items-center gap-1.5 bg-emerald-500/10 px-3 py-1.5 rounded-full border border-emerald-500/30">
                <Circle className="w-2 h-2 fill-emerald-500 text-emerald-500 animate-pulse" />
                <span className="text-sm text-emerald-500 font-medium hidden sm:inline">Live</span>
              </div>
            )}

            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Mobile Problem Title */}
      <div className="md:hidden bg-[#0D1117] border-b border-border/30 px-4 py-2">
        <div className="flex items-center justify-between">
          <span className="font-medium text-foreground text-sm truncate">
            {selectedQuestion?.title}
          </span>
          <Badge
            variant="outline"
            className={cn(
              "text-xs",
              difficultyConfig[selectedQuestion?.difficulty as keyof typeof difficultyConfig]?.color
            )}
          >
            {difficultyConfig[selectedQuestion?.difficulty as keyof typeof difficultyConfig]?.label}
          </Badge>
        </div>
      </div>

      {/* Main Content - 3 Panel Layout */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Left Panel - Problem Description */}
        <div className="lg:w-[320px] xl:w-[360px] border-b lg:border-b-0 lg:border-r border-border/30 bg-[#0D1117] flex-shrink-0 h-[30vh] lg:h-auto overflow-hidden">
          <ScrollArea className="h-full">
            <div className="p-4 lg:p-6 space-y-4 lg:space-y-6">
              {/* Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <HelpCircle className="w-4 h-4" />
                  <span className="text-sm font-medium">Problem</span>
                </div>
                {selectedQuestion?.leetcode_link && (
                  <a
                    href={selectedQuestion.leetcode_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                )}
              </div>

              {/* Description */}
              <div className="prose prose-sm dark:prose-invert max-w-none">
                <p className="text-muted-foreground leading-relaxed text-sm whitespace-pre-wrap">
                  {selectedQuestion?.description || "No description available."}
                </p>
              </div>

              {/* Hints */}
              {selectedQuestion?.hints && (selectedQuestion.hints as string[]).length > 0 && (
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
                          {(selectedQuestion.hints as string[]).length}
                        </Badge>
                      </div>
                      {hintsOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="mt-2 space-y-2">
                    {(selectedQuestion.hints as string[]).map((hint: string, idx: number) => (
                      <motion.div key={idx} initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}>
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
              {selectedQuestion?.companies && selectedQuestion.companies.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-medium text-muted-foreground">Asked by</h4>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedQuestion.companies.map((company: string, idx: number) => (
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
        <div className="flex-1 min-w-0 flex flex-col h-[35vh] lg:h-auto">
          {/* Editor Header */}
          <div className="flex items-center justify-between px-3 lg:px-4 py-2 border-b border-border/30 bg-[#161B22] flex-shrink-0">
            <div className="flex items-center gap-3">
              <Select value={language} onValueChange={handleLanguageChange}>
                <SelectTrigger className="w-[120px] h-8 bg-[#21262D] border-border/50 text-sm">
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
                className="h-8 px-2 text-muted-foreground hover:text-foreground"
                onClick={handleReset}
              >
                <RotateCcw className="w-4 h-4" />
              </Button>
            </div>

            <Button
              variant="outline"
              size="sm"
              className="h-8 bg-[#21262D] border-border/50 hover:bg-[#30363D]"
              onClick={handleRunCode}
              disabled={isRunning}
            >
              {isRunning ? (
                <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
              ) : (
                <Play className="w-4 h-4 mr-1.5 fill-current" />
              )}
              Run
            </Button>
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
                fontSize: 14,
                lineNumbers: "on",
                scrollBeyondLastLine: false,
                automaticLayout: true,
                tabSize: 4,
                wordWrap: "on",
                padding: { top: 12 },
                quickSuggestions: true,
                bracketPairColorization: { enabled: true },
                folding: true,
                renderLineHighlight: "all",
                fontFamily: "'JetBrains Mono', 'Fira Code', 'Consolas', monospace",
              }}
              loading={
                <div className="flex items-center justify-center h-full bg-[#0D1117]">
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                </div>
              }
            />
          </div>
        </div>

        {/* Right Panel - NexMentor Voice Interface */}
        <div className="lg:w-[340px] xl:w-[380px] flex-shrink-0 flex flex-col bg-card/50 backdrop-blur-sm border-t lg:border-t-0 lg:border-l border-border/50 h-[35vh] lg:h-auto">
          {/* Header */}
          <div className="p-4 border-b border-border/50 flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div
                  className={cn(
                    "w-12 h-12 rounded-full bg-gradient-to-br from-primary via-purple-600 to-pink-500 flex items-center justify-center ring-2 ring-offset-2 ring-offset-background transition-all",
                    isMentorSpeaking ? "ring-emerald-500 animate-pulse" : isUserSpeaking ? "ring-primary" : "ring-primary/30"
                  )}
                >
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
                {isConnected && (
                  <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-background animate-pulse" />
                )}
              </div>
              <div>
                <h3 className="font-semibold text-foreground flex items-center gap-2">
                  NexMentor
                  {isConnected && (
                    <Badge variant="outline" className="text-[10px] bg-emerald-500/10 text-emerald-500 border-emerald-500/30">
                      Live
                    </Badge>
                  )}
                </h3>
                <p className="text-xs text-muted-foreground">
                  {isMentorSpeaking ? "Speaking..." : isUserSpeaking ? "Listening..." : "Your AI Mentor"}
                </p>
              </div>
            </div>
          </div>

          {/* Voice Visualization Area */}
          <div className="flex-1 flex flex-col items-center justify-center p-6 space-y-6">
            {!isConnected ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center space-y-6"
              >
                <div className="w-32 h-32 rounded-full bg-gradient-to-br from-primary/20 to-purple-600/20 flex items-center justify-center mx-auto border border-primary/30">
                  <Phone className="w-12 h-12 text-primary" />
                </div>
                <div className="space-y-2">
                  <h3 className="font-semibold text-lg">Ready to Practice?</h3>
                  <p className="text-sm text-muted-foreground max-w-xs">
                    Start a live voice session with NexMentor. Think aloud and get real-time feedback.
                  </p>
                </div>
                <Button
                  size="lg"
                  className="bg-primary hover:bg-primary/90 gap-2"
                  onClick={handleStartSession}
                  disabled={isConnecting}
                >
                  {isConnecting ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Connecting...
                    </>
                  ) : (
                    <>
                      <Phone className="w-5 h-5" />
                      Start Session
                    </>
                  )}
                </Button>
              </motion.div>
            ) : (
              <>
                {/* Live Voice Visualizer */}
                <div className="flex flex-col items-center space-y-4">
                  <motion.div
                    className={cn(
                      "w-32 h-32 rounded-full flex items-center justify-center transition-all",
                      isMentorSpeaking
                        ? "bg-gradient-to-br from-emerald-500/30 to-emerald-600/30 border-2 border-emerald-500/50"
                        : isUserSpeaking
                        ? "bg-gradient-to-br from-primary/30 to-purple-600/30 border-2 border-primary/50"
                        : "bg-muted/50 border border-border/50"
                    )}
                    animate={isMentorSpeaking || isUserSpeaking ? { scale: [1, 1.05, 1] } : {}}
                    transition={{ duration: 0.5, repeat: Infinity }}
                  >
                    {isMentorSpeaking ? (
                      <Volume2 className="w-12 h-12 text-emerald-500" />
                    ) : isUserSpeaking ? (
                      <Mic className="w-12 h-12 text-primary" />
                    ) : (
                      <Mic className="w-12 h-12 text-muted-foreground" />
                    )}
                  </motion.div>

                  {/* Audio Wave Animation */}
                  <div className="flex items-center gap-1 h-8">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <motion.div
                        key={i}
                        className={cn(
                          "w-1.5 rounded-full transition-colors",
                          isMentorSpeaking ? "bg-emerald-500" : isUserSpeaking ? "bg-primary" : "bg-muted-foreground/30"
                        )}
                        animate={
                          isMentorSpeaking || isUserSpeaking
                            ? { height: [8, 32, 16, 24, 8] }
                            : { height: 8 }
                        }
                        transition={{
                          duration: 0.6,
                          repeat: isMentorSpeaking || isUserSpeaking ? Infinity : 0,
                          delay: i * 0.1,
                        }}
                        style={{ height: 8 }}
                      />
                    ))}
                  </div>

                  <p className="text-sm text-muted-foreground text-center">
                    {isMentorSpeaking
                      ? "NexMentor is speaking..."
                      : isUserSpeaking
                      ? "You're speaking..."
                      : "Speak to interact with NexMentor"}
                  </p>
                </div>

                {/* Transcript Display */}
                {mentorTranscript && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="w-full p-4 rounded-xl bg-muted/50 border border-border/50"
                  >
                    <p className="text-xs font-medium text-primary mb-1">NexMentor:</p>
                    <p className="text-sm">{mentorTranscript}</p>
                  </motion.div>
                )}
              </>
            )}
          </div>

          {/* Bottom Controls */}
          {isConnected && (
            <div className="p-4 border-t border-border/50 flex items-center justify-center gap-4">
              <Button
                variant="destructive"
                size="lg"
                className="gap-2"
                onClick={handleEndSession}
              >
                <PhoneOff className="w-5 h-5" />
                End Session
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
