import { useState, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, Loader2, FolderTree, GripVertical } from "lucide-react";
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
  slug: string;
  description: string | null;
  display_order: number;
  icon: string | null;
  color: string | null;
}

interface SortableTopicRowProps {
  topic: Topic;
  onEdit: (topic: Topic) => void;
  onDelete: (id: string) => void;
  isDeleting: boolean;
}

function SortableTopicRow({ topic, onEdit, onDelete, isDeleting }: SortableTopicRowProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: topic.id });

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
        {topic.color && (
          <div 
            className="w-4 h-4 rounded-full shrink-0" 
            style={{ backgroundColor: topic.color }}
          />
        )}
        <div className="min-w-0">
          <p className="font-medium truncate">{topic.name}</p>
          <p className="text-sm text-muted-foreground truncate">
            {topic.description || "No description"}
          </p>
        </div>
      </div>
      
      <div className="flex items-center gap-2 shrink-0">
        <span className="px-2 py-1 rounded-md bg-muted/50 text-xs text-muted-foreground">
          Order: {topic.display_order}
        </span>
        {topic.icon && (
          <span className="px-2 py-1 rounded-md bg-primary/10 text-xs text-primary">
            {topic.icon}
          </span>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onEdit(topic)}
        >
          <Pencil className="w-4 h-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onDelete(topic.id)}
          disabled={isDeleting}
        >
          <Trash2 className="w-4 h-4 text-destructive" />
        </Button>
      </div>
    </div>
  );
}

const AdminTopics = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [editingTopic, setEditingTopic] = useState<Topic | null>(null);
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

  const { data: topics, isLoading } = useQuery({
    queryKey: ["admin-topics"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("topics")
        .select("*")
        .order("display_order", { ascending: true });
      
      if (error) throw error;
      return data as Topic[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (topic: Omit<Topic, "id">) => {
      const { data, error } = await supabase
        .from("topics")
        .insert([topic])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-topics"] });
      setIsOpen(false);
      toast({ title: "Topic created successfully" });
    },
    onError: (error) => {
      toast({ title: "Error creating topic", description: error.message, variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...topic }: Partial<Topic> & { id: string }) => {
      const { data, error } = await supabase
        .from("topics")
        .update(topic)
        .eq("id", id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-topics"] });
      setIsOpen(false);
      setEditingTopic(null);
      toast({ title: "Topic updated successfully" });
    },
    onError: (error) => {
      toast({ title: "Error updating topic", description: error.message, variant: "destructive" });
    },
  });

  const reorderMutation = useMutation({
    mutationFn: async (updates: { id: string; display_order: number }[]) => {
      const promises = updates.map((update) =>
        supabase
          .from("topics")
          .update({ display_order: update.display_order })
          .eq("id", update.id)
      );
      await Promise.all(promises);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-topics"] });
      toast({ title: "Order updated" });
    },
    onError: (error) => {
      toast({ title: "Error updating order", description: error.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("topics").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-topics"] });
      toast({ title: "Topic deleted successfully" });
    },
    onError: (error) => {
      toast({ title: "Error deleting topic", description: error.message, variant: "destructive" });
    },
  });

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;

      if (over && active.id !== over.id && topics) {
        const oldIndex = topics.findIndex((t) => t.id === active.id);
        const newIndex = topics.findIndex((t) => t.id === over.id);
        
        const newTopics = arrayMove(topics, oldIndex, newIndex);
        
        // Optimistic update
        queryClient.setQueryData(["admin-topics"], newTopics);
        
        // Update database
        const updates = newTopics.map((topic, index) => ({
          id: topic.id,
          display_order: index,
        }));
        reorderMutation.mutate(updates);
      }
    },
    [topics, queryClient, reorderMutation]
  );

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const topic = {
      name: formData.get("name") as string,
      slug: (formData.get("name") as string).toLowerCase().replace(/\s+/g, "-"),
      description: formData.get("description") as string || null,
      display_order: parseInt(formData.get("display_order") as string) || (topics?.length || 0),
      icon: formData.get("icon") as string || null,
      color: formData.get("color") as string || null,
    };

    if (editingTopic) {
      updateMutation.mutate({ id: editingTopic.id, ...topic });
    } else {
      createMutation.mutate(topic);
    }
  };

  const openEdit = (topic: Topic) => {
    setEditingTopic(topic);
    setIsOpen(true);
  };

  const closeDialog = () => {
    setIsOpen(false);
    setEditingTopic(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Topics</h1>
          <p className="text-muted-foreground">Drag to reorder topics</p>
        </div>
        
        <Dialog open={isOpen} onOpenChange={(open) => { if (!open) closeDialog(); else setIsOpen(true); }}>
          <DialogTrigger asChild>
            <Button className="btn-primary-glow">
              <Plus className="w-4 h-4 mr-2" /> Add Topic
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>{editingTopic ? "Edit Topic" : "Add New Topic"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name *</Label>
                  <Input
                    id="name"
                    name="name"
                    defaultValue={editingTopic?.name || ""}
                    required
                    placeholder="Array"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="display_order">Display Order</Label>
                  <Input
                    id="display_order"
                    name="display_order"
                    type="number"
                    defaultValue={editingTopic?.display_order || topics?.length || 0}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  name="description"
                  defaultValue={editingTopic?.description || ""}
                  placeholder="Fundamental collection of elements..."
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="icon">Icon (Lucide name)</Label>
                  <Input
                    id="icon"
                    name="icon"
                    defaultValue={editingTopic?.icon || ""}
                    placeholder="list"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="color">Color (hex)</Label>
                  <Input
                    id="color"
                    name="color"
                    defaultValue={editingTopic?.color || ""}
                    placeholder="#00FFFF"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Button type="button" variant="outline" onClick={closeDialog}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                  {(createMutation.isPending || updateMutation.isPending) && (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  )}
                  {editingTopic ? "Update" : "Create"}
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
        ) : topics?.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground glass-card">
            <FolderTree className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No topics yet. Click "Add Topic" to create one.</p>
          </div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={topics?.map((t) => t.id) || []}
              strategy={verticalListSortingStrategy}
            >
              {topics?.map((topic) => (
                <SortableTopicRow
                  key={topic.id}
                  topic={topic}
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

export default AdminTopics;
