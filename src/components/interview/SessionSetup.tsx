import { useState } from "react";
 import { useQuery } from "@tanstack/react-query";
 import { supabase } from "@/integrations/supabase/client";
 import { useAuth } from "@/hooks/useAuth";
import { motion } from "framer-motion";
import { 
  Clock, 
  Zap, 
  Target, 
  Building2, 
  Layers,
  Play,
  Trophy,
  Timer,
  Shield,
   BookOpen,
   History,
   CheckCircle2,
   XCircle,
   ChevronRight,
   Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
 import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { SessionConfig, SessionType } from "@/types/interview";
 import { Link } from "react-router-dom";
 import { format } from "date-fns";

interface SessionSetupProps {
  patterns: { id: string; name: string }[];
  companies: string[];
  onStart: (config: SessionConfig) => void;
  isLoading: boolean;
}

const SESSION_TYPES = [
  {
    type: "quick" as SessionType,
    title: "Quick Practice",
    description: "3 questions in 15 minutes",
    icon: Zap,
    timeLimit: 15 * 60,
    questionCount: 3,
    color: "text-emerald-500",
    bgColor: "bg-emerald-500/10",
  },
  {
    type: "full" as SessionType,
    title: "Full Interview",
    description: "5 questions in 45 minutes",
    icon: Trophy,
    timeLimit: 45 * 60,
    questionCount: 5,
    color: "text-primary",
    bgColor: "bg-primary/10",
  },
  {
    type: "pattern" as SessionType,
    title: "Pattern Deep-Dive",
    description: "4 questions from one pattern in 30 min",
    icon: Layers,
    timeLimit: 30 * 60,
    questionCount: 4,
    color: "text-violet-500",
    bgColor: "bg-violet-500/10",
  },
  {
    type: "company" as SessionType,
    title: "Company Prep",
    description: "Practice with company-tagged questions",
    icon: Building2,
    timeLimit: 30 * 60,
    questionCount: 4,
    color: "text-amber-500",
    bgColor: "bg-amber-500/10",
  },
];

export function SessionSetup({ patterns, companies, onStart, isLoading }: SessionSetupProps) {
   const { user } = useAuth();
  const [selectedType, setSelectedType] = useState<SessionType | null>(null);
  const [selectedPattern, setSelectedPattern] = useState<string>("");
  const [selectedCompany, setSelectedCompany] = useState<string>("");
  const [isInterviewMode, setIsInterviewMode] = useState(true);
 
   // Fetch past sessions
   const { data: pastSessions, isLoading: sessionsLoading } = useQuery({
     queryKey: ["interview-history", user?.id],
     queryFn: async () => {
       if (!user) return [];
       const { data, error } = await supabase
         .from("interview_sessions")
         .select(`
           id,
           session_type,
           mode,
           status,
           total_score,
           time_limit,
           created_at,
           completed_at,
           pattern_id,
           company_name,
           patterns(name)
         `)
         .eq("user_id", user.id)
         .order("created_at", { ascending: false })
         .limit(5);
       if (error) throw error;
       return data || [];
     },
     enabled: !!user,
   });

  const selectedConfig = SESSION_TYPES.find(s => s.type === selectedType);

   const getSessionTypeLabel = (type: string) => {
     const config = SESSION_TYPES.find(s => s.type === type);
     return config?.title || type;
   };
 
   const formatDuration = (seconds: number) => {
     const m = Math.floor(seconds / 60);
     return `${m} min`;
   };
 
  const canStart = () => {
    if (!selectedType) return false;
    if (selectedType === "pattern" && !selectedPattern) return false;
    if (selectedType === "company" && !selectedCompany) return false;
    return true;
  };

  const handleStart = () => {
    if (!selectedConfig) return;
    
    onStart({
      type: selectedConfig.type,
      timeLimit: selectedConfig.timeLimit,
      questionCount: selectedConfig.questionCount,
      patternId: selectedType === "pattern" ? selectedPattern : undefined,
      companyName: selectedType === "company" ? selectedCompany : undefined,
      mode: isInterviewMode ? "interview" : "practice",
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8"
    >
      {/* Header */}
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/20 mb-4">
          <Timer className="w-8 h-8 text-primary" />
        </div>
        <h1 className="text-3xl font-bold mb-2">Interview Simulator</h1>
        <p className="text-muted-foreground max-w-lg mx-auto">
          Practice under real interview conditions with timed sessions and get AI-powered feedback
        </p>
      </div>

      {/* Mode Toggle */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="glass-card p-6"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${isInterviewMode ? "bg-primary/20" : "bg-muted"}`}>
              {isInterviewMode ? (
                <Shield className="w-5 h-5 text-primary" />
              ) : (
                <BookOpen className="w-5 h-5 text-muted-foreground" />
              )}
            </div>
            <div>
              <Label className="text-base font-medium">
                {isInterviewMode ? "Interview Mode" : "Practice Mode"}
              </Label>
              <p className="text-sm text-muted-foreground">
                {isInterviewMode 
                  ? "Paste disabled, strict scoring, real interview conditions" 
                  : "Paste allowed, relaxed scoring, learning-focused"}
              </p>
            </div>
          </div>
          <Switch
            checked={isInterviewMode}
            onCheckedChange={setIsInterviewMode}
          />
        </div>
        {isInterviewMode && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="mt-4 flex flex-wrap gap-2"
          >
            <Badge variant="outline" className="text-amber-500 border-amber-500/30">
              <Shield className="w-3 h-3 mr-1" /> Paste Disabled
            </Badge>
            <Badge variant="outline" className="text-primary border-primary/30">
              <Target className="w-3 h-3 mr-1" /> Must Run Before Submit
            </Badge>
            <Badge variant="outline" className="text-violet-500 border-violet-500/30">
              <Zap className="w-3 h-3 mr-1" /> Two-Level Scoring
            </Badge>
          </motion.div>
        )}
      </motion.div>

      {/* Session Type Selection */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {SESSION_TYPES.map((session) => {
          const Icon = session.icon;
          const isSelected = selectedType === session.type;
          
          return (
            <motion.div
              key={session.type}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Card 
                className={`cursor-pointer transition-all ${
                  isSelected 
                    ? "border-primary ring-2 ring-primary/20" 
                    : "hover:border-primary/50"
                }`}
                onClick={() => setSelectedType(session.type)}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${session.bgColor}`}>
                      <Icon className={`w-5 h-5 ${session.color}`} />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{session.title}</CardTitle>
                      <CardDescription>{session.description}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {session.timeLimit / 60} min
                    </span>
                    <span className="flex items-center gap-1">
                      <Target className="w-4 h-4" />
                      {session.questionCount} questions
                    </span>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Additional Options */}
      {selectedType === "pattern" && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="glass-card p-6"
        >
          <Label className="text-base mb-3 block">Select Pattern</Label>
          <Select value={selectedPattern} onValueChange={setSelectedPattern}>
            <SelectTrigger>
              <SelectValue placeholder="Choose a pattern to practice" />
            </SelectTrigger>
            <SelectContent>
              {patterns.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </motion.div>
      )}

      {selectedType === "company" && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="glass-card p-6"
        >
          <Label className="text-base mb-3 block">Select Company</Label>
          <Select value={selectedCompany} onValueChange={setSelectedCompany}>
            <SelectTrigger>
              <SelectValue placeholder="Choose a company" />
            </SelectTrigger>
            <SelectContent>
              {companies.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </motion.div>
      )}

      {/* Start Button */}
      <div className="flex justify-center">
        <Button
          size="lg"
          className="btn-primary-glow px-8"
          onClick={handleStart}
          disabled={!canStart() || isLoading}
        >
          {isLoading ? (
            <>Loading Questions...</>
          ) : (
            <>
              <Play className="w-5 h-5 mr-2" />
              Start {isInterviewMode ? "Interview" : "Practice"}
            </>
          )}
        </Button>
      </div>
 
       {/* Past Attempts - Grouped by Session Type */}
       {pastSessions && pastSessions.length > 0 && (
         <motion.div
           initial={{ opacity: 0, y: 10 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ delay: 0.3 }}
           className="glass-card p-6"
         >
           <div className="flex items-center gap-2 mb-4">
             <History className="w-5 h-5 text-primary" />
             <h3 className="font-semibold">Past Attempts</h3>
           </div>
           
           <Tabs defaultValue="all" className="w-full">
             <TabsList className="w-full grid grid-cols-5 mb-4">
               <TabsTrigger value="all" className="text-xs">All</TabsTrigger>
               <TabsTrigger value="quick" className="text-xs">Quick</TabsTrigger>
               <TabsTrigger value="full" className="text-xs">Full</TabsTrigger>
               <TabsTrigger value="pattern" className="text-xs">Pattern</TabsTrigger>
               <TabsTrigger value="company" className="text-xs">Company</TabsTrigger>
             </TabsList>
             
             {["all", "quick", "full", "pattern", "company"].map((tabType) => (
               <TabsContent key={tabType} value={tabType} className="space-y-3 mt-0">
                 {sessionsLoading ? (
                   <div className="flex justify-center py-4">
                     <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                   </div>
                 ) : (
                   (() => {
                     const filtered = tabType === "all" 
                       ? pastSessions 
                       : pastSessions.filter((s: any) => s.session_type === tabType);
                     
                     if (filtered.length === 0) {
                       return (
                         <p className="text-sm text-muted-foreground text-center py-4">
                           No {tabType === "all" ? "" : getSessionTypeLabel(tabType)} attempts yet
                         </p>
                       );
                     }
                     
                     return filtered.map((session: any) => (
                       <Link
                         key={session.id}
                         to={`/interview/results/${session.id}`}
                         className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors group"
                       >
                         <div className="flex items-center gap-3">
                           <div className={`p-2 rounded-lg ${
                             session.status === "completed" 
                               ? "bg-emerald-500/20" 
                               : "bg-amber-500/20"
                           }`}>
                             {session.status === "completed" ? (
                               <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                             ) : (
                               <XCircle className="w-4 h-4 text-amber-500" />
                             )}
                           </div>
                           <div>
                             <p className="font-medium text-sm">
                               {getSessionTypeLabel(session.session_type)}
                               {session.patterns?.name && (
                                 <span className="text-muted-foreground"> • {session.patterns.name}</span>
                               )}
                               {session.company_name && (
                                 <span className="text-muted-foreground"> • {session.company_name}</span>
                               )}
                             </p>
                             <p className="text-xs text-muted-foreground">
                               {format(new Date(session.created_at), "MMM d, yyyy 'at' h:mm a")} • {formatDuration(session.time_limit)}
                               {session.mode === "interview" && (
                                 <span className="ml-2 text-primary">Interview Mode</span>
                               )}
                             </p>
                           </div>
                         </div>
                         <div className="flex items-center gap-3">
                           {session.total_score !== null && (
                             <span className={`text-lg font-bold ${
                               session.total_score >= 70 ? "text-emerald-500" :
                               session.total_score >= 40 ? "text-amber-500" : "text-red-500"
                             }`}>
                               {session.total_score}%
                             </span>
                           )}
                           <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                         </div>
                       </Link>
                     ));
                   })()
                 )}
               </TabsContent>
             ))}
           </Tabs>
         </motion.div>
       )}
    </motion.div>
  );
}