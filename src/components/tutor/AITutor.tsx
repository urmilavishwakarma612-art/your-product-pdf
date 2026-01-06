import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import {
  X,
  Sparkles,
  Lightbulb,
  Target,
  Code,
  Zap,
  Send,
  Loader2,
  Brain,
  MessageCircle,
  History,
  Settings,
  ChevronDown,
  AlertTriangle,
  CheckCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { ThoughtCoach } from "./ThoughtCoach";
import { ErrorDiagnosis } from "./ErrorDiagnosis";

type TutorMode = "hint" | "approach" | "debug" | "coaching" | "custom";

interface TutorMessage {
  id: string;
  role: "user" | "tutor";
  content: string;
  message_type?: string;
  created_at: string;
}

interface AITutorProps {
  questionId: string;
  questionTitle: string;
  questionDescription?: string;
  patternId?: string;
  patternName?: string;
  userCode?: string;
  isOpen: boolean;
  onClose: () => void;
}

const modeConfig: Record<TutorMode, { label: string; icon: typeof Lightbulb; color: string; xpPenalty: number }> = {
  hint: { label: "Subtle Hint", icon: Lightbulb, color: "text-amber-500", xpPenalty: 5 },
  approach: { label: "Approach", icon: Target, color: "text-blue-500", xpPenalty: 10 },
  debug: { label: "Debug Help", icon: AlertTriangle, color: "text-red-500", xpPenalty: 5 },
  coaching: { label: "Think Together", icon: Brain, color: "text-purple-500", xpPenalty: 0 },
  custom: { label: "Ask Anything", icon: MessageCircle, color: "text-primary", xpPenalty: 0 },
};

export const AITutor = ({
  questionId,
  questionTitle,
  questionDescription,
  patternId,
  patternName,
  userCode,
  isOpen,
  onClose,
}: AITutorProps) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [mode, setMode] = useState<TutorMode | null>(null);
  const [customQuestion, setCustomQuestion] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [showCoaching, setShowCoaching] = useState(false);
  const [showErrorDiagnosis, setShowErrorDiagnosis] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch user skill level and preferences
  const { data: userProfile } = useQuery({
    queryKey: ["tutor-profile", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from("profiles")
        .select("skill_level, tutor_preferences, curriculum_level, total_xp")
        .eq("id", user.id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  // Fetch user's pattern stats for context
  const { data: patternStats } = useQuery({
    queryKey: ["tutor-pattern-stats", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from("user_progress")
        .select("question_id, is_solved, questions!inner(pattern_id, patterns(name))")
        .eq("user_id", user.id);
      if (error) throw error;

      // Aggregate by pattern
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

      return { strong, weak, all: stats };
    },
    enabled: !!user,
  });

  // Fetch past mistakes for this pattern
  const { data: pastMistakes } = useQuery({
    queryKey: ["tutor-mistakes", user?.id, patternId],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("user_mistakes")
        .select("mistake_type, description, occurrence_count")
        .eq("user_id", user.id)
        .order("occurrence_count", { ascending: false })
        .limit(5);
      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });

  // Fetch or create session
  const { data: session, refetch: refetchSession } = useQuery({
    queryKey: ["tutor-session", questionId, user?.id],
    queryFn: async () => {
      if (!user) return null;

      // Try to find existing active session
      const { data: existing, error: fetchError } = await supabase
        .from("tutor_sessions")
        .select("*")
        .eq("user_id", user.id)
        .eq("question_id", questionId)
        .is("ended_at", null)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (fetchError) throw fetchError;

      if (existing) {
        setSessionId(existing.id);
        return existing;
      }

      return null;
    },
    enabled: !!user && !!questionId && isOpen,
  });

  // Fetch messages for current session
  const { data: messages = [], refetch: refetchMessages } = useQuery({
    queryKey: ["tutor-messages", sessionId],
    queryFn: async () => {
      if (!sessionId) return [];
      const { data, error } = await supabase
        .from("tutor_messages")
        .select("*")
        .eq("session_id", sessionId)
        .order("created_at");
      if (error) throw error;
      return data as TutorMessage[];
    },
    enabled: !!sessionId,
  });

  // Create new session
  const createSession = async (sessionType: TutorMode) => {
    if (!user) return null;

    const skillLevel = detectSkillLevel();

    const { data, error } = await supabase
      .from("tutor_sessions")
      .insert({
        user_id: user.id,
        question_id: questionId,
        pattern_id: patternId || null,
        session_type: sessionType === "custom" ? "hint" : sessionType,
        user_skill_level: skillLevel,
      })
      .select()
      .single();

    if (error) throw error;
    setSessionId(data.id);
    return data;
  };

  // Detect user skill level based on profile data
  const detectSkillLevel = (): "beginner" | "intermediate" | "advanced" => {
    if (!userProfile) return "intermediate";

    const level = userProfile.curriculum_level || 0;
    const xp = userProfile.total_xp || 0;

    if (level <= 2 && xp < 500) return "beginner";
    if (level >= 7 || xp > 5000) return "advanced";
    return "intermediate";
  };

  // Send message to tutor
  const sendMessage = async (content: string, messageMode: TutorMode) => {
    if (!user) {
      toast.error("Please sign in to use the AI Tutor");
      return;
    }

    setIsLoading(true);

    try {
      // Ensure we have a session
      let currentSessionId = sessionId;
      if (!currentSessionId) {
        const newSession = await createSession(messageMode);
        if (!newSession) throw new Error("Failed to create session");
        currentSessionId = newSession.id;
      }

      const skillLevel = detectSkillLevel();

      // Build context for AI
      const context = {
        skillLevel,
        patternStrengths: patternStats?.strong || [],
        patternWeaknesses: patternStats?.weak || [],
        pastMistakes: pastMistakes?.map(m => m.mistake_type) || [],
        conversationHistory: messages.slice(-6).map(m => ({
          role: m.role,
          content: m.content.substring(0, 500),
        })),
        tutorPreferences: userProfile?.tutor_preferences || {},
      };

      // Store user message
      await supabase.from("tutor_messages").insert({
        session_id: currentSessionId,
        role: "user",
        content,
        message_type: messageMode,
        code_context: userCode ? { code: userCode.substring(0, 2000) } : null,
      });

      // Call AI Tutor edge function
      const { data, error } = await supabase.functions.invoke("ai-tutor", {
        body: {
          mode: messageMode,
          question: content,
          questionTitle,
          questionDescription: questionDescription?.substring(0, 1000),
          patternName,
          userCode: userCode?.substring(0, 2000),
          context,
          sessionId: currentSessionId,
        },
      });

      if (error) throw error;

      // Store tutor response
      await supabase.from("tutor_messages").insert({
        session_id: currentSessionId,
        role: "tutor",
        content: data.response,
        message_type: messageMode,
      });

      // Update session stats
      await supabase
        .from("tutor_sessions")
        .update({
          total_messages: messages.length + 2,
          hints_given: messageMode === "hint" ? (session?.hints_given || 0) + 1 : session?.hints_given || 0,
        })
        .eq("id", currentSessionId);

      // Refetch messages
      refetchMessages();
      refetchSession();

      // Apply XP penalty if applicable
      const penalty = modeConfig[messageMode].xpPenalty;
      if (penalty > 0) {
        toast.info(`-${penalty} XP for using ${modeConfig[messageMode].label}`);
      }

      // Show coaching prompt occasionally
      if (messageMode !== "coaching" && messages.length > 0 && messages.length % 3 === 0) {
        setShowCoaching(true);
      }
    } catch (error) {
      console.error("Tutor error:", error);
      toast.error("Failed to get tutor response. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleModeSelect = async (selectedMode: TutorMode) => {
    setMode(selectedMode);

    if (selectedMode === "debug" && userCode) {
      setShowErrorDiagnosis(true);
      return;
    }

    if (selectedMode === "coaching") {
      setShowCoaching(true);
      return;
    }

    const prompts: Record<TutorMode, string> = {
      hint: "Give me a subtle hint to point me in the right direction",
      approach: "Help me understand the approach for this problem",
      debug: "Help me debug my code",
      coaching: "Let's think through this together",
      custom: customQuestion,
    };

    if (selectedMode !== "custom") {
      await sendMessage(prompts[selectedMode], selectedMode);
    }
  };

  const handleCustomSubmit = async () => {
    if (!customQuestion.trim()) return;
    await sendMessage(customQuestion, "custom");
    setCustomQuestion("");
  };

  const handleCoachingResponse = async (response: string) => {
    await sendMessage(`[Coaching Response] ${response}`, "coaching");
    setShowCoaching(false);
  };

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Reset on close
  useEffect(() => {
    if (!isOpen) {
      setMode(null);
      setShowCoaching(false);
      setShowErrorDiagnosis(false);
    }
  }, [isOpen]);

  const skillLevel = detectSkillLevel();
  const skillColors = {
    beginner: "bg-emerald-500/10 text-emerald-500 border-emerald-500/30",
    intermediate: "bg-blue-500/10 text-blue-500 border-blue-500/30",
    advanced: "bg-purple-500/10 text-purple-500 border-purple-500/30",
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50"
            onClick={onClose}
          />

          {/* Panel */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed right-0 top-0 h-full w-full max-w-lg bg-card border-l border-border shadow-2xl z-50 flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="font-bold flex items-center gap-2">
                    AI Tutor
                    <Badge variant="outline" className={skillColors[skillLevel]}>
                      {skillLevel}
                    </Badge>
                  </h2>
                  <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                    {questionTitle}
                  </p>
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="w-5 h-5" />
              </Button>
            </div>

            {/* Content */}
            <div className="flex-1 flex flex-col overflow-hidden">
              {/* Messages */}
              {messages.length > 0 && (
                <ScrollArea className="flex-1 p-4">
                  <div className="space-y-4">
                    {messages.map((msg) => (
                      <motion.div
                        key={msg.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                      >
                        <div
                          className={`max-w-[85%] rounded-xl px-4 py-3 ${
                            msg.role === "user"
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted"
                          }`}
                        >
                          <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                          <p className="text-xs opacity-60 mt-1">
                            {new Date(msg.created_at).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>
                        </div>
                      </motion.div>
                    ))}
                    {isLoading && (
                      <div className="flex justify-start">
                        <div className="bg-muted rounded-xl px-4 py-3">
                          <div className="flex items-center gap-2">
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span className="text-sm">Thinking...</span>
                          </div>
                        </div>
                      </div>
                    )}
                    <div ref={messagesEndRef} />
                  </div>
                </ScrollArea>
              )}

              {/* Mode Selection (when no messages) */}
              {messages.length === 0 && !isLoading && (
                <div className="flex-1 p-4 overflow-auto">
                  <p className="text-sm text-muted-foreground mb-4">
                    How can I help you with this problem?
                  </p>

                  <div className="grid grid-cols-2 gap-3 mb-6">
                    {(Object.entries(modeConfig) as [TutorMode, typeof modeConfig.hint][])
                      .filter(([key]) => key !== "custom")
                      .map(([key, config]) => (
                        <Button
                          key={key}
                          variant="outline"
                          className={`h-auto py-4 flex-col gap-2 hover:border-primary/50 ${
                            mode === key ? "border-primary bg-primary/5" : ""
                          }`}
                          onClick={() => handleModeSelect(key)}
                          disabled={isLoading}
                        >
                          <config.icon className={`w-5 h-5 ${config.color}`} />
                          <span className="text-sm font-medium">{config.label}</span>
                          {config.xpPenalty > 0 && (
                            <span className="text-xs text-muted-foreground">
                              -{config.xpPenalty} XP
                            </span>
                          )}
                        </Button>
                      ))}
                  </div>

                  {/* Skill-based tips */}
                  <div className="bg-muted/50 rounded-lg p-3 mb-4">
                    <p className="text-xs text-muted-foreground">
                      {skillLevel === "beginner" && "💡 As a beginner, I'll give you step-by-step guidance."}
                      {skillLevel === "intermediate" && "💡 I'll help you recognize patterns and think critically."}
                      {skillLevel === "advanced" && "💡 I'll ask Socratic questions to guide your thinking."}
                    </p>
                  </div>

                  {/* Pattern context */}
                  {patternStats?.weak && patternStats.weak.length > 0 && (
                    <div className="text-xs text-muted-foreground mb-4">
                      <span className="text-amber-500">Focus area:</span>{" "}
                      {patternStats.weak.slice(0, 2).join(", ")}
                    </div>
                  )}
                </div>
              )}

              {/* Input Area */}
              <div className="p-4 border-t bg-background/50">
                <div className="flex gap-2">
                  <Textarea
                    value={customQuestion}
                    onChange={(e) => setCustomQuestion(e.target.value)}
                    placeholder="Ask me anything about this problem..."
                    className="min-h-[60px] resize-none"
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleCustomSubmit();
                      }
                    }}
                    disabled={isLoading}
                  />
                  <Button
                    onClick={handleCustomSubmit}
                    disabled={!customQuestion.trim() || isLoading}
                    className="btn-primary-glow"
                  >
                    {isLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                  </Button>
                </div>

                {/* Quick actions */}
                {messages.length > 0 && (
                  <div className="flex gap-2 mt-3">
                    {(Object.entries(modeConfig) as [TutorMode, typeof modeConfig.hint][])
                      .filter(([key]) => key !== "custom")
                      .map(([key, config]) => (
                        <Button
                          key={key}
                          variant="ghost"
                          size="sm"
                          className="text-xs"
                          onClick={() => handleModeSelect(key)}
                          disabled={isLoading}
                        >
                          <config.icon className={`w-3 h-3 mr-1 ${config.color}`} />
                          {config.label}
                        </Button>
                      ))}
                  </div>
                )}
              </div>
            </div>

            {/* Thought Coaching Modal */}
            <ThoughtCoach
              isOpen={showCoaching}
              onClose={() => setShowCoaching(false)}
              onRespond={handleCoachingResponse}
              questionTitle={questionTitle}
              skillLevel={skillLevel}
            />

            {/* Error Diagnosis Modal */}
            <ErrorDiagnosis
              isOpen={showErrorDiagnosis}
              onClose={() => setShowErrorDiagnosis(false)}
              userCode={userCode || ""}
              questionTitle={questionTitle}
              onFixSuggestion={(fix) => {
                setCustomQuestion(`Help me understand: ${fix}`);
                setShowErrorDiagnosis(false);
              }}
            />
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
