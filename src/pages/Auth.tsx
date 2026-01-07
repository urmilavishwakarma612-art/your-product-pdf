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

const PROD_DOMAIN = "https://nexalgotrix.vercel.app";

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
    const next = searchParams.get("next");
    return next && next.startsWith("/") ? next : "/dashboard";
  }, [searchParams]);

  useEffect(() => {
    if (user) {
      navigate(nextPath, { replace: true });
    }
  }, [user, navigate, nextPath]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (mode === "login") {
        const { error } = await signIn(email, password);
        if (error) throw error;
        toast({ title: "Logged in" });
        navigate(nextPath, { replace: true });
      }

      if (mode === "signup") {
        const { error } = await signUp(email, password, username);
        if (error) throw error;
        toast({ title: "Account created" });
        navigate(nextPath, { replace: true });
      }

      if (mode === "forgot") {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${PROD_DOMAIN}/auth?reset=true`,
        });
        if (error) throw error;
        toast({ title: "Reset link sent" });
        setMode("login");
      }
    } catch (err: any) {
      toast({
        title: "Auth failed",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // ✅ GOOGLE LOGIN (FINAL)
  const handleGoogleSignIn = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${PROD_DOMAIN}/auth/callback`, // 🔥 ONLY CALLBACK
      },
    });

    if (error) {
      toast({
        title: "Google login failed",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-full max-w-md p-8 border rounded-xl">
        <Link to="/" className="flex items-center gap-2 mb-6">
          <ArrowLeft size={16} /> Back
        </Link>

        <h1 className="text-2xl font-bold text-center mb-6">
          {mode === "login"
            ? "Welcome back"
            : mode === "signup"
            ? "Create account"
            : "Reset password"}
        </h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === "signup" && (
            <div>
              <Label>Username</Label>
              <Input value={username} onChange={(e) => setUsername(e.target.value)} />
            </div>
          )}

          <div>
            <Label>Email</Label>
            <Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>

          {mode !== "forgot" && (
            <div>
              <Label>Password</Label>
              <Input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
          )}

          <Button className="w-full" disabled={loading}>
            {loading ? "Please wait..." : "Continue"}
          </Button>
        </form>

        {mode !== "forgot" && (
          <>
            <div className="my-6 text-center text-sm text-muted-foreground">OR</div>
            <Button variant="outline" className="w-full" onClick={handleGoogleSignIn}>
              Continue with Google
            </Button>
          </>
        )}

        <div className="mt-6 text-center text-sm">
          {mode === "login" && (
            <>
              No account?{" "}
              <button onClick={() => setMode("signup")} className="text-primary">
                Sign up
              </button>
            </>
          )}
          {mode === "signup" && (
            <>
              Already have account?{" "}
              <button onClick={() => setMode("login")} className="text-primary">
                Login
              </button>
            </>
          )}
          {mode === "forgot" && (
            <>
              Remember password?{" "}
              <button onClick={() => setMode("login")} className="text-primary">
                Login
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Auth;
