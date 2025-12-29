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
      className="py-32 relative overflow-hidden"
    >
      {/* Animated background */}
      <motion.div
        style={{ y: backgroundY }}
        className="absolute inset-0 bg-gradient-to-b from-card/50 via-background to-background pointer-events-none"
      />
      
      {/* Decorative elements */}
      <div className="absolute top-20 left-10 w-72 h-72 bg-primary/5 rounded-full blur-[100px]" />
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-secondary/5 rounded-full blur-[120px]" />

      <div className="container px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="text-center max-w-3xl mx-auto mb-20"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6"
          >
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-primary">Premium Features</span>
          </motion.div>
          <h2 className="text-4xl md:text-6xl font-bold mb-6 tracking-tight">
            Everything You Need to <span className="gradient-text">Ace DSA</span>
          </h2>
          <p className="text-xl text-muted-foreground leading-relaxed">
            Premium features designed for focused, efficient learning
          </p>
        </motion.div>

        {/* AI Mentor Feature */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8 }}
          className="interactive-card p-8 md:p-12 mb-16"
        >
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <motion.span 
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary/15 text-secondary text-sm font-medium mb-6"
              >
                <Lightbulb className="w-4 h-4" />
                AI Mentor
              </motion.span>
              <h3 className="text-3xl md:text-4xl font-bold mb-6 leading-tight">
                4 Levels of AI-Powered Guidance
              </h3>
              <p className="text-muted-foreground text-lg leading-relaxed">
                Stuck on a problem? Our AI mentor provides progressive hints — from subtle nudges to complete solutions. Build real understanding, not dependency.
              </p>
            </div>
            <motion.div 
              variants={containerVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="grid grid-cols-2 gap-4"
            >
              <AIModeCard
                icon={<Lightbulb className="w-5 h-5" />}
                title="Hint Mode"
                description="Subtle direction without revealing the approach"
                color="warning"
              />
              <AIModeCard
                icon={<Route className="w-5 h-5" />}
                title="Approach"
                description="Pattern name + high-level steps"
                color="primary"
              />
              <AIModeCard
                icon={<Code className="w-5 h-5" />}
                title="Brute Force"
                description="Inefficient but working solution"
                color="secondary"
              />
              <AIModeCard
                icon={<Rocket className="w-5 h-5" />}
                title="Optimal"
                description="Best solution with dry run"
                color="accent"
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
          className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-16"
        >
          <FeatureCard
            icon={<Trophy className="w-6 h-6" />}
            title="XP System"
            description="Earn XP for every problem. More for harder ones, bonus for minimal hints."
            color="xp"
          />
          <FeatureCard
            icon={<Flame className="w-6 h-6" />}
            title="Daily Streaks"
            description="Build consistency. Don't break the chain. Unlock streak milestones."
            color="streak"
          />
          <FeatureCard
            icon={<Medal className="w-6 h-6" />}
            title="Badges"
            description="Collect pattern mastery badges, consistency badges, and more."
            color="primary"
          />
          <FeatureCard
            icon={<TrendingUp className="w-6 h-6" />}
            title="Leaderboard"
            description="Compete globally. Weekly resets. Climb to the top."
            color="secondary"
          />
        </motion.div>

        {/* Resource Links Feature */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="interactive-card p-10"
        >
          <div className="text-center max-w-2xl mx-auto">
            <h3 className="text-2xl md:text-3xl font-bold mb-6">Curated Resources for Every Problem</h3>
            <p className="text-muted-foreground text-lg mb-10 leading-relaxed">
              Each problem links to LeetCode for practice, YouTube for video explanations, and articles for deep dives.
            </p>
            <motion.div 
              className="flex flex-wrap justify-center gap-4"
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
  color: "primary" | "secondary" | "accent" | "warning";
}

function AIModeCard({ icon, title, description, color }: AIModeCardProps) {
  const colorClasses = {
    primary: "border-primary/30 hover:border-primary/60 text-primary hover:shadow-[0_0_30px_hsla(180,100%,50%,0.15)]",
    secondary: "border-secondary/30 hover:border-secondary/60 text-secondary hover:shadow-[0_0_30px_hsla(260,80%,55%,0.15)]",
    accent: "border-accent/30 hover:border-accent/60 text-accent hover:shadow-[0_0_30px_hsla(330,100%,60%,0.15)]",
    warning: "border-warning/30 hover:border-warning/60 text-warning hover:shadow-[0_0_30px_hsla(45,100%,55%,0.15)]",
  };

  const bgClasses = {
    primary: "bg-primary/10",
    secondary: "bg-secondary/10",
    accent: "bg-accent/10",
    warning: "bg-warning/10",
  };

  return (
    <motion.div
      variants={itemVariants}
      whileHover={{ y: -6, scale: 1.02 }}
      className={`p-5 rounded-xl border bg-card/50 backdrop-blur-sm ${colorClasses[color]} transition-all duration-400 cursor-default`}
    >
      <motion.div 
        className={`w-10 h-10 rounded-lg ${bgClasses[color]} flex items-center justify-center mb-4`}
        whileHover={{ rotate: [0, -10, 10, 0], scale: 1.1 }}
        transition={{ duration: 0.4 }}
      >
        {icon}
      </motion.div>
      <h4 className="font-semibold mb-2 text-foreground">{title}</h4>
      <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
    </motion.div>
  );
}

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  color: string;
}

function FeatureCard({ icon, title, description, color }: FeatureCardProps) {
  const colorMap: Record<string, string> = {
    xp: "text-[hsl(280,100%,65%)] bg-[hsl(280,100%,65%,0.1)] border-[hsl(280,100%,65%,0.3)] hover:border-[hsl(280,100%,65%,0.6)] hover:shadow-[0_0_30px_hsla(280,100%,65%,0.15)]",
    streak: "text-[hsl(25,100%,55%)] bg-[hsl(25,100%,55%,0.1)] border-[hsl(25,100%,55%,0.3)] hover:border-[hsl(25,100%,55%,0.6)] hover:shadow-[0_0_30px_hsla(25,100%,55%,0.15)]",
    primary: "text-primary bg-primary/10 border-primary/30 hover:border-primary/60 hover:shadow-[0_0_30px_hsla(180,100%,50%,0.15)]",
    secondary: "text-secondary bg-secondary/10 border-secondary/30 hover:border-secondary/60 hover:shadow-[0_0_30px_hsla(260,80%,55%,0.15)]",
  };

  return (
    <motion.div
      variants={itemVariants}
      whileHover={{ y: -8, scale: 1.02 }}
      className={`interactive-card p-6 text-center transition-all duration-400`}
    >
      <motion.div 
        className={`w-14 h-14 rounded-xl ${colorMap[color]?.split(' ').slice(0, 2).join(' ')} flex items-center justify-center mx-auto mb-5`}
        whileHover={{ rotate: [0, -10, 10, 0], scale: 1.1 }}
        transition={{ duration: 0.4 }}
      >
        {icon}
      </motion.div>
      <h4 className="font-semibold text-lg mb-3">{title}</h4>
      <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
    </motion.div>
  );
}

function ResourceBadge({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <motion.div
      variants={itemVariants}
      whileHover={{ scale: 1.05, y: -2 }}
      className="flex items-center gap-3 px-6 py-3 rounded-xl bg-muted/50 border border-border/50 hover:border-primary/30 hover:bg-muted transition-all duration-300 cursor-default"
    >
      <span className="text-primary">{icon}</span>
      <span className="font-medium">{label}</span>
    </motion.div>
  );
}
