import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, Crown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useSubscription } from "@/hooks/useSubscription";
import { ThemeToggle } from "@/components/ThemeToggle";
import { ProfileDropdown } from "./ProfileDropdown";
import logoImage from "@/assets/logo.png";
export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { user } = useAuth();
  const { isPremium } = useSubscription();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

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
        <div className="flex items-center justify-between h-14 px-6">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <motion.div
              whileHover={{ scale: 1.05, rotate: 5 }}
              whileTap={{ scale: 0.95 }}
              className="w-9 h-9 flex items-center justify-center"
            >
              <img src={logoImage} alt="Nexalgotrix Logo" className="w-9 h-9 object-contain" />
            </motion.div>
            <span className="font-bold text-lg tracking-tight group-hover:text-primary transition-colors duration-300">
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

      {/* Mobile Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="md:hidden mt-2 mx-auto max-w-5xl rounded-2xl border border-white/10 dark:border-white/10 bg-background/80 dark:bg-background/60 backdrop-blur-2xl shadow-[0_12px_40px_rgba(0,0,0,0.2)] overflow-hidden"
          >
            <div className="px-6 py-5 space-y-4">
              <NavLinks mobile onClick={() => setIsOpen(false)} />
              <div className="pt-4 border-t border-border/50 space-y-3">
                <div className="flex items-center justify-between py-2">
                  <span className="text-sm text-muted-foreground">Theme</span>
                  <ThemeToggle />
                </div>
                {user ? (
                  <div className="space-y-3">
                    {isPremium && (
                      <div className="flex items-center justify-center gap-2 py-2">
                        <div className="flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/30">
                          <Crown className="w-4 h-4 text-amber-500" />
                          <span className="text-sm font-medium text-amber-500">PRO Member</span>
                        </div>
                      </div>
                    )}
                    <Link to="/dashboard" onClick={() => setIsOpen(false)}>
                      <Button className="w-full rounded-full">Dashboard</Button>
                    </Link>
                  </div>
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

  // Primary nav only - secondary items go in ProfileDropdown
  const authLinks = [
    { href: "/", label: "Home", isRoute: true },
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
            transition={{ delay: index * 0.1 }}
          >
            <Link
              to={link.href}
              onClick={onClick}
              className={`
                relative px-4 py-2 text-sm font-medium
                text-muted-foreground hover:text-foreground 
                transition-all duration-300 rounded-full
                hover:bg-foreground/5
                ${mobile ? "block" : ""}
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
            transition={{ delay: index * 0.1 }}
          >
            <a
              href={link.href}
              onClick={onClick}
              className={`
                relative px-4 py-2 text-sm font-medium
                text-muted-foreground hover:text-foreground 
                transition-all duration-300 rounded-full
                hover:bg-foreground/5
                ${mobile ? "block" : ""}
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