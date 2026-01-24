import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Trophy, TrendingUp, Crown, Medal } from "lucide-react";
import { motion } from "framer-motion";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface LeagueConfig {
  name: string;
  minXP: number;
  maxXP: number;
  color: string;
  bgColor: string;
}

const leagues: LeagueConfig[] = [
  { name: "Iron", minXP: 0, maxXP: 499, color: "text-muted-foreground", bgColor: "bg-muted/20" },
  { name: "Bronze", minXP: 500, maxXP: 1499, color: "text-warning", bgColor: "bg-warning/10" },
  { name: "Silver", minXP: 1500, maxXP: 3499, color: "text-muted-foreground", bgColor: "bg-muted/30" },
  { name: "Gold", minXP: 3500, maxXP: 6999, color: "text-warning", bgColor: "bg-warning/20" },
  { name: "Platinum", minXP: 7000, maxXP: Infinity, color: "text-primary", bgColor: "bg-primary/10" },
];

const getLeague = (xp: number): LeagueConfig => {
  return leagues.find(l => xp >= l.minXP && xp <= l.maxXP) || leagues[0];
};

const getLeagueProgress = (xp: number, league: LeagueConfig): number => {
  if (league.maxXP === Infinity) return 100;
  const range = league.maxXP - league.minXP;
  const progress = xp - league.minXP;
  return Math.min(100, Math.max(0, (progress / range) * 100));
};

interface LeaderboardUser {
  id: string;
  username: string | null;
  avatar_url: string | null;
  total_xp: number | null;
  current_level: number | null;
}

export function LeaderboardCompact() {
  const { user } = useAuth();

  const { data: currentUserProfile } = useQuery({
    queryKey: ["compact-current-user-profile", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data } = await supabase
        .from("profiles")
        .select("total_xp, current_level, username, avatar_url")
        .eq("id", user.id)
        .single();
      return data;
    },
    enabled: !!user?.id,
  });

  const currentXP = currentUserProfile?.total_xp || 0;
  const currentLeague = getLeague(currentXP);
  const leagueProgress = getLeagueProgress(currentXP, currentLeague);

  const { data: leaderboard = [] } = useQuery<LeaderboardUser[]>({
    queryKey: ["compact-leaderboard", currentLeague.name],
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("id, username, avatar_url, total_xp, current_level")
        .gte("total_xp", currentLeague.minXP)
        .lte("total_xp", currentLeague.maxXP === Infinity ? 999999999 : currentLeague.maxXP)
        .order("total_xp", { ascending: false })
        .limit(10);
      return (data as LeaderboardUser[]) || [];
    },
    enabled: !!currentLeague,
  });

  const userRank = leaderboard.findIndex(u => u.id === user?.id) + 1;
  const topThree = leaderboard.slice(0, 3);

  return (
    <div className="space-y-3">
      {/* Current League Card */}
      <div className={`p-3 rounded-lg ${currentLeague.bgColor} border border-border/30`}>
        <div className="flex items-center gap-2 mb-2">
          <Crown className={`w-4 h-4 ${currentLeague.color}`} />
          <span className={`text-sm font-bold ${currentLeague.color}`}>
            {currentLeague.name} League
          </span>
        </div>
        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">{currentXP} XP</span>
            {currentLeague.maxXP !== Infinity && (
              <span className="text-muted-foreground">{currentLeague.maxXP} XP</span>
            )}
          </div>
          <Progress value={leagueProgress} className="h-1.5" />
        </div>
        {userRank > 0 && (
          <div className="mt-2 flex items-center gap-1 text-xs">
            <TrendingUp className="w-3 h-3 text-primary" />
            <span className="text-muted-foreground">Rank #{userRank} in league</span>
          </div>
        )}
      </div>

      {/* Top 3 in League */}
      <div className="space-y-2">
        <p className="text-[10px] text-muted-foreground font-medium">Top in Your League</p>
        <div className="space-y-1.5">
          {topThree.map((profile, index) => {
            const isCurrentUser = profile.id === user?.id;
            return (
              <motion.div
                key={profile.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`flex items-center gap-2 p-2 rounded-lg transition-colors ${
                  isCurrentUser ? "bg-primary/10 border border-primary/20" : "bg-muted/30"
                }`}
              >
                {/* Rank */}
                <div className="w-5 h-5 flex items-center justify-center">
                  {index === 0 ? (
                    <Trophy className="w-4 h-4 text-warning" />
                  ) : index === 1 ? (
                    <Medal className="w-4 h-4 text-muted-foreground" />
                  ) : (
                    <Medal className="w-4 h-4 text-warning/70" />
                  )}
                </div>

                {/* Avatar */}
                <Avatar className="w-6 h-6">
                  <AvatarImage src={profile.avatar_url || undefined} />
                  <AvatarFallback className="text-[10px]">
                    {(profile.username || "U")[0].toUpperCase()}
                  </AvatarFallback>
                </Avatar>

                {/* Name & XP */}
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-medium truncate">
                    {isCurrentUser ? "You" : profile.username || "User"}
                  </p>
                </div>

                <span className="text-[10px] font-medium text-muted-foreground">
                  {profile.total_xp || 0} XP
                </span>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* League tiers visualization */}
      <div className="flex items-center justify-between gap-1 pt-1">
        {leagues.map((league) => (
          <div
            key={league.name}
            className={`flex-1 h-1.5 rounded-full ${
              league.name === currentLeague.name
                ? "bg-primary/50"
                : "bg-muted/30"
            }`}
            title={league.name}
          />
        ))}
      </div>
      <div className="flex items-center justify-between text-[8px] text-muted-foreground">
        <span>Iron</span>
        <span>Bronze</span>
        <span>Silver</span>
        <span>Gold</span>
        <span>Platinum</span>
      </div>
    </div>
  );
}
