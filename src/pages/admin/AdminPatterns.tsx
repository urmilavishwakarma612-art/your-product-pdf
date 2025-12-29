import { useState, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
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
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, Loader2, Layers, GripVertical } from "lucide-react";
import { motion } from "framer-motion";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface Topic {
  id: string;
  name: string;
}

interface Pattern {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  phase: number;
  topic_id: string | null;
  display_order: number;
  is_free: boolean;
  icon: string | null;
  color: string | null;
  total_questions: number;
}

interface SortablePatternRowProps {
  pattern: Pattern;
  topicName: string;
  onEdit: (pattern: Pattern) => void;
  onDelete: (id: string) => void;
  isDeleting: boolean;
}

function SortablePatternRow({ pattern, topicName, onEdit, onDelete, isDeleting }: SortablePatternRowProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: pattern.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 1 : 0,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-4 p-4 rounded-xl border border-border/50 bg-card/50 backdrop-blur-sm transition-all ${
        isDragging ? "shadow-xl ring-2 ring-primary/50" : "hover:bg-card/80"
      }`}
    >
      <button
        className="cursor-grab active:cursor-grabbing p-1 text-muted-foreground hover:text-foreground transition-colors"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="w-5 h-5" />
      </button>
      
      <div className="flex items-center gap-3 flex-1 min-w-0">
        {pattern.color && (
          <div 
            className="w-4 h-4 rounded-full shrink-0" 
            style={{ backgroundColor: pattern.color }}
          />
        )}
        <div className="min-w-0 flex-1">
          <p className="font-medium truncate">{pattern.name}</p>
          <p className="text-sm text-muted-foreground truncate">
            {pattern.description || "No description"}
          </p>
        </div>
      </div>
      
      <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end">
        <span className="px-2 py-1 rounded-full bg-primary/20 text-primary text-xs">
          {topicName}
        </span>
        <span className="px-2 py-1 rounded-full bg-secondary/20 text-secondary text-xs">
          Phase {pattern.phase}
        </span>
        <span className="px-2 py-1 rounded-md bg-muted/50 text-xs text-muted-foreground">
          {pattern.total_questions} Q
        </span>
        {pattern.is_free && (
          <span className="px-2 py-1 rounded-full bg-success/20 text-success text-xs">
            Free
          </span>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onEdit(pattern)}
        >
          <Pencil className="w-4 h-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onDelete(pattern.id)}
          disabled={isDeleting}
        >
          <Trash2 className="w-4 h-4 text-destructive" />
        </Button>
      </div>
    </div>
  );
}

const AdminPatterns = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [editingPattern, setEditingPattern] = useState<Pattern | null>(null);
  const [selectedTopicId, setSelectedTopicId] = useState<string>("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const { data: topics } = useQuery({
    queryKey: ["admin-topics"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("topics")
        .select("id, name")
        .order("display_order", { ascending: true });
      
      if (error) throw error;
      return data as Topic[];
    },
  });

  const { data: patterns, isLoading } = useQuery({
    queryKey: ["admin-patterns"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("patterns")
        .select("*")
        .order("display_order", { ascending: true });
      
      if (error) throw error;
      return data as Pattern[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (pattern: Omit<Pattern, "id" | "total_questions">) => {
      const { data, error } = await supabase
        .from("patterns")
        .insert([pattern])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-patterns"] });
      setIsOpen(false);
      toast({ title: "Pattern created successfully" });
    },
    onError: (error) => {
      toast({ title: "Error creating pattern", description: error.message, variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...pattern }: Partial<Pattern> & { id: string }) => {
      const { data, error } = await supabase
        .from("patterns")
        .update(pattern)
        .eq("id", id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-patterns"] });
      setIsOpen(false);
      setEditingPattern(null);
      toast({ title: "Pattern updated successfully" });
    },
    onError: (error) => {
      toast({ title: "Error updating pattern", description: error.message, variant: "destructive" });
    },
  });

  const reorderMutation = useMutation({
    mutationFn: async (updates: { id: string; display_order: number }[]) => {
      const promises = updates.map((update) =>
        supabase
          .from("patterns")
          .update({ display_order: update.display_order })
          .eq("id", update.id)
      );
      await Promise.all(promises);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-patterns"] });
      toast({ title: "Order updated" });
    },
    onError: (error) => {
      toast({ title: "Error updating order", description: error.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("patterns").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-patterns"] });
      toast({ title: "Pattern deleted successfully" });
    },
    onError: (error) => {
      toast({ title: "Error deleting pattern", description: error.message, variant: "destructive" });
    },
  });

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;

      if (over && active.id !== over.id && patterns) {
        const oldIndex = patterns.findIndex((p) => p.id === active.id);
        const newIndex = patterns.findIndex((p) => p.id === over.id);
        
        const newPatterns = arrayMove(patterns, oldIndex, newIndex);
        
        // Optimistic update
        queryClient.setQueryData(["admin-patterns"], newPatterns);
        
        // Update database
        const updates = newPatterns.map((pattern, index) => ({
          id: pattern.id,
          display_order: index,
        }));
        reorderMutation.mutate(updates);
      }
    },
    [patterns, queryClient, reorderMutation]
  );

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const pattern = {
      name: formData.get("name") as string,
      slug: (formData.get("name") as string).toLowerCase().replace(/\s+/g, "-"),
      description: formData.get("description") as string || null,
      phase: parseInt(formData.get("phase") as string) || 1,
      topic_id: selectedTopicId || null,
      display_order: parseInt(formData.get("display_order") as string) || (patterns?.length || 0),
      is_free: formData.get("is_free") === "on",
      icon: formData.get("icon") as string || null,
      color: formData.get("color") as string || null,
    };

    if (editingPattern) {
      updateMutation.mutate({ id: editingPattern.id, ...pattern });
    } else {
      createMutation.mutate(pattern);
    }
  };

  const openEdit = (pattern: Pattern) => {
    setEditingPattern(pattern);
    setSelectedTopicId(pattern.topic_id || "");
    setIsOpen(true);
  };

  const closeDialog = () => {
    setIsOpen(false);
    setEditingPattern(null);
    setSelectedTopicId("");
  };

  const getTopicName = (topicId: string | null) => {
    if (!topicId) return "No Topic";
    const topic = topics?.find(t => t.id === topicId);
    return topic?.name || "No Topic";
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Patterns</h1>
          <p className="text-muted-foreground">Drag to reorder patterns</p>
        </div>
        
        <Dialog open={isOpen} onOpenChange={(open) => { if (!open) closeDialog(); else setIsOpen(true); }}>
          <DialogTrigger asChild>
            <Button className="btn-primary-glow">
              <Plus className="w-4 h-4 mr-2" /> Add Pattern
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>{editingPattern ? "Edit Pattern" : "Add New Pattern"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name *</Label>
                  <Input
                    id="name"
                    name="name"
                    defaultValue={editingPattern?.name || ""}
                    required
                    placeholder="Two Pointer"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="topic">Topic *</Label>
                  <Select value={selectedTopicId} onValueChange={setSelectedTopicId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select topic" />
                    </SelectTrigger>
                    <SelectContent>
                      {topics?.map((topic) => (
                        <SelectItem key={topic.id} value={topic.id}>
                          {topic.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  name="description"
                  defaultValue={editingPattern?.description || ""}
                  placeholder="Learn the two pointer technique..."
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="phase">Phase</Label>
                  <Input
                    id="phase"
                    name="phase"
                    type="number"
                    min={1}
                    max={6}
                    defaultValue={editingPattern?.phase || 1}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="display_order">Display Order</Label>
                  <Input
                    id="display_order"
                    name="display_order"
                    type="number"
                    defaultValue={editingPattern?.display_order || patterns?.length || 0}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="icon">Icon (Lucide name)</Label>
                  <Input
                    id="icon"
                    name="icon"
                    defaultValue={editingPattern?.icon || ""}
                    placeholder="target"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="color">Color (hex)</Label>
                  <Input
                    id="color"
                    name="color"
                    defaultValue={editingPattern?.color || ""}
                    placeholder="#00FFFF"
                  />
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Switch
                  id="is_free"
                  name="is_free"
                  defaultChecked={editingPattern?.is_free || false}
                />
                <Label htmlFor="is_free">Free Pattern</Label>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Button type="button" variant="outline" onClick={closeDialog}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                  {(createMutation.isPending || updateMutation.isPending) && (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  )}
                  {editingPattern ? "Update" : "Create"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-3"
      >
        {isLoading ? (
          <div className="p-8 text-center text-muted-foreground glass-card">Loading...</div>
        ) : patterns?.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground glass-card">
            <Layers className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No patterns yet. Click "Add Pattern" to create one.</p>
          </div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={patterns?.map((p) => p.id) || []}
              strategy={verticalListSortingStrategy}
            >
              {patterns?.map((pattern) => (
                <SortablePatternRow
                  key={pattern.id}
                  pattern={pattern}
                  topicName={getTopicName(pattern.topic_id)}
                  onEdit={openEdit}
                  onDelete={(id) => deleteMutation.mutate(id)}
                  isDeleting={deleteMutation.isPending}
                />
              ))}
            </SortableContext>
          </DndContext>
        )}
      </motion.div>
    </div>
  );
};

export default AdminPatterns;
