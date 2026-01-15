import { forwardRef } from "react";
import { 
  Trophy, Flame, Target, Star, Zap, Award, 
  Code, GitBranch, Binary, Layers
} from "lucide-react";
import logoImage from "@/assets/logo.png";

type ShareType = "level" | "streak" | "interview" | "pattern" | "badge";

interface ShareCardProps {
  type: ShareType;
  title: string;
  subtitle?: string;
  value?: string | number;
  userName?: string;
  icon?: string;
  badgeType?: string;
  earnedDate?: string;
}

const iconMap: Record<string, React.ElementType> = {
  flame: Flame,
  target: Target,
  award: Award,
  star: Star,
  zap: Zap,
  trophy: Trophy,
  code: Code,
  "git-branch": GitBranch,
  binary: Binary,
  layers: Layers,
};

export const ShareCard = forwardRef<HTMLDivElement, ShareCardProps>(
  ({ type, title, subtitle, value, userName, icon, badgeType, earnedDate }, ref) => {
    // Brand primary color: #e80948 (magenta/red)
    const getGradientByType = (badgeCategory?: string) => {
      if (badgeCategory === "streak") {
        return "linear-gradient(135deg, #1a0a12 0%, #2d0a1a 30%, #0a0a0a 70%, #1a0510 100%)";
      }
      if (badgeCategory === "xp") {
        return "linear-gradient(135deg, #0a1a12 0%, #0a2d1a 30%, #0a0a0a 70%, #0a1a10 100%)";
      }
      if (badgeCategory === "pattern") {
        return "linear-gradient(135deg, #0a0a1a 0%, #0a1a2d 30%, #0a0a0a 70%, #05101a 100%)";
      }
      // Default brand gradient
      return "linear-gradient(135deg, #1a0510 0%, #2d0a1a 30%, #0a0a0a 70%, #1a0a12 100%)";
    };

    const getIconGradient = (badgeCategory?: string) => {
      if (badgeCategory === "streak") return "linear-gradient(135deg, #f97316, #ef4444, #f59e0b)";
      if (badgeCategory === "xp") return "linear-gradient(135deg, #10b981, #14b8a6, #22d3d1)";
      if (badgeCategory === "pattern") return "linear-gradient(135deg, #8b5cf6, #6366f1, #a855f7)";
      return "linear-gradient(135deg, #e80948, #f43f5e, #ec4899)";
    };

    const getAccentColor = (badgeCategory?: string) => {
      if (badgeCategory === "streak") return "#f97316";
      if (badgeCategory === "xp") return "#10b981";
      if (badgeCategory === "pattern") return "#8b5cf6";
      return "#e80948";
    };

    const IconComponent = icon ? (iconMap[icon] || Trophy) : Trophy;
    const accentColor = getAccentColor(badgeType || type);

    return (
      <div
        ref={ref}
        style={{
          background: getGradientByType(badgeType || type),
          width: "400px",
          height: "500px",
          borderRadius: "24px",
          padding: "24px",
          position: "relative",
          overflow: "hidden",
          fontFamily: "'Inter', 'Segoe UI', sans-serif",
        }}
      >
        {/* Decorative Background Elements */}
        <div
          style={{
            position: "absolute",
            top: "-80px",
            right: "-80px",
            width: "250px",
            height: "250px",
            background: `radial-gradient(circle, ${accentColor}20 0%, transparent 70%)`,
            borderRadius: "50%",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: "-60px",
            left: "-60px",
            width: "200px",
            height: "200px",
            background: `radial-gradient(circle, ${accentColor}15 0%, transparent 70%)`,
            borderRadius: "50%",
          }}
        />
        
        {/* Floating Dots Pattern */}
        <div style={{ position: "absolute", inset: 0, opacity: 0.3 }}>
          {[...Array(12)].map((_, i) => (
            <div
              key={i}
              style={{
                position: "absolute",
                width: "4px",
                height: "4px",
                borderRadius: "50%",
                background: "rgba(255,255,255,0.4)",
                left: `${15 + (i % 4) * 25}%`,
                top: `${20 + Math.floor(i / 4) * 25}%`,
              }}
            />
          ))}
        </div>

        {/* Diagonal Lines */}
        <div
          style={{
            position: "absolute",
            top: "30%",
            left: "-20%",
            width: "140%",
            height: "1px",
            background: `linear-gradient(90deg, transparent, ${accentColor}30, transparent)`,
            transform: "rotate(-15deg)",
          }}
        />
        <div
          style={{
            position: "absolute",
            top: "40%",
            left: "-20%",
            width: "140%",
            height: "1px",
            background: `linear-gradient(90deg, transparent, ${accentColor}20, transparent)`,
            transform: "rotate(-15deg)",
          }}
        />

        {/* Content Container */}
        <div
          style={{
            position: "relative",
            zIndex: 10,
            height: "100%",
            display: "flex",
            flexDirection: "column",
          }}
        >
          {/* Header - Logo & Branding */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
            }}
          >
            <img
              src={logoImage}
              alt="NexAlgoTrix"
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "8px",
              }}
            />
            <span
              style={{
                color: "white",
                fontSize: "16px",
                fontWeight: 700,
                letterSpacing: "0.5px",
              }}
            >
              NexAlgoTrix
            </span>
          </div>

          {/* Center Content - Badge Icon & Title */}
          <div
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: "16px",
              marginTop: "-20px",
            }}
          >
            {/* Hexagonal Badge Container */}
            <div
              style={{
                position: "relative",
                width: "130px",
                height: "150px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {/* Outer Glow */}
              <div
                style={{
                  position: "absolute",
                  width: "140px",
                  height: "160px",
                  background: `radial-gradient(circle, ${accentColor}40 0%, transparent 60%)`,
                  filter: "blur(20px)",
                }}
              />
              
              {/* Hexagon SVG Background */}
              <svg
                viewBox="0 0 100 115"
                style={{
                  position: "absolute",
                  width: "120px",
                  height: "138px",
                  filter: `drop-shadow(0 0 20px ${accentColor}50)`,
                }}
              >
                <defs>
                  <linearGradient id="hexGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" style={{ stopColor: "rgba(255,255,255,0.15)" }} />
                    <stop offset="100%" style={{ stopColor: "rgba(255,255,255,0.05)" }} />
                  </linearGradient>
                </defs>
                <polygon
                  points="50,2 95,28 95,87 50,113 5,87 5,28"
                  fill="url(#hexGradient)"
                  stroke={accentColor}
                  strokeWidth="2"
                />
              </svg>

              {/* Icon Container */}
              <div
                style={{
                  position: "relative",
                  width: "80px",
                  height: "80px",
                  borderRadius: "50%",
                  background: getIconGradient(badgeType || type),
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: `0 8px 32px ${accentColor}60`,
                }}
              >
                <IconComponent 
                  style={{ 
                    width: "40px", 
                    height: "40px", 
                    color: "white",
                  }} 
                />
                {/* Value Badge */}
                {value && (
                  <div
                    style={{
                      position: "absolute",
                      bottom: "-8px",
                      background: "rgba(0,0,0,0.8)",
                      border: `2px solid ${accentColor}`,
                      borderRadius: "20px",
                      padding: "4px 16px",
                      fontSize: "16px",
                      fontWeight: 700,
                      color: "white",
                    }}
                  >
                    {value}
                  </div>
                )}
              </div>
            </div>

            {/* Badge Title */}
            <h2
              style={{
                color: accentColor,
                fontSize: "28px",
                fontWeight: 800,
                textAlign: "center",
                marginTop: "12px",
                textShadow: `0 0 30px ${accentColor}50`,
              }}
            >
              {title}
            </h2>

            {/* Subtitle / Description */}
            <p
              style={{
                color: "rgba(255,255,255,0.8)",
                fontSize: "14px",
                textAlign: "center",
                maxWidth: "280px",
                lineHeight: 1.5,
              }}
            >
              {subtitle || `Earned for mastering ${title.toLowerCase()} on NexAlgoTrix`}
            </p>
          </div>

          {/* Footer - User Info */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "12px",
            }}
          >
            {/* User Pill */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                background: "rgba(255,255,255,0.1)",
                backdropFilter: "blur(10px)",
                borderRadius: "50px",
                padding: "10px 24px",
                border: "1px solid rgba(255,255,255,0.1)",
              }}
            >
              <div
                style={{
                  width: "36px",
                  height: "36px",
                  borderRadius: "50%",
                  background: getIconGradient(badgeType || type),
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "16px",
                  fontWeight: 700,
                  color: "white",
                }}
              >
                {userName?.[0]?.toUpperCase() || "U"}
              </div>
              <span
                style={{
                  color: "white",
                  fontSize: "16px",
                  fontWeight: 600,
                }}
              >
                {userName || "User"}
              </span>
            </div>

            {/* Earned Date */}
            {earnedDate && (
              <p
                style={{
                  color: "rgba(255,255,255,0.5)",
                  fontSize: "12px",
                }}
              >
                Earned on {earnedDate}
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }
);

ShareCard.displayName = "ShareCard";
