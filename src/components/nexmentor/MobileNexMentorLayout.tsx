import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence, PanInfo } from "framer-motion";
import { cn } from "@/lib/utils";
import { 
  BookOpen, 
  Code2, 
  MessageSquare,
  ChevronLeft,
  ChevronRight 
} from "lucide-react";

interface MobileNexMentorLayoutProps {
  problemPanel: React.ReactNode;
  editorPanel: React.ReactNode;
  chatPanel: React.ReactNode;
  currentStep: number;
}

const ALL_TABS = [
  { id: "problem", label: "Problem", icon: BookOpen },
  { id: "editor", label: "Code", icon: Code2 },
  { id: "chat", label: "Chat", icon: MessageSquare },
] as const;

type TabId = typeof ALL_TABS[number]["id"];

export function MobileNexMentorLayout({
  problemPanel,
  editorPanel,
  chatPanel,
  currentStep,
}: MobileNexMentorLayoutProps) {
  // At Step 4, hide chat tab
  const isStep4 = currentStep >= 4;
  const TABS = isStep4 ? ALL_TABS.filter(t => t.id !== "chat") : ALL_TABS;
  
  const [activeTab, setActiveTab] = useState<TabId>(isStep4 ? "editor" : "problem");
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Auto-switch to editor when Step 4 is unlocked
  useEffect(() => {
    if (isStep4 && activeTab === "chat") {
      setActiveTab("editor");
    }
  }, [isStep4, activeTab]);
  
  const activeIndex = TABS.findIndex(t => t.id === activeTab);

  const handleSwipe = (info: PanInfo) => {
    const threshold = 50;
    const velocity = info.velocity.x;
    const offset = info.offset.x;

    if (Math.abs(velocity) > 500 || Math.abs(offset) > threshold) {
      if (offset > 0 && activeIndex > 0) {
        // Swipe right - go to previous tab
        setActiveTab(TABS[activeIndex - 1].id);
      } else if (offset < 0 && activeIndex < TABS.length - 1) {
        // Swipe left - go to next tab
        setActiveTab(TABS[activeIndex + 1].id);
      }
    }
  };

  const goToPrevTab = () => {
    if (activeIndex > 0) {
      setActiveTab(TABS[activeIndex - 1].id);
    }
  };

  const goToNextTab = () => {
    if (activeIndex < TABS.length - 1) {
      setActiveTab(TABS[activeIndex + 1].id);
    }
  };

  const renderPanel = (tabId: TabId) => {
    switch (tabId) {
      case "problem":
        return problemPanel;
      case "editor":
        return editorPanel;
      case "chat":
        return chatPanel;
    }
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Tab Navigation */}
      <div className="flex-shrink-0 bg-card border-b border-border">
        <div className="flex items-center justify-between px-2">
          {/* Prev Arrow */}
          <button
            onClick={goToPrevTab}
            disabled={activeIndex === 0}
            className={cn(
              "p-2 rounded-lg transition-colors",
              activeIndex === 0 ? "text-muted-foreground/30" : "text-muted-foreground hover:bg-muted"
            )}
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          {/* Tabs */}
          <div className="flex items-center gap-1 flex-1 justify-center py-2">
            {TABS.map((tab) => {
              const isActive = activeTab === tab.id;
              const Icon = tab.icon;
              const isLocked = tab.id === "editor" && currentStep < 4;
              
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all",
                    isActive 
                      ? "bg-primary text-primary-foreground" 
                      : "text-muted-foreground hover:bg-muted",
                    isLocked && !isActive && "opacity-60"
                  )}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                  {isLocked && (
                    <span className="text-[10px] ml-0.5">🔒</span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Next Arrow */}
          <button
            onClick={goToNextTab}
            disabled={activeIndex === TABS.length - 1}
            className={cn(
              "p-2 rounded-lg transition-colors",
              activeIndex === TABS.length - 1 ? "text-muted-foreground/30" : "text-muted-foreground hover:bg-muted"
            )}
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Swipe Indicator Dots */}
        <div className="flex items-center justify-center gap-2 pb-2">
          {TABS.map((tab, idx) => (
            <div
              key={tab.id}
              className={cn(
                "w-2 h-2 rounded-full transition-all",
                idx === activeIndex ? "bg-primary w-4" : "bg-muted-foreground/30"
              )}
            />
          ))}
        </div>
      </div>

      {/* Swipeable Content Area */}
      <div 
        ref={containerRef}
        className="flex-1 overflow-hidden relative"
      >
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.2}
            onDragEnd={(_, info) => handleSwipe(info)}
            className="absolute inset-0 overflow-auto"
          >
            {renderPanel(activeTab)}
          </motion.div>
        </AnimatePresence>
      </div>

    </div>
  );
}
