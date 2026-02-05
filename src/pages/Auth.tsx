import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, Lock, User, ArrowLeft, Sparkles, Eye, EyeOff, KeyRound, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import logoImage from "@/assets/logo.png";

type AuthMode = "login" | "signup" | "forgot" | "reset";

const Auth = () => {
  const [mode, setMode] = useState<AuthMode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
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
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const accessToken = hashParams.get('access_token');
    const type = hashParams.get('type');
    
    if (accessToken && type === 'recovery') {
      setMode("reset");
      return;
    }

    if (user) {
      navigate(nextPath, { replace: true });
    }
  }, [user, navigate, nextPath]);

  const persistUpgradeIntentIfNeeded = () => {
    if (!isUpgradeFlow) return;
    const existing = sessionStorage.getItem('upgrade_pending');
    if (existing) return;
    const pending = { next: nextPath, context: 'feature', plan: 'lifetime' };
    sessionStorage.setItem('upgrade_pending', JSON.stringify(pending));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (mode === "reset") {
        if (password !== confirmPassword) {
          toast({ title: "Passwords don't match", description: "Please ensure both passwords are the same.", variant: "destructive" });
          setLoading(false);
          return;
        }
        if (password.length < 6) {
          toast({ title: "Password too short", description: "Password must be at least 6 characters.", variant: "destructive" });
          setLoading(false);
          return;
        }

        const { error } = await supabase.auth.updateUser({ password });
        if (error) {
          toast({ title: "Password reset failed", description: error.message, variant: "destructive" });
        } else {
          toast({ title: "Password updated!", description: "You can now log in with your new password." });
          window.history.replaceState(null, '', window.location.pathname);
          setMode("login");
          setPassword("");
          setConfirmPassword("");
        }
      } else if (mode === "login") {
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

  const modeConfig = {
    login: { title: "Welcome back", subtitle: "Continue your DSA mastery journey", button: "Sign In", icon: KeyRound },
    signup: { title: "Join the Elite", subtitle: "Start mastering patterns like a pro", button: "Create Account", icon: Shield },
    forgot: { title: "Reset Password", subtitle: "We'll send you a magic link", button: "Send Reset Link", icon: Mail },
    reset: { title: "New Password", subtitle: "Choose a strong password", button: "Update Password", icon: Lock },
  };

  const currentConfig = modeConfig[mode];
  const IconComponent = currentConfig.icon;

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4 relative overflow-hidden">
      {/* Premium gradient background */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(232,9,72,0.15),transparent_50%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,rgba(232,9,72,0.1),transparent_50%)]" />
      
      {/* Grid pattern overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:64px_64px]" />
      
      {/* Animated gradient orbs */}
      <motion.div
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.3, 0.5, 0.3],
        }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        className="absolute -top-32 -right-32 w-96 h-96 bg-primary/20 rounded-full blur-[128px] pointer-events-none"
      />
      <motion.div
        animate={{
          scale: [1.2, 1, 1.2],
          opacity: [0.2, 0.4, 0.2],
        }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        className="absolute -bottom-32 -left-32 w-96 h-96 bg-primary/15 rounded-full blur-[128px] pointer-events-none"
      />

      {/* Floating particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-primary/30 rounded-full"
            initial={{
              x: Math.random() * (typeof window !== 'undefined' ? window.innerWidth : 1000),
              y: Math.random() * (typeof window !== 'undefined' ? window.innerHeight : 800),
            }}
            animate={{
              y: [null, Math.random() * -300 - 100],
              opacity: [0, 1, 0],
            }}
            transition={{
              duration: Math.random() * 4 + 3,
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
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-sm relative z-10"
      >
        {/* Back button */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Link 
            to="/" 
            className="inline-flex items-center gap-2 text-white/50 hover:text-white mb-4 group transition-all duration-300"
          >
            <span className="p-1.5 rounded-lg bg-white/5 group-hover:bg-white/10 transition-colors">
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
            </span>
            <span className="text-xs font-medium">Back to home</span>
          </Link>
        </motion.div>

        {/* Main card */}
        <motion.div
          className="relative rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-xl p-6 shadow-2xl shadow-primary/5"
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1, duration: 0.5 }}
        >
          {/* Glow effect on card */}
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-b from-primary/10 via-transparent to-transparent opacity-50 pointer-events-none" />
          <div className="absolute inset-px rounded-2xl bg-gradient-to-b from-white/5 to-transparent pointer-events-none" />
          
          {/* Logo */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="flex items-center justify-center gap-2 mb-6"
          >
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="relative w-10 h-10 flex items-center justify-center"
            >
              <div className="absolute inset-0 bg-primary/20 rounded-xl blur-xl" />
              <img src={logoImage} alt="Nexalgotrix" className="w-9 h-9 object-contain relative z-10" />
            </motion.div>
            <span className="font-bold text-xl text-white tracking-tight">Nexalgotrix</span>
          </motion.div>

          {/* Title section with icon */}
          <AnimatePresence mode="wait">
            <motion.div
              key={mode}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="text-center mb-5"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
                className="inline-flex items-center justify-center w-11 h-11 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20 mb-3"
              >
                <IconComponent className="w-5 h-5 text-primary" />
              </motion.div>
              <h1 className="text-xl font-bold text-white mb-1">
                {currentConfig.title}
              </h1>
              <p className="text-white/50 text-xs">
                {currentConfig.subtitle}
              </p>
            </motion.div>
          </AnimatePresence>

          {/* Form */}
          <motion.form
            onSubmit={handleSubmit}
            className="space-y-3"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            {/* Username field for signup */}
            <AnimatePresence mode="wait">
              {mode === "signup" && (
                <motion.div
                  key="username"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-1.5"
                >
                  <Label htmlFor="username" className="text-xs font-medium text-white/70">Username</Label>
                  <div className="relative group">
                    <div className="absolute left-0 top-0 bottom-0 w-12 flex items-center justify-center pointer-events-none">
                      <User className="w-4 h-4 text-white/30 group-focus-within:text-primary transition-colors duration-300" />
                    </div>
                    <Input
                      id="username"
                      type="text"
                      placeholder="johndoe"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="pl-10 h-10 rounded-lg border-white/10 bg-white/5 text-white text-sm placeholder:text-white/30 focus:border-primary/50 focus:bg-white/[0.07] focus:ring-1 focus:ring-primary/20 transition-all duration-300"
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Email field */}
            <div className="space-y-1.5 relative">
              {mode !== "reset" && (
                <>
                  <Label htmlFor="email" className="text-xs font-medium text-white/70">Email</Label>
                  <div className="relative group">
                    <div className="absolute left-0 top-0 bottom-0 w-10 flex items-center justify-center pointer-events-none">
                      <Mail className="w-4 h-4 text-white/30 group-focus-within:text-primary transition-colors duration-300" />
                    </div>
                    <Input
                      id="email"
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10 h-10 rounded-lg border-white/10 bg-white/5 text-white text-sm placeholder:text-white/30 focus:border-primary/50 focus:bg-white/[0.07] focus:ring-1 focus:ring-primary/20 transition-all duration-300"
                      required
                    />
                  </div>
                </>
              )}
            </div>

            {/* Password field */}
            <AnimatePresence mode="wait">
              {(mode !== "forgot") && (
                <motion.div
                  key="password"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password" className="text-xs font-medium text-white/70">
                      {mode === "reset" ? "New Password" : "Password"}
                    </Label>
                    {mode === "login" && (
                      <button
                        type="button"
                        onClick={() => setMode("forgot")}
                        className="text-xs text-primary hover:text-primary/80 transition-colors touch-manipulation relative z-30 py-2 px-2 -my-2 rounded-md hover:bg-primary/10"
                      >
                        Forgot password?
                      </button>
                    )}
                  </div>
                  <div className="relative group">
                    <div className="absolute left-0 top-0 bottom-0 w-10 flex items-center justify-center pointer-events-none">
                      <Lock className="w-4 h-4 text-white/30 group-focus-within:text-primary transition-colors duration-300" />
                    </div>
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10 pr-10 h-10 rounded-lg border-white/10 bg-white/5 text-white text-sm placeholder:text-white/30 focus:border-primary/50 focus:bg-white/[0.07] focus:ring-1 focus:ring-primary/20 transition-all duration-300"
                      required
                      minLength={6}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-0 top-0 bottom-0 w-10 flex items-center justify-center text-white/30 hover:text-white/60 transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Confirm password for reset */}
            <AnimatePresence mode="wait">
              {mode === "reset" && (
                <motion.div
                  key="confirm-password"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-1.5"
                >
                  <Label htmlFor="confirmPassword" className="text-xs font-medium text-white/70">Confirm Password</Label>
                  <div className="relative group">
                    <div className="absolute left-0 top-0 bottom-0 w-10 flex items-center justify-center pointer-events-none">
                      <Lock className="w-4 h-4 text-white/30 group-focus-within:text-primary transition-colors duration-300" />
                    </div>
                    <Input
                      id="confirmPassword"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="pl-10 h-10 rounded-lg border-white/10 bg-white/5 text-white text-sm placeholder:text-white/30 focus:border-primary/50 focus:bg-white/[0.07] focus:ring-1 focus:ring-primary/20 transition-all duration-300"
                      required
                      minLength={6}
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Submit button */}
            <motion.div 
              whileHover={{ scale: 1.01 }} 
              whileTap={{ scale: 0.98 }}
              className="pt-1"
            >
              <Button 
                type="submit" 
                className="relative w-full h-10 rounded-lg text-sm font-semibold bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-white shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-all duration-300 overflow-hidden group"
                disabled={loading}
              >
                <span className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
                {loading ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
                  />
                ) : (
                  <span className="flex items-center gap-2">
                    {currentConfig.button}
                    <Sparkles className="w-4 h-4 ml-2" />
                  </span>
                )}
              </Button>
            </motion.div>
          </motion.form>

          {/* Divider */}
          <div className="relative my-5">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/10" />
            </div>
          </div>

          {/* Mode switch */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-center text-xs text-white/50 relative z-20"
          >
            {mode === "login" && (
              <p>
                New to Nexalgotrix?{" "}
                <button
                  type="button"
                  onClick={() => setMode("signup")}
                  className="text-primary hover:text-primary/80 font-semibold transition-colors px-2 py-1 -mx-2 rounded-md hover:bg-primary/10 touch-manipulation"
                >
                  Create an account
                </button>
              </p>
            )}
            {mode === "signup" && (
              <p>
                Already a member?{" "}
                <button
                  type="button"
                  onClick={() => setMode("login")}
                  className="text-primary hover:text-primary/80 font-semibold transition-colors px-2 py-1 -mx-2 rounded-md hover:bg-primary/10 touch-manipulation"
                >
                  Sign in
                </button>
              </p>
            )}
            {(mode === "forgot" || mode === "reset") && (
              <p>
                Remembered your password?{" "}
                <button
                  type="button"
                  onClick={() => setMode("login")}
                  className="text-primary hover:text-primary/80 font-semibold transition-colors px-2 py-1 -mx-2 rounded-md hover:bg-primary/10 touch-manipulation"
                >
                  Back to sign in
                </button>
              </p>
            )}
          </motion.div>
        </motion.div>

        {/* Security badge */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="flex items-center justify-center gap-1.5 mt-5 text-white/25 text-[10px]"
        >
          <Shield className="w-3 h-3" />
          <span>Secured with end-to-end encryption</span>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default Auth;
