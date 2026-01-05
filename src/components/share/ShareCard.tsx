import { forwardRef } from "react";
import { Trophy, Flame, Target, Star } from "lucide-react";

type ShareType = "level" | "streak" | "interview" | "pattern" | "badge";

interface ShareCardProps {
  type: ShareType;
  title: string;
  subtitle?: string;
  value?: string | number;
  userName?: string;
  icon?: string;
}

export const ShareCard = forwardRef<HTMLDivElement, ShareCardProps>(
  ({ type, title, subtitle, value, userName, icon }, ref) => {
    const gradients: Record<ShareType, string> = {
      level: "from-primary via-primary/80 to-purple-600",
      streak: "from-orange-500 via-red-500 to-amber-500",
      interview: "from-emerald-500 via-green-500 to-teal-500",
      pattern: "from-blue-500 via-indigo-500 to-purple-500",
      badge: "from-amber-500 via-yellow-500 to-orange-500",
    };

    const icons: Record<ShareType, React.ReactNode> = {
      level: <Trophy className="w-8 h-8 text-white" />,
      streak: <Flame className="w-8 h-8 text-white" />,
      interview: <Target className="w-8 h-8 text-white" />,
      pattern: <Star className="w-8 h-8 text-white" />,
      badge: <span className="text-3xl">{icon || "🏆"}</span>,
    };

    return (
      <div
        ref={ref}
        className={`w-[400px] h-[220px] rounded-2xl bg-gradient-to-br ${gradients[type]} p-6 relative overflow-hidden`}
      >
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full -translate-y-32 translate-x-32" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white rounded-full translate-y-24 -translate-x-24" />
        </div>

        {/* Content */}
        <div className="relative z-10 h-full flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center">
                {icons[type]}
              </div>
              <div>
                <h3 className="text-white font-bold text-lg">{title}</h3>
                {subtitle && (
                  <p className="text-white/80 text-sm">{subtitle}</p>
                )}
              </div>
            </div>
            {value && (
              <div className="text-4xl font-bold text-white">
                {value}
              </div>
            )}
          </div>

          <div className="flex items-end justify-between">
            <div>
              {userName && (
                <p className="text-white/90 font-medium">{userName}</p>
              )}
              <p className="text-white/60 text-sm">
                Achieved on NexAlgoTrix
              </p>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
                <span className="text-white font-bold text-sm">N</span>
              </div>
              <span className="text-white/80 text-sm font-medium">NexAlgoTrix</span>
            </div>
          </div>
        </div>
      </div>
    );
  }
);

ShareCard.displayName = "ShareCard";
