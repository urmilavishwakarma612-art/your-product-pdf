import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Navbar } from "@/components/landing/Navbar";
import { SessionSetup } from "@/components/interview/SessionSetup";
import { InterviewSession } from "@/components/interview/InterviewSession";
import { InterviewResults } from "@/components/interview/InterviewResults";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

export type SessionType = "quick" | "full" | "pattern" | "company";

export interface SessionConfig {
  type: SessionType;
  timeLimit: number;
  questionCount: number;
  patternId?: string;
  companyName?: string;
}

export interface InterviewQuestion {
  id: string;
  title: string;
  difficulty: "easy" | "medium" | "hard";
  pattern_name?: string;
}

export interface QuestionResult {
  question_id: string;
  question_title: string;
  difficulty: string;
  time_spent: number;
  is_solved: boolean;
  hints_used: number;
  skipped: boolean;
  flagged: boolean;
}

type ViewState = "setup" | "interview" | "results";

const InterviewSimulator = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  const [view, setView] = useState<ViewState>("setup");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [sessionConfig, setSessionConfig] = useState<SessionConfig | null>(null);
  const [questions, setQuestions] = useState<InterviewQuestion[]>([]);
  const [results, setResults] = useState<QuestionResult[]>([]);

  useEffect(() => {
    if (!authLoading && !user) {
      toast.error("Please login to access Interview Simulator");
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  // Fetch patterns for setup
  const { data: patterns } = useQuery({
    queryKey: ["patterns-for-interview"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("patterns")
        .select("id, name")
        .order("display_order");
      if (error) throw error;
      return data;
    },
  });

  // Fetch companies for setup
  const { data: companies } = useQuery({
    queryKey: ["companies-for-interview"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("companies")
        .select("name")
        .order("name");
      if (error) throw error;
      return data?.map(c => c.name) || [];
    },
  });

  // Start session mutation
  const startSessionMutation = useMutation({
    mutationFn: async (config: SessionConfig) => {
      if (!user) throw new Error("Not authenticated");

      // Fetch random questions based on config
      let query = supabase
        .from("questions")
        .select("id, title, difficulty, patterns(name)")
        .limit(config.questionCount);

      if (config.type === "pattern" && config.patternId) {
        query = query.eq("pattern_id", config.patternId);
      } else if (config.type === "company" && config.companyName) {
        query = query.contains("companies", [config.companyName]);
      }

      const { data: questionData, error: qError } = await query;
      if (qError) throw qError;

      // Shuffle and limit
      const shuffled = (questionData || [])
        .sort(() => Math.random() - 0.5)
        .slice(0, config.questionCount);

      if (shuffled.length === 0) {
        throw new Error("No questions found for this configuration");
      }

      const questionIds = shuffled.map(q => q.id);

      // Create session
      const { data: session, error: sError } = await supabase
        .from("interview_sessions")
        .insert({
          user_id: user.id,
          session_type: config.type,
          time_limit: config.timeLimit,
          pattern_id: config.patternId || null,
          company_name: config.companyName || null,
          questions: questionIds,
        })
        .select()
        .single();

      if (sError) throw sError;

      // Create empty results for each question
      const resultInserts = shuffled.map(q => ({
        session_id: session.id,
        question_id: q.id,
      }));

      const { error: rError } = await supabase
        .from("interview_results")
        .insert(resultInserts);

      if (rError) throw rError;

      return {
        session,
        questions: shuffled.map(q => ({
          id: q.id,
          title: q.title,
          difficulty: q.difficulty as "easy" | "medium" | "hard",
          pattern_name: (q.patterns as any)?.name,
        })),
      };
    },
    onSuccess: (data) => {
      setSessionId(data.session.id);
      setQuestions(data.questions);
      setView("interview");
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Failed to start session");
    },
  });

  const handleStartSession = (config: SessionConfig) => {
    setSessionConfig(config);
    startSessionMutation.mutate(config);
  };

  const handleEndSession = (questionResults: QuestionResult[]) => {
    setResults(questionResults);
    setView("results");
  };

  const handleNewSession = () => {
    setSessionId(null);
    setSessionConfig(null);
    setQuestions([]);
    setResults([]);
    setView("setup");
    queryClient.invalidateQueries({ queryKey: ["interview-history"] });
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 pt-24 pb-12 max-w-5xl">
        {view === "setup" && (
          <SessionSetup
            patterns={patterns || []}
            companies={companies || []}
            onStart={handleStartSession}
            isLoading={startSessionMutation.isPending}
          />
        )}

        {view === "interview" && sessionId && sessionConfig && (
          <InterviewSession
            sessionId={sessionId}
            config={sessionConfig}
            questions={questions}
            onEnd={handleEndSession}
          />
        )}

        {view === "results" && sessionId && sessionConfig && (
          <InterviewResults
            sessionId={sessionId}
            config={sessionConfig}
            results={results}
            onNewSession={handleNewSession}
          />
        )}
      </main>
    </div>
  );
};

export default InterviewSimulator;
