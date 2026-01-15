import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { 
  Flame, Target, Award, Star, Zap, Trophy, Lock, 
  Download, Linkedin, Twitter, Check, MessageCircle, Copy
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Textarea } from "@/components/ui/textarea";
import { format } from "date-fns";
import { toast } from "sonner";
import { ShareCard } from "@/components/share/ShareCard";

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
    id: "achievement", 
    label: "Problem Solving", 
    icon: Target,
    color: "from-primary to-pink-500",
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
    color: "from-emerald-500 to-teal-500",
    description: "Awarded for earning XP"
  },
];

const iconMap: Record<string, React.ElementType> = {
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
  const [isDownloading, setIsDownloading] = useState(false);
  const [shareMessage, setShareMessage] = useState("");
  const cardRef = useRef<HTMLDivElement>(null);

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

  const handleBadgeClick = (badge: BadgeData) => {
    if (badge.earned) {
      setSelectedBadge(badge);
      setShareMessage(
        `🏆 Just earned the "${badge.name}" badge on NexAlgoTrix!\n\n${badge.description}\n\nFocused on pattern-based DSA learning for interview success.\n\n#DSA #CodingInterview #NexAlgoTrix`
      );
      setShareModalOpen(true);
    }
  };

  const handleShareLinkedIn = () => {
    const url = encodeURIComponent("https://nexalgotrix.lovable.app");
    const text = encodeURIComponent(shareMessage);
    window.open(
      `https://www.linkedin.com/sharing/share-offsite/?url=${url}&summary=${text}`,
      "_blank",
      "noopener,noreferrer"
    );
  };

  const handleShareTwitter = () => {
    const text = encodeURIComponent(shareMessage);
    window.open(
      `https://twitter.com/intent/tweet?text=${text}`,
      "_blank",
      "noopener,noreferrer"
    );
  };

  const handleShareWhatsApp = () => {
    const text = encodeURIComponent(`${shareMessage}\n\nhttps://nexalgotrix.lovable.app`);
    window.open(`https://wa.me/?text=${text}`, "_blank", "noopener,noreferrer");
  };

  const handleCopyText = async () => {
    await navigator.clipboard.writeText(shareMessage);
    toast.success("Message copied to clipboard!");
  };

  const handleDownloadImage = async () => {
    if (!cardRef.current || isDownloading) return;

    setIsDownloading(true);
    try {
      const html2canvas = (await import("html2canvas")).default;
      
      // Clone the card for proper rendering
      const clone = cardRef.current.cloneNode(true) as HTMLElement;
      clone.style.position = "absolute";
      clone.style.left = "-9999px";
      clone.style.top = "0";
      document.body.appendChild(clone);
      
      const canvas = await html2canvas(clone, {
        scale: 2,
        backgroundColor: null,
        useCORS: true,
        allowTaint: true,
        logging: false,
      });
      
      document.body.removeChild(clone);
      
      const link = document.createElement("a");
      const badgeName = selectedBadge?.name.toLowerCase().replace(/\s+/g, "-") || "badge";
      link.download = `nexalgotrix-${badgeName}-${Date.now()}.png`;
      link.href = canvas.toDataURL("image/png", 1.0);
      link.click();
      
      toast.success("Badge image downloaded successfully!");
    } catch (error) {
      console.error("Failed to download image:", error);
      toast.error("Failed to download image. Please try again.");
    } finally {
      setIsDownloading(false);
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

      {/* Premium Badge Share Modal */}
      <Dialog open={shareModalOpen} onOpenChange={setShareModalOpen}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-center">Share Your Achievement</DialogTitle>
          </DialogHeader>
          
          {selectedBadge && (
            <div className="space-y-4">
              {/* Premium Badge Card Preview */}
              <div className="flex justify-center overflow-hidden rounded-xl bg-muted/30 p-4">
                <div className="scale-[0.6] origin-center">
                  <ShareCard
                    ref={cardRef}
                    type="badge"
                    title={selectedBadge.name}
                    subtitle={selectedBadge.description}
                    icon={selectedBadge.icon}
                    userName={profile?.username || "User"}
                    badgeType={selectedBadge.type}
                    earnedDate={selectedBadge.earnedAt ? format(new Date(selectedBadge.earnedAt), "MMMM d, yyyy") : undefined}
                  />
                </div>
              </div>

              {/* Editable Share Message */}
              <div>
                <label className="text-sm font-medium mb-1.5 block">
                  Share Message
                </label>
                <Textarea
                  value={shareMessage}
                  onChange={(e) => setShareMessage(e.target.value)}
                  rows={4}
                  className="resize-none text-sm"
                />
              </div>

              {/* Share Buttons */}
              <div className="grid grid-cols-2 gap-3">
                <Button
                  variant="outline"
                  onClick={handleShareLinkedIn}
                  className="flex items-center gap-2"
                >
                  <Linkedin className="w-4 h-4 text-[#0A66C2]" />
                  LinkedIn
                </Button>
                <Button
                  variant="outline"
                  onClick={handleShareTwitter}
                  className="flex items-center gap-2"
                >
                  <Twitter className="w-4 h-4" />
                  X (Twitter)
                </Button>
                <Button
                  variant="outline"
                  onClick={handleShareWhatsApp}
                  className="flex items-center gap-2"
                >
                  <MessageCircle className="w-4 h-4 text-[#25D366]" />
                  WhatsApp
                </Button>
                <Button
                  variant="outline"
                  onClick={handleCopyText}
                  className="flex items-center gap-2"
                >
                  <Copy className="w-4 h-4" />
                  Copy Text
                </Button>
              </div>

              {/* Download Button */}
              <Button
                className="w-full gap-2 bg-primary hover:bg-primary/90"
                onClick={handleDownloadImage}
                disabled={isDownloading}
              >
                <Download className="w-4 h-4" />
                {isDownloading ? "Downloading..." : "Download Image"}
              </Button>

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