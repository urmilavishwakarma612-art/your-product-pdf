import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { motion, useScroll, useTransform } from "framer-motion";
import { Lock, Unlock, ChevronRight, Layers, Crown, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { UpgradeModal } from "@/components/premium/UpgradeModal";
import { useSubscription } from "@/hooks/useSubscription";
import { useAuth } from "@/hooks/useAuth";

interface CurriculumLevel {
  id: string;
  level_number: number;
  name: string;
  description: string | null;
  is_free: boolean | null;
  week_start: number | null;
  week_end: number | null;
  icon: string | null;
  color: string | null;
}

export function PhasesSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isPremium } = useSubscription();
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  });

  const lineHeight = useTransform(scrollYProgress, [0.1, 0.9], ["0%", "100%"]);

  const { data: levels = [] } = useQuery({
    queryKey: ["curriculum-levels-landing"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("curriculum_levels")
        .select("*")
        .order("level_number", { ascending: true });
      
      if (error) throw error;
      return data as CurriculumLevel[];
    },
  });

  const handleLevelClick = (level: CurriculumLevel) => {
    const isFree = level.is_free;
    const canAccess = isFree || isPremium;
    
    if (canAccess) {
      // Navigate to curriculum and scroll to the level
      navigate(`/curriculum#level-${level.level_number}`);
    } else {
      // Show upgrade modal for non-premium users on pro levels
      setShowUpgradeModal(true);
    }
  };

  return (
    <>
      <section ref={sectionRef} id="phases" className="py-20 md:py-32 relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-radial from-primary/5 to-transparent rounded-full blur-3xl pointer-events-none" />

        <div className="container px-4 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="text-center max-w-3xl mx-auto mb-12 md:mb-20"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 border border-accent/20 mb-6"
            >
              <Layers className="w-4 h-4 text-accent" />
              <span className="text-sm font-medium text-accent">18-Week Curriculum</span>
            </motion.div>
            <h2 className="text-3xl md:text-5xl lg:text-6xl font-bold mb-4 md:mb-6 tracking-tight">
              Structured <span className="gradient-text-accent">Learning Path</span>
            </h2>
            <p className="text-base md:text-xl text-muted-foreground leading-relaxed px-4">
              11 levels from foundation to interview mastery. Each level builds on the previous.
            </p>
          </motion.div>

          <div className="max-w-4xl mx-auto relative">
            {/* Progress line - hidden on mobile */}
            <div className="absolute left-7 top-0 bottom-0 w-0.5 bg-border/30 hidden md:block">
              <motion.div
                style={{ height: lineHeight }}
                className="w-full bg-gradient-to-b from-primary via-secondary to-accent"
              />
            </div>

            <div className="space-y-3 md:space-y-5">
              {levels.map((level, index) => (
                <motion.div
                  key={level.id}
                  initial={{ opacity: 0, x: -30 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, margin: "-50px" }}
                  transition={{ delay: index * 0.05, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                >
                  <LevelCard 
                    level={level} 
                    index={index} 
                    isPremium={isPremium}
                    onClick={() => handleLevelClick(level)} 
                  />
                </motion.div>
              ))}
            </div>
          </div>

          {/* Bottom CTA */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
            className="text-center mt-12 md:mt-16"
          >
            <p className="text-muted-foreground mb-4">
              <span className="text-success font-medium">Level 0 & 1 are FREE</span> • Unlock all with Pro
            </p>
          </motion.div>
        </div>
      </section>

      <UpgradeModal 
        isOpen={showUpgradeModal} 
        onClose={() => setShowUpgradeModal(false)} 
      />
    </>
  );
}

interface LevelCardProps {
  level: CurriculumLevel;
  index: number;
  isPremium: boolean;
  onClick: () => void;
}

function LevelCard({ level, index, isPremium, onClick }: LevelCardProps) {
  const isFree = level.is_free;
  const canAccess = isFree || isPremium;
  const weekRange = level.week_start && level.week_end 
    ? level.week_start === level.week_end 
      ? `Week ${level.week_start}`
      : `Week ${level.week_start}-${level.week_end}`
    : level.level_number === 0 
      ? "Foundation"
      : null;

  return (
    <motion.div
      whileHover={{ x: canAccess ? 8 : 4, scale: canAccess ? 1.01 : 1.005 }}
      onClick={onClick}
      className={`relative overflow-hidden rounded-xl border backdrop-blur-sm p-4 md:p-6 flex items-center gap-4 md:gap-6 group transition-all duration-300 cursor-pointer ${
        canAccess 
          ? "bg-card/50 border-success/30 hover:border-success/50" 
          : "bg-muted/30 border-border/30 hover:border-primary/30"
      }`}
    >
      {/* Locked overlay for Pro levels */}
      {!canAccess && (
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-primary/5 pointer-events-none" />
      )}

      {/* Level Number */}
      <motion.div
        whileHover={{ scale: canAccess ? 1.1 : 1, rotate: canAccess ? 5 : 0 }}
        className={`w-12 h-12 md:w-14 md:h-14 rounded-xl flex items-center justify-center font-bold text-lg md:text-xl relative flex-shrink-0 ${
          canAccess
            ? "bg-success/15 text-success border border-success/30"
            : "bg-muted text-muted-foreground border border-border/50"
        }`}
      >
        {level.level_number}
        {canAccess && (
          <motion.div
            className="absolute -top-1 -right-1 w-3 h-3 bg-success rounded-full"
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
        )}
      </motion.div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 md:gap-3 mb-1.5 md:mb-2 flex-wrap">
          <h3 className={`text-base md:text-lg font-semibold transition-colors truncate ${
            canAccess ? "group-hover:text-success" : "text-muted-foreground"
          }`}>
            {level.name}
          </h3>
          {isFree ? (
            <motion.span 
              whileHover={{ scale: 1.05 }}
              className="inline-flex items-center gap-1 px-2 md:px-3 py-0.5 md:py-1 rounded-full bg-success/15 text-success text-xs font-medium border border-success/30"
            >
              <Unlock className="w-3 h-3" />
              <span className="hidden sm:inline">Free</span>
            </motion.span>
          ) : isPremium ? (
            <motion.span 
              whileHover={{ scale: 1.05 }}
              className="inline-flex items-center gap-1 px-2 md:px-3 py-0.5 md:py-1 rounded-full bg-success/15 text-success text-xs font-medium border border-success/30"
            >
              <Unlock className="w-3 h-3" />
              <span className="hidden sm:inline">Unlocked</span>
            </motion.span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2 md:px-3 py-0.5 md:py-1 rounded-full bg-primary/10 text-primary text-xs font-medium border border-primary/30">
              <Crown className="w-3 h-3" />
              <span className="hidden sm:inline">Pro</span>
            </span>
          )}
        </div>
        
        {level.description && (
          <p className="text-muted-foreground text-xs md:text-sm leading-relaxed line-clamp-2 pr-4">
            {level.description}
          </p>
        )}
        
        {!level.description && weekRange && (
          <p className="text-muted-foreground text-xs md:text-sm">
            {weekRange}
          </p>
        )}
      </div>

      {/* Week Badge - Desktop only */}
      {weekRange && level.description && (
        <div className="text-right hidden lg:block">
          <div className="text-xs text-muted-foreground bg-muted/50 px-3 py-1.5 rounded-lg">
            {weekRange}
          </div>
        </div>
      )}

      {/* Arrow / Lock Icon */}
      <motion.div
        animate={canAccess ? { x: [0, 4, 0] } : {}}
        transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
        className="flex-shrink-0"
      >
        {canAccess ? (
          <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-success transition-colors" />
        ) : (
          <div className="w-8 h-8 md:w-9 md:h-9 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
            <Lock className="w-4 h-4 text-primary" />
          </div>
        )}
      </motion.div>

      {/* Hover glow effect for locked cards */}
      {!canAccess && (
        <motion.div
          initial={{ opacity: 0 }}
          whileHover={{ opacity: 1 }}
          className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-primary/5 pointer-events-none"
        />
      )}
    </motion.div>
  );
}