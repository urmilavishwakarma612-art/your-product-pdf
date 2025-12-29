import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Share2, Crown, Calendar } from "lucide-react";
import { format } from "date-fns";
import { toast } from "@/hooks/use-toast";

interface ProfileHeaderProps {
  username: string;
  avatarUrl?: string | null;
  level: number;
  createdAt: string;
  subscriptionStatus: string;
}

export function ProfileHeader({
  username,
  avatarUrl,
  level,
  createdAt,
  subscriptionStatus,
}: ProfileHeaderProps) {
  const initials = username?.slice(0, 2).toUpperCase() || "??";

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    toast({
      title: "Link copied!",
      description: "Profile link copied to clipboard",
    });
  };

  return (
    <div className="flex flex-col sm:flex-row items-center gap-6 p-6 bg-card rounded-xl border">
      <Avatar className="h-24 w-24 border-4 border-primary/20">
        <AvatarImage src={avatarUrl || undefined} alt={username} />
        <AvatarFallback className="text-2xl font-bold bg-primary/10 text-primary">
          {initials}
        </AvatarFallback>
      </Avatar>

      <div className="flex-1 text-center sm:text-left">
        <div className="flex flex-col sm:flex-row items-center gap-3 mb-2">
          <h1 className="text-2xl font-bold">{username}</h1>
          <Badge variant="secondary" className="gap-1">
            <Crown className="h-3 w-3" />
            Level {level}
          </Badge>
          {subscriptionStatus !== "free" && (
            <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0">
              PRO
            </Badge>
          )}
        </div>

        <div className="flex items-center justify-center sm:justify-start gap-2 text-muted-foreground text-sm">
          <Calendar className="h-4 w-4" />
          <span>Member since {format(new Date(createdAt), "MMMM yyyy")}</span>
        </div>
      </div>

      <Button variant="outline" size="sm" onClick={handleShare} className="gap-2">
        <Share2 className="h-4 w-4" />
        Share Profile
      </Button>
    </div>
  );
}
