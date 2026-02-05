 import { Navigate, useLocation } from "react-router-dom";
 import { useAuth } from "@/hooks/useAuth";
 import { PageLoader } from "@/components/ui/LogoSpinner";
 
 interface ProtectedRouteProps {
   children: React.ReactNode;
 }
 
 export function ProtectedRoute({ children }: ProtectedRouteProps) {
   const { user, loading } = useAuth();
   const location = useLocation();
 
   if (loading) {
     return <PageLoader />;
   }
 
   if (!user) {
     // Save the attempted URL for redirecting after login
     return <Navigate to="/auth" state={{ from: location.pathname }} replace />;
   }
 
   return <>{children}</>;
 }