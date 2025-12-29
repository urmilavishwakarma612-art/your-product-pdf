import { motion } from "framer-motion";
import { ArrowRight, Zap, Target, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

export function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-grid">
      {/* Animated Background Orbs */}
      <div className="hero-orb-1 -top-20 -left-20" />
      <div className="hero-orb-2 top-1/3 -right-32" />
      <div className="hero-orb-3 bottom-20 left-1/4" />

      <div className="container relative z-10 px-4 py-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-4xl mx-auto"
        >
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/30 mb-8"
          >
            <Zap className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-primary">Pattern-Based DSA Mastery</span>
          </motion.div>

          {/* Main Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-5xl md:text-7xl font-bold mb-6 leading-tight"
          >
            Master DSA Through
            <span className="block gradient-text">Patterns, Not Chaos</span>
          </motion.h1>

          {/* Subheadline */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-xl md:text-2xl text-muted-foreground mb-10 max-w-2xl mx-auto"
          >
            Stop memorizing 500+ random problems. Learn the 30+ core patterns that solve them all.
            <span className="text-primary font-semibold"> AI-powered guidance. Gamified learning.</span>
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="flex flex-col sm:flex-row gap-4 justify-center items-center"
          >
            <Link to="/auth">
              <Button size="lg" className="btn-primary-glow text-lg px-8 py-6 group">
                Start Learning Free
                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
            <Link to="/patterns">
              <Button size="lg" variant="outline" className="text-lg px-8 py-6 border-border hover:border-primary/50">
                Explore Patterns
              </Button>
            </Link>
          </motion.div>

          {/* Stats Row */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="grid grid-cols-3 gap-8 mt-16 max-w-2xl mx-auto"
          >
            <div className="text-center">
              <div className="text-4xl font-bold gradient-text mb-1">30+</div>
              <div className="text-muted-foreground text-sm">Core Patterns</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold gradient-text-accent mb-1">300+</div>
              <div className="text-muted-foreground text-sm">Curated Problems</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-success mb-1">4</div>
              <div className="text-muted-foreground text-sm">AI Mentor Modes</div>
            </div>
          </motion.div>
        </motion.div>

        {/* Floating Feature Cards */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.6 }}
          className="grid md:grid-cols-3 gap-6 mt-20 max-w-5xl mx-auto"
        >
          <FeatureCard
            icon={<Target className="w-6 h-6" />}
            title="Pattern-First Learning"
            description="Recognize patterns, not memorize solutions. Build intuition that transfers across problems."
            color="primary"
          />
          <FeatureCard
            icon={<Zap className="w-6 h-6" />}
            title="AI Mentor System"
            description="Get hints, approaches, and solutions on-demand. 4 levels from subtle hints to full code."
            color="secondary"
          />
          <FeatureCard
            icon={<Trophy className="w-6 h-6" />}
            title="Gamified Progress"
            description="Earn XP, unlock badges, maintain streaks, and climb the leaderboard."
            color="accent"
          />
        </motion.div>
      </div>
    </section>
  );
}

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  color: "primary" | "secondary" | "accent";
}

function FeatureCard({ icon, title, description, color }: FeatureCardProps) {
  const colorClasses = {
    primary: "text-primary border-primary/30 hover:border-primary/50",
    secondary: "text-secondary border-secondary/30 hover:border-secondary/50",
    accent: "text-accent border-accent/30 hover:border-accent/50",
  };

  return (
    <motion.div
      whileHover={{ y: -4, scale: 1.02 }}
      className={`glass-card p-6 border ${colorClasses[color]} transition-all duration-300`}
    >
      <div className={`w-12 h-12 rounded-lg bg-${color}/10 flex items-center justify-center mb-4`}>
        {icon}
      </div>
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p className="text-muted-foreground text-sm">{description}</p>
    </motion.div>
  );
}