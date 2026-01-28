import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { User, Loader2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Form } from "@/components/ui/form";
import { AppLayout } from "@/components/layout/AppLayout";
import { BasicInfoSection } from "@/components/profile/BasicInfoSection";
import { AcademicSection } from "@/components/profile/AcademicSection";
import { WorkExperienceSection } from "@/components/profile/WorkExperienceSection";
import { SocialLinksSection } from "@/components/profile/SocialLinksSection";
import { ProfileCompletionCard } from "@/components/profile/ProfileCompletionCard";
import { useNavigate } from "react-router-dom";

const profileSchema = z.object({
  full_name: z.string().max(100, "Name must be less than 100 characters").optional().or(z.literal("")),
  username: z.string().min(3, "Username must be at least 3 characters").max(30, "Username must be less than 30 characters"),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  mobile: z.string().max(20, "Mobile must be less than 20 characters").optional().or(z.literal("")),
  address: z.string().max(500, "Address must be less than 500 characters").optional().or(z.literal("")),
  bio: z.string().max(160, "Bio must be less than 160 characters").optional().or(z.literal("")),
  college: z.string().max(200, "College name must be less than 200 characters").optional().or(z.literal("")),
  degree: z.string().optional().or(z.literal("")),
  cgpa: z.number().min(0).max(10).optional().nullable(),
  graduation_year: z.number().optional().nullable(),
  work_experience: z.array(z.object({
    company: z.string(),
    role: z.string(),
    duration: z.string(),
    techStack: z.array(z.string()),
    type: z.enum(["internship", "fulltime", "parttime", "freelance"]),
  })).optional(),
  linkedin_url: z.string().url("Invalid URL").optional().or(z.literal("")),
  github_url: z.string().url("Invalid URL").optional().or(z.literal("")),
  twitter_url: z.string().url("Invalid URL").optional().or(z.literal("")),
  instagram_url: z.string().url("Invalid URL").optional().or(z.literal("")),
  leetcode_url: z.string().url("Invalid URL").optional().or(z.literal("")),
  portfolio_url: z.string().url("Invalid URL").optional().or(z.literal("")),
});

type ProfileFormData = z.infer<typeof profileSchema>;

export default function ProfileManagement() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  // Redirect to auth if not logged in
  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth?next=/profile-settings");
    }
  }, [user, authLoading, navigate]);

  const { data: profile, isLoading } = useQuery({
    queryKey: ["profile-management", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  const form = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      full_name: "",
      username: "",
      email: "",
      mobile: "",
      address: "",
      bio: "",
      college: "",
      degree: "",
      cgpa: null,
      graduation_year: null,
      work_experience: [],
      linkedin_url: "",
      github_url: "",
      twitter_url: "",
      instagram_url: "",
      leetcode_url: "",
      portfolio_url: "",
    },
  });

  useEffect(() => {
    if (profile) {
      form.reset({
        full_name: profile.full_name || "",
        username: profile.username || "",
        email: profile.email || "",
        mobile: profile.mobile || "",
        address: profile.address || "",
        bio: profile.bio || "",
        college: profile.college || "",
        degree: profile.degree || "",
        cgpa: profile.cgpa,
        graduation_year: profile.graduation_year,
        work_experience: (profile.work_experience as any[]) || [],
        linkedin_url: profile.linkedin_url || "",
        github_url: profile.github_url || "",
        twitter_url: profile.twitter_url || "",
        instagram_url: profile.instagram_url || "",
        leetcode_url: profile.leetcode_url || "",
        portfolio_url: profile.portfolio_url || "",
      });
      setAvatarPreview(profile.avatar_url);
    }
  }, [profile, form]);

  const updateMutation = useMutation({
    mutationFn: async (data: ProfileFormData) => {
      if (!user?.id) throw new Error("Not authenticated");

      let avatarUrl = profile?.avatar_url;

      // Upload avatar if changed
      if (avatarFile) {
        const fileExt = avatarFile.name.split(".").pop();
        const filePath = `${user.id}/avatar.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from("company-logos")
          .upload(filePath, avatarFile, { upsert: true });

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from("company-logos")
          .getPublicUrl(filePath);

        avatarUrl = urlData.publicUrl;
      }

      // Check if profile is complete
      const isComplete = !!(
        data.full_name &&
        data.username &&
        data.email &&
        data.college &&
        data.degree &&
        (data.linkedin_url || data.github_url)
      );

      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: data.full_name || null,
          username: data.username,
          email: data.email || null,
          mobile: data.mobile || null,
          address: data.address || null,
          bio: data.bio || null,
          avatar_url: avatarUrl,
          college: data.college || null,
          degree: data.degree || null,
          cgpa: data.cgpa,
          graduation_year: data.graduation_year,
          work_experience: data.work_experience || [],
          linkedin_url: data.linkedin_url || null,
          github_url: data.github_url || null,
          twitter_url: data.twitter_url || null,
          instagram_url: data.instagram_url || null,
          leetcode_url: data.leetcode_url || null,
          portfolio_url: data.portfolio_url || null,
          profile_completed_at: isComplete ? new Date().toISOString() : null,
        })
        .eq("id", user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile-management"] });
      queryClient.invalidateQueries({ queryKey: ["user-profile"] });
      toast.success("Profile updated successfully!");
    },
    onError: (error) => {
      toast.error("Failed to update profile: " + error.message);
    },
  });

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast.error("Image must be less than 2MB");
        return;
      }
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const onSubmit = (data: ProfileFormData) => {
    updateMutation.mutate(data);
  };

  if (authLoading || isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto space-y-6 pb-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="text-center"
        >
          <Badge className="mb-4 bg-blue-500/10 text-blue-500 border-blue-500/20">
            <User className="w-3 h-3 mr-1" />
            Profile Settings
          </Badge>
          <h1 className="text-2xl md:text-3xl font-bold mb-2">
            Profile &{" "}
            <span className="bg-gradient-to-r from-blue-500 to-cyan-500 bg-clip-text text-transparent">
              Account
            </span>
          </h1>
          <p className="text-muted-foreground">
            Manage your personal info, academic background, experience, and social links.
          </p>
        </motion.div>

        {/* Completion Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.4 }}
        >
          <ProfileCompletionCard profile={profile} />
        </motion.div>

        {/* Form */}
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.4 }}
            >
              <BasicInfoSection
                form={form}
                avatarPreview={avatarPreview}
                onAvatarChange={handleAvatarChange}
                username={profile?.username || undefined}
              />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.4 }}
            >
              <AcademicSection form={form} />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.4 }}
            >
              <WorkExperienceSection form={form} />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.4 }}
            >
              <SocialLinksSection form={form} />
            </motion.div>

            {/* Submit Button */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.4 }}
              className="flex justify-end sticky bottom-4"
            >
              <Button
                type="submit"
                size="lg"
                disabled={updateMutation.isPending || !form.formState.isDirty}
                className="shadow-lg"
              >
                {updateMutation.isPending ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
                Save Changes
              </Button>
            </motion.div>
          </form>
        </Form>
      </div>
    </AppLayout>
  );
}
