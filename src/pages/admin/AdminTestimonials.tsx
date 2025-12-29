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
import { Plus, Pencil, Trash2, Loader2, Linkedin, GripVertical, Eye, EyeOff } from "lucide-react";
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
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface Testimonial {
  id: string;
  name: string;
  avatar_url: string | null;
  linkedin_url: string | null;
  review: string;
  role: string | null;
  company: string | null;
  company_logo_url: string | null;
  display_order: number;
  is_visible: boolean;
}

type NewTestimonial = Omit<Testimonial, "id">;

const SortableRow = ({ testimonial, onEdit, onDelete, onToggleVisibility }: {
  testimonial: Testimonial;
  onEdit: (t: Testimonial) => void;
  onDelete: (id: string) => void;
  onToggleVisibility: (t: Testimonial) => void;
}) => {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: testimonial.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <TableRow ref={setNodeRef} style={style}>
      <TableCell>
        <button {...attributes} {...listeners} className="cursor-grab p-1 hover:bg-muted rounded">
          <GripVertical className="w-4 h-4 text-muted-foreground" />
        </button>
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-3">
          {testimonial.avatar_url ? (
            <img src={testimonial.avatar_url} alt={testimonial.name} className="w-10 h-10 rounded-full object-cover" />
          ) : (
            <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-muted-foreground text-sm font-medium">
              {testimonial.name.charAt(0)}
            </div>
          )}
          <div>
            <span className="font-medium">{testimonial.name}</span>
            {testimonial.linkedin_url && (
              <a href={testimonial.linkedin_url} target="_blank" rel="noopener noreferrer" className="ml-2 inline-block">
                <Linkedin className="w-4 h-4 text-blue-500" />
              </a>
            )}
          </div>
        </div>
      </TableCell>
      <TableCell className="text-muted-foreground text-sm max-w-xs truncate">
        {testimonial.review.substring(0, 60)}...
      </TableCell>
      <TableCell>
        <div className="text-sm">
          <div>{testimonial.role}</div>
          <div className="text-muted-foreground">{testimonial.company}</div>
        </div>
      </TableCell>
      <TableCell>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onToggleVisibility(testimonial)}
        >
          {testimonial.is_visible ? (
            <Eye className="w-4 h-4 text-success" />
          ) : (
            <EyeOff className="w-4 h-4 text-muted-foreground" />
          )}
        </Button>
      </TableCell>
      <TableCell className="text-right">
        <div className="flex justify-end gap-2">
          <Button variant="ghost" size="icon" onClick={() => onEdit(testimonial)}>
            <Pencil className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => onDelete(testimonial.id)}>
            <Trash2 className="w-4 h-4 text-destructive" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
};

