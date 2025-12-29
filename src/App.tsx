import { Suspense, lazy } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { SubscriptionProvider } from "@/hooks/useSubscription";
import { PageLoader } from "@/components/ui/LogoSpinner";

// Eager load critical pages
import Index from "./pages/Index";
import Auth from "./pages/Auth";

// Lazy load other pages for better performance
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Patterns = lazy(() => import("./pages/Patterns"));
const Question = lazy(() => import("./pages/Question"));
const UserProfile = lazy(() => import("./pages/UserProfile"));
const AdminLayout = lazy(() => import("./pages/admin/AdminLayout"));
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));
const AdminTopics = lazy(() => import("./pages/admin/AdminTopics"));
const AdminPatterns = lazy(() => import("./pages/admin/AdminPatterns"));
const AdminQuestions = lazy(() => import("./pages/admin/AdminQuestions"));
const AdminCompanies = lazy(() => import("./pages/admin/AdminCompanies"));
const AdminUsers = lazy(() => import("./pages/admin/AdminUsers"));
const AdminBadges = lazy(() => import("./pages/admin/AdminBadges"));
const AdminTestimonials = lazy(() => import("./pages/admin/AdminTestimonials"));
const AdminSubscriptions = lazy(() => import("./pages/admin/AdminSubscriptions"));
const AdminEmailTemplates = lazy(() => import("./pages/admin/AdminEmailTemplates"));
const NotFound = lazy(() => import("./pages/NotFound"));
const ShippingPolicy = lazy(() => import("./pages/ShippingPolicy"));
const PrivacyPolicy = lazy(() => import("./pages/PrivacyPolicy"));
const TermsConditions = lazy(() => import("./pages/TermsConditions"));
const RefundPolicy = lazy(() => import("./pages/RefundPolicy"));

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <SubscriptionProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Suspense fallback={<PageLoader />}>
              <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/patterns" element={<Patterns />} />
              <Route path="/question/:id" element={<Question />} />
              <Route path="/profile/:username" element={<UserProfile />} />
              <Route path="/admin" element={<AdminLayout />}>
                <Route index element={<AdminDashboard />} />
                <Route path="topics" element={<AdminTopics />} />
                <Route path="patterns" element={<AdminPatterns />} />
                <Route path="questions" element={<AdminQuestions />} />
                <Route path="companies" element={<AdminCompanies />} />
                <Route path="users" element={<AdminUsers />} />
                <Route path="badges" element={<AdminBadges />} />
                <Route path="testimonials" element={<AdminTestimonials />} />
                <Route path="subscriptions" element={<AdminSubscriptions />} />
                <Route path="email-templates" element={<AdminEmailTemplates />} />
              </Route>
              <Route path="/shipping" element={<ShippingPolicy />} />
              <Route path="/privacy" element={<PrivacyPolicy />} />
              <Route path="/terms" element={<TermsConditions />} />
              <Route path="/refund" element={<RefundPolicy />} />
              <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </BrowserRouter>
        </TooltipProvider>
      </SubscriptionProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;