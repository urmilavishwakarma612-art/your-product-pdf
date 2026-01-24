import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Search, Zap, Flame, Trophy, Crown, LogOut, Settings, User } from "lucide-react";
import logo from "@/assets/logo.png";

interface HomeHeaderProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

export function HomeHeader({ searchQuery, onSearchChange }: HomeHeaderProps) {
  const { user, signOut } = useAuth();

  const { data: profile } = useQuery({
    queryKey: ["header-profile", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data } = await supabase
        .from("profiles")
        .select("username, avatar_url, total_xp, current_streak, subscription_status")
        .eq("id", user.id)
        .single();
      return data;
    },
    enabled: !!user?.id,
  });

  // Get user's league rank
  const { data: leaderboardRank } = useQuery({
    queryKey: ["header-rank", user?.id, profile?.total_xp],
    queryFn: async () => {
      if (!user?.id || !profile) return null;
      const userXp = profile.total_xp || 0;
      
      // Get count of users with more XP
      const { count } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true })
        .gt("total_xp", userXp);
      
      return (count || 0) + 1;
    },
    enabled: !!user?.id && !!profile,
  });

  const isPro = profile?.subscription_status !== "free";
  const initials = profile?.username?.slice(0, 2).toUpperCase() || "U";

  return (
    <header className="fixed top-0 left-0 right-0 h-16 bg-background/95 backdrop-blur-sm border-b border-border z-50">
      <div className="h-full px-4 flex items-center justify-between gap-4">
        {/* Left: Logo + Brand */}
        <Link to="/" className="flex items-center gap-2 flex-shrink-0">
          <img src={logo} alt="NexAlgoTrix" className="w-8 h-8" />
          <span className="font-bold text-lg hidden sm:inline">
            NexAlgo<span className="text-primary">Trix</span>
          </span>
        </Link>

        {/* Center: Search */}
        <div className="flex-1 max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search patterns, questions..."
              className="pl-10 bg-muted/50 border-muted"
            />
          </div>
        </div>

        {/* Right: Stats + Profile */}
        <div className="flex items-center gap-3">
          {/* XP */}
          <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 rounded-lg">
            <Zap className="w-4 h-4 text-primary" />
            <span className="text-sm font-semibold text-primary">
              {(profile?.total_xp || 0).toLocaleString()}
            </span>
          </div>

          {/* Streak */}
          <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 bg-warning/10 rounded-lg">
            <Flame className="w-4 h-4 text-warning" />
            <span className="text-sm font-semibold text-warning">
              {profile?.current_streak || 0}
            </span>
          </div>

          {/* Rank */}
          <div className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 bg-secondary/10 rounded-lg">
            <Trophy className="w-4 h-4 text-secondary" />
            <span className="text-sm font-semibold text-secondary">
              #{leaderboardRank || "—"}
            </span>
          </div>

          <ThemeToggle />

          {/* Profile Dropdown */}
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 rounded-full p-0">
                  <Avatar className="h-10 w-10 border-2 border-primary/20">
                    <AvatarImage src={profile?.avatar_url || undefined} />
                    <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  {isPro && (
                    <Crown className="absolute -top-1 -right-1 w-4 h-4 text-secondary fill-secondary" />
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="px-2 py-1.5">
                  <p className="text-sm font-medium">{profile?.username || "User"}</p>
                  <p className="text-xs text-muted-foreground">{user.email}</p>
                  {isPro && (
                    <Badge className="mt-1 bg-gradient-to-r from-secondary to-primary text-secondary-foreground border-0 text-xs">
                      PRO
                    </Badge>
                  )}
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to={`/profile/${profile?.username}`} className="flex items-center gap-2">
                    <User className="w-4 h-4" />
                    View Profile
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/profile-settings" className="flex items-center gap-2">
                    <Settings className="w-4 h-4" />
                    Settings
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={signOut} className="text-destructive">
                  <LogOut className="w-4 h-4 mr-2" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button asChild size="sm">
              <Link to="/auth">Sign In</Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
