import { useState } from "react";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { 
  Trophy, Shield, Medal, Crown, Star, 
  Share2, Linkedin, Twitter, ChevronUp, ChevronDown
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

interface LeagueConfig {
  name: string;
  icon: typeof Trophy;
  color: string;
  bgGradient: string;
  minXp: number;
  maxXp: number;
}

const leagues: LeagueConfig[] = [
  { 
    name: "Iron", 
    icon: Shield, 
    color: "text-gray-400",
    bgGradient: "from-gray-500/20 to-gray-600/10",
    minXp: 0, 
    maxXp: 499 
  },
  { 
    name: "Bronze", 
    icon: Medal, 
    color: "text-amber-600",
    bgGradient: "from-amber-600/20 to-amber-700/10",
    minXp: 500, 
    maxXp: 1499 
  },
  { 
    name: "Silver", 
    icon: Star, 
    color: "text-slate-400",
    bgGradient: "from-slate-400/20 to-slate-500/10",
    minXp: 1500, 
    maxXp: 3499 
  },
  { 
    name: "Gold", 
    icon: Trophy, 
    color: "text-yellow-500",
    bgGradient: "from-yellow-500/20 to-yellow-600/10",
    minXp: 3500, 
    maxXp: 6999 
  },
  { 
    name: "Platinum", 
    icon: Crown, 
    color: "text-cyan-400",
    bgGradient: "from-cyan-400/20 to-cyan-500/10",
    minXp: 7000, 
    maxXp: Infinity 
  },
];

const getLeague = (xp: number): LeagueConfig => {
  return leagues.find(l => xp >= l.minXp && xp <= l.maxXp) || leagues[0];
};

const getLeagueProgress = (xp: number, league: LeagueConfig): number => {
  if (league.maxXp === Infinity) return 100;
  const range = league.maxXp - league.minXp;
  const progress = xp - league.minXp;
  return Math.min(100, Math.round((progress / range) * 100));
};

export function LeaderboardTab() {
  const { user } = useAuth();
  const [shareModalOpen, setShareModalOpen] = useState(false);

  // Fetch current user's profile
  const { data: currentProfile } = useQuery({
    queryKey: ["current-profile", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data } = await supabase
        .from("profiles")
        .select("id, username, avatar_url, total_xp, current_streak, current_level")
        .eq("id", user.id)
        .single();
      return data;
    },
    enabled: !!user?.id,
  });

  // Fetch leaderboard (nearby users) - use public view for other users' data
  const { data: leaderboard = [] } = useQuery({
    queryKey: ["leaderboard", currentProfile?.total_xp],
    queryFn: async () => {
      if (!currentProfile) return [];
      
      const userXp = currentProfile.total_xp || 0;
      const userLeague = getLeague(userXp);
      
      // Get users in the same league - use profiles_public view for security
      const { data } = await supabase
        .from("profiles_public")
        .select("id, username, avatar_url, total_xp, current_streak, current_level")
        .gte("total_xp", userLeague.minXp)
        .lte("total_xp", userLeague.maxXp === Infinity ? 999999999 : userLeague.maxXp)
        .order("total_xp", { ascending: false })
        .limit(20);

      return data || [];
    },
    enabled: !!currentProfile,
  });

  const currentUserXp = currentProfile?.total_xp || 0;
  const currentLeague = getLeague(currentUserXp);
  const leagueProgress = getLeagueProgress(currentUserXp, currentLeague);
  const LeagueIcon = currentLeague.icon;

  // Find current user's position
  const userPosition = leaderboard.findIndex(p => p.id === user?.id) + 1;
  
  // Get nearby users (5 above and 5 below)
  const userIndex = leaderboard.findIndex(p => p.id === user?.id);
  const startIndex = Math.max(0, userIndex - 5);
  const endIndex = Math.min(leaderboard.length, userIndex + 6);
  const nearbyUsers = leaderboard.slice(startIndex, endIndex);

  const handleShare = async (platform: "linkedin" | "twitter" | "copy") => {
    const shareText = `Currently in ${currentLeague.name} League on NexAlgoTrix — focusing on consistency and structured DSA learning.\n\n${currentUserXp.toLocaleString()} XP earned through pattern-based practice.\n\n#DSA #CodingInterview #NexAlgoTrix`;
    
    switch (platform) {
      case "linkedin":
        window.open(
          `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent("https://nexalgotrix.lovable.app")}&summary=${encodeURIComponent(shareText)}`,
          "_blank"
        );
        break;
      case "twitter":
        window.open(
          `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`,
          "_blank"
        );
        break;
      case "copy":
        await navigator.clipboard.writeText(shareText);
        toast.success("Share text copied to clipboard!");
        break;
    }
    setShareModalOpen(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      {/* Current League Card */}
      <Card className={`bg-gradient-to-br ${currentLeague.bgGradient} border-2`}>
        <CardContent className="pt-6">
          <div className="flex items-center gap-6">
            <div className={`w-20 h-20 rounded-2xl bg-background/50 flex items-center justify-center ${currentLeague.color}`}>
              <LeagueIcon className="w-10 h-10" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h2 className={`text-2xl font-bold ${currentLeague.color}`}>
                  {currentLeague.name} League
                </h2>
                <Badge variant="outline" className="text-xs">
                  #{userPosition || "—"}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground mb-3">
                {currentUserXp.toLocaleString()} XP
                {currentLeague.maxXp !== Infinity && (
                  <span> • {(currentLeague.maxXp - currentUserXp + 1).toLocaleString()} XP to next league</span>
                )}
              </p>
              <div className="h-2 bg-background/50 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${leagueProgress}%` }}
                  transition={{ duration: 1, delay: 0.3 }}
                  className={`h-full rounded-full bg-gradient-to-r from-primary to-primary/80`}
                />
              </div>
            </div>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setShareModalOpen(true)}
              className="hidden sm:flex"
            >
              <Share2 className="w-4 h-4 mr-2" />
              Share
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* League Tiers Overview */}
      <div className="grid grid-cols-5 gap-2">
        {leagues.map((league, index) => {
          const isCurrentLeague = league.name === currentLeague.name;
          const isPastLeague = currentUserXp > league.maxXp;
          const LeagueIconComponent = league.icon;
          
          return (
            <motion.div
              key={league.name}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`
                p-3 rounded-xl text-center transition-all
                ${isCurrentLeague 
                  ? `bg-gradient-to-br ${league.bgGradient} ring-2 ring-primary` 
                  : isPastLeague 
                    ? "bg-muted/50 opacity-60" 
                    : "bg-muted/30 opacity-40"
                }
              `}
            >
              <LeagueIconComponent className={`w-6 h-6 mx-auto mb-1 ${league.color}`} />
              <p className={`text-xs font-medium ${isCurrentLeague ? "text-foreground" : "text-muted-foreground"}`}>
                {league.name}
              </p>
            </motion.div>
          );
        })}
      </div>

      {/* Nearby Rankings */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Trophy className="w-5 h-5 text-yellow-500" />
            Your Rankings
          </CardTitle>
          <CardDescription>
            Users near your position in {currentLeague.name} League
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {nearbyUsers.map((profile, index) => {
              const actualPosition = startIndex + index + 1;
              const isCurrentUser = profile.id === user?.id;
              const userLeague = getLeague(profile.total_xp || 0);
              const UserLeagueIcon = userLeague.icon;

              return (
                <motion.div
                  key={profile.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={`
                    flex items-center gap-4 p-3 rounded-lg transition-all
                    ${isCurrentUser 
                      ? "bg-primary/10 ring-1 ring-primary/30" 
                      : "hover:bg-muted/50"
                    }
                  `}
                >
                  <div className={`
                    w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold
                    ${actualPosition <= 3 
                      ? "bg-gradient-to-br from-yellow-500 to-amber-600 text-white" 
                      : "bg-muted text-muted-foreground"
                    }
                  `}>
                    {actualPosition}
                  </div>

                  <Avatar className="w-10 h-10">
                    <AvatarImage src={profile.avatar_url || undefined} />
                    <AvatarFallback className="bg-primary/10 text-primary">
                      {profile.username?.[0]?.toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className={`font-medium truncate ${isCurrentUser ? "text-primary" : ""}`}>
                        {profile.username || "Anonymous"}
                        {isCurrentUser && <span className="text-xs ml-1">(You)</span>}
                      </p>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Level {profile.current_level || 1} • {profile.current_streak || 0} day streak
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <UserLeagueIcon className={`w-4 h-4 ${userLeague.color}`} />
                    <div className="text-right">
                      <p className="font-semibold">{(profile.total_xp || 0).toLocaleString()}</p>
                      <p className="text-xs text-muted-foreground">XP</p>
                    </div>
                  </div>
                </motion.div>
              );
            })}

            {nearbyUsers.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <Trophy className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p className="text-sm">Start solving problems to appear on the leaderboard!</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Philosophy Note */}
      <Card className="bg-muted/20 border-dashed">
        <CardContent className="pt-6 text-center">
          <p className="text-sm text-muted-foreground italic">
            "Motivation without humiliation" — Rankings are league-based, not global. 
            Focus on your growth, not others' positions.
          </p>
        </CardContent>
      </Card>

      {/* Share Modal */}
      <Dialog open={shareModalOpen} onOpenChange={setShareModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center">Share Your League</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* League Preview Card */}
            <div className={`bg-gradient-to-br ${currentLeague.bgGradient} rounded-2xl p-6 text-center border`}>
              <div className={`w-16 h-16 mx-auto rounded-full bg-background/50 flex items-center justify-center mb-4 ${currentLeague.color}`}>
                <LeagueIcon className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold mb-1">{currentLeague.name} League</h3>
              <p className="text-sm text-muted-foreground mb-3">
                {currentUserXp.toLocaleString()} XP earned
              </p>
              <div className="flex items-center justify-center gap-2">
                <Avatar className="w-6 h-6">
                  <AvatarImage src={currentProfile?.avatar_url || undefined} />
                  <AvatarFallback className="text-xs">
                    {currentProfile?.username?.[0]?.toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm">{currentProfile?.username || "User"}</span>
              </div>
            </div>

            {/* Share Buttons */}
            <div className="grid grid-cols-3 gap-3">
              <Button
                variant="outline"
                onClick={() => handleShare("linkedin")}
                className="flex flex-col items-center gap-1 h-auto py-3"
              >
                <Linkedin className="w-5 h-5 text-[#0A66C2]" />
                <span className="text-xs">LinkedIn</span>
              </Button>
              <Button
                variant="outline"
                onClick={() => handleShare("twitter")}
                className="flex flex-col items-center gap-1 h-auto py-3"
              >
                <Twitter className="w-5 h-5" />
                <span className="text-xs">X</span>
              </Button>
              <Button
                variant="outline"
                onClick={() => handleShare("copy")}
                className="flex flex-col items-center gap-1 h-auto py-3"
              >
                <Share2 className="w-5 h-5" />
                <span className="text-xs">Copy</span>
              </Button>
            </div>

            <p className="text-xs text-center text-muted-foreground">
              Professional & LinkedIn-safe • No rank shaming
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}