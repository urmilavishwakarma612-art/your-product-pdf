import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Mail, Lock, User, ArrowLeft, Eye, EyeOff, CheckCircle2 } from "lucide-react";
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
    login: { title: "Welcome back", subtitle: "Continue your DSA mastery journey", button: "Sign In" },
    signup: { title: "Create an account", subtitle: "Start mastering patterns like a pro", button: "Create Account" },
    forgot: { title: "Reset Password", subtitle: "We'll send you a magic link", button: "Send Reset Link" },
    reset: { title: "New Password", subtitle: "Choose a strong password", button: "Update Password" },
  };

  const currentConfig = modeConfig[mode];

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left Side - CTA Section (Desktop Only) */}
      <div className="hidden lg:flex lg:w-1/2 bg-black relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-black via-gray-900 to-black" />
        {/* Subtle glow effects */}
        <div className="absolute top-1/4 -left-20 w-72 h-72 bg-primary/20 rounded-full blur-[100px]" />
        <div className="absolute bottom-1/4 right-0 w-60 h-60 bg-primary/15 rounded-full blur-[80px]" />
        <div className="relative z-10 flex flex-col justify-center px-12 xl:px-20 text-white">
          <Link to="/" className="inline-flex items-center gap-2 text-white/80 hover:text-white mb-8 group transition-colors">
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            <span className="text-sm font-medium">Back to home</span>
          </Link>
          
          <div className="flex items-center gap-3 mb-8">
            <img src={logoImage} alt="Nexalgotrix" className="w-12 h-12 object-contain" />
            <span className="font-bold text-2xl text-primary">Nexalgotrix</span>
          </div>
          
          <h1 className="text-4xl xl:text-5xl font-bold mb-6 leading-tight">
            Master DSA Patterns.<br />
            Crack Any Interview.
          </h1>
          
          <p className="text-lg text-white/80 mb-8 max-w-md">
            Join thousands of developers who've transformed their problem-solving skills with our pattern-based learning approach.
          </p>
          
          <div className="space-y-4">
            {[
              "15+ proven DSA patterns",
              "AI-powered personalized tutoring",
              "Real interview simulations",
              "Track progress & earn badges"
            ].map((feature, i) => (
              <div key={i} className="flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-white/90" />
                <span className="text-white/90">{feature}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Side - Auth Form */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-md bg-card border border-border rounded-xl p-8 shadow-sm">
          {/* Mobile Back Button */}
          <div className="lg:hidden">
            <Link 
              to="/" 
              className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 group transition-colors"
            >
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
              <span className="text-sm font-medium">Back to home</span>
            </Link>

            {/* Mobile Logo */}
            <div className="flex items-center gap-2 mb-8">
              <img src={logoImage} alt="Nexalgotrix" className="w-10 h-10 object-contain" />
              <span className="font-bold text-xl text-foreground">Nexalgotrix</span>
            </div>
          </div>

          {/* Title */}
          <AnimatePresence mode="wait">
            <motion.div
              key={mode}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="mb-8"
            >
              <h1 className="text-2xl font-bold text-foreground mb-2">
                {currentConfig.title}
              </h1>
              <p className="text-muted-foreground">
                {currentConfig.subtitle}
              </p>
            </motion.div>
          </AnimatePresence>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Username field for signup */}
            <AnimatePresence mode="wait">
              {mode === "signup" && (
                <motion.div
                  key="username"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-2"
                >
                  <Label htmlFor="username">Username</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="username"
                      type="text"
                      placeholder="johndoe"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Email field */}
            {mode !== "reset" && (
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>
            )}

            {/* Password field */}
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
                    <Label htmlFor="password">
                      {mode === "reset" ? "New Password" : "Password"}
                    </Label>
                    {mode === "login" && (
                      <button
                        type="button"
                        onClick={() => setMode("forgot")}
                        className="text-sm text-primary hover:text-primary/80 transition-colors"
                      >
                        Forgot password?
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10 pr-10"
                      required
                      minLength={6}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
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
                  className="space-y-2"
                >
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="confirmPassword"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="pl-10"
                      required
                      minLength={6}
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Submit button */}
            <Button 
              type="submit" 
              className="w-full"
              disabled={loading}
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                currentConfig.button
              )}
            </Button>
          </form>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border" />
            </div>
          </div>

          {/* Mode switch */}
          <div className="text-center text-sm text-muted-foreground">
            {mode === "login" && (
              <p>
                New to Nexalgotrix?{" "}
                <button
                  type="button"
                  onClick={() => setMode("signup")}
                  className="text-primary hover:text-primary/80 font-semibold transition-colors"
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
                  className="text-primary hover:text-primary/80 font-semibold transition-colors"
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
                  className="text-primary hover:text-primary/80 font-semibold transition-colors"
                >
                  Back to sign in
                </button>
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;
