import { useRef } from "react";
import { motion, useScroll, useTransform, useSpring } from "framer-motion";
import { ArrowRight, Zap, Target, Trophy, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

export function HeroSection() {
  const containerRef = useRef<HTMLElement>(null);
  
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"]
  });

  const y = useTransform(scrollYProgress, [0, 1], [0, 200]);
  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);
  const scale = useTransform(scrollYProgress, [0, 0.5], [1, 0.95]);
  
  const smoothY = useSpring(y, { stiffness: 100, damping: 30 });
  const smoothOpacity = useSpring(opacity, { stiffness: 100, damping: 30 });
  const smoothScale = useSpring(scale, { stiffness: 100, damping: 30 });

  // Parallax for orbs
  const orb1Y = useTransform(scrollYProgress, [0, 1], [0, 150]);
  const orb2Y = useTransform(scrollYProgress, [0, 1], [0, -100]);
  const orb3Y = useTransform(scrollYProgress, [0, 1], [0, 200]);

  return (
    <section 
      ref={containerRef}
      className="relative min-h-screen flex items-center justify-center overflow-hidden bg-grid"
    >
      {/* Animated Background Orbs with Parallax */}
      <motion.div 
        className="hero-orb-1 -top-40 -left-40"
        style={{ y: orb1Y }}
      />
      <motion.div 
        className="hero-orb-2 top-1/4 -right-48"
        style={{ y: orb2Y }}
      />
      <motion.div 
        className="hero-orb-3 bottom-10 left-1/3"
        style={{ y: orb3Y }}
      />

      {/* Floating particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-primary/30 rounded-full"
            initial={{
              x: Math.random() * window.innerWidth,
              y: Math.random() * window.innerHeight,
            }}
            animate={{
              y: [null, Math.random() * -200 - 100],
              opacity: [0, 1, 0],
            }}
            transition={{
              duration: Math.random() * 3 + 2,
              repeat: Infinity,
              delay: Math.random() * 2,
              ease: "easeOut",
            }}
          />
        ))}
      </div>

      <div className="container relative z-10 px-4 py-20">
        <motion.div
          style={{ y: smoothY, opacity: smoothOpacity, scale: smoothScale }}
          className="text-center max-w-4xl mx-auto"
        >
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-primary/10 border border-primary/30 mb-8 backdrop-blur-sm"
          >
            <motion.div
              animate={{ rotate: [0, 15, -15, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            >
              <Sparkles className="w-4 h-4 text-primary" />
            </motion.div>
            <span className="text-sm font-medium text-primary">Pattern-Based DSA Mastery</span>
          </motion.div>

          {/* Main Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="text-5xl md:text-7xl lg:text-8xl font-bold mb-6 leading-[1.1] tracking-tight"
          >
            <motion.span
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
            >
              Master DSA Through
            </motion.span>
            <motion.span 
              className="block gradient-text"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
            >
              Patterns, Not Chaos
            </motion.span>
          </motion.h1>

          {/* Subheadline */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.6 }}
            className="text-lg md:text-xl lg:text-2xl text-muted-foreground mb-12 max-w-2xl mx-auto leading-relaxed"
          >
            Stop memorizing 500+ random problems. Learn the 30+ core patterns that solve them all.
            <span className="text-primary font-medium"> AI-powered guidance. Gamified learning.</span>
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.6 }}
            className="flex flex-col sm:flex-row gap-4 justify-center items-center"
          >
            <Link to="/auth">
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Button size="lg" className="btn-primary-glow text-lg px-8 py-6 rounded-full group">
                  Start Learning Free
                  <motion.span
                    className="ml-2"
                    animate={{ x: [0, 4, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  >
                    <ArrowRight className="w-5 h-5" />
                  </motion.span>
                </Button>
              </motion.div>
            </Link>
            <Link to="/patterns">
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Button 
                  size="lg" 
                  variant="outline" 
                  className="text-lg px-8 py-6 rounded-full border-border/50 hover:border-primary/50 hover:bg-primary/5 transition-all duration-300"
                >
                  Explore Patterns
                </Button>
              </motion.div>
            </Link>
          </motion.div>

          {/* Stats Row */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 0.6 }}
            className="grid grid-cols-3 gap-8 mt-20 max-w-2xl mx-auto"
          >
            {[
              { value: "30+", label: "Core Patterns", gradient: "gradient-text" },
              { value: "300+", label: "Curated Problems", gradient: "gradient-text-accent" },
              { value: "4", label: "AI Mentor Modes", gradient: "text-success" },
            ].map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.9 + index * 0.1 }}
                whileHover={{ scale: 1.05 }}
                className="text-center group cursor-default"
              >
                <motion.div 
                  className={`text-4xl md:text-5xl font-bold ${stat.gradient} mb-2`}
                  whileHover={{ scale: 1.1 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  {stat.value}
                </motion.div>
                <div className="text-muted-foreground text-sm group-hover:text-foreground transition-colors">
                  {stat.label}
                </div>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>

        {/* Floating Feature Cards */}
        <motion.div
          initial={{ opacity: 0, y: 60 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="grid md:grid-cols-3 gap-6 mt-24 max-w-5xl mx-auto"
        >
          <FeatureCard
            icon={<Target className="w-6 h-6" />}
            title="Pattern-First Learning"
            description="Recognize patterns, not memorize solutions. Build intuition that transfers across problems."
            color="primary"
            delay={0}
          />
          <FeatureCard
            icon={<Zap className="w-6 h-6" />}
            title="AI Mentor System"
            description="Get hints, approaches, and solutions on-demand. 4 levels from subtle hints to full code."
            color="secondary"
            delay={0.1}
          />
          <FeatureCard
            icon={<Trophy className="w-6 h-6" />}
            title="Gamified Progress"
            description="Earn XP, unlock badges, maintain streaks, and climb the leaderboard."
            color="accent"
            delay={0.2}
          />
        </motion.div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
      >
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
          className="w-6 h-10 rounded-full border-2 border-muted-foreground/30 flex items-start justify-center p-2"
        >
          <motion.div
            animate={{ opacity: [0.5, 1, 0.5], y: [0, 8, 0] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
            className="w-1 h-2 bg-muted-foreground/50 rounded-full"
          />
        </motion.div>
      </motion.div>
    </section>
  );
}

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  color: "primary" | "secondary" | "accent";
  delay: number;
}

function FeatureCard({ icon, title, description, color, delay }: FeatureCardProps) {
  const colorClasses = {
    primary: {
      border: "border-primary/20 hover:border-primary/50",
      icon: "text-primary bg-primary/10",
      glow: "group-hover:shadow-[0_0_40px_hsla(180,100%,50%,0.2)]",
    },
    secondary: {
      border: "border-secondary/20 hover:border-secondary/50",
      icon: "text-secondary bg-secondary/10",
      glow: "group-hover:shadow-[0_0_40px_hsla(260,80%,55%,0.2)]",
    },
    accent: {
      border: "border-accent/20 hover:border-accent/50",
      icon: "text-accent bg-accent/10",
      glow: "group-hover:shadow-[0_0_40px_hsla(330,100%,60%,0.2)]",
    },
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 1.1 + delay, duration: 0.6 }}
      whileHover={{ y: -8, scale: 1.02 }}
      className={`group interactive-card p-6 ${colorClasses[color].border} ${colorClasses[color].glow} transition-all duration-500`}
    >
      <motion.div 
        className={`w-14 h-14 rounded-xl ${colorClasses[color].icon} flex items-center justify-center mb-5`}
        whileHover={{ rotate: [0, -10, 10, 0], scale: 1.1 }}
        transition={{ duration: 0.4 }}
      >
        {icon}
      </motion.div>
      <h3 className="text-lg font-semibold mb-3 group-hover:text-foreground transition-colors">{title}</h3>
      <p className="text-muted-foreground text-sm leading-relaxed">{description}</p>
    </motion.div>
  );
}
