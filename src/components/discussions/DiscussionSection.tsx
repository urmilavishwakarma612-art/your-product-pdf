import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { motion, AnimatePresence } from "framer-motion";
import { MessageSquare, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DiscussionCard } from "./DiscussionCard";
import { DiscussionForm } from "./DiscussionForm";
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

interface DiscussionSectionProps {
  questionId: string;
}

export function DiscussionSection({ questionId }: DiscussionSectionProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);

  // Fetch discussions with (optional) profiles and votes
  const { data: discussions, isLoading, error } = useQuery({
    queryKey: ["discussions", questionId, !!user],
    queryFn: async () => {
      // Profiles are only readable for authenticated users (RLS), so avoid embedding when logged out.
      const selectQuery = user
        ? `
          *,
          profiles:user_id(username, avatar_url),
          votes:discussion_votes(vote_type)
        `
        : `
          *,
          votes:discussion_votes(vote_type)
        `;

      const { data, error } = await supabase
        .from("discussions")
        .select(selectQuery)
        .eq("question_id", questionId)
        .order("created_at", { ascending: true });

      if (error) throw error;

      // Organize into threaded structure
      const discussionMap = new Map<string, Discussion>();
      const rootDiscussions: Discussion[] = [];

      (data || []).forEach((d: any) => {
        discussionMap.set(d.id, { ...d, replies: [] });
      });

      discussionMap.forEach((d) => {
        if (d.parent_id && discussionMap.has(d.parent_id)) {
          discussionMap.get(d.parent_id)!.replies!.push(d);
        } else if (!d.parent_id) {
          rootDiscussions.push(d);
        }
      });

      return rootDiscussions;
    },
  });

  // Real-time subscription
  useEffect(() => {
    const channel = supabase
      .channel("discussions-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "discussions", filter: `question_id=eq.${questionId}` },
        () => {
          queryClient.invalidateQueries({ queryKey: ["discussions", questionId] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [questionId, queryClient]);

  // Create discussion mutation
  const createMutation = useMutation({
    mutationFn: async ({ content, parentId }: { content: string; parentId?: string }) => {
      const { error } = await supabase.from("discussions").insert({
        question_id: questionId,
        user_id: user!.id,
        content,
        parent_id: parentId || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["discussions", questionId] });
      setShowForm(false);
      setReplyingTo(null);
      toast.success("Discussion posted!");
    },
    onError: () => {
      toast.error("Failed to post discussion");
    },
  });

  const handleSubmit = (content: string) => {
    createMutation.mutate({ content, parentId: replyingTo || undefined });
  };

  const handleReply = (discussionId: string) => {
    setReplyingTo(discussionId);
    setShowForm(true);
  };

  const discussionCount = discussions?.reduce(
    (acc, d) => acc + 1 + (d.replies?.length || 0),
    0
  ) || 0;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5" />
            Discussions ({discussionCount})
          </CardTitle>
          {user && !showForm && (
            <Button size="sm" onClick={() => { setShowForm(true); setReplyingTo(null); }}>
              <Plus className="w-4 h-4 mr-1" />
              Add Discussion
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Form */}
        <AnimatePresence>
          {showForm && user && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
            >
              <DiscussionForm
                onSubmit={handleSubmit}
                onCancel={() => { setShowForm(false); setReplyingTo(null); }}
                isLoading={createMutation.isPending}
                isReply={!!replyingTo}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Login prompt */}
        {!user && (
          <div className="text-center py-6 text-muted-foreground">
            <p>Please log in to participate in discussions</p>
          </div>
        )}

        {/* Loading */}
        {isLoading && (
          <div className="space-y-4">
            {[1, 2].map((i) => (
              <div key={i} className="h-24 bg-muted animate-pulse rounded-lg" />
            ))}
          </div>
        )}

        {/* Error */}
        {!isLoading && error && (
          <div className="text-center py-6 text-destructive">
            <p>Couldn’t load discussions. Please refresh.</p>
          </div>
        )}

        {/* Discussions List */}
        {!isLoading && discussions?.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No discussions yet. Be the first to start one!</p>
          </div>
        )}

        <div className="space-y-4">
          {discussions?.map((discussion) => (
            <DiscussionCard
              key={discussion.id}
              discussion={discussion}
              onReply={handleReply}
              questionId={questionId}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
