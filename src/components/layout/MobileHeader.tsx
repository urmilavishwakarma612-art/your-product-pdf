import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ThemeToggle } from "@/components/ThemeToggle";
import { 
  Zap, Flame, Trophy, Crown, LogOut, Settings, User, 
  Home, BookOpen, Bot, Video, Briefcase, Gift, BarChart3, Calendar, CreditCard
} from "lucide-react";
import logo from "@/assets/logo.png";
import { motion, AnimatePresence } from "framer-motion";
import { MonthlyTrackerCompact } from "@/components/home/MonthlyTrackerCompact";
import { BadgesCompact } from "@/components/home/BadgesCompact";
import { LeaderboardCompact } from "@/components/home/LeaderboardCompact";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface MobileHeaderProps {
  showSearch?: boolean;
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
}

const primaryNav = [
  { href: "/", label: "Home", icon: Home },
  { href: "/curriculum", label: "Curriculum", icon: BookOpen },
  { href: "/tutor", label: "NexMentor", icon: Bot },
  { href: "/interview", label: "Interview", icon: Video },
];

const secondaryNav = [
  { href: "/jobs", label: "Jobs", icon: Briefcase },
  { href: "/gamification", label: "Rewards", icon: Trophy },
  { href: "/events", label: "Events", icon: Calendar },
  { href: "/referral", label: "Referrals", icon: Gift },
  { href: "/payments", label: "Payments", icon: CreditCard },
  { href: "/dashboard?tab=analytics", label: "Analytics", icon: BarChart3 },
  { href: "/profile-settings", label: "Settings", icon: Settings },
];

