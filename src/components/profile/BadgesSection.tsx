import { formatDistanceToNow } from "date-fns";
import { Award } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface Badge {
  id: string;
  name: string;
  description: string | null;
  icon: string | null;
  type: string;
  earned_at: string;
}

interface BadgesSectionProps {
  badges: Badge[];
}

export function BadgesSection({ badges }: BadgesSectionProps) {
  if (badges.length === 0) {
    return (
      <div className="p-6 bg-card rounded-xl border">
        <h3 className="font-semibold mb-4 flex items-center gap-2">
          <Award className="h-5 w-5 text-amber-500" />
          Badges Earned
        </h3>
        <p className="text-muted-foreground text-sm text-center py-8">
          No badges earned yet. Keep solving problems!
        </p>
      </div>
    );
  }

  return (
    <div className="p-6 bg-card rounded-xl border">
      <h3 className="font-semibold mb-4 flex items-center gap-2">
        <Award className="h-5 w-5 text-amber-500" />
        Badges Earned ({badges.length})
      </h3>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {badges.map((badge) => (
          <Tooltip key={badge.id}>
            <TooltipTrigger asChild>
              <div className="flex flex-col items-center gap-2 p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors cursor-pointer">
                <div className="text-4xl">{badge.icon || "🏆"}</div>
                <span className="text-sm font-medium text-center line-clamp-1">
                  {badge.name}
                </span>
                <span className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(badge.earned_at), { addSuffix: true })}
                </span>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <div className="max-w-[200px]">
                <p className="font-medium">{badge.name}</p>
                {badge.description && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {badge.description}
                  </p>
                )}
              </div>
            </TooltipContent>
          </Tooltip>
        ))}
      </div>
    </div>
  );
}
