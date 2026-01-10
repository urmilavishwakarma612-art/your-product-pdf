import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useVoiceRecognition } from "@/hooks/useVoiceRecognition";
import {
  Mic,
  MicOff,
  Send,
  Loader2,
  User,
  Sparkles,
  X,
  Minimize2,
  Maximize2,
  Volume2,
  VolumeX,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface NexMentorPanelProps {
  questionId: string;
  questionTitle: string;
  questionDescription?: string;
  patternName?: string;
  patternId?: string;
  userCode: string;
  isMinimized?: boolean;
  onToggleMinimize?: () => void;
  onClose?: () => void;
}

export function NexMentorPanel({
  questionId,
  questionTitle,
  questionDescription,
  patternName,
  patternId,
  userCode,
  isMinimized = false,
  onToggleMinimize,
  onClose,
}: NexMentorPanelProps) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isSpeechEnabled, setIsSpeechEnabled] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Voice recognition hook
  const {
    isListening,
    transcript,
    startListening,
    stopListening,
    isSupported: isVoiceSupported,
    error: voiceError,
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

  // Fetch user profile for skill level
  const { data: userProfile } = useQuery({
    queryKey: ["nexmentor-profile", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from("profiles")
        .select("skill_level, curriculum_level, total_xp")
        .eq("id", user.id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  // Fetch pattern stats
  const { data: patternStats } = useQuery({
    queryKey: ["nexmentor-pattern-stats", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from("user_progress")
        .select("question_id, is_solved, questions!inner(pattern_id, patterns(name))")
        .eq("user_id", user.id);
      if (error) throw error;

      const stats: Record<string, { solved: number; total: number }> = {};
      data?.forEach((p: any) => {
        const pName = p.questions?.patterns?.name;
        if (!pName) return;
        if (!stats[pName]) stats[pName] = { solved: 0, total: 0 };
        stats[pName].total++;
        if (p.is_solved) stats[pName].solved++;
      });

      const strong = Object.entries(stats)
        .filter(([_, s]) => s.total >= 3 && s.solved / s.total >= 0.7)
        .map(([name]) => name);
      const weak = Object.entries(stats)
        .filter(([_, s]) => s.total >= 3 && s.solved / s.total < 0.4)
        .map(([name]) => name);

      return { strong, weak };
    },
    enabled: !!user,
  });

  // Initialize with welcome message
  useEffect(() => {
    if (messages.length === 0) {
      setMessages([
        {
          id: "welcome",
          role: "assistant",
          content: `Remember, the array is sorted. What approach are you considering here?`,
          timestamp: new Date(),
        },
      ]);
    }
  }, []);

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

  const detectSkillLevel = (): "beginner" | "intermediate" | "advanced" => {
    if (!userProfile) return "intermediate";
    const level = userProfile.curriculum_level || 0;
    const xp = userProfile.total_xp || 0;
    if (level <= 2 && xp < 500) return "beginner";
    if (level >= 7 || xp > 5000) return "advanced";
    return "intermediate";
  };

  const sendMessage = async (content?: string) => {
    const messageContent = content || inputMessage.trim();
    if (!messageContent || isLoading) return;

    if (!user) {
      toast.error("Please sign in to use NexMentor");
      return;
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: messageContent,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputMessage("");
    setIsLoading(true);

    // Stop listening if active
    if (isListening) {
      stopListening();
    }

    try {
      const skillLevel = detectSkillLevel();

      const context = {
        skillLevel,
        patternStrengths: patternStats?.strong || [],
        patternWeaknesses: patternStats?.weak || [],
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
          questionTitle,
          questionDescription: questionDescription?.substring(0, 1000),
          patternName,
          userCode: userCode?.substring(0, 2000),
          context,
          sessionId: sessionId || "practice-session",
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

      // Text-to-speech for response if enabled
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

  if (isMinimized) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="absolute bottom-4 right-4 z-50"
      >
        <Button
          onClick={onToggleMinimize}
          className="h-14 w-14 rounded-full bg-gradient-to-br from-primary via-purple-600 to-pink-500 shadow-lg shadow-primary/30 hover:shadow-primary/50"
        >
          <Sparkles className="w-6 h-6 text-white" />
        </Button>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="flex flex-col h-full bg-card/50 backdrop-blur-sm border-l border-border/50"
    >
      {/* Header */}
      <div className="p-4 border-b border-border/50 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Avatar with glow effect */}
          <div className="relative">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary via-purple-600 to-pink-500 flex items-center justify-center ring-2 ring-primary/30 ring-offset-2 ring-offset-background">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-background" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground flex items-center gap-2">
              NexMentor
              <Badge variant="outline" className="text-[10px] bg-emerald-500/10 text-emerald-500 border-emerald-500/30">
                Live
              </Badge>
            </h3>
            <p className="text-xs text-muted-foreground">Your Personal Coding Mentor</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => setIsSpeechEnabled(!isSpeechEnabled)}
          >
            {isSpeechEnabled ? (
              <Volume2 className="w-4 h-4 text-primary" />
            ) : (
              <VolumeX className="w-4 h-4 text-muted-foreground" />
            )}
          </Button>
          {onToggleMinimize && (
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onToggleMinimize}>
              <Minimize2 className="w-4 h-4" />
            </Button>
          )}
          {onClose && (
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={cn("flex gap-3", msg.role === "user" ? "justify-end" : "justify-start")}
            >
              {msg.role === "assistant" && (
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center flex-shrink-0">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
              )}
              <div
                className={cn(
                  "max-w-[85%] rounded-2xl px-4 py-3",
                  msg.role === "user"
                    ? "bg-primary/20 border border-primary/30 text-foreground"
                    : "bg-muted/80 border border-border/50"
                )}
              >
                {msg.role === "assistant" && (
                  <p className="text-xs font-medium text-primary mb-1">NexMentor:</p>
                )}
                <p className="text-sm whitespace-pre-wrap leading-relaxed">{msg.content}</p>
              </div>
              {msg.role === "user" && (
                <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                  <User className="w-4 h-4 text-muted-foreground" />
                </div>
              )}
            </motion.div>
          ))}
          {isLoading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex gap-3"
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <div className="bg-muted/80 rounded-2xl px-4 py-3 border border-border/50">
                <div className="flex items-center gap-2">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: "0ms" }} />
                    <span className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: "150ms" }} />
                    <span className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                  <span className="text-sm text-muted-foreground">Thinking...</span>
                </div>
              </div>
            </motion.div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Input Area */}
      <div className="p-4 border-t border-border/50 space-y-3">
        <div className="relative">
          <Textarea
            placeholder="Im thinking: two pointers might work, starting from the ends?"
            className="min-h-[60px] pr-24 resize-none bg-muted/50 border-border/50 rounded-xl"
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
                  "h-8 w-8 rounded-lg transition-all",
                  isListening && "bg-red-500 hover:bg-red-600 animate-pulse"
                )}
                onClick={toggleVoice}
              >
                {isListening ? (
                  <MicOff className="w-4 h-4" />
                ) : (
                  <Mic className="w-4 h-4" />
                )}
              </Button>
            )}
            <Button
              size="icon"
              className="h-8 w-8 rounded-lg"
              onClick={() => sendMessage()}
              disabled={!inputMessage.trim() || isLoading}
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Voice indicator */}
        {isListening && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="flex items-center gap-2 text-sm text-muted-foreground"
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

        {/* Quick action buttons */}
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="rounded-full h-10 w-10 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30"
            onClick={toggleVoice}
          >
            <Mic className={cn("w-4 h-4", isListening ? "text-red-500" : "text-emerald-500")} />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="rounded-full h-10 w-10 bg-muted hover:bg-muted/80"
            onClick={() => setIsSpeechEnabled(!isSpeechEnabled)}
          >
            {isSpeechEnabled ? (
              <Volume2 className="w-4 h-4 text-primary" />
            ) : (
              <VolumeX className="w-4 h-4 text-muted-foreground" />
            )}
          </Button>
          {/* Visualizer placeholder */}
          <div className="flex items-center gap-0.5 px-4 py-2 rounded-full bg-muted/50 border border-border/50">
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className={cn(
                  "w-1 rounded-full transition-all",
                  isListening ? "bg-primary" : "bg-muted-foreground/30"
                )}
                style={{
                  height: isListening ? `${Math.random() * 12 + 4}px` : "4px",
                }}
              />
            ))}
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="rounded-full h-10 w-10 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30"
            onClick={onClose}
          >
            <X className="w-4 h-4 text-red-500" />
          </Button>
        </div>
      </div>
    </motion.div>
  );
}
