import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { 
  Flame, Target, Award, Star, Zap, Trophy, Lock, 
  Share2, Download, Linkedin, Twitter, Check
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { format } from "date-fns";
import { toast } from "sonner";

interface BadgeData {
  id: string;
  name: string;
  description: string;
  icon: string;
  type: string;
  earned?: boolean;
  earnedAt?: string;
}

const badgeCategories = [
  { 
    id: "streak", 
    label: "Streak Badges", 
    icon: Flame,
    color: "from-orange-500 to-amber-500",
    description: "Awarded for consistent daily practice"
  },
  { 
    id: "problem_solving", 
    label: "Problem Solving", 
    icon: Target,
    color: "from-green-500 to-emerald-500",
    description: "Awarded for solving problems"
  },
  { 
    id: "pattern", 
    label: "Pattern Mastery", 
    icon: Award,
    color: "from-purple-500 to-violet-500",
    description: "Awarded for mastering DSA patterns"
  },
  { 
    id: "xp", 
    label: "XP Milestones", 
    icon: Star,
    color: "from-yellow-500 to-amber-500",
    description: "Awarded for earning XP"
  },
];

const iconMap: Record<string, any> = {
  flame: Flame,
  target: Target,
  award: Award,
  star: Star,
  zap: Zap,
  trophy: Trophy,
};

export function BadgesTab() {
  const { user } = useAuth();
  const [selectedBadge, setSelectedBadge] = useState<BadgeData | null>(null);
  const [shareModalOpen, setShareModalOpen] = useState(false);

  // Fetch all badges
  const { data: allBadges = [] } = useQuery({
    queryKey: ["all-badges"],
    queryFn: async () => {
      const { data } = await supabase
        .from("badges")
        .select("*")
        .order("created_at");
      return data || [];
    },
  });

  // Fetch user's earned badges
  const { data: earnedBadges = [] } = useQuery({
    queryKey: ["user-badges", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data } = await supabase
        .from("user_badges")
        .select(`
          badge_id,
          earned_at,
          badges (*)
        `)
        .eq("user_id", user.id);
      return data || [];
    },
    enabled: !!user?.id,
  });

  // Fetch user profile for stats
  const { data: profile } = useQuery({
    queryKey: ["profile-stats", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data } = await supabase
        .from("profiles")
        .select("username, avatar_url, total_xp, current_streak")
        .eq("id", user.id)
        .single();
      return data;
    },
    enabled: !!user?.id,
  });

  // Combine all badges with earned status
  const badgesWithStatus: BadgeData[] = allBadges.map((badge) => {
    const earned = earnedBadges.find((e: any) => e.badge_id === badge.id);
    return {
      ...badge,
      earned: !!earned,
      earnedAt: earned?.earned_at,
    };
  });

  // Group badges by type
  const badgesByType = badgeCategories.map((category) => ({
    ...category,
    badges: badgesWithStatus.filter((b) => b.type === category.id),
  }));

  const earnedCount = badgesWithStatus.filter((b) => b.earned).length;
  const totalCount = badgesWithStatus.length;

  const handleShareBadge = async (platform: "linkedin" | "twitter" | "download" | "copy") => {
    if (!selectedBadge || !profile) return;

    const shareText = `🏆 Just earned the "${selectedBadge.name}" badge on NexAlgoTrix!\n\n${selectedBadge.description}\n\n#DSA #CodingInterview #NexAlgoTrix`;
    
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
      case "download":
        toast.info("Badge image download coming soon!");
        break;
    }
    setShareModalOpen(false);
  };

  const handleBadgeClick = (badge: BadgeData) => {
    if (badge.earned) {
      setSelectedBadge(badge);
      setShareModalOpen(true);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      {/* Progress Overview */}
      <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Badge Progress</h3>
              <p className="text-sm text-muted-foreground">
                {earnedCount} of {totalCount} badges earned
              </p>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-primary">
                {totalCount > 0 ? Math.round((earnedCount / totalCount) * 100) : 0}%
              </div>
              <p className="text-xs text-muted-foreground">Complete</p>
            </div>
          </div>
          <div className="mt-4 h-2 bg-muted rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${totalCount > 0 ? (earnedCount / totalCount) * 100 : 0}%` }}
              transition={{ duration: 1, delay: 0.3 }}
              className="h-full bg-gradient-to-r from-primary to-primary/80 rounded-full"
            />
          </div>
        </CardContent>
      </Card>

      {/* Badge Categories */}
      <Tabs defaultValue="streak" className="space-y-6">
        <TabsList className="grid grid-cols-2 md:grid-cols-4 h-auto gap-2 bg-transparent p-0">
          {badgeCategories.map((category) => (
            <TabsTrigger
              key={category.id}
              value={category.id}
              className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary border border-border data-[state=active]:border-primary/30 py-3"
            >
              <category.icon className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">{category.label}</span>
              <span className="sm:hidden">{category.label.split(" ")[0]}</span>
            </TabsTrigger>
          ))}
        </TabsList>

        {badgesByType.map((category) => (
          <TabsContent key={category.id} value={category.id} className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <div className={`p-2 rounded-lg bg-gradient-to-br ${category.color} text-white`}>
                <category.icon className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold">{category.label}</h3>
                <p className="text-xs text-muted-foreground">{category.description}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              <TooltipProvider>
                {category.badges.map((badge, index) => {
                  const IconComponent = iconMap[badge.icon || "trophy"] || Trophy;
                  
                  return (
                    <Tooltip key={badge.id}>
                      <TooltipTrigger asChild>
                        <motion.div
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: index * 0.05 }}
                          onClick={() => handleBadgeClick(badge)}
                          className={`
                            relative p-4 rounded-xl border text-center cursor-pointer
                            transition-all duration-300 group
                            ${badge.earned 
                              ? `bg-gradient-to-br ${category.color} border-transparent shadow-lg hover:shadow-xl hover:scale-105` 
                              : "bg-muted/30 border-dashed border-muted-foreground/30 opacity-50"
                            }
                          `}
                        >
                          {!badge.earned && (
                            <Lock className="absolute top-2 right-2 w-3 h-3 text-muted-foreground" />
                          )}
                          <div className={`
                            w-12 h-12 mx-auto rounded-full flex items-center justify-center mb-2
                            ${badge.earned 
                              ? "bg-white/20 shadow-inner" 
                              : "bg-muted"
                            }
                          `}>
                            <IconComponent className={`w-6 h-6 ${badge.earned ? "text-white" : "text-muted-foreground"}`} />
                          </div>
                          <p className={`text-xs font-medium truncate ${badge.earned ? "text-white" : "text-muted-foreground"}`}>
                            {badge.name}
                          </p>
                          {badge.earned && (
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center"
                            >
                              <Check className="w-3 h-3 text-white" />
                            </motion.div>
                          )}
                        </motion.div>
                      </TooltipTrigger>
                      <TooltipContent side="top" className="max-w-[200px]">
                        <p className="font-medium">{badge.name}</p>
                        <p className="text-xs text-muted-foreground">{badge.description}</p>
                        {badge.earned && badge.earnedAt && (
                          <p className="text-xs text-primary mt-1">
                            Earned on {format(new Date(badge.earnedAt), "MMM d, yyyy")}
                          </p>
                        )}
                      </TooltipContent>
                    </Tooltip>
                  );
                })}
              </TooltipProvider>

              {category.badges.length === 0 && (
                <div className="col-span-full text-center py-8 text-muted-foreground">
                  <Trophy className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">No badges in this category yet</p>
                </div>
              )}
            </div>
          </TabsContent>
        ))}
      </Tabs>

      {/* Badge Share Modal */}
      <Dialog open={shareModalOpen} onOpenChange={setShareModalOpen}>
        <DialogContent className="sm:max-w-md bg-gradient-to-br from-background via-background to-primary/5">
          <DialogHeader>
            <DialogTitle className="text-center">Share Your Achievement</DialogTitle>
          </DialogHeader>
          
          {selectedBadge && (
            <div className="space-y-6">
              {/* Badge Preview Card */}
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="bg-gradient-to-br from-primary/20 to-purple-500/20 rounded-2xl p-6 text-center border border-primary/30"
              >
                <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-primary to-purple-500 flex items-center justify-center mb-4 shadow-lg">
                  {(() => {
                    const IconComponent = iconMap[selectedBadge.icon || "trophy"] || Trophy;
                    return <IconComponent className="w-10 h-10 text-white" />;
                  })()}
                </div>
                <h3 className="text-xl font-bold mb-1">{selectedBadge.name}</h3>
                <p className="text-sm text-muted-foreground mb-3">{selectedBadge.description}</p>
                <div className="flex items-center justify-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                    <span className="text-xs font-bold">
                      {profile?.username?.[0]?.toUpperCase() || "U"}
                    </span>
                  </div>
                  <span className="text-sm font-medium">{profile?.username || "User"}</span>
                </div>
                {selectedBadge.earnedAt && (
                  <p className="text-xs text-muted-foreground mt-2">
                    Earned on {format(new Date(selectedBadge.earnedAt), "MMMM d, yyyy")}
                  </p>
                )}
              </motion.div>

              {/* Share Buttons */}
              <div className="grid grid-cols-2 gap-3">
                <Button
                  variant="outline"
                  onClick={() => handleShareBadge("linkedin")}
                  className="flex items-center gap-2"
                >
                  <Linkedin className="w-4 h-4 text-[#0A66C2]" />
                  LinkedIn
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleShareBadge("twitter")}
                  className="flex items-center gap-2"
                >
                  <Twitter className="w-4 h-4" />
                  X (Twitter)
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleShareBadge("download")}
                  className="flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Download
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleShareBadge("copy")}
                  className="flex items-center gap-2"
                >
                  <Share2 className="w-4 h-4" />
                  Copy Link
                </Button>
              </div>

              <p className="text-xs text-center text-muted-foreground">
                Share your progress professionally • LinkedIn-safe
              </p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}