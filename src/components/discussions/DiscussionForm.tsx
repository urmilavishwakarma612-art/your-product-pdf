import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, X } from "lucide-react";

interface DiscussionFormProps {
  onSubmit: (content: string) => void;
  onCancel: () => void;
  isLoading: boolean;
  isReply?: boolean;
}

export function DiscussionForm({ 
  onSubmit, 
  onCancel, 
  isLoading, 
  isReply = false 
}: DiscussionFormProps) {
  const [content, setContent] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (content.trim()) {
      onSubmit(content.trim());
      setContent("");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3 p-4 rounded-lg bg-muted/50 border">
      <Textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder={isReply ? "Write your reply..." : "Share your thoughts, ask a question, or help others..."}
        className="min-h-[100px] resize-none"
        autoFocus
      />
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          Be respectful and constructive
        </p>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onCancel}
            disabled={isLoading}
          >
            <X className="w-4 h-4 mr-1" />
            Cancel
          </Button>
          <Button
            type="submit"
            size="sm"
            disabled={!content.trim() || isLoading}
          >
            <Send className="w-4 h-4 mr-1" />
            {isReply ? "Reply" : "Post"}
          </Button>
        </div>
      </div>
    </form>
  );
}
