export type SessionType = "quick" | "full" | "pattern" | "company";

export interface SessionConfig {
  type: SessionType;
  timeLimit: number;
  questionCount: number;
  patternId?: string;
  companyName?: string;
  mode?: "practice" | "interview";
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
  submitted_code?: string;
  evaluation_result?: any;
}
