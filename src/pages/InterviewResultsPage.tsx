 import { useParams, useNavigate } from "react-router-dom";
 import { useQuery } from "@tanstack/react-query";
 import { supabase } from "@/integrations/supabase/client";
 import { useAuth } from "@/hooks/useAuth";
 import { AppLayout } from "@/components/layout/AppLayout";
 import { InterviewResults } from "@/components/interview/InterviewResults";
 import { Loader2 } from "lucide-react";
 import { useEffect } from "react";
 import { toast } from "sonner";
 import type { SessionConfig, QuestionResult } from "@/types/interview";
 
 const InterviewResultsPage = () => {
   const { sessionId } = useParams<{ sessionId: string }>();
   const { user, loading: authLoading } = useAuth();
   const navigate = useNavigate();
 
   useEffect(() => {
     if (!authLoading && !user) {
       toast.error("Please login to view results");
       navigate("/auth");
     }
   }, [user, authLoading, navigate]);
 
   // Fetch session data
   const { data: session, isLoading: sessionLoading } = useQuery({
     queryKey: ["interview-session", sessionId],
     queryFn: async () => {
       if (!sessionId) throw new Error("No session ID");
       const { data, error } = await supabase
         .from("interview_sessions")
         .select(`
           *,
           patterns(name)
         `)
         .eq("id", sessionId)
         .maybeSingle();
       if (error) throw error;
       if (!data) throw new Error("Session not found");
       return data;
     },
     enabled: !!sessionId && !!user,
   });
 
   // Fetch session results
   const { data: results, isLoading: resultsLoading } = useQuery({
     queryKey: ["interview-results", sessionId],
     queryFn: async () => {
       if (!sessionId) return [];
       const { data, error } = await supabase
         .from("interview_results")
         .select(`
           *,
           questions(title, difficulty)
         `)
         .eq("session_id", sessionId);
       if (error) throw error;
       return (data || []).map((r: any) => ({
         question_id: r.question_id,
         question_title: r.questions?.title || "Unknown",
         difficulty: r.questions?.difficulty || "medium",
         time_spent: r.time_spent || 0,
         is_solved: r.is_solved || false,
         hints_used: r.hints_used || 0,
         skipped: r.skipped || false,
         flagged: r.flagged || false,
         submitted_code: r.submitted_code,
         evaluation_result: r.evaluation_result,
       })) as QuestionResult[];
     },
     enabled: !!sessionId && !!user,
   });
 
   if (authLoading || sessionLoading || resultsLoading) {
     return (
       <div className="min-h-screen bg-background flex items-center justify-center">
         <Loader2 className="w-8 h-8 animate-spin text-primary" />
       </div>
     );
   }
 
   if (!session || !results) {
     return (
       <AppLayout>
         <div className="text-center py-12">
           <p className="text-muted-foreground">Session not found</p>
         </div>
       </AppLayout>
     );
   }
 
   const config: SessionConfig = {
     type: session.session_type as any,
     timeLimit: session.time_limit,
     questionCount: results.length,
     patternId: session.pattern_id || undefined,
     companyName: session.company_name || undefined,
     mode: (session.mode as "practice" | "interview") || "interview",
   };
 
   return (
     <AppLayout>
       <InterviewResults
         sessionId={sessionId!}
         config={config}
         results={results}
         onNewSession={() => navigate("/interview")}
       />
     </AppLayout>
   );
 };
 
 export default InterviewResultsPage;