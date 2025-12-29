import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
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
import { Plus, Pencil, Trash2, Loader2 } from "lucide-react";
import { motion } from "framer-motion";

interface Pattern {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  phase: number;
  display_order: number;
  is_free: boolean;
  icon: string | null;
  color: string | null;
  total_questions: number;
}

const AdminPatterns = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [editingPattern, setEditingPattern] = useState<Pattern | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: patterns, isLoading } = useQuery({
    queryKey: ["admin-patterns"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("patterns")
        .select("*")
        .order("phase", { ascending: true })
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

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const pattern = {
      name: formData.get("name") as string,
      slug: (formData.get("name") as string).toLowerCase().replace(/\s+/g, "-"),
      description: formData.get("description") as string || null,
      phase: parseInt(formData.get("phase") as string) || 1,
      display_order: parseInt(formData.get("display_order") as string) || 0,
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
    setIsOpen(true);
  };

  const closeDialog = () => {
    setIsOpen(false);
    setEditingPattern(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Patterns</h1>
          <p className="text-muted-foreground">Manage DSA patterns and categories</p>
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
                  <Label htmlFor="phase">Phase *</Label>
                  <Input
                    id="phase"
                    name="phase"
                    type="number"
                    min={1}
                    max={6}
                    defaultValue={editingPattern?.phase || 1}
                    required
                  />
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
                  <Label htmlFor="display_order">Display Order</Label>
                  <Input
                    id="display_order"
                    name="display_order"
                    type="number"
                    defaultValue={editingPattern?.display_order || 0}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="icon">Icon (Lucide name)</Label>
                  <Input
                    id="icon"
                    name="icon"
                    defaultValue={editingPattern?.icon || ""}
                    placeholder="target"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="color">Color (hex)</Label>
                  <Input
                    id="color"
                    name="color"
                    defaultValue={editingPattern?.color || ""}
                    placeholder="#00FFFF"
                  />
                </div>
                <div className="flex items-center gap-3 pt-6">
                  <Switch
                    id="is_free"
                    name="is_free"
                    defaultChecked={editingPattern?.is_free || false}
                  />
                  <Label htmlFor="is_free">Free Pattern</Label>
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
        className="glass-card overflow-hidden"
      >
        {isLoading ? (
          <div className="p-8 text-center text-muted-foreground">Loading...</div>
        ) : patterns?.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            No patterns yet. Click "Add Pattern" to create one.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Phase</TableHead>
                <TableHead>Questions</TableHead>
                <TableHead>Free</TableHead>
                <TableHead>Order</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {patterns?.map((pattern) => (
                <TableRow key={pattern.id}>
                  <TableCell className="font-medium">{pattern.name}</TableCell>
                  <TableCell>
                    <span className="px-2 py-1 rounded-full bg-secondary/20 text-secondary text-xs">
                      Phase {pattern.phase}
                    </span>
                  </TableCell>
                  <TableCell>{pattern.total_questions}</TableCell>
                  <TableCell>
                    {pattern.is_free ? (
                      <span className="px-2 py-1 rounded-full bg-success/20 text-success text-xs">Yes</span>
                    ) : (
                      <span className="px-2 py-1 rounded-full bg-muted text-muted-foreground text-xs">No</span>
                    )}
                  </TableCell>
                  <TableCell>{pattern.display_order}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEdit(pattern)}
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteMutation.mutate(pattern.id)}
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

export default AdminPatterns;