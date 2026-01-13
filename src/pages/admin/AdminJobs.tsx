import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Plus,
  Pencil,
  Trash2,
  Search,
  Briefcase,
  Building2,
  MapPin,
  Clock,
  ExternalLink,
  Loader2,
} from "lucide-react";
import { format } from "date-fns";

interface DSAJob {
  id: string;
  title: string;
  company_name: string;
  company_logo: string | null;
  role: string;
  about_job: string | null;
  description: string;
  eligibility: string | null;
  skills: string[];
  experience: string | null;
  education: string | null;
  location: string | null;
  job_type: string;
  apply_link: string;
  tags: string[];
  status: string;
  is_featured: boolean;
  posted_date: string;
  closing_date: string | null;
}

const defaultJob: Partial<DSAJob> = {
  title: "",
  company_name: "",
  company_logo: "",
  role: "",
  about_job: "",
  description: "",
  eligibility: "",
  skills: ["DSA", "Problem Solving"],
  experience: "",
  education: "",
  location: "",
  job_type: "full-time",
  apply_link: "",
  tags: ["DSA"],
  status: "active",
  is_featured: false,
  closing_date: null,
};

export default function AdminJobs() {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingJob, setEditingJob] = useState<DSAJob | null>(null);
  const [formData, setFormData] = useState<Partial<DSAJob>>(defaultJob);
  const [skillsInput, setSkillsInput] = useState("");
  const [tagsInput, setTagsInput] = useState("");

  const { data: jobs, isLoading } = useQuery({
    queryKey: ["admin-dsa-jobs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("dsa_jobs")
        .select("*")
        .order("posted_date", { ascending: false });
      if (error) throw error;
      return data as DSAJob[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (job: any) => {
      const { data, error } = await supabase
        .from("dsa_jobs")
        .insert([job])
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-dsa-jobs"] });
      toast.success("Job created successfully");
      handleCloseDialog();
    },
    onError: (error) => {
      toast.error("Failed to create job: " + error.message);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...job }: Partial<DSAJob> & { id: string }) => {
      const { data, error } = await supabase
        .from("dsa_jobs")
        .update(job)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-dsa-jobs"] });
      toast.success("Job updated successfully");
      handleCloseDialog();
    },
    onError: (error) => {
      toast.error("Failed to update job: " + error.message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("dsa_jobs").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-dsa-jobs"] });
      toast.success("Job deleted successfully");
    },
    onError: (error) => {
      toast.error("Failed to delete job: " + error.message);
    },
  });

  const handleOpenCreate = () => {
    setEditingJob(null);
    setFormData(defaultJob);
    setSkillsInput("DSA, Problem Solving");
    setTagsInput("DSA");
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (job: DSAJob) => {
    setEditingJob(job);
    setFormData(job);
    setSkillsInput(job.skills?.join(", ") || "");
    setTagsInput(job.tags?.join(", ") || "");
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingJob(null);
    setFormData(defaultJob);
    setSkillsInput("");
    setTagsInput("");
  };

  const handleSubmit = () => {
    const jobData = {
      ...formData,
      skills: skillsInput.split(",").map((s) => s.trim()).filter(Boolean),
      tags: tagsInput.split(",").map((t) => t.trim()).filter(Boolean),
    };

    if (editingJob) {
      updateMutation.mutate({ id: editingJob.id, ...jobData });
    } else {
      createMutation.mutate(jobData);
    }
  };

  const filteredJobs = jobs?.filter((job) => {
    const matchesSearch =
      job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.company_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.role.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || job.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">DSA Jobs</h1>
          <p className="text-muted-foreground">Manage DSA and coding job listings</p>
        </div>
        <Button onClick={handleOpenCreate} className="gap-2">
          <Plus className="w-4 h-4" />
          Add New Job
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search jobs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-[150px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="closed">Closed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Jobs Table */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Job</TableHead>
                <TableHead>Company</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Posted</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredJobs?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
                    No jobs found
                  </TableCell>
                </TableRow>
              ) : (
                filteredJobs?.map((job) => (
                  <TableRow key={job.id}>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="font-medium flex items-center gap-2">
                          {job.title}
                          {job.is_featured && (
                            <Badge variant="secondary" className="text-xs">Featured</Badge>
                          )}
                        </div>
                        <div className="text-sm text-muted-foreground">{job.role}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {job.company_logo && (
                          <img
                            src={job.company_logo}
                            alt={job.company_name}
                            className="w-6 h-6 rounded object-contain"
                          />
                        )}
                        <span>{job.company_name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize">
                        {job.job_type}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={job.status === "active" ? "default" : "secondary"}
                        className="capitalize"
                      >
                        {job.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {format(new Date(job.posted_date), "MMM d, yyyy")}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleOpenEdit(job)}
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteMutation.mutate(job.id)}
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                        <a href={job.apply_link} target="_blank" rel="noopener noreferrer">
                          <Button variant="ghost" size="icon">
                            <ExternalLink className="w-4 h-4" />
                          </Button>
                        </a>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>{editingJob ? "Edit Job" : "Add New Job"}</DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-[60vh] pr-4">
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Job Title *</Label>
                  <Input
                    id="title"
                    placeholder="Software Engineer - DSA Focus"
                    value={formData.title || ""}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="role">Role/Designation *</Label>
                  <Input
                    id="role"
                    placeholder="SDE-1"
                    value={formData.role || ""}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="company_name">Company Name *</Label>
                  <Input
                    id="company_name"
                    placeholder="Google"
                    value={formData.company_name || ""}
                    onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="company_logo">Company Logo URL</Label>
                  <Input
                    id="company_logo"
                    placeholder="https://..."
                    value={formData.company_logo || ""}
                    onChange={(e) => setFormData({ ...formData, company_logo: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="about_job">About the Job</Label>
                <Textarea
                  id="about_job"
                  placeholder="Brief summary of the job..."
                  value={formData.about_job || ""}
                  onChange={(e) => setFormData({ ...formData, about_job: e.target.value })}
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Full Job Description *</Label>
                <Textarea
                  id="description"
                  placeholder="Detailed job description..."
                  value={formData.description || ""}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={4}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="eligibility">Eligibility Criteria</Label>
                <Textarea
                  id="eligibility"
                  placeholder="Required qualifications..."
                  value={formData.eligibility || ""}
                  onChange={(e) => setFormData({ ...formData, eligibility: e.target.value })}
                  rows={2}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="skills">Skills (comma-separated)</Label>
                  <Input
                    id="skills"
                    placeholder="DSA, Problem Solving, Algorithms"
                    value={skillsInput}
                    onChange={(e) => setSkillsInput(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tags">Tags (comma-separated)</Label>
                  <Input
                    id="tags"
                    placeholder="DSA, Product-Based, Coding"
                    value={tagsInput}
                    onChange={(e) => setTagsInput(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="experience">Experience</Label>
                  <Input
                    id="experience"
                    placeholder="0-2 years"
                    value={formData.experience || ""}
                    onChange={(e) => setFormData({ ...formData, experience: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="education">Education</Label>
                  <Input
                    id="education"
                    placeholder="B.Tech CS"
                    value={formData.education || ""}
                    onChange={(e) => setFormData({ ...formData, education: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    placeholder="Bangalore / Remote"
                    value={formData.location || ""}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="job_type">Job Type</Label>
                  <Select
                    value={formData.job_type || "full-time"}
                    onValueChange={(value) => setFormData({ ...formData, job_type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="full-time">Full-time</SelectItem>
                      <SelectItem value="internship">Internship</SelectItem>
                      <SelectItem value="contract">Contract</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={formData.status || "active"}
                    onValueChange={(value) => setFormData({ ...formData, status: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="closed">Closed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="apply_link">Apply Link *</Label>
                <Input
                  id="apply_link"
                  placeholder="https://careers.google.com/..."
                  value={formData.apply_link || ""}
                  onChange={(e) => setFormData({ ...formData, apply_link: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="closing_date">Closing Date</Label>
                <Input
                  id="closing_date"
                  type="date"
                  value={formData.closing_date?.split("T")[0] || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      closing_date: e.target.value ? new Date(e.target.value).toISOString() : null,
                    })
                  }
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="is_featured"
                  checked={formData.is_featured || false}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_featured: checked })}
                />
                <Label htmlFor="is_featured">Featured Job</Label>
              </div>
            </div>
          </ScrollArea>
          <DialogFooter>
            <Button variant="outline" onClick={handleCloseDialog}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={isPending}>
              {isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {editingJob ? "Update Job" : "Create Job"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
