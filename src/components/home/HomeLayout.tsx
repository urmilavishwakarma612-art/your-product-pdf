import { useState } from "react";
import { motion } from "framer-motion";
import { HomeHeader } from "./HomeHeader";
import { HomeSidebar } from "./HomeSidebar";
import { HomeCenterPanel } from "./HomeCenterPanel";
import { HomeRightPanel } from "./HomeRightPanel";
import { cn } from "@/lib/utils";

export function HomeLayout() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <div className="min-h-screen bg-background">
      {/* Fixed Header */}
      <HomeHeader searchQuery={searchQuery} onSearchChange={setSearchQuery} />

      {/* Fixed Sidebar */}
      <HomeSidebar 
        collapsed={sidebarCollapsed} 
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} 
      />

      {/* Main Content Area */}
      <div
        className={cn(
          "pt-16 min-h-screen transition-all duration-200",
          sidebarCollapsed ? "pl-16" : "pl-[200px]"
        )}
      >
        <div className="flex">
          {/* Center Panel - Scrollable */}
          <main className="flex-1 p-6 lg:pr-0 overflow-y-auto">
            <div className="max-w-4xl">
              <HomeCenterPanel searchQuery={searchQuery} />
            </div>
          </main>

          {/* Right Panel - Fixed on large screens */}
          <aside className="hidden lg:block w-[340px] xl:w-[380px] p-6 pl-4 sticky top-16 h-[calc(100vh-4rem)] overflow-y-auto scrollbar-hide">
            <HomeRightPanel />
          </aside>
        </div>
      </div>
    </div>
  );
}
