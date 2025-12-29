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
import { Plus, Pencil, Trash2, Loader2, Trophy, Flame, Medal, Star } from "lucide-react";
import { motion } from "framer-motion";

interface Badge {
  id: string;
  name: string;
  description: string | null;
  icon: string | null;
  type: "pattern" | "streak" | "achievement" | "xp";
  requirement: unknown;
}

type NewBadge = {
  name: string;
  description: string | null;
  icon: string | null;
  type: string;
  requirement: null;
};

const badgeIcons: Record<string, React.ReactNode> = {
  trophy: <Trophy className="w-5 h-5" />,
  flame: <Flame className="w-5 h-5" />,
  medal: <Medal className="w-5 h-5" />,
  star: <Star className="w-5 h-5" />,
};

const AdminBadges = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [editingBadge, setEditingBadge] = useState<Badge | null>(null);
  const [formType, setFormType] = useState<string>("achievement");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: badges, isLoading } = useQuery({
    queryKey: ["admin-badges"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("badges")
        .select("*")
        .order("type", { ascending: true });
      
      if (error) throw error;
      return data as Badge[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (badge: NewBadge) => {
      const { data, error } = await supabase
        .from("badges")
        .insert([badge])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-badges"] });
      setIsOpen(false);
      resetForm();
      toast({ title: "Badge created successfully" });
    },
    onError: (error) => {
      toast({ title: "Error creating badge", description: error.message, variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...badge }: NewBadge & { id: string }) => {
      const { data, error } = await supabase
        .from("badges")
        .update(badge)
        .eq("id", id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-badges"] });
      setIsOpen(false);
      resetForm();
      toast({ title: "Badge updated successfully" });
    },
    onError: (error) => {
      toast({ title: "Error updating badge", description: error.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("badges").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-badges"] });
      toast({ title: "Badge deleted successfully" });
    },
    onError: (error) => {
      toast({ title: "Error deleting badge", description: error.message, variant: "destructive" });
    },
  });

  const resetForm = () => {
    setEditingBadge(null);
    setFormType("achievement");
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const badge = {
      name: formData.get("name") as string,
      description: formData.get("description") as string || null,
      icon: formData.get("icon") as string || null,
      type: formType as "pattern" | "streak" | "achievement" | "xp",
      requirement: null,
    };

    if (editingBadge) {
      updateMutation.mutate({ id: editingBadge.id, ...badge });
    } else {
      createMutation.mutate(badge);
    }
  };

  const openEdit = (badge: Badge) => {
    setEditingBadge(badge);
    setFormType(badge.type);
    setIsOpen(true);
  };

  const closeDialog = () => {
    setIsOpen(false);
    resetForm();
  };

  const typeColors: Record<string, string> = {
    pattern: "bg-primary/20 text-primary",
    streak: "bg-streak/20 text-streak",
    achievement: "bg-warning/20 text-warning",
    xp: "bg-xp/20 text-xp",
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Badges</h1>
          <p className="text-muted-foreground">Manage achievement badges</p>
        </div>
        
        <Dialog open={isOpen} onOpenChange={(open) => { if (!open) closeDialog(); else setIsOpen(true); }}>
          <DialogTrigger asChild>
            <Button className="btn-primary-glow">
              <Plus className="w-4 h-4 mr-2" /> Add Badge
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>{editingBadge ? "Edit Badge" : "Add New Badge"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  name="name"
                  defaultValue={editingBadge?.name || ""}
                  required
                  placeholder="Two Pointer Master"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  name="description"
                  defaultValue={editingBadge?.description || ""}
                  placeholder="Awarded for completing all Two Pointer problems"
                  rows={2}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Type *</Label>
                  <Select value={formType} onValueChange={setFormType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pattern">Pattern</SelectItem>
                      <SelectItem value="streak">Streak</SelectItem>
                      <SelectItem value="achievement">Achievement</SelectItem>
                      <SelectItem value="xp">XP</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="icon">Icon</Label>
                  <Input
                    id="icon"
                    name="icon"
                    defaultValue={editingBadge?.icon || ""}
                    placeholder="trophy, flame, medal, star"
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
                  {editingBadge ? "Update" : "Create"}
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
        ) : badges?.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            No badges yet. Click "Add Badge" to create one.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Badge</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Type</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {badges?.map((badge) => (
                <TableRow key={badge.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-warning/20 flex items-center justify-center text-warning">
                        {badge.icon && badgeIcons[badge.icon] ? badgeIcons[badge.icon] : <Trophy className="w-5 h-5" />}
                      </div>
                      <span className="font-medium">{badge.name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm max-w-xs truncate">
                    {badge.description}
                  </TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded-full text-xs ${typeColors[badge.type]}`}>
                      {badge.type}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEdit(badge)}
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteMutation.mutate(badge.id)}
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

export default AdminBadges;