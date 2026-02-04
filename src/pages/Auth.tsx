import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, Lock, User, ArrowLeft, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import logoImage from "@/assets/logo.png";

type AuthMode = "login" | "signup" | "forgot";

type PendingUpgrade = {
  plan?: 'monthly' | 'lifetime';
  context?: string;
  next?: string;
};

const Auth = () => {
  const [mode, setMode] = useState<AuthMode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const { signIn, signUp, user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const nextPath = useMemo(() => {
    const next = searchParams.get('next');
    return next && next.startsWith('/') ? next : '/dashboard';
  }, [searchParams]);

  const isUpgradeFlow = useMemo(() => searchParams.get('upgrade') === '1', [searchParams]);

  useEffect(() => {
    // If user is already logged in and landed on /auth via redirect, forward them.
    if (user) {
      navigate(nextPath, { replace: true });
    }
  }, [user, navigate, nextPath]);

  const persistUpgradeIntentIfNeeded = () => {
    if (!isUpgradeFlow) return;

    // If UpgradeModal already stored details, keep them; otherwise create minimal pending state.
    const existing = sessionStorage.getItem('upgrade_pending');
    if (existing) return;

    const pending: PendingUpgrade = { next: nextPath, context: 'feature', plan: 'lifetime' };
    sessionStorage.setItem('upgrade_pending', JSON.stringify(pending));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (mode === "login") {
        const { error } = await signIn(email, password);
        if (error) {
          toast({ title: "Login failed", description: error.message, variant: "destructive" });
        } else {
          persistUpgradeIntentIfNeeded();
          toast({ title: "Welcome back!", description: "You're now logged in." });
          navigate(nextPath, { replace: true });
        }
      } else if (mode === "signup") {
        const { error } = await signUp(email, password, username);
        if (error) {
          toast({ title: "Sign up failed", description: error.message, variant: "destructive" });
        } else {
          persistUpgradeIntentIfNeeded();
          toast({ title: "Account created!", description: "Welcome to Nexalgotrix!" });
          navigate(nextPath, { replace: true });
        }
      } else if (mode === "forgot") {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/auth?reset=true`,
        });
        if (error) {
          toast({ title: "Reset failed", description: error.message, variant: "destructive" });
        } else {
          toast({ title: "Check your email", description: "We've sent you a password reset link." });
          setMode("login");
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const getTitle = () => {
    if (mode === "login") return "Welcome back";
    if (mode === "signup") return "Create your account";
    return "Reset your password";
  };

  const getSubtitle = () => {
    if (mode === "login") return "Log in to continue your DSA journey";
    if (mode === "signup") return "Start mastering DSA through patterns";
    return "Enter your email to receive a reset link";
  };

  const getButtonText = () => {
    if (mode === "login") return "Log in";
    if (mode === "signup") return "Create account";
    return "Send reset link";
  };


  return (
    <div className="min-h-screen bg-background bg-grid flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated orbs */}
      <motion.div
        animate={{
          x: [0, 30, 0],
          y: [0, -20, 0],
        }}
        transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
        className="hero-orb-1 -top-40 -right-40"
      />
      <motion.div
        animate={{
          x: [0, -30, 0],
          y: [0, 20, 0],
        }}
        transition={{ duration: 25, repeat: Infinity, ease: "easeInOut" }}
        className="hero-orb-2 -bottom-40 -left-40"
      />

      {/* Floating particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(15)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-primary/20 rounded-full"
            initial={{
              x: Math.random() * (typeof window !== 'undefined' ? window.innerWidth : 1000),
              y: Math.random() * (typeof window !== 'undefined' ? window.innerHeight : 800),
            }}
            animate={{
              y: [null, Math.random() * -200 - 100],
              opacity: [0, 1, 0],
            }}
            transition={{
              duration: Math.random() * 3 + 2,
              repeat: Infinity,
              delay: Math.random() * 2,
              ease: "easeOut",
            }}
          />
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-md relative z-10"
      >
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Link to="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-8 group transition-colors">
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> 
            Back to home
          </Link>
        </motion.div>

        <motion.div 
          className="interactive-card p-8 md:p-10"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1, duration: 0.6 }}
        >
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="flex items-center justify-center gap-3 mb-8"
          >
            <motion.div 
              whileHover={{ scale: 1.05, rotate: 5 }}
              className="w-12 h-12 flex items-center justify-center"
            >
              <img src={logoImage} alt="Nexalgotrix Logo" className="w-12 h-12 object-contain" />
            </motion.div>
            <span className="font-bold text-2xl">Nexalgotrix</span>
          </motion.div>

          <AnimatePresence mode="wait">
            <motion.div
              key={mode}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <h1 className="text-2xl md:text-3xl font-bold text-center mb-3">
                {getTitle()}
              </h1>
              <p className="text-muted-foreground text-center mb-8">
                {getSubtitle()}
              </p>
            </motion.div>
          </AnimatePresence>

          <motion.form 
            onSubmit={handleSubmit} 
            className="space-y-5"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            <AnimatePresence mode="wait">
              {mode === "signup" && (
                <motion.div 
                  key="username"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-2"
                >
                  <Label htmlFor="username" className="text-sm font-medium">Username</Label>
                  <div className="relative group">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                    <Input
                      id="username"
                      type="text"
                      placeholder="johndoe"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="pl-10 h-12 rounded-xl border-border/50 bg-muted/30 focus:bg-muted/50 transition-all"
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium">Email</Label>
              <div className="relative group">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 h-12 rounded-xl border-border/50 bg-muted/30 focus:bg-muted/50 transition-all"
                  required
                />
              </div>
            </div>

            <AnimatePresence mode="wait">
              {mode !== "forgot" && (
                <motion.div 
                  key="password"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password" className="text-sm font-medium">Password</Label>
                    {mode === "login" && (
                      <button
                        type="button"
                        onClick={() => setMode("forgot")}
                        className="text-xs text-primary hover:text-primary/80 transition-colors touch-manipulation"
                      >
                        Forgot password?
                      </button>
                    )}
                  </div>
                  <div className="relative group">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                    <Input
                      id="password"
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10 h-12 rounded-xl border-border/50 bg-muted/30 focus:bg-muted/50 transition-all"
                      required
                      minLength={6}
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
              <Button type="submit" className="w-full btn-primary-glow h-12 rounded-xl text-base" disabled={loading}>
                {loading ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full"
                  />
                ) : (
                  <>
                    {getButtonText()}
                    <Sparkles className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>
            </motion.div>
          </motion.form>


          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-8 text-center text-sm text-muted-foreground relative z-20"
          >
            {mode === "login" && (
              <>
                Don't have an account?{" "}
                <button
                  type="button"
                  onClick={() => setMode("signup")}
                  className="text-primary hover:text-primary/80 font-medium transition-colors p-2 -m-2 touch-manipulation"
                >
                  Sign up
                </button>
              </>
            )}
            {mode === "signup" && (
              <>
                Already have an account?{" "}
                <button
                  type="button"
                  onClick={() => setMode("login")}
                  className="text-primary hover:text-primary/80 font-medium transition-colors p-2 -m-2 touch-manipulation"
                >
                  Log in
                </button>
              </>
            )}
            {mode === "forgot" && (
              <>
                Remember your password?{" "}
                <button
                  type="button"
                  onClick={() => setMode("login")}
                  className="text-primary hover:text-primary/80 font-medium transition-colors p-2 -m-2 touch-manipulation"
                >
                  Back to login
                </button>
              </>
            )}
          </motion.div>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default Auth;
