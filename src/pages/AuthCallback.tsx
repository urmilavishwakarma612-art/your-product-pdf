import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

const AuthCallback = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const handleAuth = async () => {
      const { error } = await supabase.auth.getSessionFromUrl();
      if (error) {
        console.error(error.message);
        navigate(`/auth?error=${encodeURIComponent(error.message)}`);
      } else {
        navigate("/dashboard"); // redirect after successful login
      }
    };
    handleAuth();
  }, [navigate, searchParams]);

  return <p>Logging in...</p>;
};

export default AuthCallback;
