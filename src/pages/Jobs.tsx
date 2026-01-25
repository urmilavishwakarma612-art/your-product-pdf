import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import {
  Search,
  Briefcase,
  Building2,
  MapPin,
  Clock,
  ExternalLink,
  Filter,
  Loader2,
  Code,
  GraduationCap,
  Calendar,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
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
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { AppLayout } from "@/components/layout/AppLayout";
import { format, differenceInDays } from "date-fns";

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

export default function Jobs() {
  const [searchQuery, setSearchQuery] = useState("");
  const [jobTypeFilter, setJobTypeFilter] = useState<string>("all");
  const [selectedJob, setSelectedJob] = useState<DSAJob | null>(null);

  const { data: jobs, isLoading } = useQuery({
    queryKey: ["dsa-jobs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("dsa_jobs")
        .select("*")
        .eq("status", "active")
        .order("is_featured", { ascending: false })
        .order("posted_date", { ascending: false });
      if (error) throw error;
      return data as DSAJob[];
    },
  });

  const filteredJobs = jobs?.filter((job) => {
    const matchesSearch =
      job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.company_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase())) ||
      job.skills.some((s) => s.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesType = jobTypeFilter === "all" || job.job_type === jobTypeFilter;
    return matchesSearch && matchesType;
  });

  const isClosingSoon = (closingDate: string | null) => {
    if (!closingDate) return false;
    const daysLeft = differenceInDays(new Date(closingDate), new Date());
    return daysLeft >= 0 && daysLeft <= 7;
  };

  const isNew = (postedDate: string) => {
    const daysSincePosted = differenceInDays(new Date(), new Date(postedDate));
    return daysSincePosted <= 3;
  };

  return (
    <AppLayout fullWidth>
      {/* Hero Section */}
      <section className="relative py-12 md:py-16 overflow-hidden -mx-4 sm:-mx-6 px-4 sm:px-6 mb-8">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-purple-500/5" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(120,119,198,0.1),transparent_50%)]" />
        
        <div className="relative container mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/30 mb-6"
          >
            <Briefcase className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-primary">DSA & Coding Jobs</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-3xl md:text-4xl font-bold mb-4"
          >
            Latest <span className="text-primary">DSA Jobs</span> for You
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-muted-foreground max-w-2xl mx-auto mb-8"
          >
            Curated opportunities from top product-based companies that value strong DSA and problem-solving skills
          </motion.p>

          {/* Search & Filters */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="max-w-3xl mx-auto flex flex-col sm:flex-row gap-4"
          >
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                placeholder="Search by company, role, skill..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 h-12 text-base bg-card/50 border-border/50"
              />
            </div>
            <Select value={jobTypeFilter} onValueChange={setJobTypeFilter}>
              <SelectTrigger className="w-full sm:w-[180px] h-12 bg-card/50 border-border/50">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Job Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="full-time">Full-time</SelectItem>
                <SelectItem value="internship">Internship</SelectItem>
                <SelectItem value="contract">Contract</SelectItem>
              </SelectContent>
            </Select>
          </motion.div>
        </div>
      </section>

      {/* Jobs Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-10 h-10 animate-spin text-primary" />
        </div>
      ) : filteredJobs?.length === 0 ? (
        <div className="text-center py-20">
          <Briefcase className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2">No jobs found</h3>
          <p className="text-muted-foreground">Try adjusting your search or filters</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredJobs?.map((job, index) => (
            <motion.div
              key={job.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card className="h-full hover:shadow-lg hover:border-primary/30 transition-all cursor-pointer group"
                onClick={() => setSelectedJob(job)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      {job.company_logo ? (
                        <img
                          src={job.company_logo}
                          alt={job.company_name}
                          className="w-12 h-12 rounded-lg object-contain bg-muted p-1"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                          <Building2 className="w-6 h-6 text-primary" />
                        </div>
                      )}
                      <div>
                        <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-1">
                          {job.title}
                        </h3>
                        <p className="text-sm text-muted-foreground">{job.company_name}</p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      {job.is_featured && (
                        <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0">
                          <Sparkles className="w-3 h-3 mr-1" />
                          Featured
                        </Badge>
                      )}
                      {isNew(job.posted_date) && !job.is_featured && (
                        <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/30">
                          New
                        </Badge>
                      )}
                      {isClosingSoon(job.closing_date) && (
                        <Badge variant="destructive" className="text-xs">
                          Closing Soon
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Briefcase className="w-4 h-4" />
                    <span>{job.role}</span>
                  </div>
                  
                  {job.location && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin className="w-4 h-4" />
                      <span>{job.location}</span>
                    </div>
                  )}

                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {job.about_job || job.description.substring(0, 100)}...
                  </p>

                  <div className="flex flex-wrap gap-1.5">
                    {job.tags.slice(0, 3).map((tag, i) => (
                      <Badge key={i} variant="outline" className="text-xs bg-primary/5 border-primary/30 text-primary">
                        {tag}
                      </Badge>
                    ))}
                    <Badge variant="outline" className="text-xs capitalize">
                      {job.job_type}
                    </Badge>
                  </div>
                </CardContent>

                <CardFooter className="pt-3 border-t flex items-center justify-between">
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="w-3 h-3" />
                    <span>{format(new Date(job.posted_date), "MMM d, yyyy")}</span>
                  </div>
                  <Button size="sm" variant="ghost" className="gap-1 text-primary">
                    View Details
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </CardFooter>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {/* Job Detail Modal */}
      <Dialog open={!!selectedJob} onOpenChange={() => setSelectedJob(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh]">
          <DialogHeader>
            <div className="flex items-center gap-4">
              {selectedJob?.company_logo ? (
                <img
                  src={selectedJob.company_logo}
                  alt={selectedJob.company_name}
                  className="w-16 h-16 rounded-xl object-contain bg-muted p-2"
                />
              ) : (
                <div className="w-16 h-16 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Building2 className="w-8 h-8 text-primary" />
                </div>
              )}
              <div>
                <DialogTitle className="text-xl">{selectedJob?.title}</DialogTitle>
                <p className="text-muted-foreground">{selectedJob?.company_name}</p>
              </div>
            </div>
          </DialogHeader>

          <ScrollArea className="max-h-[60vh] pr-4">
            <div className="space-y-6 py-4">
              {/* Quick Info */}
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-2 text-sm">
                  <Briefcase className="w-4 h-4 text-muted-foreground" />
                  <span>{selectedJob?.role}</span>
                </div>
                {selectedJob?.location && (
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="w-4 h-4 text-muted-foreground" />
                    <span>{selectedJob.location}</span>
                  </div>
                )}
                {selectedJob?.experience && (
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="w-4 h-4 text-muted-foreground" />
                    <span>{selectedJob.experience}</span>
                  </div>
                )}
                {selectedJob?.education && (
                  <div className="flex items-center gap-2 text-sm">
                    <GraduationCap className="w-4 h-4 text-muted-foreground" />
                    <span>{selectedJob.education}</span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <span>Posted {selectedJob && format(new Date(selectedJob.posted_date), "MMM d, yyyy")}</span>
                </div>
                {selectedJob?.closing_date && (
                  <div className="flex items-center gap-2 text-sm text-destructive">
                    <Calendar className="w-4 h-4" />
                    <span>Closes {format(new Date(selectedJob.closing_date), "MMM d, yyyy")}</span>
                  </div>
                )}
              </div>

              <Separator />

              {/* Tags */}
              <div>
                <h4 className="font-medium mb-2">Tags</h4>
                <div className="flex flex-wrap gap-2">
                  {selectedJob?.tags.map((tag, i) => (
                    <Badge key={i} variant="outline" className="bg-primary/5 border-primary/30 text-primary">
                      {tag}
                    </Badge>
                  ))}
                  <Badge variant="outline" className="capitalize">{selectedJob?.job_type}</Badge>
                </div>
              </div>

              {/* Skills */}
              {selectedJob?.skills && selectedJob.skills.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2 flex items-center gap-2">
                    <Code className="w-4 h-4" />
                    Required Skills
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedJob.skills.map((skill, i) => (
                      <Badge key={i} variant="secondary" className="text-sm">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              <Separator />

              {/* Description */}
              <div>
                <h4 className="font-medium mb-2">Job Description</h4>
                <p className="text-muted-foreground whitespace-pre-wrap text-sm">
                  {selectedJob?.description}
                </p>
              </div>

              {/* Eligibility */}
              {selectedJob?.eligibility && (
                <div>
                  <h4 className="font-medium mb-2">Eligibility Criteria</h4>
                  <p className="text-muted-foreground whitespace-pre-wrap text-sm">
                    {selectedJob.eligibility}
                  </p>
                </div>
              )}
            </div>
          </ScrollArea>

          <div className="flex gap-3 pt-4 border-t">
            <Button variant="outline" className="flex-1" onClick={() => setSelectedJob(null)}>
              Close
            </Button>
            <a href={selectedJob?.apply_link} target="_blank" rel="noopener noreferrer" className="flex-1">
              <Button className="w-full gap-2">
                <ExternalLink className="w-4 h-4" />
                Apply Now
              </Button>
            </a>
          </div>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}