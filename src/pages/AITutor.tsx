import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { 
  Brain, Lightbulb, Bug, MessageSquare, Zap, 
  ArrowRight, Sparkles, BookOpen, Target, Shield,
  Users, Timer, Code2, GraduationCap, Send, Loader2,
  FileText, Code, Mic, Bookmark, X, Clock, Circle,
  ChevronLeft, Bot
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Navbar } from "@/components/landing/Navbar";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

const demoQuestions = [
  { id: "demo-1", title: "Two Sum", pattern: "Two Pointers", difficulty: "easy" },
  { id: "demo-2", title: "Container With Most Water", pattern: "Two Pointers", difficulty: "medium" },
  { id: "demo-3", title: "3Sum", pattern: "Two Pointers", difficulty: "medium" },
  { id: "demo-4", title: "Valid Parentheses", pattern: "Stack", difficulty: "easy" },
  { id: "demo-5", title: "Binary Search", pattern: "Binary Search", difficulty: "easy" },
];

export default function AITutor() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const questionId = searchParams.get("q");
  
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [selectedQuestion, setSelectedQuestion] = useState<typeof demoQuestions[0] | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sessionTime, setSessionTime] = useState(0);
  const [activeTab, setActiveTab] = useState("chat");
  const [sessionNotes, setSessionNotes] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch real questions if user is logged in
  const { data: questions } = useQuery({
    queryKey: ["tutor-questions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("questions")
        .select("id, title, difficulty, patterns(name)")
        .limit(10);
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  // Session timer
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isSessionActive) {
      interval = setInterval(() => {
        setSessionTime(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isSessionActive]);

  // Auto scroll messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const startSession = (question: typeof demoQuestions[0]) => {
    setSelectedQuestion(question);
    setIsSessionActive(true);
    setSessionTime(0);
    setMessages([{
      id: "welcome",
      role: "assistant",
      content: `Welcome! I'm NEXMENTOR, your senior engineering mentor. Let's work on "${question.title}" together.\n\nBefore we dive in — what's your initial read on this problem? What pattern or approach comes to mind first?`,
      timestamp: new Date(),
    }]);
  };

  const endSession = () => {
    setIsSessionActive(false);
    setSelectedQuestion(null);
    setMessages([]);
    setSessionTime(0);
    setSessionNotes("");
  };

  const sendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: inputMessage,
      timestamp: new Date(),
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInputMessage("");
    setIsLoading(true);

    try {
      // Build context for AI
      const context = {
        skillLevel: "intermediate" as const,
        patternStrengths: [],
        patternWeaknesses: [],
        pastMistakes: [],
        conversationHistory: messages.slice(-6).map(m => ({
          role: m.role === "assistant" ? "tutor" : "user",
          content: m.content,
        })),
        tutorPreferences: {},
      };

      const { data, error } = await supabase.functions.invoke("ai-tutor", {
        body: {
          mode: "custom",
          question: inputMessage,
          questionTitle: selectedQuestion?.title || "General DSA",
          questionDescription: "",
          patternName: selectedQuestion?.pattern || "",
          userCode: "",
          context,
          sessionId: "demo-session",
        },
      });

      if (error) throw error;

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.response,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error("Error:", error);
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

  // If session is active, show the interactive session interface
  if (isSessionActive && selectedQuestion) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        {/* Session Header */}
        <header className="bg-card border-b border-border px-4 py-3">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={endSession}>
                <ChevronLeft className="w-5 h-5" />
              </Button>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center">
                  <Code2 className="w-5 h-5 text-white" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h1 className="font-semibold">{selectedQuestion.title}</h1>
                    <Badge className="bg-primary/10 text-primary border-primary/20 text-xs">
                      <Bot className="w-3 h-3 mr-1" />
                      NEXMENTOR
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-primary/50" />
                    {selectedQuestion.pattern}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 bg-muted/50 px-3 py-1.5 rounded-full">
                <Clock className="w-4 h-4 text-muted-foreground" />
                <span className="font-mono text-sm">{formatTime(sessionTime)}</span>
                <span className="text-xs text-muted-foreground">remaining</span>
              </div>
              <div className="flex items-center gap-2">
                <Circle className="w-2 h-2 fill-green-500 text-green-500" />
                <span className="text-sm text-green-500">Active</span>
              </div>
              <Button 
                variant="outline" 
                className="border-red-500/50 text-red-500 hover:bg-red-500/10"
                onClick={endSession}
              >
                <X className="w-4 h-4 mr-2" />
                End Session
              </Button>
            </div>
          </div>
        </header>

        {/* Tip Banner */}
        <div className="bg-muted/30 border-b border-border py-2 px-4">
          <p className="text-center text-sm text-muted-foreground flex items-center justify-center gap-2">
            <Lightbulb className="w-4 h-4 text-primary" />
            Ask NEXMENTOR for help when stuck on algorithms
            <span className="flex gap-1 ml-2">
              {[...Array(8)].map((_, i) => (
                <span key={i} className="w-1.5 h-1.5 rounded-full bg-primary/40" />
              ))}
            </span>
          </p>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left Panel - Chat & Tabs */}
          <div className="flex-1 flex flex-col">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
              <div className="border-b border-border px-4">
                <TabsList className="bg-transparent h-12">
                  <TabsTrigger value="notes" className="data-[state=active]:bg-muted">
                    <FileText className="w-4 h-4 mr-2" />
                    Session Notes
                  </TabsTrigger>
                  <TabsTrigger value="code" className="data-[state=active]:bg-muted">
                    <Code className="w-4 h-4 mr-2" />
                    Code Editor
                  </TabsTrigger>
                  <TabsTrigger value="chat" className="data-[state=active]:bg-muted">
                    <Sparkles className="w-4 h-4 mr-2" />
                    AI Chat
                  </TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="notes" className="flex-1 p-4 mt-0">
                <Textarea 
                  placeholder="Take notes during your session..."
                  className="h-full min-h-[400px] resize-none"
                  value={sessionNotes}
                  onChange={(e) => setSessionNotes(e.target.value)}
                />
              </TabsContent>

              <TabsContent value="code" className="flex-1 p-4 mt-0">
                <div className="h-full bg-muted/50 rounded-lg flex items-center justify-center">
                  <p className="text-muted-foreground">Code editor coming soon...</p>
                </div>
              </TabsContent>

              <TabsContent value="chat" className="flex-1 flex flex-col mt-0 overflow-hidden">
                {/* Messages */}
                <ScrollArea className="flex-1 p-4">
                  <div className="space-y-4 max-w-3xl mx-auto">
                    {messages.map((msg) => (
                      <motion.div
                        key={msg.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                      >
                        {msg.role === "assistant" && (
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center flex-shrink-0">
                            <span className="text-sm">🧠</span>
                          </div>
                        )}
                        <div
                          className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                            msg.role === "user"
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted"
                          }`}
                        >
                          {msg.role === "assistant" && (
                            <p className="text-xs text-primary font-medium mb-1">NEXMENTOR:</p>
                          )}
                          <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                        </div>
                      </motion.div>
                    ))}
                    {isLoading && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex gap-3"
                      >
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center flex-shrink-0">
                          <span className="text-sm">🧠</span>
                        </div>
                        <div className="bg-muted rounded-2xl px-4 py-3">
                          <div className="flex items-center gap-2">
                            <Loader2 className="w-4 h-4 animate-spin text-primary" />
                            <span className="text-sm text-muted-foreground">NEXMENTOR is thinking...</span>
                          </div>
                        </div>
                      </motion.div>
                    )}
                    <div ref={messagesEndRef} />
                  </div>
                </ScrollArea>

                {/* Input Area */}
                <div className="p-4 border-t border-border">
                  <div className="max-w-3xl mx-auto">
                    <div className="relative">
                      <Textarea
                        placeholder="Explain your thinking or ask a question..."
                        className="min-h-[60px] pr-12 resize-none"
                        value={inputMessage}
                        onChange={(e) => setInputMessage(e.target.value)}
                        onKeyDown={handleKeyDown}
                        disabled={isLoading}
                      />
                      <Button
                        size="icon"
                        className="absolute right-2 bottom-2"
                        onClick={sendMessage}
                        disabled={!inputMessage.trim() || isLoading}
                      >
                        <Send className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-center gap-4 pb-6">
                  <Button size="lg" variant="outline" className="rounded-full w-14 h-14 bg-emerald-500/10 border-emerald-500/30 hover:bg-emerald-500/20">
                    <Mic className="w-5 h-5 text-emerald-500" />
                  </Button>
                  <Button size="lg" variant="outline" className="rounded-full w-14 h-14 bg-muted">
                    <Bookmark className="w-5 h-5" />
                  </Button>
                  <Button 
                    size="lg" 
                    variant="outline" 
                    className="rounded-full w-14 h-14 bg-red-500/10 border-red-500/30 hover:bg-red-500/20"
                    onClick={endSession}
                  >
                    <X className="w-5 h-5 text-red-500" />
                  </Button>
                </div>
              </TabsContent>
            </Tabs>
          </div>

          {/* Right Panel - Mentor Info (optional, can be removed on mobile) */}
          <div className="hidden lg:block w-80 border-l border-border p-6">
            <div className="text-center">
              <div className="w-32 h-32 mx-auto rounded-full bg-gradient-to-br from-primary/20 to-purple-500/20 flex items-center justify-center mb-4 ring-2 ring-primary/30 ring-offset-4 ring-offset-background">
                <Bot className="w-16 h-16 text-primary" />
              </div>
              <h3 className="font-bold text-lg">NEXMENTOR</h3>
              <p className="text-sm text-muted-foreground mb-4">Senior Engineering Mentor</p>
              
              <div className="space-y-2 text-left">
                <div className="flex items-center gap-2 text-sm">
                  <Brain className="w-4 h-4 text-primary" />
                  <span>Socratic Method</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Shield className="w-4 h-4 text-primary" />
                  <span>Anti-Spoiler Protection</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Target className="w-4 h-4 text-primary" />
                  <span>Interview-Style Guidance</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Landing Page / Question Selection
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="pt-32 pb-20 px-4">
        <div className="max-w-6xl mx-auto">
          {/* Hero Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <Badge className="mb-4 bg-primary/10 text-primary border-primary/20">
              <Sparkles className="w-3 h-3 mr-1" />
              AI-Powered Mentorship
            </Badge>
            <h1 className="text-4xl md:text-6xl font-bold mb-4">
              Meet{" "}
              <span className="bg-gradient-to-r from-primary via-purple-500 to-pink-500 bg-clip-text text-transparent">
                NEXMENTOR
              </span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-2">
              Your senior engineer mentor who guides without spoiling.
            </p>
            <p className="text-lg text-muted-foreground/80 max-w-xl mx-auto mb-8">
              I don't solve problems for you. I train you to think like an interviewer expects.
            </p>
          </motion.div>

          {/* Quick Start - Select Problem */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="mb-16"
          >
            <Card className="bg-gradient-to-br from-primary/5 to-purple-500/5 border-primary/20">
              <CardHeader className="text-center">
                <CardTitle className="text-2xl">Start a Session</CardTitle>
                <CardDescription>
                  Select a problem to practice with NEXMENTOR
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {(questions || demoQuestions).slice(0, 6).map((q: any) => (
                    <Card 
                      key={q.id} 
                      className="cursor-pointer hover:border-primary/50 transition-all hover:shadow-lg"
                      onClick={() => startSession({
                        id: q.id,
                        title: q.title,
                        pattern: q.patterns?.name || q.pattern || "General",
                        difficulty: q.difficulty,
                      })}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-2">
                          <Badge variant={
                            q.difficulty === "easy" ? "default" : 
                            q.difficulty === "medium" ? "secondary" : "destructive"
                          } className="text-xs">
                            {q.difficulty}
                          </Badge>
                          <Bot className="w-4 h-4 text-primary" />
                        </div>
                        <h3 className="font-medium mb-1">{q.title}</h3>
                        <p className="text-xs text-muted-foreground">
                          {q.patterns?.name || q.pattern}
                        </p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
                
                <div className="mt-6 text-center">
                  <Button 
                    variant="outline"
                    onClick={() => navigate("/curriculum")}
                  >
                    View Full Curriculum
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* How It Works */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="mb-16"
          >
            <h2 className="text-2xl font-bold text-center mb-8">How NEXMENTOR Works</h2>
            <div className="grid md:grid-cols-4 gap-6">
              {[
                { step: "1", title: "You Explain", desc: "Share your initial approach", icon: MessageSquare },
                { step: "2", title: "I Question", desc: "Challenge your reasoning", icon: Brain },
                { step: "3", title: "You Think", desc: "Refine your understanding", icon: Lightbulb },
                { step: "4", title: "Insight Emerges", desc: "Discover the solution yourself", icon: Sparkles },
              ].map((item, i) => (
                <div key={i} className="text-center">
                  <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                    <item.icon className="w-7 h-7 text-primary" />
                  </div>
                  <div className="text-xs text-primary font-medium mb-1">Step {item.step}</div>
                  <h3 className="font-semibold mb-1">{item.title}</h3>
                  <p className="text-sm text-muted-foreground">{item.desc}</p>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Features */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
          >
            <div className="grid md:grid-cols-2 gap-6">
              <Card className="bg-amber-500/5 border-amber-500/20">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-amber-500/20 flex items-center justify-center">
                      <Shield className="w-5 h-5 text-amber-500" />
                    </div>
                    <CardTitle>Anti-Spoiler Protection</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    NEXMENTOR never gives direct solutions. If you ask for the answer, 
                    I'll redirect you to the thinking process instead.
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-purple-500/5 border-purple-500/20">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
                      <Brain className="w-5 h-5 text-purple-500" />
                    </div>
                    <CardTitle>Socratic Method</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    I ask questions instead of giving answers. What you discover 
                    yourself, you'll remember forever.
                  </p>
                </CardContent>
              </Card>
            </div>
          </motion.div>
        </div>
      </main>
    </div>
  );
}
