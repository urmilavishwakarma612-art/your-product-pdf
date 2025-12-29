import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { ThemeToggle } from "@/components/ThemeToggle";

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const { user } = useAuth();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/50">
      <div className="container px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
              <Zap className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-bold text-xl">Nexalgotrix</span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-8">
            <NavLinks />
          </div>

          {/* Desktop CTA */}
          <div className="hidden md:flex items-center gap-2">
            <ThemeToggle />
            {user ? (
              <Link to="/dashboard">
                <Button className="btn-primary-glow">Dashboard</Button>
              </Link>
            ) : (
              <>
                <Link to="/auth">
                  <Button variant="ghost">Login</Button>
                </Link>
                <Link to="/auth">
                  <Button className="btn-primary-glow">Get Started</Button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden p-2 text-foreground"
          >
            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-background border-b border-border"
          >
            <div className="container px-4 py-4 space-y-4">
              <NavLinks mobile onClick={() => setIsOpen(false)} />
              <div className="pt-4 border-t border-border space-y-2">
                <div className="flex items-center justify-between py-2">
                  <span className="text-muted-foreground">Theme</span>
                  <ThemeToggle />
                </div>
                {user ? (
                  <Link to="/dashboard" onClick={() => setIsOpen(false)}>
                    <Button className="w-full">Dashboard</Button>
                  </Link>
                ) : (
                  <>
                    <Link to="/auth" onClick={() => setIsOpen(false)}>
                      <Button variant="outline" className="w-full">
                        Login
                      </Button>
                    </Link>
                    <Link to="/auth" onClick={() => setIsOpen(false)}>
                      <Button className="w-full">Get Started</Button>
                    </Link>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}

function NavLinks({ mobile, onClick }: { mobile?: boolean; onClick?: () => void }) {
  const { user } = useAuth();
  
  const publicLinks = [
    { href: "/", label: "Home", isRoute: true },
    { href: "#features", label: "Features", isRoute: false },
    { href: "#phases", label: "Phases", isRoute: false },
    { href: "#pricing", label: "Pricing", isRoute: false },
  ];

  const authLinks = [
    { href: "/", label: "Home", isRoute: true },
    { href: "/patterns", label: "Patterns", isRoute: true },
    { href: "/dashboard", label: "Dashboard", isRoute: true },
  ];

  const links = user ? authLinks : publicLinks;

  return (
    <div className={mobile ? "space-y-2" : "flex items-center gap-6"}>
      {links.map((link) =>
        link.isRoute ? (
          <Link
            key={link.href}
            to={link.href}
            onClick={onClick}
            className={`text-muted-foreground hover:text-foreground transition-colors ${
              mobile ? "block py-2" : ""
            }`}
          >
            {link.label}
          </Link>
        ) : (
          <a
            key={link.href}
            href={link.href}
            onClick={onClick}
            className={`text-muted-foreground hover:text-foreground transition-colors ${
              mobile ? "block py-2" : ""
            }`}
          >
            {link.label}
          </a>
        )
      )}
    </div>
  );
}