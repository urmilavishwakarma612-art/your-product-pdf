import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, Loader2, ExternalLink, Youtube } from "lucide-react";
import { motion } from "framer-motion";

interface Question {
  id: string;
  pattern_id: string;
  title: string;
  difficulty: "easy" | "medium" | "hard";
  leetcode_link: string | null;
  youtube_link: string | null;
  article_link: string | null;
  description: string | null;
  hints: string[];
  approach: string | null;
  brute_force: string | null;
  optimal_solution: string | null;
  display_order: number;
  xp_reward: number;
  companies: string[];
}

interface Pattern {
  id: string;
  name: string;
  phase: number;
}

const AdminQuestions = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [selectedPattern, setSelectedPattern] = useState<string>("");
  const [formPatternId, setFormPatternId] = useState<string>("");
  const [formDifficulty, setFormDifficulty] = useState<string>("easy");
  const [selectedCompanies, setSelectedCompanies] = useState<string[]>([]);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: patterns } = useQuery({
    queryKey: ["admin-patterns-list"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("patterns")
        .select("id, name, phase")
        .order("phase", { ascending: true })
        .order("display_order", { ascending: true });
      
      if (error) throw error;
      return data as Pattern[];
    },
  });

  const { data: companies } = useQuery({
    queryKey: ["admin-companies-list"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("companies")
        .select("id, name, logo_url")
        .order("name", { ascending: true });
      
      if (error) throw error;
      return data as { id: string; name: string; logo_url: string | null }[];
    },
  });

  const { data: questions, isLoading } = useQuery({
    queryKey: ["admin-questions", selectedPattern],
    queryFn: async () => {
      let query = supabase
        .from("questions")
        .select("*")
        .order("display_order", { ascending: true });
      
      if (selectedPattern) {
        query = query.eq("pattern_id", selectedPattern);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data as Question[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (question: Omit<Question, "id">) => {
      const { data, error } = await supabase
        .from("questions")
        .insert([question])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-questions"] });
      setIsOpen(false);
      resetForm();
      toast({ title: "Question created successfully" });
    },
    onError: (error) => {
      toast({ title: "Error creating question", description: error.message, variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...question }: Partial<Question> & { id: string }) => {
      const { data, error } = await supabase
        .from("questions")
        .update(question)
        .eq("id", id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-questions"] });
      setIsOpen(false);
      resetForm();
      toast({ title: "Question updated successfully" });
    },
    onError: (error) => {
      toast({ title: "Error updating question", description: error.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("questions").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-questions"] });
      toast({ title: "Question deleted successfully" });
    },
    onError: (error) => {
      toast({ title: "Error deleting question", description: error.message, variant: "destructive" });
    },
  });

  const resetForm = () => {
    setEditingQuestion(null);
    setFormPatternId("");
    setFormDifficulty("easy");
    setSelectedCompanies([]);
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const hintsText = formData.get("hints") as string;
    const hints = hintsText ? hintsText.split("\n").filter(h => h.trim()) : [];

    const question = {
      pattern_id: formPatternId,
      title: formData.get("title") as string,
      difficulty: formDifficulty as "easy" | "medium" | "hard",
      leetcode_link: formData.get("leetcode_link") as string || null,
      youtube_link: formData.get("youtube_link") as string || null,
      article_link: formData.get("article_link") as string || null,
      description: formData.get("description") as string || null,
      hints: hints,
      approach: formData.get("approach") as string || null,
      brute_force: formData.get("brute_force") as string || null,
      optimal_solution: formData.get("optimal_solution") as string || null,
      display_order: parseInt(formData.get("display_order") as string) || 0,
      xp_reward: parseInt(formData.get("xp_reward") as string) || 10,
      companies: selectedCompanies,
    };

    if (editingQuestion) {
      updateMutation.mutate({ id: editingQuestion.id, ...question });
    } else {
      createMutation.mutate(question);
    }
  };

  const openEdit = (question: Question) => {
    setEditingQuestion(question);
    setFormPatternId(question.pattern_id);
    setFormDifficulty(question.difficulty);
    setSelectedCompanies(question.companies || []);
    setIsOpen(true);
  };

  const openNew = () => {
    resetForm();
    setIsOpen(true);
  };

  const closeDialog = () => {
    setIsOpen(false);
    resetForm();
  };

  const getPatternName = (patternId: string) => {
    return patterns?.find(p => p.id === patternId)?.name || "Unknown";
  };

  const difficultyColors = {
    easy: "bg-success/20 text-success",
    medium: "bg-warning/20 text-warning",
    hard: "bg-destructive/20 text-destructive",
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-2">Questions</h1>
          <p className="text-muted-foreground">Manage DSA questions and resources</p>
        </div>
        
        <div className="flex items-center gap-4">
          <Select value={selectedPattern || "all"} onValueChange={(value) => setSelectedPattern(value === "all" ? "" : value)}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="All Patterns" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Patterns</SelectItem>
              {patterns?.map((pattern) => (
                <SelectItem key={pattern.id} value={pattern.id}>
                  Phase {pattern.phase}: {pattern.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Dialog open={isOpen} onOpenChange={(open) => { if (!open) closeDialog(); else openNew(); }}>
            <DialogTrigger asChild>
              <Button className="btn-primary-glow">
                <Plus className="w-4 h-4 mr-2" /> Add Question
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingQuestion ? "Edit Question" : "Add New Question"}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Title *</Label>
                    <Input
                      id="title"
                      name="title"
                      defaultValue={editingQuestion?.title || ""}
                      required
                      placeholder="Two Sum"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Pattern *</Label>
                    <Select value={formPatternId} onValueChange={setFormPatternId} required>
                      <SelectTrigger>
                        <SelectValue placeholder="Select pattern" />
                      </SelectTrigger>
                      <SelectContent>
                        {patterns?.map((pattern) => (
                          <SelectItem key={pattern.id} value={pattern.id}>
                            Phase {pattern.phase}: {pattern.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Difficulty *</Label>
                    <Select value={formDifficulty} onValueChange={setFormDifficulty}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="easy">Easy</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="hard">Hard</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="display_order">Order</Label>
                    <Input
                      id="display_order"
                      name="display_order"
                      type="number"
                      defaultValue={editingQuestion?.display_order || 0}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="xp_reward">XP Reward</Label>
                    <Input
                      id="xp_reward"
                      name="xp_reward"
                      type="number"
                      defaultValue={editingQuestion?.xp_reward || 10}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    name="description"
                    defaultValue={editingQuestion?.description || ""}
                    placeholder="Problem description..."
                    rows={2}
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="leetcode_link">LeetCode Link</Label>
                    <Input
                      id="leetcode_link"
                      name="leetcode_link"
                      defaultValue={editingQuestion?.leetcode_link || ""}
                      placeholder="https://leetcode.com/..."
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="youtube_link">YouTube Link</Label>
                    <Input
                      id="youtube_link"
                      name="youtube_link"
                      defaultValue={editingQuestion?.youtube_link || ""}
                      placeholder="https://youtube.com/..."
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="article_link">Article Link</Label>
                    <Input
                      id="article_link"
                      name="article_link"
                      defaultValue={editingQuestion?.article_link || ""}
                      placeholder="https://..."
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Companies</Label>
                  <div className="flex flex-wrap gap-2 p-3 rounded-lg border border-border bg-background min-h-[42px]">
                    {companies?.map((company) => {
                      const isSelected = selectedCompanies.includes(company.name);
                      return (
                        <button
                          key={company.id}
                          type="button"
                          onClick={() => {
                            if (isSelected) {
                              setSelectedCompanies(prev => prev.filter(c => c !== company.name));
                            } else {
                              setSelectedCompanies(prev => [...prev, company.name]);
                            }
                          }}
                          className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-sm transition-colors ${
                            isSelected 
                              ? "bg-primary text-primary-foreground" 
                              : "bg-muted hover:bg-muted/80"
                          }`}
                        >
                          {company.logo_url && (
                            <img src={company.logo_url} alt="" className="w-4 h-4 object-contain" />
                          )}
                          {company.name}
                        </button>
                      );
                    })}
                    {(!companies || companies.length === 0) && (
                      <span className="text-muted-foreground text-sm">
                        No companies added. Add companies in the Companies section first.
                      </span>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="hints">Hints (one per line)</Label>
                  <Textarea
                    id="hints"
                    name="hints"
                    defaultValue={Array.isArray(editingQuestion?.hints) ? editingQuestion.hints.join("\n") : ""}
                    placeholder="Think about using a hashmap...&#10;Consider the time complexity..."
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="approach">Approach</Label>
                  <Textarea
                    id="approach"
                    name="approach"
                    defaultValue={editingQuestion?.approach || ""}
                    placeholder="High-level approach explanation..."
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="brute_force">Brute Force Solution</Label>
                  <Textarea
                    id="brute_force"
                    name="brute_force"
                    defaultValue={editingQuestion?.brute_force || ""}
                    placeholder="Brute force approach and code..."
                    rows={4}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="optimal_solution">Optimal Solution</Label>
                  <Textarea
                    id="optimal_solution"
                    name="optimal_solution"
                    defaultValue={editingQuestion?.optimal_solution || ""}
                    placeholder="Optimal solution with code..."
                    rows={4}
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <Button type="button" variant="outline" onClick={closeDialog}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending || !formPatternId}>
                    {(createMutation.isPending || updateMutation.isPending) && (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    )}
                    {editingQuestion ? "Update" : "Create"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card overflow-hidden"
      >
        {isLoading ? (
          <div className="p-8 text-center text-muted-foreground">Loading...</div>
        ) : questions?.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            No questions yet. Click "Add Question" to create one.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Pattern</TableHead>
                <TableHead>Difficulty</TableHead>
                <TableHead>XP</TableHead>
                <TableHead>Links</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {questions?.map((question) => (
                <TableRow key={question.id}>
                  <TableCell className="font-medium">{question.title}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {getPatternName(question.pattern_id)}
                  </TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded-full text-xs ${difficultyColors[question.difficulty]}`}>
                      {question.difficulty}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="xp-badge">+{question.xp_reward}</span>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      {question.leetcode_link && (
                        <a href={question.leetcode_link} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="w-4 h-4 text-primary hover:text-primary/80" />
                        </a>
                      )}
                      {question.youtube_link && (
                        <a href={question.youtube_link} target="_blank" rel="noopener noreferrer">
                          <Youtube className="w-4 h-4 text-destructive hover:text-destructive/80" />
                        </a>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEdit(question)}
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteMutation.mutate(question.id)}
                        disabled={deleteMutation.isPending}
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </motion.div>
    </div>
  );
};

export default AdminQuestions;