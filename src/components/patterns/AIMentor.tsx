import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bot, X, Lightbulb, Route, Zap, Code2, Send, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface AIMentorProps {
  questionTitle: string;
  questionDescription?: string;
  isOpen: boolean;
  onClose: () => void;
}

type MentorMode = "hint" | "approach" | "brute_force" | "solution";

const modeConfig: Record<MentorMode, { label: string; icon: React.ReactNode; color: string; xpPenalty: string }> = {
  hint: { 
    label: "Hint", 
    icon: <Lightbulb className="w-4 h-4" />, 
    color: "text-amber-500 border-amber-500/30 hover:bg-amber-500/10",
    xpPenalty: "No XP penalty"
  },
  approach: { 
    label: "Approach", 
    icon: <Route className="w-4 h-4" />, 
    color: "text-blue-500 border-blue-500/30 hover:bg-blue-500/10",
    xpPenalty: "-25% XP"
  },
  brute_force: { 
    label: "Brute Force", 
    icon: <Zap className="w-4 h-4" />, 
    color: "text-purple-500 border-purple-500/30 hover:bg-purple-500/10",
    xpPenalty: "-50% XP"
  },
  solution: { 
    label: "Full Solution", 
    icon: <Code2 className="w-4 h-4" />, 
    color: "text-emerald-500 border-emerald-500/30 hover:bg-emerald-500/10",
    xpPenalty: "-100% XP"
  },
};

export const AIMentor = ({ questionTitle, questionDescription, isOpen, onClose }: AIMentorProps) => {
  const [selectedMode, setSelectedMode] = useState<MentorMode | null>(null);
  const [response, setResponse] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [customQuestion, setCustomQuestion] = useState("");

  // Reset state when question changes or panel closes
  useEffect(() => {
    if (!isOpen) {
      setSelectedMode(null);
      setResponse("");
      setCustomQuestion("");
    }
  }, [isOpen, questionTitle]);

  const handleModeSelect = async (mode: MentorMode) => {
    setSelectedMode(mode);
    setIsLoading(true);
    setResponse("");

    try {
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-mentor`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          mode,
          questionTitle,
          questionDescription,
        }),
      });

      if (res.status === 429) {
        toast.error("Rate limit exceeded. Please try again later.");
        setIsLoading(false);
        return;
      }

      if (res.status === 402) {
        toast.error("AI credits exhausted. Please add more credits.");
        setIsLoading(false);
        return;
      }

      if (!res.ok || !res.body) {
        throw new Error("Failed to get AI response");
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);

          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || line.trim() === "") continue;
          if (!line.startsWith("data: ")) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") break;

          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              setResponse(prev => prev + content);
            }
          } catch {
            textBuffer = line + "\n" + textBuffer;
            break;
          }
        }
      }
    } catch (error) {
      console.error("AI Mentor error:", error);
      toast.error("Failed to get AI response. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCustomQuestion = async () => {
    if (!customQuestion.trim()) return;
    
    setIsLoading(true);
    setResponse("");
    setSelectedMode(null);

    try {
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-mentor`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          mode: "custom",
          questionTitle,
          questionDescription,
          customQuestion,
        }),
      });

      if (res.status === 429) {
        toast.error("Rate limit exceeded. Please try again later.");
        setIsLoading(false);
        return;
      }

      if (!res.ok || !res.body) {
        throw new Error("Failed to get AI response");
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);

          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || line.trim() === "") continue;
          if (!line.startsWith("data: ")) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") break;

          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              setResponse(prev => prev + content);
            }
          } catch {
            textBuffer = line + "\n" + textBuffer;
            break;
          }
        }
      }
      setCustomQuestion("");
    } catch (error) {
      console.error("AI Mentor error:", error);
      toast.error("Failed to get AI response. Please try again.");
    } finally {
      setIsLoading(false);
    }
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
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 h-full w-full max-w-md bg-card border-l border-border shadow-2xl z-50 flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-border">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Bot className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h2 className="font-semibold text-foreground">AI Mentor</h2>
                  <p className="text-xs text-muted-foreground truncate max-w-[200px]">{questionTitle}</p>
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="w-5 h-5" />
              </Button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {/* Mode Selection */}
              <div>
                <p className="text-sm text-muted-foreground mb-3">Choose help type:</p>
                <div className="grid grid-cols-2 gap-2">
                  {(Object.entries(modeConfig) as [MentorMode, typeof modeConfig[MentorMode]][]).map(([mode, config]) => (
                    <button
                      key={mode}
                      onClick={() => handleModeSelect(mode)}
                      disabled={isLoading}
                      className={`flex flex-col items-center gap-1.5 p-3 rounded-lg border transition-colors ${
                        selectedMode === mode 
                          ? config.color.replace("hover:", "") + " bg-opacity-20"
                          : "border-border hover:border-muted-foreground/30"
                      } ${config.color}`}
                    >
                      {config.icon}
                      <span className="text-sm font-medium">{config.label}</span>
                      <span className="text-xs text-muted-foreground">{config.xpPenalty}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Response Area */}
              {(response || isLoading) && (
                <div className="bg-muted/30 rounded-lg p-4">
                  {isLoading && !response && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span className="text-sm">Thinking...</span>
                    </div>
                  )}
                  {response && (
                    <div className="prose prose-sm dark:prose-invert max-w-none">
                      <div className="whitespace-pre-wrap text-sm text-foreground">{response}</div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Custom Question Input */}
            <div className="p-4 border-t border-border">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={customQuestion}
                  onChange={(e) => setCustomQuestion(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleCustomQuestion()}
                  placeholder="Ask a custom question..."
                  className="flex-1 px-3 py-2 bg-muted/50 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                  disabled={isLoading}
                />
                <Button
                  size="icon"
                  onClick={handleCustomQuestion}
                  disabled={isLoading || !customQuestion.trim()}
                >
                  {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                </Button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
