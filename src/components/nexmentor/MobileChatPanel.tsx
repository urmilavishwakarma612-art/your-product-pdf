import { useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Brain, Send, Loader2, CheckCircle, Target, Zap, Code2 } from "lucide-react";
import { cn } from "@/lib/utils";

const STEPS = [
  { id: 1, name: "Decode", icon: Brain },
  { id: 2, name: "Brute", icon: Target },
  { id: 3, name: "Optimal", icon: Zap },
  { id: 4, name: "Code", icon: Code2 },
];

interface Message {
  role: "user" | "assistant";
  content: string;
  step?: number;
}

interface MobileChatPanelProps {
  messages: Message[];
  inputMessage: string;
  onInputChange: (value: string) => void;
  onSend: () => void;
  isLoading: boolean;
  currentStep: number;
}

export function MobileChatPanel({
  messages,
  inputMessage,
  onInputChange,
  onSend,
  isLoading,
  currentStep,
}: MobileChatPanelProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  };

  return (
    <div className="h-full flex flex-col bg-card">
      {/* Chat Header with Step Progress */}
      <div className="px-3 py-2 border-b border-border flex-shrink-0">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
              <Brain className="w-4 h-4 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-sm">NexMentor</h3>
              <p className="text-[10px] text-muted-foreground">AI Thinking Coach</p>
            </div>
          </div>
          <Badge variant="secondary" className="text-xs">
            Step {currentStep}/4
          </Badge>
        </div>
        
        {/* Mini Step Progress */}
        <div className="flex items-center gap-1">
          {STEPS.map((step, idx) => (
            <div key={step.id} className="flex items-center flex-1">
              <div 
                className={cn(
                  "h-1.5 flex-1 rounded-full transition-colors",
                  step.id <= currentStep ? "bg-primary" : "bg-muted"
                )}
              />
              {idx < STEPS.length - 1 && <div className="w-1" />}
            </div>
          ))}
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1">
        <div className="p-3 space-y-3">
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
                  "max-w-[85%] rounded-2xl px-3 py-2",
                  message.role === "user"
                    ? "bg-primary text-primary-foreground rounded-br-sm"
                    : "bg-muted rounded-bl-sm"
                )}
              >
                <p className="text-sm whitespace-pre-wrap leading-relaxed">{message.content}</p>
              </div>
            </motion.div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-muted rounded-2xl rounded-bl-sm px-4 py-3">
                <div className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-primary" />
                  <span className="text-xs text-muted-foreground">Thinking...</span>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Input Area */}
      <div className="p-3 border-t border-border flex-shrink-0">
        {currentStep < 4 ? (
          <div className="flex gap-2">
            <Textarea
              value={inputMessage}
              onChange={(e) => onInputChange(e.target.value)}
              placeholder="Type your answer..."
              className="min-h-[44px] max-h-[100px] resize-none bg-muted/50 text-sm"
              onKeyDown={handleKeyDown}
              disabled={isLoading}
            />
            <Button
              onClick={onSend}
              disabled={isLoading || !inputMessage.trim()}
              size="icon"
              className="h-auto aspect-square min-w-[44px]"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        ) : (
          <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-center">
            <div className="flex items-center justify-center gap-2 mb-1">
              <CheckCircle className="w-4 h-4 text-emerald-500" />
              <span className="text-sm font-medium text-emerald-600 dark:text-emerald-400">
                Step 4: Code & Verify
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              Swipe left to the Code tab and implement your solution
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
