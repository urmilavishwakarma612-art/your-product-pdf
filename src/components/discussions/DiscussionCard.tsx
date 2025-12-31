import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { formatDistanceToNow } from "date-fns";
import { motion } from "framer-motion";
import { 
  ThumbsUp, 
  ThumbsDown, 
  Reply, 
  MoreVertical, 
  Trash2, 
  CheckCircle,
  MessageSquare 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";

interface Discussion {
  id: string;
  question_id: string;
  user_id: string;
  parent_id: string | null;
  content: string;
  is_best_answer: boolean;
  created_at: string;
  updated_at: string;
  profiles?: {
    username: string | null;
    avatar_url: string | null;
  };
  votes?: { vote_type: string }[];
  replies?: Discussion[];
}

interface DiscussionCardProps {
  discussion: Discussion;
  onReply: (discussionId: string) => void;
  questionId: string;
  isNested?: boolean;
}

export function DiscussionCard({ 
  discussion, 
  onReply, 
  questionId,
  isNested = false 
}: DiscussionCardProps) {
  const { user, isAdmin } = useAuth();
  const queryClient = useQueryClient();
  const [showReplies, setShowReplies] = useState(true);

  const upvotes = discussion.votes?.filter((v) => v.vote_type === "upvote").length || 0;
  const downvotes = discussion.votes?.filter((v) => v.vote_type === "downvote").length || 0;
  const voteScore = upvotes - downvotes;

  // Vote mutation
  const voteMutation = useMutation({
    mutationFn: async (voteType: "upvote" | "downvote") => {
      // Check if user already voted
      const { data: existing } = await supabase
        .from("discussion_votes")
        .select("id, vote_type")
        .eq("discussion_id", discussion.id)
        .eq("user_id", user!.id)
        .single();

      if (existing) {
        if (existing.vote_type === voteType) {
          // Remove vote
          await supabase.from("discussion_votes").delete().eq("id", existing.id);
        } else {
          // Change vote
          await supabase
            .from("discussion_votes")
            .update({ vote_type: voteType })
            .eq("id", existing.id);
        }
      } else {
        // New vote
        await supabase.from("discussion_votes").insert({
          discussion_id: discussion.id,
          user_id: user!.id,
          vote_type: voteType,
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["discussions", questionId] });
    },
    onError: () => {
      toast.error("Failed to vote");
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("discussions")
        .delete()
        .eq("id", discussion.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["discussions", questionId] });
      toast.success("Discussion deleted");
    },
    onError: () => {
      toast.error("Failed to delete");
    },
  });

  const canDelete = user?.id === discussion.user_id || isAdmin;
  const username = discussion.profiles?.username || "Anonymous";
  const avatarUrl = discussion.profiles?.avatar_url;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`${isNested ? "ml-8 border-l-2 border-muted pl-4" : ""}`}
    >
      <div className={`p-4 rounded-lg ${discussion.is_best_answer ? "bg-green-500/10 border border-green-500/30" : "bg-muted/50"}`}>
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <Avatar className="w-8 h-8">
              <AvatarImage src={avatarUrl || undefined} />
              <AvatarFallback>{username[0]?.toUpperCase()}</AvatarFallback>
            </Avatar>
            <div>
              <span className="font-medium text-sm">{username}</span>
              <span className="text-xs text-muted-foreground ml-2">
                {formatDistanceToNow(new Date(discussion.created_at), { addSuffix: true })}
              </span>
            </div>
            {discussion.is_best_answer && (
              <span className="flex items-center gap-1 text-xs text-green-500 font-medium">
                <CheckCircle className="w-3 h-3" />
                Best Answer
              </span>
            )}
          </div>

          {canDelete && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  className="text-destructive"
                  onClick={() => deleteMutation.mutate()}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        {/* Content */}
        <p className="text-sm whitespace-pre-wrap mb-3">{discussion.content}</p>

        {/* Actions */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => user && voteMutation.mutate("upvote")}
              disabled={!user || voteMutation.isPending}
            >
              <ThumbsUp className="w-4 h-4" />
            </Button>
            <span className={`text-sm font-medium ${voteScore > 0 ? "text-green-500" : voteScore < 0 ? "text-red-500" : ""}`}>
              {voteScore}
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => user && voteMutation.mutate("downvote")}
              disabled={!user || voteMutation.isPending}
            >
              <ThumbsDown className="w-4 h-4" />
            </Button>
          </div>

          {user && !isNested && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs"
              onClick={() => onReply(discussion.id)}
            >
              <Reply className="w-3 h-3 mr-1" />
              Reply
            </Button>
          )}

          {discussion.replies && discussion.replies.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs"
              onClick={() => setShowReplies(!showReplies)}
            >
              <MessageSquare className="w-3 h-3 mr-1" />
              {showReplies ? "Hide" : "Show"} {discussion.replies.length} replies
            </Button>
          )}
        </div>
      </div>

      {/* Replies */}
      {showReplies && discussion.replies && discussion.replies.length > 0 && (
        <div className="mt-2 space-y-2">
          {discussion.replies.map((reply) => (
            <DiscussionCard
              key={reply.id}
              discussion={reply}
              onReply={onReply}
              questionId={questionId}
              isNested
            />
          ))}
        </div>
      )}
    </motion.div>
  );
}
