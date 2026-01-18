import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, Crown, Trophy, Briefcase, Calendar, Gift, BarChart3, User, Settings, LogOut, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useSubscription } from "@/hooks/useSubscription";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ThemeToggle } from "@/components/ThemeToggle";
import { ProfileDropdown } from "./ProfileDropdown";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import logoImage from "@/assets/logo.png";

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { user, signOut } = useAuth();
  const { isPremium } = useSubscription();
  const navigate = useNavigate();

  const { data: profile } = useQuery({
    queryKey: ["profile-nav", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from("profiles")
        .select("username, avatar_url, current_level, subscription_status")
        .eq("id", user.id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleSignOut = async () => {
    setIsOpen(false);
    await signOut();
  };

  const secondaryNavItems = [
    { href: "/gamification", label: "Rewards", icon: Trophy },
    { href: "/jobs", label: "Jobs", icon: Briefcase },
    { href: "/events", label: "Events", icon: Calendar },
    { href: "/referral", label: "Referrals", icon: Gift },
    { href: "/payments", label: "Payments & Refunds", icon: CreditCard },
    { href: "/dashboard?tab=analytics", label: "Analytics", icon: BarChart3 },
  ];

  return (
    <motion.nav
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className="fixed top-0 left-0 right-0 z-50 px-4 md:px-8 py-4"
    >
      <motion.div
        className={`
          mx-auto max-w-5xl
          rounded-full
          border border-white/10 dark:border-white/10
          bg-background/60 dark:bg-background/40
          backdrop-blur-2xl backdrop-saturate-150
          shadow-[0_8px_32px_rgba(0,0,0,0.12)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.4)]
          transition-all duration-500 ease-out
          ${scrolled ? "bg-background/80 dark:bg-background/60 shadow-[0_12px_40px_rgba(0,0,0,0.15)] dark:shadow-[0_12px_40px_rgba(0,0,0,0.5)]" : ""}
        `}
        layout
      >
        <div className="flex items-center justify-between h-14 px-4 sm:px-6">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <motion.div
              whileHover={{ scale: 1.05, rotate: 5 }}
              whileTap={{ scale: 0.95 }}
              className="w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center"
            >
              <img src={logoImage} alt="Nexalgotrix Logo" className="w-8 h-8 sm:w-9 sm:h-9 object-contain" />
            </motion.div>
            <span className="font-bold text-base sm:text-lg tracking-tight group-hover:text-primary transition-colors duration-300">
              Nexalgotrix
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-1">
            <NavLinks />
          </div>

          {/* Desktop CTA */}
          <div className="hidden md:flex items-center gap-2">
            <ThemeToggle />
            {user ? (
              <div className="flex items-center gap-2">
                {isPremium && (
                  <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/30">
                    <Crown className="w-3.5 h-3.5 text-amber-500" />
                    <span className="text-xs font-medium text-amber-500">PRO</span>
                  </div>
                )}
                <ProfileDropdown />
              </div>
            ) : (
              <>
                <Link to="/auth">
                  <Button
                    variant="ghost"
                    className="rounded-full px-5 hover:bg-foreground/5 transition-all duration-300"
                  >
                    Login
                  </Button>
                </Link>
                <Link to="/auth">
                  <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                    <Button className="rounded-full px-5 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-all duration-300">
                      Get Started
                    </Button>
                  </motion.div>
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden p-2 rounded-full hover:bg-foreground/5 text-foreground transition-colors"
          >
            <AnimatePresence mode="wait">
              {isOpen ? (
                <motion.div
                  key="close"
                  initial={{ rotate: -90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: 90, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <X className="w-5 h-5" />
                </motion.div>
              ) : (
                <motion.div
                  key="menu"
                  initial={{ rotate: 90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: -90, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <Menu className="w-5 h-5" />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.button>
        </div>
      </motion.div>

      {/* Mobile Menu - Full Navigation */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="md:hidden mt-2 mx-auto max-w-5xl rounded-2xl border border-white/10 dark:border-white/10 bg-background/95 dark:bg-background/90 backdrop-blur-2xl shadow-[0_12px_40px_rgba(0,0,0,0.2)] overflow-hidden max-h-[80vh] overflow-y-auto"
          >
            <div className="px-4 py-4 space-y-3">
              {/* User Profile Header (if logged in) */}
              {user && profile && (
                <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/30 border border-border/30">
                  <Avatar className="w-12 h-12 ring-2 ring-primary/30">
                    <AvatarImage src={profile.avatar_url || undefined} />
                    <AvatarFallback className="bg-primary/10 text-primary font-bold">
                      {profile.username?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold truncate">{profile.username || "User"}</p>
                      {profile.subscription_status === "pro" && (
                        <Crown className="w-4 h-4 text-amber-500 flex-shrink-0" />
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                    {profile.current_level && (
                      <p className="text-xs text-primary">Level {profile.current_level}</p>
                    )}
                  </div>
                </div>
              )}

              {/* Primary Navigation */}
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground px-2 py-1">Navigation</p>
                <NavLinks mobile onClick={() => setIsOpen(false)} />
              </div>

              {/* Secondary Navigation (only for logged-in users) */}
              {user && (
                <div className="space-y-1 pt-2 border-t border-border/30">
                  <p className="text-xs font-medium text-muted-foreground px-2 py-1">More</p>
                  {secondaryNavItems.map((item, index) => (
                    <motion.div
                      key={item.href}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <Link
                        to={item.href}
                        onClick={() => setIsOpen(false)}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
                      >
                        <item.icon className="w-4 h-4" />
                        {item.label}
                      </Link>
                    </motion.div>
                  ))}
                </div>
              )}

              {/* Profile Actions (only for logged-in users) */}
              {user && (
                <div className="space-y-1 pt-2 border-t border-border/30">
                  <p className="text-xs font-medium text-muted-foreground px-2 py-1">Account</p>
                  <Link
                    to={`/profile/${encodeURIComponent((profile?.username || "").trim())}`}
                    onClick={() => setIsOpen(false)}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
                  >
                    <User className="w-4 h-4" />
                    View Profile
                  </Link>
                  <Link
                    to="/profile-settings"
                    onClick={() => setIsOpen(false)}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
                  >
                    <Settings className="w-4 h-4" />
                    Edit Profile
                  </Link>
                </div>
              )}

              {/* Theme & Auth */}
              <div className="pt-3 border-t border-border/30 space-y-3">
                <div className="flex items-center justify-between px-2 py-1">
                  <span className="text-sm text-muted-foreground">Theme</span>
                  <ThemeToggle />
                </div>
                
                {user ? (
                  <Button
                    variant="ghost"
                    className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10"
                    onClick={handleSignOut}
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Sign Out
                  </Button>
                ) : (
                  <div className="flex gap-2">
                    <Link to="/auth" onClick={() => setIsOpen(false)} className="flex-1">
                      <Button variant="outline" className="w-full rounded-full">
                        Login
                      </Button>
                    </Link>
                    <Link to="/auth" onClick={() => setIsOpen(false)} className="flex-1">
                      <Button className="w-full rounded-full">Get Started</Button>
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
}

function NavLinks({ mobile, onClick }: { mobile?: boolean; onClick?: () => void }) {
  const { user } = useAuth();
  
  const publicLinks = [
    { href: "/", label: "Home", isRoute: true },
    { href: "#features", label: "Features", isRoute: false },
    { href: "#phases", label: "Phases", isRoute: false },
    { href: "/pricing", label: "Pricing", isRoute: true },
  ];

  // Primary nav only - secondary items now shown directly in mobile menu
  const authLinks = [
    { href: "/", label: "Home", isRoute: true },
    { href: "/tutor", label: "NexMentor", isRoute: true },
    { href: "/curriculum", label: "Curriculum", isRoute: true },
    { href: "/interview", label: "Interview", isRoute: true },
    { href: "/dashboard", label: "Dashboard", isRoute: true },
  ];

  const links = user ? authLinks : publicLinks;

  return (
    <div className={mobile ? "space-y-1" : "flex items-center gap-1"}>
      {links.map((link, index) =>
        link.isRoute ? (
          <motion.div
            key={link.href}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <Link
              to={link.href}
              onClick={onClick}
              className={`
                relative px-3 sm:px-4 py-2.5 text-sm font-medium
                text-muted-foreground hover:text-foreground 
                transition-all duration-300 rounded-lg
                hover:bg-muted/50
                ${mobile ? "flex items-center" : ""}
              `}
            >
              {link.label}
            </Link>
          </motion.div>
        ) : (
          <motion.div
            key={link.href}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <a
              href={link.href}
              onClick={onClick}
              className={`
                relative px-3 sm:px-4 py-2.5 text-sm font-medium
                text-muted-foreground hover:text-foreground 
                transition-all duration-300 rounded-lg
                hover:bg-muted/50
                ${mobile ? "flex items-center" : ""}
              `}
            >
              {link.label}
            </a>
          </motion.div>
        )
      )}
    </div>
  );
}