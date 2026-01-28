import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ProfileHeader } from "@/components/profile/ProfileHeader";
import { StatsGrid } from "@/components/profile/StatsGrid";
import { ActivityGraph } from "@/components/profile/ActivityGraph";
import { BadgesSection } from "@/components/profile/BadgesSection";
import { RecentActivity } from "@/components/profile/RecentActivity";
import { DifficultyBreakdown } from "@/components/profile/DifficultyBreakdown";
import { PaymentHistory } from "@/components/profile/PaymentHistory";
import { RefundSection } from "@/components/profile/RefundSection";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { useAuth } from "@/hooks/useAuth";

export default function UserProfile() {
  const params = useParams<{ username: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const rawUsername = params.username ? decodeURIComponent(params.username) : "";
  const normalizedUsername = rawUsername.trim();

  // First, get minimal data from public view to find the user
  const { data: publicProfile, isLoading: profileLoading } = useQuery({
    queryKey: ["profile-public", normalizedUsername],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles_public")
        .select("*")
        .ilike("username", normalizedUsername)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: normalizedUsername.length > 0,
  });

  // For own profile, fetch full data from base table (includes bio, social links)
  const isOwnProfile = user?.id === publicProfile?.id;
  
  const { data: fullProfile } = useQuery({
    queryKey: ["profile-full", publicProfile?.id],
    queryFn: async () => {
      if (!publicProfile?.id) return null;
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", publicProfile.id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: isOwnProfile && !!publicProfile?.id,
  });

  // Use full profile for own profile, otherwise public profile
  const profile = isOwnProfile && fullProfile ? fullProfile : publicProfile;

  const { data: badges = [] } = useQuery({
    queryKey: ["user-badges", profile?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_badges")
        .select(`
          earned_at,
          badges (
            id,
            name,
            description,
            icon,
            type
          )
        `)
        .eq("user_id", profile!.id);
      if (error) throw error;
      return data.map((ub: any) => ({
        ...ub.badges,
        earned_at: ub.earned_at,
      }));
    },
    enabled: !!profile?.id,
  });

  const { data: activityData = [] } = useQuery({
    queryKey: ["activity", profile?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_progress")
        .select("solved_at")
        .eq("user_id", profile!.id)
        .eq("is_solved", true)
        .not("solved_at", "is", null);
      if (error) throw error;

      const countMap = new Map<string, number>();
      data.forEach((item: any) => {
        const date = format(new Date(item.solved_at), "yyyy-MM-dd");
        countMap.set(date, (countMap.get(date) || 0) + 1);
      });

      return Array.from(countMap.entries()).map(([date, count]) => ({
        date,
        count,
      }));
    },
    enabled: !!profile?.id,
  });

  const { data: recentProblems = [] } = useQuery({
    queryKey: ["recent-problems", profile?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_progress")
        .select(`
          solved_at,
          questions (
            id,
            title,
            difficulty
          )
        `)
        .eq("user_id", profile!.id)
        .eq("is_solved", true)
        .not("solved_at", "is", null)
        .order("solved_at", { ascending: false })
        .limit(10);
      if (error) throw error;
      return data.map((p: any) => ({
        id: p.questions.id,
        title: p.questions.title,
        difficulty: p.questions.difficulty,
        solved_at: p.solved_at,
      }));
    },
    enabled: !!profile?.id,
  });

  const { data: difficultyStats } = useQuery({
    queryKey: ["difficulty-stats", profile?.id],
    queryFn: async () => {
      const { data: questions, error: qError } = await supabase
        .from("questions")
        .select("id, difficulty");
      if (qError) throw qError;

      const { data: progress, error: pError } = await supabase
        .from("user_progress")
        .select("question_id")
        .eq("user_id", profile!.id)
        .eq("is_solved", true);
      if (pError) throw pError;

      const solvedIds = new Set(progress.map((p: any) => p.question_id));

      const stats = {
        easy: { solved: 0, total: 0 },
        medium: { solved: 0, total: 0 },
        hard: { solved: 0, total: 0 },
      };

      questions.forEach((q: any) => {
        const key = q.difficulty.toLowerCase() as "easy" | "medium" | "hard";
        if (stats[key]) {
          stats[key].total++;
          if (solvedIds.has(q.id)) {
            stats[key].solved++;
          }
        }
      });

      return stats;
    },
    enabled: !!profile?.id,
  });

  const solvedCount = activityData.reduce((sum, d) => sum + d.count, 0);

  if (profileLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[50vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  // Handle empty username case
  if (!normalizedUsername) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center gap-4 min-h-[50vh]">
          <h1 className="text-2xl font-bold">No username provided</h1>
          <p className="text-muted-foreground">
            Please set up your username in your profile settings.
          </p>
          <Button onClick={() => navigate("/dashboard")} variant="outline">
            Go to Dashboard
          </Button>
        </div>
      </AppLayout>
    );
  }

  if (!profile) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center gap-4 min-h-[50vh]">
          <h1 className="text-2xl font-bold">User not found</h1>
          <p className="text-muted-foreground">
            The user "{normalizedUsername}" doesn't exist.
          </p>
          <Button onClick={() => navigate("/")} variant="outline">
            Go Home
          </Button>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Back button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(-1)}
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>

        {/* Profile Header - bio/social links only shown for own profile */}
        <ProfileHeader
          username={profile.username || "Anonymous"}
          avatarUrl={profile.avatar_url}
          level={profile.current_level}
          createdAt={profile.created_at}
          subscriptionStatus={profile.subscription_status}
          bio={'bio' in profile ? (profile.bio as string | null) : undefined}
          githubUrl={'github_url' in profile ? (profile.github_url as string | null) : undefined}
          linkedinUrl={'linkedin_url' in profile ? (profile.linkedin_url as string | null) : undefined}
          leetcodeUrl={'leetcode_url' in profile ? (profile.leetcode_url as string | null) : undefined}
          instagramUrl={'instagram_url' in profile ? (profile.instagram_url as string | null) : undefined}
          twitterUrl={'twitter_url' in profile ? (profile.twitter_url as string | null) : undefined}
        />

        {/* Stats Grid */}
        <StatsGrid
          totalXp={profile.total_xp}
          level={profile.current_level}
          currentStreak={profile.current_streak}
          longestStreak={profile.longest_streak}
          solvedCount={solvedCount}
        />

        {/* Activity Graph */}
        <ActivityGraph activityData={activityData} />

        {/* Two column layout for badges and breakdown */}
        <div className="grid md:grid-cols-2 gap-6">
          <BadgesSection badges={badges} />
          {difficultyStats && (
            <DifficultyBreakdown
              easy={difficultyStats.easy}
              medium={difficultyStats.medium}
              hard={difficultyStats.hard}
            />
          )}
        </div>

        {/* Recent Activity */}
        <RecentActivity recentProblems={recentProblems} />

        {/* Payment History - Only show on own profile */}
        {isOwnProfile && <PaymentHistory />}

        {/* Refunds Section - Only show on own profile */}
        {isOwnProfile && <RefundSection />}
      </div>
    </AppLayout>
  );
}