const AdminTestimonials = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [editingTestimonial, setEditingTestimonial] = useState<Testimonial | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const { data: testimonials, isLoading } = useQuery({
    queryKey: ["admin-testimonials"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("testimonials")
        .select("*")
        .order("display_order", { ascending: true });

      if (error) throw error;
      return data as Testimonial[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (testimonial: NewTestimonial) => {
      const { data, error } = await supabase
        .from("testimonials")
        .insert([testimonial])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-testimonials"] });
      setIsOpen(false);
      resetForm();
      toast({ title: "Testimonial created successfully" });
    },
    onError: (error) => {
      toast({ title: "Error creating testimonial", description: error.message, variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...testimonial }: Partial<Testimonial> & { id: string }) => {
      const { data, error } = await supabase
        .from("testimonials")
        .update(testimonial)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-testimonials"] });
      setIsOpen(false);
      resetForm();
      toast({ title: "Testimonial updated successfully" });
    },
    onError: (error) => {
      toast({ title: "Error updating testimonial", description: error.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("testimonials").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-testimonials"] });
      toast({ title: "Testimonial deleted successfully" });
    },
    onError: (error) => {
      toast({ title: "Error deleting testimonial", description: error.message, variant: "destructive" });
    },
  });

  const reorderMutation = useMutation({
    mutationFn: async (items: { id: string; display_order: number }[]) => {
      const updates = items.map((item) =>
        supabase.from("testimonials").update({ display_order: item.display_order }).eq("id", item.id)
      );
      await Promise.all(updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-testimonials"] });
    },
  });

  const resetForm = () => {
    setEditingTestimonial(null);
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    const testimonial: NewTestimonial = {
      name: formData.get("name") as string,
      avatar_url: (formData.get("avatar_url") as string) || null,
      linkedin_url: (formData.get("linkedin_url") as string) || null,
      review: formData.get("review") as string,
      role: (formData.get("role") as string) || null,
      company: (formData.get("company") as string) || null,
      company_logo_url: (formData.get("company_logo_url") as string) || null,
      display_order: editingTestimonial?.display_order ?? (testimonials?.length ?? 0),
      is_visible: true,
    };

    if (editingTestimonial) {
      updateMutation.mutate({ id: editingTestimonial.id, ...testimonial });
    } else {
      createMutation.mutate(testimonial);
    }
  };

  const openEdit = (testimonial: Testimonial) => {
    setEditingTestimonial(testimonial);
    setIsOpen(true);
  };

  const closeDialog = () => {
    setIsOpen(false);
    resetForm();
  };

  const handleToggleVisibility = (testimonial: Testimonial) => {
    updateMutation.mutate({ id: testimonial.id, is_visible: !testimonial.is_visible });
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id || !testimonials) return;

    const oldIndex = testimonials.findIndex((t) => t.id === active.id);
    const newIndex = testimonials.findIndex((t) => t.id === over.id);

    const newOrder = arrayMove(testimonials, oldIndex, newIndex);
    const updates = newOrder.map((item, index) => ({ id: item.id, display_order: index }));

    queryClient.setQueryData(["admin-testimonials"], newOrder);
    reorderMutation.mutate(updates);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Testimonials</h1>
          <p className="text-muted-foreground">Manage user testimonials displayed on landing page</p>
        </div>

        <Dialog open={isOpen} onOpenChange={(open) => { if (!open) closeDialog(); else setIsOpen(true); }}>
          <DialogTrigger asChild>
            <Button className="btn-primary-glow">
              <Plus className="w-4 h-4 mr-2" /> Add Testimonial
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingTestimonial ? "Edit Testimonial" : "Add New Testimonial"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name *</Label>
                <Input id="name" name="name" defaultValue={editingTestimonial?.name || ""} required placeholder="John Doe" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="avatar_url">Avatar URL</Label>
                <Input id="avatar_url" name="avatar_url" defaultValue={editingTestimonial?.avatar_url || ""} placeholder="https://..." />
              </div>

              <div className="space-y-2">
                <Label htmlFor="linkedin_url">LinkedIn URL</Label>
                <Input id="linkedin_url" name="linkedin_url" defaultValue={editingTestimonial?.linkedin_url || ""} placeholder="https://linkedin.com/in/..." />
              </div>

              <div className="space-y-2">
                <Label htmlFor="review">Review *</Label>
                <Textarea id="review" name="review" defaultValue={editingTestimonial?.review || ""} required placeholder="Write their testimonial here..." rows={4} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="role">Role</Label>
                  <Input id="role" name="role" defaultValue={editingTestimonial?.role || ""} placeholder="Software Engineer" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="company">Company</Label>
                  <Input id="company" name="company" defaultValue={editingTestimonial?.company || ""} placeholder="Google" />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="company_logo_url">Company Logo URL</Label>
                <Input id="company_logo_url" name="company_logo_url" defaultValue={editingTestimonial?.company_logo_url || ""} placeholder="https://..." />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Button type="button" variant="outline" onClick={closeDialog}>Cancel</Button>
                <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                  {(createMutation.isPending || updateMutation.isPending) && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  {editingTestimonial ? "Update" : "Create"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-muted-foreground">Loading...</div>
        ) : testimonials?.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">No testimonials yet. Click "Add Testimonial" to create one.</div>
        ) : (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10"></TableHead>
                  <TableHead>Person</TableHead>
                  <TableHead>Review</TableHead>
                  <TableHead>Position</TableHead>
                  <TableHead>Visible</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <SortableContext items={testimonials?.map((t) => t.id) || []} strategy={verticalListSortingStrategy}>
                  {testimonials?.map((testimonial) => (
                    <SortableRow
                      key={testimonial.id}
                      testimonial={testimonial}
                      onEdit={openEdit}
                      onDelete={(id) => deleteMutation.mutate(id)}
                      onToggleVisibility={handleToggleVisibility}
                    />
                  ))}
                </SortableContext>
              </TableBody>
            </Table>
          </DndContext>
        )}
      </motion.div>
    </div>
  );
};

export default AdminTestimonials;
