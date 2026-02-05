 import { Navbar } from "@/components/landing/Navbar";
 import { HeroSection } from "@/components/landing/HeroSection";
 import { PhasesSection } from "@/components/landing/PhasesSection";
 import { FeaturesSection } from "@/components/landing/FeaturesSection";
 import { TestimonialsSection } from "@/components/landing/TestimonialsSection";
 import { FAQSection } from "@/components/landing/FAQSection";
 import { PricingSection } from "@/components/landing/PricingSection";
 import { Footer } from "@/components/landing/Footer";
 
 export function LandingPage() {
   return (
     <div className="min-h-screen bg-black">
       {/* Premium gradient background - consistent with Auth page */}
       <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,rgba(232,9,72,0.15),transparent_50%)] pointer-events-none" />
       <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_bottom_right,rgba(232,9,72,0.1),transparent_50%)] pointer-events-none" />
       
       {/* Grid pattern overlay */}
       <div className="fixed inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:64px_64px] pointer-events-none" />
       
       <div className="relative z-10">
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
     </div>
   );
 }