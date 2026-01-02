import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";

const AdminCurriculum = () => {
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [editingLevel, setEditingLevel] = useState<any>(null);
  const [form, setForm] = useState({ level_number: 0, name: "", description: "", week_start: 1, week_end: 1, is_free: false });

  const { data: levels = [], isLoading } = useQuery({
    queryKey: ["admin-curriculum-levels"],
    queryFn: async () => {
      const { data, error } = await supabase.from("curriculum_levels").select("*").order("display_order");
      if (error) throw error;
      return data;
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (data: any) => {
      if (editingLevel) {
        const { error } = await supabase.from("curriculum_levels").update(data).eq("id", editingLevel.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("curriculum_levels").insert({ ...data, display_order: levels.length });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-curriculum-levels"] });
      toast.success(editingLevel ? "Level updated" : "Level created");
      setIsOpen(false);
      resetForm();
    },
    onError: () => toast.error("Failed to save"),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("curriculum_levels").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-curriculum-levels"] });
      toast.success("Level deleted");
    },
  });

  const resetForm = () => {
    setForm({ level_number: 0, name: "", description: "", week_start: 1, week_end: 1, is_free: false });
    setEditingLevel(null);
  };

  const openEdit = (level: any) => {
    setEditingLevel(level);
    setForm({ level_number: level.level_number, name: level.name, description: level.description || "", week_start: level.week_start || 1, week_end: level.week_end || 1, is_free: level.is_free });
    setIsOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Curriculum Levels</h1>
        <Dialog open={isOpen} onOpenChange={(o) => { setIsOpen(o); if (!o) resetForm(); }}>
          <DialogTrigger asChild>
            <Button><Plus className="w-4 h-4 mr-2" />Add Level</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{editingLevel ? "Edit" : "Add"} Level</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Level Number</Label><Input type="number" value={form.level_number} onChange={(e) => setForm({ ...form, level_number: +e.target.value })} /></div>
                <div><Label>Name</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
              </div>
              <div><Label>Description</Label><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Week Start</Label><Input type="number" value={form.week_start} onChange={(e) => setForm({ ...form, week_start: +e.target.value })} /></div>
                <div><Label>Week End</Label><Input type="number" value={form.week_end} onChange={(e) => setForm({ ...form, week_end: +e.target.value })} /></div>
              </div>
              <div className="flex items-center gap-2"><Switch checked={form.is_free} onCheckedChange={(c) => setForm({ ...form, is_free: c })} /><Label>Free Level</Label></div>
              <Button onClick={() => saveMutation.mutate(form)} disabled={saveMutation.isPending} className="w-full">Save</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
      <Table>
        <TableHeader><TableRow><TableHead>Level</TableHead><TableHead>Name</TableHead><TableHead>Weeks</TableHead><TableHead>Free</TableHead><TableHead></TableHead></TableRow></TableHeader>
        <TableBody>
          {isLoading ? <TableRow><TableCell colSpan={5} className="text-center">Loading...</TableCell></TableRow> :
            levels.map((l: any) => (
              <TableRow key={l.id}>
                <TableCell>{l.level_number}</TableCell>
                <TableCell className="font-medium">{l.name}</TableCell>
                <TableCell>{l.week_start}-{l.week_end}</TableCell>
                <TableCell>{l.is_free ? "✓" : ""}</TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="icon" onClick={() => openEdit(l)}><Pencil className="w-4 h-4" /></Button>
                  <Button variant="ghost" size="icon" onClick={() => deleteMutation.mutate(l.id)}><Trash2 className="w-4 h-4" /></Button>
                </TableCell>
              </TableRow>
            ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default AdminCurriculum;
