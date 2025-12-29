import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { Plus, Pencil, Trash2, Loader2, Upload, Building2 } from "lucide-react";
import { motion } from "framer-motion";

interface Company {
  id: string;
  name: string;
  logo_url: string | null;
  created_at: string;
}

const AdminCompanies = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: companies, isLoading } = useQuery({
    queryKey: ["admin-companies"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("companies")
        .select("*")
        .order("name", { ascending: true });
      
      if (error) throw error;
      return data as Company[];
    },
  });

  const uploadLogo = async (file: File, companyName: string): Promise<string | null> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${companyName.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}.${fileExt}`;
    
    const { error: uploadError } = await supabase.storage
      .from('company-logos')
      .upload(fileName, file);
    
    if (uploadError) throw uploadError;
    
    const { data } = supabase.storage
      .from('company-logos')
      .getPublicUrl(fileName);
    
    return data.publicUrl;
  };

  const createMutation = useMutation({
    mutationFn: async ({ name, logoFile }: { name: string; logoFile: File | null }) => {
      setIsUploading(true);
      let logo_url = null;
      
      if (logoFile) {
        logo_url = await uploadLogo(logoFile, name);
      }
      
      const { data, error } = await supabase
        .from("companies")
        .insert([{ name, logo_url }])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-companies"] });
      setIsOpen(false);
      resetForm();
      toast({ title: "Company created successfully" });
    },
    onError: (error) => {
      toast({ title: "Error creating company", description: error.message, variant: "destructive" });
    },
    onSettled: () => {
      setIsUploading(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, name, logoFile }: { id: string; name: string; logoFile: File | null }) => {
      setIsUploading(true);
      let logo_url = editingCompany?.logo_url || null;
      
      if (logoFile) {
        logo_url = await uploadLogo(logoFile, name);
      }
      
      const { data, error } = await supabase
        .from("companies")
        .update({ name, logo_url })
        .eq("id", id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-companies"] });
      setIsOpen(false);
      resetForm();
      toast({ title: "Company updated successfully" });
    },
    onError: (error) => {
      toast({ title: "Error updating company", description: error.message, variant: "destructive" });
    },
    onSettled: () => {
      setIsUploading(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("companies").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-companies"] });
      toast({ title: "Company deleted successfully" });
    },
    onError: (error) => {
      toast({ title: "Error deleting company", description: error.message, variant: "destructive" });
    },
  });

  const resetForm = () => {
    setEditingCompany(null);
    setLogoFile(null);
    setLogoPreview(null);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLogoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const name = formData.get("name") as string;

    if (editingCompany) {
      updateMutation.mutate({ id: editingCompany.id, name, logoFile });
    } else {
      createMutation.mutate({ name, logoFile });
    }
  };

  const openEdit = (company: Company) => {
    setEditingCompany(company);
    setLogoPreview(company.logo_url);
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-2">Companies</h1>
          <p className="text-muted-foreground">Manage company names and logos for question tags</p>
        </div>
        
        <Dialog open={isOpen} onOpenChange={(open) => { if (!open) closeDialog(); else openNew(); }}>
          <DialogTrigger asChild>
            <Button className="btn-primary-glow">
              <Plus className="w-4 h-4 mr-2" /> Add Company
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingCompany ? "Edit Company" : "Add New Company"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Company Name *</Label>
                <Input
                  id="name"
                  name="name"
                  defaultValue={editingCompany?.name || ""}
                  required
                  placeholder="Google, Amazon, Meta..."
                />
              </div>

              <div className="space-y-2">
                <Label>Company Logo</Label>
                <div className="flex items-center gap-4">
                  {logoPreview ? (
                    <div className="w-16 h-16 rounded-lg border border-border overflow-hidden bg-muted flex items-center justify-center">
                      <img src={logoPreview} alt="Logo preview" className="w-full h-full object-contain p-1" />
                    </div>
                  ) : (
                    <div className="w-16 h-16 rounded-lg border border-dashed border-border flex items-center justify-center bg-muted/50">
                      <Building2 className="w-6 h-6 text-muted-foreground" />
                    </div>
                  )}
                  <div className="flex-1">
                    <Label htmlFor="logo" className="cursor-pointer">
                      <div className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border hover:bg-muted/50 transition-colors w-fit">
                        <Upload className="w-4 h-4" />
                        <span className="text-sm">{logoFile ? "Change Logo" : "Upload Logo"}</span>
                      </div>
                    </Label>
                    <Input
                      id="logo"
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                    <p className="text-xs text-muted-foreground mt-1">PNG, JPG up to 2MB</p>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Button type="button" variant="outline" onClick={closeDialog}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending || isUploading}>
                  {(createMutation.isPending || updateMutation.isPending || isUploading) && (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  )}
                  {editingCompany ? "Update" : "Create"}
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
        ) : companies?.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            No companies yet. Click "Add Company" to create one.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Logo</TableHead>
                <TableHead>Name</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {companies?.map((company) => (
                <TableRow key={company.id}>
                  <TableCell>
                    <div className="w-10 h-10 rounded-lg border border-border overflow-hidden bg-muted flex items-center justify-center">
                      {company.logo_url ? (
                        <img src={company.logo_url} alt={company.name} className="w-full h-full object-contain p-1" />
                      ) : (
                        <Building2 className="w-5 h-5 text-muted-foreground" />
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">{company.name}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEdit(company)}
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          if (confirm("Are you sure you want to delete this company?")) {
                            deleteMutation.mutate(company.id);
                          }
                        }}
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

export default AdminCompanies;
