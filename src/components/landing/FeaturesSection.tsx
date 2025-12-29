import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { 
  Lightbulb, 
  Route, 
  Code, 
  Rocket, 
  Trophy, 
  Flame, 
  Medal, 
  TrendingUp,
  ExternalLink,
  Youtube,
  BookOpen,
  Sparkles
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: "easeOut" as const,
    },
  },
};

export function FeaturesSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  });

  const backgroundY = useTransform(scrollYProgress, [0, 1], [0, -100]);

  return (
    <section 
      ref={sectionRef}
      id="features" 
      className="py-16 sm:py-24 lg:py-32 relative overflow-hidden"
    >
      {/* Animated background */}
      <motion.div
        style={{ y: backgroundY }}
        className="absolute inset-0 bg-gradient-to-b from-card/50 via-background to-background pointer-events-none"
      />
      
      {/* Decorative elements */}
      <div className="absolute top-20 left-10 w-48 sm:w-72 h-48 sm:h-72 bg-primary/5 rounded-full blur-[100px]" />
      <div className="absolute bottom-20 right-10 w-64 sm:w-96 h-64 sm:h-96 bg-secondary/5 rounded-full blur-[120px]" />

      <div className="container px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="text-center max-w-3xl mx-auto mb-12 sm:mb-16 lg:mb-20"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-primary/10 border border-primary/20 mb-4 sm:mb-6"
          >
            <Sparkles className="w-3 h-3 sm:w-4 sm:h-4 text-primary" />
            <span className="text-xs sm:text-sm font-medium text-primary">Premium Features</span>
          </motion.div>
          <h2 className="text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-4 sm:mb-6 tracking-tight">
            Everything You Need to <span className="gradient-text">Ace DSA</span>
          </h2>
          <p className="text-base sm:text-lg lg:text-xl text-muted-foreground leading-relaxed">
            Premium features designed for focused, efficient learning
          </p>
        </motion.div>

        {/* AI Mentor Feature */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8 }}
          className="interactive-card p-5 sm:p-8 md:p-12 mb-10 sm:mb-16"
        >
          <div className="grid md:grid-cols-2 gap-6 sm:gap-8 lg:gap-12 items-center">
            <div>
              <motion.span 
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-secondary/15 text-secondary text-xs sm:text-sm font-medium mb-4 sm:mb-6"
              >
                <Lightbulb className="w-3 h-3 sm:w-4 sm:h-4" />
                AI Mentor
              </motion.span>
              <h3 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold mb-4 sm:mb-6 leading-tight">
                4 Levels of AI-Powered Guidance
              </h3>
              <p className="text-sm sm:text-base lg:text-lg text-muted-foreground leading-relaxed">
                Stuck on a problem? Our AI mentor provides progressive hints — from subtle nudges to complete solutions.
              </p>
            </div>
            <motion.div 
              variants={containerVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="grid grid-cols-2 gap-3 sm:gap-4"
            >
              <AIModeCard
                icon={<Lightbulb className="w-5 h-5" />}
                title="Hint Mode"
                description="Subtle direction without revealing the approach"
                colorVariant="emerald"
              />
              <AIModeCard
                icon={<Route className="w-5 h-5" />}
                title="Approach"
                description="Pattern name + high-level steps"
                colorVariant="magenta"
              />
              <AIModeCard
                icon={<Code className="w-5 h-5" />}
                title="Brute Force"
                description="Inefficient but working solution"
                colorVariant="purple"
              />
              <AIModeCard
                icon={<Rocket className="w-5 h-5" />}
                title="Optimal"
                description="Best solution with dry run"
                colorVariant="teal"
              />
            </motion.div>
          </div>
        </motion.div>

        {/* Gamification Features */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 mb-10 sm:mb-16"
        >
          <FeatureCard
            icon={<Trophy className="w-6 h-6" />}
            title="XP System"
            description="Earn XP for every problem. More for harder ones, bonus for minimal hints."
            colorVariant="purple"
          />
          <FeatureCard
            icon={<Flame className="w-6 h-6" />}
            title="Daily Streaks"
            description="Build consistency. Don't break the chain. Unlock streak milestones."
            colorVariant="crimson"
          />
          <FeatureCard
            icon={<Medal className="w-6 h-6" />}
            title="Badges"
            description="Collect pattern mastery badges, consistency badges, and more."
            colorVariant="emerald"
          />
          <FeatureCard
            icon={<TrendingUp className="w-6 h-6" />}
            title="Leaderboard"
            description="Compete globally. Weekly resets. Climb to the top."
            colorVariant="teal"
          />
        </motion.div>

        {/* Resource Links Feature */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="interactive-card p-6 sm:p-10"
        >
          <div className="text-center max-w-2xl mx-auto">
            <h3 className="text-xl sm:text-2xl md:text-3xl font-bold mb-4 sm:mb-6">Curated Resources for Every Problem</h3>
            <p className="text-sm sm:text-base lg:text-lg text-muted-foreground mb-6 sm:mb-10 leading-relaxed">
              Each problem links to LeetCode for practice, YouTube for video explanations, and articles for deep dives.
            </p>
            <motion.div 
              className="flex flex-wrap justify-center gap-3 sm:gap-4"
              variants={containerVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
            >
              <ResourceBadge icon={<ExternalLink />} label="LeetCode" />
              <ResourceBadge icon={<Youtube />} label="YouTube" />
              <ResourceBadge icon={<BookOpen />} label="Articles" />
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

interface AIModeCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  colorVariant: "emerald" | "magenta" | "purple" | "teal" | "crimson";
}

function AIModeCard({ icon, title, description, colorVariant }: AIModeCardProps) {
  const iconBgClasses = {
    emerald: "bg-white/20",
    magenta: "bg-white/20",
    purple: "bg-white/20",
    teal: "bg-white/20",
    crimson: "bg-white/20",
  };

  return (
    <Card
      variant={colorVariant}
      className="p-3 sm:p-5 cursor-default"
    >
      <motion.div
        variants={itemVariants}
        whileHover={{ y: -6, scale: 1.02 }}
        className="h-full"
      >
        <motion.div 
          className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg ${iconBgClasses[colorVariant]} flex items-center justify-center mb-2 sm:mb-4`}
          whileHover={{ rotate: [0, -10, 10, 0], scale: 1.1 }}
          transition={{ duration: 0.4 }}
        >
          <span className="scale-75 sm:scale-100">{icon}</span>
        </motion.div>
        <h4 className="font-semibold mb-1 sm:mb-2 text-sm sm:text-base">{title}</h4>
        <p className="text-xs sm:text-sm text-white/70 leading-relaxed">{description}</p>
      </motion.div>
    </Card>
  );
}

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  colorVariant: "emerald" | "magenta" | "purple" | "teal" | "crimson";
}

function FeatureCard({ icon, title, description, colorVariant }: FeatureCardProps) {
  return (
    <Card
      variant={colorVariant}
      className="p-4 sm:p-6 text-center cursor-default"
    >
      <motion.div
        variants={itemVariants}
        whileHover={{ y: -8, scale: 1.02 }}
        className="h-full"
      >
        <motion.div 
          className="w-10 h-10 sm:w-14 sm:h-14 rounded-xl bg-white/20 flex items-center justify-center mx-auto mb-3 sm:mb-5"
          whileHover={{ rotate: [0, -10, 10, 0], scale: 1.1 }}
          transition={{ duration: 0.4 }}
        >
          <span className="scale-75 sm:scale-100">{icon}</span>
        </motion.div>
        <h4 className="font-semibold text-sm sm:text-lg mb-2 sm:mb-3">{title}</h4>
        <p className="text-xs sm:text-sm text-white/70 leading-relaxed">{description}</p>
      </motion.div>
    </Card>
  );
}

function ResourceBadge({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <motion.div
      variants={itemVariants}
      whileHover={{ scale: 1.05, y: -2 }}
      className="flex items-center gap-2 sm:gap-3 px-4 sm:px-6 py-2 sm:py-3 rounded-xl bg-muted/50 border border-border/50 hover:border-primary/30 hover:bg-muted transition-all duration-300 cursor-default"
    >
      <span className="text-primary scale-75 sm:scale-100">{icon}</span>
      <span className="font-medium text-sm sm:text-base">{label}</span>
    </motion.div>
  );
}
