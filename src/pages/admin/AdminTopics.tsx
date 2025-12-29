import { useState } from "react";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, Loader2, FolderTree } from "lucide-react";
import { motion } from "framer-motion";

interface Topic {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  display_order: number;
  icon: string | null;
  color: string | null;
}

const AdminTopics = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [editingTopic, setEditingTopic] = useState<Topic | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

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

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const topic = {
      name: formData.get("name") as string,
      slug: (formData.get("name") as string).toLowerCase().replace(/\s+/g, "-"),
      description: formData.get("description") as string || null,
      display_order: parseInt(formData.get("display_order") as string) || 0,
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
          <p className="text-muted-foreground">Manage DSA topics for grouping patterns</p>
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
                    defaultValue={editingTopic?.display_order || 0}
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
        className="glass-card overflow-hidden"
      >
        {isLoading ? (
          <div className="p-8 text-center text-muted-foreground">Loading...</div>
        ) : topics?.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            <FolderTree className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No topics yet. Click "Add Topic" to create one.</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Order</TableHead>
                <TableHead>Icon</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {topics?.map((topic) => (
                <TableRow key={topic.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      {topic.color && (
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: topic.color }}
                        />
                      )}
                      {topic.name}
                    </div>
                  </TableCell>
                  <TableCell className="max-w-[200px] truncate text-muted-foreground">
                    {topic.description || "-"}
                  </TableCell>
                  <TableCell>{topic.display_order}</TableCell>
                  <TableCell className="text-muted-foreground">{topic.icon || "-"}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEdit(topic)}
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteMutation.mutate(topic.id)}
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

export default AdminTopics;