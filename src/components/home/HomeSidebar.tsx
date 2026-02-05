import { Link, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import {
  Home,
  BookOpen,
  Bot,
  Video,
  Briefcase,
  Gift,
  BarChart3,
  ChevronLeft,
  ChevronRight,
  X,
  Trophy,
  Settings,
  User,
  LogOut,
  Crown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

interface HomeSidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  isMobile?: boolean;
}

const navItems = [
  { href: "/", label: "Home", icon: Home },
  { href: "/curriculum", label: "Curriculum", icon: BookOpen },
  { href: "/tutor", label: "NexMentor", icon: Bot },
  { href: "/interview", label: "Interview", icon: Video },
  { href: "/jobs", label: "Jobs", icon: Briefcase },
  { href: "/pricing", label: "Upgrade Pro", icon: Crown },
  { href: "/referral", label: "Referrals", icon: Gift },
  { href: "/dashboard?tab=analytics", label: "Analytics", icon: BarChart3 },
];

const secondaryItems = [
  { href: "/gamification", label: "Rewards", icon: Trophy },
  { href: "/profile-settings", label: "Settings", icon: Settings },
];

export function HomeSidebar({ collapsed, onToggle, isMobile = false }: HomeSidebarProps) {
  const location = useLocation();
  const { user, signOut } = useAuth();

  const isActive = (href: string) => {
    if (href === "/") return location.pathname === "/";
    return location.pathname.startsWith(href.split("?")[0]);
  };

  const sidebarContent = (
    <>
      {/* Mobile header with close button */}
      {isMobile && (
        <div className="flex items-center justify-between p-4 border-b border-border">
          <span className="font-bold text-lg">Menu</span>
          <Button variant="ghost" size="icon" onClick={onToggle}>
            <X className="w-5 h-5" />
          </Button>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
        {/* Main Nav */}
        <div className="space-y-1">
          {navItems.map((item) => {
            const active = isActive(item.href);
            const Icon = item.icon;

            const linkContent = (
              <Link
                to={item.href}
                onClick={isMobile ? onToggle : undefined}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all",
                  "hover:bg-muted/80",
                  active && "bg-primary/10 text-primary font-medium",
                  collapsed && !isMobile && "justify-center px-2"
                )}
              >
                <Icon className={cn("w-5 h-5 flex-shrink-0", active && "text-primary")} />
                {(!collapsed || isMobile) && (
                  <span className="text-sm truncate">{item.label}</span>
                )}
              </Link>
            );

            if (collapsed && !isMobile) {
              return (
                <Tooltip key={item.href}>
                  <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
                  <TooltipContent side="right" className="font-medium">
                    {item.label}
                  </TooltipContent>
                </Tooltip>
              );
            }

            return <div key={item.href}>{linkContent}</div>;
          })}
        </div>

        {/* Separator */}
        {(!collapsed || isMobile) && (
          <div className="py-2">
            <Separator />
          </div>
        )}

        {/* Secondary Nav */}
        <div className="space-y-1">
          {secondaryItems.map((item) => {
            const active = isActive(item.href);
            const Icon = item.icon;

            const linkContent = (
              <Link
                to={item.href}
                onClick={isMobile ? onToggle : undefined}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all",
                  "hover:bg-muted/80 text-muted-foreground",
                  active && "bg-primary/10 text-primary font-medium",
                  collapsed && !isMobile && "justify-center px-2"
                )}
              >
                <Icon className={cn("w-5 h-5 flex-shrink-0", active && "text-primary")} />
                {(!collapsed || isMobile) && (
                  <span className="text-sm truncate">{item.label}</span>
                )}
              </Link>
            );

            if (collapsed && !isMobile) {
              return (
                <Tooltip key={item.href}>
                  <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
                  <TooltipContent side="right" className="font-medium">
                    {item.label}
                  </TooltipContent>
                </Tooltip>
              );
            }

            return <div key={item.href}>{linkContent}</div>;
          })}
        </div>
      </nav>

      {/* Collapse Toggle / Sign Out for Mobile */}
      <div className="p-2 border-t border-border">
        {isMobile ? (
          <Button
            variant="ghost"
            size="sm"
            onClick={signOut}
            className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10"
          >
            <LogOut className="w-4 h-4 mr-2" />
            <span className="text-sm">Sign Out</span>
          </Button>
        ) : (
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggle}
            className={cn("w-full", collapsed ? "px-2" : "justify-start")}
          >
            {collapsed ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <>
                <ChevronLeft className="w-4 h-4 mr-2" />
                <span className="text-xs">Collapse</span>
              </>
            )}
          </Button>
        )}
      </div>
    </>
  );

  if (isMobile) {
    return (
      <div className="h-full bg-card border-r border-border flex flex-col">
        {sidebarContent}
      </div>
    );
  }

  return (
    <TooltipProvider delayDuration={0}>
      <motion.aside
        initial={false}
        animate={{ width: collapsed ? 64 : 200 }}
        transition={{ duration: 0.2 }}
        className="fixed left-0 top-16 bottom-0 bg-card border-r border-border z-40 flex flex-col"
      >
        {sidebarContent}
      </motion.aside>
    </TooltipProvider>
  );
}
