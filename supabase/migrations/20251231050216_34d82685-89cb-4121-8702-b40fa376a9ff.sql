-- Create discussions table for per-question discussions
CREATE TABLE public.discussions (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    question_id UUID NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    parent_id UUID REFERENCES public.discussions(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    is_best_answer BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create discussion votes table
CREATE TABLE public.discussion_votes (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    discussion_id UUID NOT NULL REFERENCES public.discussions(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    vote_type TEXT NOT NULL CHECK (vote_type IN ('upvote', 'downvote')),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(discussion_id, user_id)
);

-- Create indexes for performance
CREATE INDEX idx_discussions_question_id ON public.discussions(question_id);
CREATE INDEX idx_discussions_parent_id ON public.discussions(parent_id);
CREATE INDEX idx_discussions_user_id ON public.discussions(user_id);
CREATE INDEX idx_discussion_votes_discussion_id ON public.discussion_votes(discussion_id);

-- Enable RLS
ALTER TABLE public.discussions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.discussion_votes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for discussions
CREATE POLICY "Anyone can view discussions"
ON public.discussions
FOR SELECT
USING (true);

CREATE POLICY "Authenticated users can create discussions"
ON public.discussions
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own discussions"
ON public.discussions
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own discussions"
ON public.discussions
FOR DELETE
USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all discussions"
ON public.discussions
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for discussion votes
CREATE POLICY "Anyone can view votes"
ON public.discussion_votes
FOR SELECT
USING (true);

CREATE POLICY "Authenticated users can vote"
ON public.discussion_votes
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can change own vote"
ON public.discussion_votes
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can remove own vote"
ON public.discussion_votes
FOR DELETE
USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_discussions_updated_at
BEFORE UPDATE ON public.discussions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for discussions
ALTER PUBLICATION supabase_realtime ADD TABLE public.discussions;