export function MobileHeader({ showSearch, searchQuery, onSearchChange }: MobileHeaderProps) {
  const { user, signOut } = useAuth();
  const [statIndex, setStatIndex] = useState(0);
  const [rightPanelOpen, setRightPanelOpen] = useState(false);

  const { data: profile } = useQuery({
    queryKey: ["mobile-header-profile", user?.id],
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

  const { data: leaderboardRank } = useQuery({
    queryKey: ["mobile-header-rank", user?.id, profile?.total_xp],
    queryFn: async () => {
      if (!user?.id || !profile) return null;
      const { count } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true })
        .gt("total_xp", profile.total_xp || 0);
      return (count || 0) + 1;
    },
    enabled: !!user?.id && !!profile,
  });

  // Rotate stats every 2 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setStatIndex((prev) => (prev + 1) % 3);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const isPro = profile?.subscription_status !== "free";
  const initials = profile?.username?.slice(0, 2).toUpperCase() || "U";

  const stats = [
    { icon: Zap, value: profile?.total_xp || 0, label: "XP", color: "text-primary" },
    { icon: Flame, value: profile?.current_streak || 0, label: "Streak", color: "text-warning" },
    { icon: Trophy, value: `#${leaderboardRank || "—"}`, label: "Rank", color: "text-secondary" },
  ];

  const currentStat = stats[statIndex];

  return (
    <header className="fixed top-0 left-0 right-0 h-14 bg-background/95 backdrop-blur-sm border-b border-border z-50">
      <div className="h-full px-3 flex items-center justify-between gap-2">
        {/* Left: Logo */}
        <Link to="/" className="flex items-center gap-2">
          <img src={logo} alt="NexAlgoTrix" className="w-7 h-7" />
          <span className="font-bold text-base">
            NexAlgo<span className="text-primary">Trix</span>
          </span>
        </Link>

        {/* Right: Rotating Stats + Profile */}
        <div className="flex items-center gap-2">
          {/* Rotating Stats - Clickable to open right panel */}
          {user && (
            <Sheet open={rightPanelOpen} onOpenChange={setRightPanelOpen}>
              <SheetTrigger asChild>
                <button className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={statIndex}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.2 }}
                      className="flex items-center gap-1.5"
                    >
                      <currentStat.icon className={`w-4 h-4 ${currentStat.color}`} />
                      <span className={`text-sm font-semibold ${currentStat.color}`}>
                        {typeof currentStat.value === "number" && currentStat.value >= 1000
                          ? `${(currentStat.value / 1000).toFixed(1)}k`
                          : currentStat.value}
                      </span>
                    </motion.div>
                  </AnimatePresence>
                </button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[300px] p-0">
                <div className="p-4 border-b border-border">
                  <h2 className="font-semibold text-lg">Your Stats</h2>
                </div>
                <ScrollArea className="h-[calc(100vh-60px)]">
                  <div className="p-4">
                    <Tabs defaultValue="tracker" className="w-full">
                      <TabsList className="w-full grid grid-cols-3 mb-4">
                        <TabsTrigger value="tracker" className="text-xs">Tracker</TabsTrigger>
                        <TabsTrigger value="badges" className="text-xs">Badges</TabsTrigger>
                        <TabsTrigger value="leaderboard" className="text-xs">Rank</TabsTrigger>
                      </TabsList>
                      <TabsContent value="tracker">
                        <MonthlyTrackerCompact />
                      </TabsContent>
                      <TabsContent value="badges">
                        <BadgesCompact />
                      </TabsContent>
                      <TabsContent value="leaderboard">
                        <LeaderboardCompact />
                      </TabsContent>
                    </Tabs>
                  </div>
                </ScrollArea>
              </SheetContent>
            </Sheet>
          )}

          <ThemeToggle />

          {/* Profile Menu */}
          {user ? (
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" className="relative h-9 w-9 rounded-full p-0">
                  <Avatar className="h-9 w-9 border-2 border-primary/20">
                    <AvatarImage src={profile?.avatar_url || undefined} />
                    <AvatarFallback className="bg-primary/10 text-primary font-semibold text-xs">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  {isPro && (
                    <Crown className="absolute -top-1 -right-1 w-4 h-4 text-secondary fill-secondary" />
                  )}
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[280px] p-0">
                {/* Profile Header */}
                <div className="p-4 border-b border-border bg-muted/30">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-12 w-12 ring-2 ring-primary/30">
                      <AvatarImage src={profile?.avatar_url || undefined} />
                      <AvatarFallback className="bg-primary/10 text-primary font-bold">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold truncate">{profile?.username || "User"}</p>
                        {isPro && <Crown className="w-4 h-4 text-secondary flex-shrink-0" />}
                      </div>
                      <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                    </div>
                  </div>
                </div>

                <ScrollArea className="h-[calc(100vh-120px)]">
                  <div className="p-2">
                    {/* Primary Navigation */}
                    <div className="mb-2">
                      <p className="text-xs font-medium text-muted-foreground px-3 py-2">Navigation</p>
                      {primaryNav.map((item) => (
                        <Link
                          key={item.href}
                          to={item.href}
                          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium hover:bg-muted transition-colors"
                        >
                          <item.icon className="w-4 h-4 text-muted-foreground" />
                          {item.label}
                        </Link>
                      ))}
                    </div>

                    <div className="border-t border-border my-2" />

                    {/* Secondary Navigation */}
                    <div className="mb-2">
                      <p className="text-xs font-medium text-muted-foreground px-3 py-2">More</p>
                      {secondaryNav.map((item) => (
                        <Link
                          key={item.href}
                          to={item.href}
                          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium hover:bg-muted transition-colors"
                        >
                          <item.icon className="w-4 h-4 text-muted-foreground" />
                          {item.label}
                        </Link>
                      ))}
                    </div>

                    <div className="border-t border-border my-2" />

                    {/* Profile Actions */}
                    <div>
                      <Link
                        to={`/profile/${profile?.username}`}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium hover:bg-muted transition-colors"
                      >
                        <User className="w-4 h-4 text-muted-foreground" />
                        View Profile
                      </Link>
                      <button
                        onClick={signOut}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors"
                      >
                        <LogOut className="w-4 h-4" />
                        Sign Out
                      </button>
                    </div>
                  </div>
                </ScrollArea>
              </SheetContent>
            </Sheet>
          ) : (
            <Button asChild size="sm" className="h-8 text-xs">
              <Link to="/auth">Sign In</Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
