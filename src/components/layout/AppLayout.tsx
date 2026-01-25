import { useState, ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { HomeHeader } from "@/components/home/HomeHeader";
import { HomeSidebar } from "@/components/home/HomeSidebar";
import { MobileHeader } from "./MobileHeader";
import { BottomNav } from "./BottomNav";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import { useAuth } from "@/hooks/useAuth";

interface AppLayoutProps {
  children: ReactNode;
  showRightPanel?: boolean;
  rightPanel?: ReactNode;
  showSearch?: boolean;
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
  fullWidth?: boolean;
}

export function AppLayout({ 
  children, 
  showRightPanel = false,
  rightPanel,
  showSearch = false,
  searchQuery = "",
  onSearchChange,
  fullWidth = false,
}: AppLayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const isMobile = useIsMobile();
  const { user } = useAuth();

  // If not logged in, show minimal layout
  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        {children}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header - Different for mobile vs desktop */}
      {isMobile ? (
        <MobileHeader 
          showSearch={showSearch}
          searchQuery={searchQuery}
          onSearchChange={onSearchChange}
        />
      ) : (
        <HomeHeader 
          searchQuery={searchQuery} 
          onSearchChange={onSearchChange || (() => {})}
          onMobileMenuToggle={() => setMobileMenuOpen(!mobileMenuOpen)}
        />
      )}

      {/* Sidebar - Only on desktop */}
      {!isMobile && (
        <HomeSidebar 
          collapsed={sidebarCollapsed} 
          onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} 
        />
      )}

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {isMobile && mobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40"
              onClick={() => setMobileMenuOpen(false)}
            />
            <motion.div
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="fixed left-0 top-0 bottom-0 w-[280px] z-50"
            >
              <HomeSidebar 
                collapsed={false} 
                onToggle={() => setMobileMenuOpen(false)}
                isMobile={true}
              />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Main Content Area */}
      <div
        className={cn(
          "pt-14 min-h-screen transition-all duration-200",
          !isMobile && (sidebarCollapsed ? "pl-16" : "pl-[200px]"),
          isMobile && "pb-16" // Space for bottom nav
        )}
      >
        {showRightPanel && rightPanel ? (
          <div className="flex flex-col lg:flex-row">
            <main className={cn(
              "flex-1 p-4 sm:p-6 lg:pr-0 overflow-y-auto",
              fullWidth ? "" : "max-w-4xl mx-auto lg:mx-0"
            )}>
              {children}
            </main>
            <aside className="w-full lg:w-[320px] xl:w-[360px] p-4 sm:p-6 lg:pl-4 lg:sticky lg:top-16 lg:h-[calc(100vh-4rem)] lg:overflow-y-auto scrollbar-hide">
              {rightPanel}
            </aside>
          </div>
        ) : (
          <main className={cn(
            "p-4 sm:p-6",
            fullWidth ? "" : "container mx-auto max-w-5xl"
          )}>
            {children}
          </main>
        )}
      </div>

      {/* Bottom Navigation - Only on mobile */}
      {isMobile && <BottomNav />}
    </div>
  );
}
