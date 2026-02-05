import { useAuth } from "@/hooks/useAuth";
import { HomeLayout } from "@/components/home/HomeLayout";
import { Navbar } from "@/components/landing/Navbar";
import { HeroSection } from "@/components/landing/HeroSection";
import { PhasesSection } from "@/components/landing/PhasesSection";
import { FeaturesSection } from "@/components/landing/FeaturesSection";
import { TestimonialsSection } from "@/components/landing/TestimonialsSection";
import { FAQSection } from "@/components/landing/FAQSection";
import { PricingSection } from "@/components/landing/PricingSection";
import { Footer } from "@/components/landing/Footer";

const Index = () => {
  const { user, loading } = useAuth();

  // Show new 3-panel dashboard layout for logged-in users
  if (!loading && user) {
    return <HomeLayout />;
  }

  // Show landing page for non-logged-in users
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main>
        <HeroSection />
        <PhasesSection />
        <FeaturesSection />
        <TestimonialsSection />
        <FAQSection />
        <PricingSection />
      </main>
      <Footer />
    </div>
  );
};

export default Index;