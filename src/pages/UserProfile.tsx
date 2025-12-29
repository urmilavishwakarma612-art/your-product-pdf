import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ProfileHeader } from "@/components/profile/ProfileHeader";
import { StatsGrid } from "@/components/profile/StatsGrid";
import { ActivityGraph } from "@/components/profile/ActivityGraph";
import { BadgesSection } from "@/components/profile/BadgesSection";
import { RecentActivity } from "@/components/profile/RecentActivity";
import { DifficultyBreakdown } from "@/components/profile/DifficultyBreakdown";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2 } from "lucide-react";
import { format } from "date-fns";

export default function UserProfile() {
  const { username } = useParams<{ username: string }>();
  const navigate = useNavigate();

  // Fetch profile by username
  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ["profile", username],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("username", username)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!username,
  });

  // Fetch user badges
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

  // Fetch activity data for graph
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

      // Group by date
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

  // Fetch recent solved problems
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

  // Fetch difficulty breakdown
  const { data: difficultyStats } = useQuery({
    queryKey: ["difficulty-stats", profile?.id],
    queryFn: async () => {
      // Get all questions with their difficulty
      const { data: questions, error: qError } = await supabase
        .from("questions")
        .select("id, difficulty");
      if (qError) throw qError;

      // Get user's solved questions
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

  // Calculate solved count
  const solvedCount = activityData.reduce((sum, d) => sum + d.count, 0);

  if (profileLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <h1 className="text-2xl font-bold">User not found</h1>
        <p className="text-muted-foreground">
          The user "{username}" doesn't exist.
        </p>
        <Button onClick={() => navigate("/")} variant="outline">
          Go Home
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-5xl mx-auto px-4 py-8">
        {/* Back button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(-1)}
          className="mb-6 gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>

        <div className="space-y-6">
          {/* Profile Header */}
          <ProfileHeader
            username={profile.username || "Anonymous"}
            avatarUrl={profile.avatar_url}
            level={profile.current_level}
            createdAt={profile.created_at}
            subscriptionStatus={profile.subscription_status}
            bio={profile.bio}
            githubUrl={profile.github_url}
            linkedinUrl={profile.linkedin_url}
            leetcodeUrl={profile.leetcode_url}
            instagramUrl={profile.instagram_url}
            twitterUrl={profile.twitter_url}
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
        </div>
      </div>
    </div>
  );
}
