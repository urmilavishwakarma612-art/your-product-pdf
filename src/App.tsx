import { Suspense, lazy } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { SubscriptionProvider } from "@/hooks/useSubscription";
import { PageLoader } from "@/components/ui/LogoSpinner";

// Eager load critical pages
import Index from "./pages/Index";
import Auth from "./pages/Auth";

// Lazy load other pages for better performance
const Dashboard = lazy(() => import("./pages/Dashboard"));
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
const AdminCurriculum = lazy(() => import("./pages/admin/AdminCurriculum"));
const AdminModules = lazy(() => import("./pages/admin/AdminModules"));
const NotFound = lazy(() => import("./pages/NotFound"));
const ShippingPolicy = lazy(() => import("./pages/ShippingPolicy"));
const PrivacyPolicy = lazy(() => import("./pages/PrivacyPolicy"));
const TermsConditions = lazy(() => import("./pages/TermsConditions"));
const RefundPolicy = lazy(() => import("./pages/RefundPolicy"));
const PaymentStatus = lazy(() => import("./pages/PaymentStatus"));
const Pricing = lazy(() => import("./pages/Pricing"));
const InterviewSimulator = lazy(() => import("./pages/InterviewSimulator"));
const Curriculum = lazy(() => import("./pages/Curriculum"));
const CurriculumModule = lazy(() => import("./pages/CurriculumModule"));
const AITutor = lazy(() => import("./pages/AITutor"));
const Events = lazy(() => import("./pages/Events"));
const Gamification = lazy(() => import("./pages/Gamification"));
const Referral = lazy(() => import("./pages/Referral"));
const ProfileManagement = lazy(() => import("./pages/ProfileManagement"));
const Jobs = lazy(() => import("./pages/Jobs"));
const AdminJobs = lazy(() => import("./pages/admin/AdminJobs"));

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
              <Route path="/patterns" element={<Navigate to="/curriculum" replace />} />
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
                <Route path="curriculum" element={<AdminCurriculum />} />
                <Route path="modules" element={<AdminModules />} />
                <Route path="jobs" element={<AdminJobs />} />
              </Route>
              <Route path="/shipping" element={<ShippingPolicy />} />
              <Route path="/privacy" element={<PrivacyPolicy />} />
              <Route path="/terms" element={<TermsConditions />} />
              <Route path="/refund" element={<RefundPolicy />} />
              <Route path="/payment-status" element={<PaymentStatus />} />
              <Route path="/pricing" element={<Pricing />} />
              <Route path="/interview" element={<InterviewSimulator />} />
              <Route path="/curriculum" element={<Curriculum />} />
              <Route path="/curriculum/module/:id" element={<CurriculumModule />} />
              <Route path="/tutor" element={<AITutor />} />
              <Route path="/practice" element={<Navigate to="/tutor" replace />} />
              <Route path="/events" element={<Events />} />
              <Route path="/gamification" element={<Gamification />} />
              <Route path="/referral" element={<Referral />} />
              <Route path="/profile-settings" element={<ProfileManagement />} />
              <Route path="/jobs" element={<Jobs />} />
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