import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, Tag } from "lucide-react";
import type { InterviewQuestion } from "@/types/interview";

interface ProblemPanelProps {
  question: InterviewQuestion;
  questionNumber: number;
  totalQuestions: number;
}

export function ProblemPanel({ question, questionNumber, totalQuestions }: ProblemPanelProps) {
  // Fetch full question details
  const { data: questionDetails, isLoading } = useQuery({
    queryKey: ["question-details", question.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("questions")
        .select("title, description, difficulty, hints, companies")
        .eq("id", question.id)
        .single();
      if (error) throw error;
      return data;
    },
  });

  const difficultyConfig = {
    easy: "bg-emerald-500/20 text-emerald-500 border-emerald-500/30",
    medium: "bg-amber-500/20 text-amber-500 border-amber-500/30",
    hard: "bg-red-500/20 text-red-500 border-red-500/30",
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  const hints = questionDetails?.hints as string[] | null;
  const companies = questionDetails?.companies as string[] | null;

  return (
    <ScrollArea className="h-full">
      <div className="p-6 space-y-6">
        {/* Question Header */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Badge variant="outline" className="text-primary border-primary/30">
              Q{questionNumber}/{totalQuestions}
            </Badge>
            <Badge 
              variant="outline" 
              className={difficultyConfig[question.difficulty]}
            >
              {question.difficulty}
            </Badge>
            {question.pattern_name && (
              <Badge variant="secondary" className="flex items-center gap-1">
                <Tag className="w-3 h-3" />
                {question.pattern_name}
              </Badge>
            )}
          </div>
          <h2 className="text-2xl font-bold">{question.title}</h2>
        </div>

        {/* Problem Description */}
        <div className="prose prose-sm dark:prose-invert max-w-none">
          {questionDetails?.description ? (
            <div 
              dangerouslySetInnerHTML={{ 
                __html: questionDetails.description.replace(/\n/g, '<br/>') 
              }} 
            />
          ) : (
            <div className="p-4 rounded-lg bg-muted/50 text-center text-muted-foreground">
              <p className="font-medium mb-2">Problem Statement</p>
              <p className="text-sm">
                Solve the "{question.title}" problem using your preferred approach.
              </p>
              <p className="text-xs mt-2">
                Focus on writing clean, efficient code with proper time and space complexity.
              </p>
            </div>
          )}
        </div>

        {/* Companies Tag */}
        {companies && companies.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-muted-foreground mb-2">Asked by Companies</h4>
            <div className="flex flex-wrap gap-2">
              {companies.map((company, idx) => (
                <Badge key={idx} variant="outline" className="text-xs">
                  {company}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Hints Section (collapsed by default) */}
        {hints && hints.length > 0 && (
          <div className="p-4 rounded-lg border border-dashed border-primary/30 bg-primary/5">
            <p className="text-sm text-muted-foreground">
              💡 {hints.length} hint{hints.length > 1 ? 's' : ''} available - Use the "Hint" button if needed
            </p>
          </div>
        )}

        {/* Instructions */}
        <div className="p-4 rounded-lg bg-muted/30 space-y-2">
          <h4 className="font-medium text-sm">Instructions</h4>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• Write your complete solution in the code editor</li>
            <li>• Choose your preferred programming language</li>
            <li>• Click "Submit Code" when you're done</li>
            <li>• Your code will be analyzed by AI for feedback</li>
          </ul>
        </div>
      </div>
    </ScrollArea>
  );
}
