import { useAuth } from "@/hooks/useAuth";
import { HomeLayout } from "@/components/home/HomeLayout";
import { LandingPage } from "@/components/landing/LandingPage";
import { LogoSpinner } from "@/components/ui/LogoSpinner";

const Index = () => {
  const { user, loading } = useAuth();

  // Show loading spinner while auth is being determined
  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <LogoSpinner size="lg" />
      </div>
    );
  }

  // Show new 3-panel dashboard layout for logged-in users
  if (user) {
    return <HomeLayout />;
  }

  // Show landing page for non-logged-in users
  return <LandingPage />;
};

export default Index;