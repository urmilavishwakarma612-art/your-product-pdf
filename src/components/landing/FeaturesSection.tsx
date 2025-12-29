import { motion } from "framer-motion";
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
  BookOpen
} from "lucide-react";

export function FeaturesSection() {
  return (
    <section id="features" className="py-24 bg-card/30">
      <div className="container px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center max-w-3xl mx-auto mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            Everything You Need to <span className="gradient-text">Ace DSA</span>
          </h2>
          <p className="text-xl text-muted-foreground">
            Premium features designed for focused, efficient learning
          </p>
        </motion.div>

        {/* AI Mentor Feature */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="glass-card p-8 md:p-12 mb-12"
        >
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div>
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-secondary/20 text-secondary text-sm font-medium mb-4">
                <Lightbulb className="w-4 h-4" />
                AI Mentor
              </span>
              <h3 className="text-3xl font-bold mb-4">
                4 Levels of AI-Powered Guidance
              </h3>
              <p className="text-muted-foreground mb-6">
                Stuck on a problem? Our AI mentor provides progressive hints — from subtle nudges to complete solutions. Build real understanding, not dependency.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
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
            </div>
          </div>
        </motion.div>

        {/* Gamification Features */}
        <div className="grid md:grid-cols-4 gap-6 mb-12">
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
        </div>

        {/* Resource Links Feature */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="glass-card p-8"
        >
          <div className="text-center max-w-2xl mx-auto">
            <h3 className="text-2xl font-bold mb-4">Curated Resources for Every Problem</h3>
            <p className="text-muted-foreground mb-8">
              Each problem links to LeetCode for practice, YouTube for video explanations, and articles for deep dives.
            </p>
            <div className="flex justify-center gap-6">
              <ResourceBadge icon={<ExternalLink />} label="LeetCode" />
              <ResourceBadge icon={<Youtube />} label="YouTube" />
              <ResourceBadge icon={<BookOpen />} label="Articles" />
            </div>
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
    primary: "bg-primary/10 border-primary/30 text-primary",
    secondary: "bg-secondary/10 border-secondary/30 text-secondary",
    accent: "bg-accent/10 border-accent/30 text-accent",
    warning: "bg-warning/10 border-warning/30 text-warning",
  };

  return (
    <div className={`p-4 rounded-xl border ${colorClasses[color]}`}>
      <div className="mb-2">{icon}</div>
      <h4 className="font-semibold mb-1">{title}</h4>
      <p className="text-xs text-muted-foreground">{description}</p>
    </div>
  );
}

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  color: string;
}

function FeatureCard({ icon, title, description, color }: FeatureCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="glass-card p-6 text-center"
    >
      <div className={`w-12 h-12 rounded-xl bg-${color}/20 text-${color} flex items-center justify-center mx-auto mb-4`}>
        {icon}
      </div>
      <h4 className="font-semibold mb-2">{title}</h4>
      <p className="text-sm text-muted-foreground">{description}</p>
    </motion.div>
  );
}

function ResourceBadge({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-muted/50">
      <span className="text-primary">{icon}</span>
      <span className="font-medium">{label}</span>
    </div>
  );
}