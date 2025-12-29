import { createContext, useContext, ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

interface Pattern {
  id: string;
  is_free: boolean;
  phase: number;
}

interface SubscriptionContextType {
  subscriptionStatus: string;
  subscriptionExpiresAt: string | null;
  isPremium: boolean;
  isLoading: boolean;
  canAccessPattern: (pattern: Pattern | null) => boolean;
  canAccessPhase: (phase: number) => boolean;
  refetch: () => void;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

export function SubscriptionProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();

  const { data: profile, isLoading, refetch } = useQuery({
    queryKey: ["subscription-profile", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from("profiles")
        .select("subscription_status, subscription_expires_at")
        .eq("id", user.id)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  const subscriptionStatus = profile?.subscription_status || "free";
  const subscriptionExpiresAt = profile?.subscription_expires_at || null;
  
  // Check if subscription is active and not expired
  const isPremium = (() => {
    if (subscriptionStatus !== "pro") return false;
    if (!subscriptionExpiresAt) return true; // No expiry = lifetime
    return new Date(subscriptionExpiresAt) > new Date();
  })();

  // Check if user can access a specific pattern
  const canAccessPattern = (pattern: Pattern | null): boolean => {
    if (!pattern) return false;
    if (pattern.is_free) return true; // Free patterns accessible to all
    if (pattern.phase === 1) return true; // Phase 1 is always free
    return isPremium; // Premium patterns need subscription
  };

  // Check if user can access a specific phase
  const canAccessPhase = (phase: number): boolean => {
    if (phase === 1) return true; // Phase 1 is always free
    return isPremium;
  };

  return (
    <SubscriptionContext.Provider 
      value={{ 
        subscriptionStatus, 
        subscriptionExpiresAt, 
        isPremium, 
        isLoading,
        canAccessPattern,
        canAccessPhase,
        refetch,
      }}
    >
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useSubscription() {
  const context = useContext(SubscriptionContext);
  if (context === undefined) {
    throw new Error("useSubscription must be used within a SubscriptionProvider");
  }
  return context;
}
