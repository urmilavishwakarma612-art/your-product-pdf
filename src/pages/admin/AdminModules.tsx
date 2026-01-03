import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Plus, Edit, Trash2, ChevronDown, ChevronUp, GripVertical } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Label } from "@/components/ui/label";

interface Module {
  id: string;
  level_id: string | null;
  pattern_id: string | null;
  module_number: number;
  name: string;
  subtitle: string | null;
  why_exists: string | null;
  when_not_to_use: string | null;
  mental_model: string | null;
  pattern_template: string | null;
  confusion_breakers: string | null;
  exit_condition: string | null;
  estimated_hours: number | null;
  display_order: number | null;
}

interface SubPattern {
  id: string;
  module_id: string | null;
  name: string;
  description: string | null;
  template: string | null;
  display_order: number | null;
}

export default function AdminModules() {
  const queryClient = useQueryClient();
  const [selectedLevel, setSelectedLevel] = useState<string>("all");
  const [isModuleDialogOpen, setIsModuleDialogOpen] = useState(false);
  const [isSubPatternDialogOpen, setIsSubPatternDialogOpen] = useState(false);
  const [editingModule, setEditingModule] = useState<Module | null>(null);
  const [editingSubPattern, setEditingSubPattern] = useState<SubPattern | null>(null);
  const [activeModuleId, setActiveModuleId] = useState<string | null>(null);

  const [moduleForm, setModuleForm] = useState({
    level_id: "",
    pattern_id: "",
    module_number: 0,
    name: "",
    subtitle: "",
    why_exists: "",
    when_not_to_use: "",
    mental_model: "",
    pattern_template: "",
    confusion_breakers: "",
    exit_condition: "",
    estimated_hours: 4,
  });

  const [subPatternForm, setSubPatternForm] = useState({
    module_id: "",
    name: "",
    description: "",
    template: "",
  });

  // Fetch levels
  const { data: levels } = useQuery({
    queryKey: ["curriculum-levels"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("curriculum_levels")
        .select("*")
        .order("level_number");
      if (error) throw error;
      return data;
    },
  });

  // Fetch patterns
  const { data: patterns } = useQuery({
    queryKey: ["patterns"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("patterns")
        .select("*")
        .order("display_order");
      if (error) throw error;
      return data;
    },
  });

  // Fetch modules
  const { data: modules, isLoading } = useQuery({
    queryKey: ["curriculum-modules", selectedLevel],
    queryFn: async () => {
      let query = supabase
        .from("curriculum_modules")
        .select("*, curriculum_levels(name, level_number), patterns(name)")
        .order("display_order");
      
      if (selectedLevel !== "all") {
        query = query.eq("level_id", selectedLevel);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  // Fetch sub-patterns
  const { data: subPatterns } = useQuery({
    queryKey: ["sub-patterns"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sub_patterns")
        .select("*")
        .order("display_order");
      if (error) throw error;
      return data;
    },
  });

  // Module mutations
  const createModule = useMutation({
    mutationFn: async (data: typeof moduleForm) => {
      const { error } = await supabase.from("curriculum_modules").insert({
        ...data,
        level_id: data.level_id || null,
        pattern_id: data.pattern_id || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["curriculum-modules"] });
      toast.success("Module created!");
      setIsModuleDialogOpen(false);
      resetModuleForm();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const updateModule = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: typeof moduleForm }) => {
      const { error } = await supabase
        .from("curriculum_modules")
        .update({
          ...data,
          level_id: data.level_id || null,
          pattern_id: data.pattern_id || null,
        })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["curriculum-modules"] });
      toast.success("Module updated!");
      setIsModuleDialogOpen(false);
      setEditingModule(null);
      resetModuleForm();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const deleteModule = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("curriculum_modules").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["curriculum-modules"] });
      toast.success("Module deleted!");
    },
    onError: (error: Error) => toast.error(error.message),
  });

  // Sub-pattern mutations
  const createSubPattern = useMutation({
    mutationFn: async (data: typeof subPatternForm) => {
      const { error } = await supabase.from("sub_patterns").insert(data);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sub-patterns"] });
      toast.success("Sub-pattern created!");
      setIsSubPatternDialogOpen(false);
      resetSubPatternForm();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const updateSubPattern = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: typeof subPatternForm }) => {
      const { error } = await supabase.from("sub_patterns").update(data).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sub-patterns"] });
      toast.success("Sub-pattern updated!");
      setIsSubPatternDialogOpen(false);
      setEditingSubPattern(null);
      resetSubPatternForm();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const deleteSubPattern = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("sub_patterns").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sub-patterns"] });
      toast.success("Sub-pattern deleted!");
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const resetModuleForm = () => {
    setModuleForm({
      level_id: "",
      pattern_id: "",
      module_number: 0,
      name: "",
      subtitle: "",
      why_exists: "",
      when_not_to_use: "",
      mental_model: "",
      pattern_template: "",
      confusion_breakers: "",
      exit_condition: "",
      estimated_hours: 4,
    });
  };

  const resetSubPatternForm = () => {
    setSubPatternForm({
      module_id: "",
      name: "",
      description: "",
      template: "",
    });
  };

  const handleEditModule = (module: Module) => {
    setEditingModule(module);
    setModuleForm({
      level_id: module.level_id || "",
      pattern_id: module.pattern_id || "",
      module_number: module.module_number,
      name: module.name,
      subtitle: module.subtitle || "",
      why_exists: module.why_exists || "",
      when_not_to_use: module.when_not_to_use || "",
      mental_model: module.mental_model || "",
      pattern_template: module.pattern_template || "",
      confusion_breakers: module.confusion_breakers || "",
      exit_condition: module.exit_condition || "",
      estimated_hours: module.estimated_hours || 4,
    });
    setIsModuleDialogOpen(true);
  };

  const handleEditSubPattern = (subPattern: SubPattern) => {
    setEditingSubPattern(subPattern);
    setSubPatternForm({
      module_id: subPattern.module_id || "",
      name: subPattern.name,
      description: subPattern.description || "",
      template: subPattern.template || "",
    });
    setIsSubPatternDialogOpen(true);
  };

  const handleAddSubPattern = (moduleId: string) => {
    setActiveModuleId(moduleId);
    setSubPatternForm({
      module_id: moduleId,
      name: "",
      description: "",
      template: "",
    });
    setIsSubPatternDialogOpen(true);
  };

  const getModuleSubPatterns = (moduleId: string) => {
    return subPatterns?.filter((sp) => sp.module_id === moduleId) || [];
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Curriculum Modules</h1>
          <p className="text-muted-foreground">Manage modules and sub-patterns</p>
        </div>
        <Dialog open={isModuleDialogOpen} onOpenChange={setIsModuleDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => { setEditingModule(null); resetModuleForm(); }}>
              <Plus className="w-4 h-4 mr-2" /> Add Module
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingModule ? "Edit Module" : "Add Module"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Level</Label>
                  <Select
                    value={moduleForm.level_id}
                    onValueChange={(value) => setModuleForm({ ...moduleForm, level_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select level" />
                    </SelectTrigger>
                    <SelectContent>
                      {levels?.map((level) => (
                        <SelectItem key={level.id} value={level.id}>
                          Level {level.level_number}: {level.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Linked Pattern (optional)</Label>
                  <Select
                    value={moduleForm.pattern_id}
                    onValueChange={(value) => setModuleForm({ ...moduleForm, pattern_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select pattern" />
                    </SelectTrigger>
                    <SelectContent>
                      {patterns?.map((pattern) => (
                        <SelectItem key={pattern.id} value={pattern.id}>
                          {pattern.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Module Number</Label>
                  <Input
                    type="number"
                    value={moduleForm.module_number}
                    onChange={(e) => setModuleForm({ ...moduleForm, module_number: parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Estimated Hours</Label>
                  <Input
                    type="number"
                    value={moduleForm.estimated_hours}
                    onChange={(e) => setModuleForm({ ...moduleForm, estimated_hours: parseInt(e.target.value) || 4 })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Module Name</Label>
                <Input
                  value={moduleForm.name}
                  onChange={(e) => setModuleForm({ ...moduleForm, name: e.target.value })}
                  placeholder="e.g., Two Pointer Pattern"
                />
              </div>

              <div className="space-y-2">
                <Label>Subtitle</Label>
                <Input
                  value={moduleForm.subtitle}
                  onChange={(e) => setModuleForm({ ...moduleForm, subtitle: e.target.value })}
                  placeholder="e.g., Signal: sorted array, pairs, palindrome"
                />
              </div>

              <div className="space-y-2">
                <Label>Why This Pattern Exists (Markdown)</Label>
                <Textarea
                  value={moduleForm.why_exists}
                  onChange={(e) => setModuleForm({ ...moduleForm, why_exists: e.target.value })}
                  rows={6}
                  placeholder="Explain why this pattern is important..."
                />
              </div>

              <div className="space-y-2">
                <Label>When NOT to Use (Markdown)</Label>
                <Textarea
                  value={moduleForm.when_not_to_use}
                  onChange={(e) => setModuleForm({ ...moduleForm, when_not_to_use: e.target.value })}
                  rows={6}
                  placeholder="Common mistakes and when to avoid..."
                />
              </div>

              <div className="space-y-2">
                <Label>Mental Model (Markdown)</Label>
                <Textarea
                  value={moduleForm.mental_model}
                  onChange={(e) => setModuleForm({ ...moduleForm, mental_model: e.target.value })}
                  rows={6}
                  placeholder="Visual/thinking model..."
                />
              </div>

              <div className="space-y-2">
                <Label>Pattern Template (Markdown)</Label>
                <Textarea
                  value={moduleForm.pattern_template}
                  onChange={(e) => setModuleForm({ ...moduleForm, pattern_template: e.target.value })}
                  rows={6}
                  placeholder="Thinking template..."
                />
              </div>

              <div className="space-y-2">
                <Label>Confusion Breakers (Markdown)</Label>
                <Textarea
                  value={moduleForm.confusion_breakers}
                  onChange={(e) => setModuleForm({ ...moduleForm, confusion_breakers: e.target.value })}
                  rows={4}
                  placeholder="Trap problems explanation..."
                />
              </div>

              <div className="space-y-2">
                <Label>Exit Condition</Label>
                <Textarea
                  value={moduleForm.exit_condition}
                  onChange={(e) => setModuleForm({ ...moduleForm, exit_condition: e.target.value })}
                  rows={2}
                  placeholder="e.g., Can identify Two Pointer in < 5 seconds"
                />
              </div>

              <Button
                onClick={() => {
                  if (editingModule) {
                    updateModule.mutate({ id: editingModule.id, data: moduleForm });
                  } else {
                    createModule.mutate(moduleForm);
                  }
                }}
                className="w-full"
              >
                {editingModule ? "Update Module" : "Create Module"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filter by Level */}
      <div className="flex items-center gap-4">
        <Label>Filter by Level:</Label>
        <Select value={selectedLevel} onValueChange={setSelectedLevel}>
          <SelectTrigger className="w-64">
            <SelectValue placeholder="All Levels" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Levels</SelectItem>
            {levels?.map((level) => (
              <SelectItem key={level.id} value={level.id}>
                Level {level.level_number}: {level.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Modules List */}
      {isLoading ? (
        <div className="text-center py-8">Loading...</div>
      ) : (
        <div className="space-y-4">
          {modules?.map((module: any) => (
            <Card key={module.id}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <GripVertical className="w-4 h-4 text-muted-foreground cursor-grab" />
                    <div>
                      <CardTitle className="text-lg">
                        Module {module.module_number}: {module.name}
                      </CardTitle>
                      {module.subtitle && (
                        <p className="text-sm text-muted-foreground">{module.subtitle}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {module.curriculum_levels && (
                      <Badge variant="outline">
                        Level {module.curriculum_levels.level_number}
                      </Badge>
                    )}
                    {module.patterns && (
                      <Badge variant="secondary">{module.patterns.name}</Badge>
                    )}
                    <Badge>{module.estimated_hours}h</Badge>
                    <Button variant="ghost" size="icon" onClick={() => handleEditModule(module)}>
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => deleteModule.mutate(module.id)}
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Accordion type="single" collapsible>
                  <AccordionItem value="sub-patterns">
                    <AccordionTrigger className="text-sm">
                      Sub-Patterns ({getModuleSubPatterns(module.id).length})
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-2 pt-2">
                        {getModuleSubPatterns(module.id).map((sp) => (
                          <div
                            key={sp.id}
                            className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                          >
                            <div>
                              <p className="font-medium">{sp.name}</p>
                              {sp.description && (
                                <p className="text-sm text-muted-foreground">{sp.description}</p>
                              )}
                            </div>
                            <div className="flex items-center gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleEditSubPattern(sp)}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => deleteSubPattern.mutate(sp.id)}
                              >
                                <Trash2 className="w-4 h-4 text-destructive" />
                              </Button>
                            </div>
                          </div>
                        ))}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleAddSubPattern(module.id)}
                          className="w-full"
                        >
                          <Plus className="w-4 h-4 mr-2" /> Add Sub-Pattern
                        </Button>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Sub-Pattern Dialog */}
      <Dialog open={isSubPatternDialogOpen} onOpenChange={setIsSubPatternDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingSubPattern ? "Edit Sub-Pattern" : "Add Sub-Pattern"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input
                value={subPatternForm.name}
                onChange={(e) => setSubPatternForm({ ...subPatternForm, name: e.target.value })}
                placeholder="e.g., Opposite Ends"
              />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={subPatternForm.description}
                onChange={(e) => setSubPatternForm({ ...subPatternForm, description: e.target.value })}
                rows={2}
                placeholder="Brief description..."
              />
            </div>
            <div className="space-y-2">
              <Label>Template (Code)</Label>
              <Textarea
                value={subPatternForm.template}
                onChange={(e) => setSubPatternForm({ ...subPatternForm, template: e.target.value })}
                rows={8}
                placeholder="```python\n# Code template\n```"
                className="font-mono text-sm"
              />
            </div>
            <Button
              onClick={() => {
                if (editingSubPattern) {
                  updateSubPattern.mutate({ id: editingSubPattern.id, data: subPatternForm });
                } else {
                  createSubPattern.mutate(subPatternForm);
                }
              }}
              className="w-full"
            >
              {editingSubPattern ? "Update Sub-Pattern" : "Create Sub-Pattern"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
