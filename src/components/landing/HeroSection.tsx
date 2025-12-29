import { useRef } from "react";
import { motion, useScroll, useTransform, useSpring } from "framer-motion";
import { ArrowRight, Zap, Target, Trophy, Sparkles, Code2, GitBranch, Cpu, Binary, Braces, Database } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

// 3D Floating Code Visual Component
function TechVisual3D() {
  return (
    <div className="relative w-full h-full min-h-[500px] flex items-center justify-center">
      {/* Main rotating cube container */}
      <div className="relative w-80 h-80 preserve-3d">
        {/* Central glowing orb */}
        <motion.div
          className="absolute inset-0 flex items-center justify-center"
          animate={{
            rotateY: [0, 360],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "linear",
          }}
        >
          <motion.div
            className="w-32 h-32 rounded-full bg-gradient-to-br from-primary via-secondary to-accent"
            style={{
              boxShadow: "0 0 80px hsla(var(--primary), 0.5), 0 0 120px hsla(var(--secondary), 0.3)",
            }}
            animate={{
              scale: [1, 1.1, 1],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        </motion.div>

        {/* Orbiting code icons */}
        {[
          { icon: Code2, delay: 0, radius: 140, color: "primary" },
          { icon: GitBranch, delay: 0.5, radius: 140, color: "secondary" },
          { icon: Cpu, delay: 1, radius: 140, color: "accent" },
          { icon: Binary, delay: 1.5, radius: 140, color: "primary" },
          { icon: Braces, delay: 2, radius: 140, color: "secondary" },
          { icon: Database, delay: 2.5, radius: 140, color: "accent" },
        ].map((item, index) => (
          <motion.div
            key={index}
            className="absolute left-1/2 top-1/2"
            style={{
              transformOrigin: "0 0",
            }}
            animate={{
              rotate: [0 + index * 60, 360 + index * 60],
            }}
            transition={{
              duration: 12,
              repeat: Infinity,
              ease: "linear",
              delay: item.delay,
            }}
          >
            <motion.div
              className={`-ml-6 -mt-6 w-12 h-12 rounded-xl bg-${item.color}/20 border border-${item.color}/40 flex items-center justify-center backdrop-blur-sm`}
              style={{
                transform: `translateX(${item.radius}px)`,
                boxShadow: `0 0 30px hsla(var(--${item.color}), 0.3)`,
              }}
              animate={{
                rotate: [360, 0],
                scale: [1, 1.1, 1],
              }}
              transition={{
                rotate: {
                  duration: 12,
                  repeat: Infinity,
                  ease: "linear",
                },
                scale: {
                  duration: 2,
                  repeat: Infinity,
                  delay: item.delay,
                },
              }}
            >
              <item.icon className={`w-5 h-5 text-${item.color}`} />
            </motion.div>
          </motion.div>
        ))}

        {/* Floating code snippets */}
        {[
          { text: "O(n log n)", x: -60, y: -120, delay: 0 },
          { text: "Two Pointers", x: 100, y: -80, delay: 0.3 },
          { text: "BFS / DFS", x: -80, y: 100, delay: 0.6 },
          { text: "Dynamic Programming", x: 60, y: 120, delay: 0.9 },
        ].map((snippet, index) => (
          <motion.div
            key={index}
            className="absolute left-1/2 top-1/2 px-3 py-1.5 rounded-lg bg-card/80 border border-border/50 backdrop-blur-sm"
            style={{
              x: snippet.x,
              y: snippet.y,
            }}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{
              opacity: [0.5, 1, 0.5],
              y: [snippet.y, snippet.y - 10, snippet.y],
              scale: [0.95, 1, 0.95],
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              delay: snippet.delay,
              ease: "easeInOut",
            }}
          >
            <code className="text-xs font-mono text-primary">{snippet.text}</code>
          </motion.div>
        ))}

        {/* Connecting lines */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none">
          <motion.circle
            cx="50%"
            cy="50%"
            r="100"
            fill="none"
            stroke="url(#gradient1)"
            strokeWidth="1"
            strokeDasharray="10 5"
            opacity="0.3"
            animate={{
              rotate: [0, 360],
            }}
            transition={{
              duration: 30,
              repeat: Infinity,
              ease: "linear",
            }}
            style={{ transformOrigin: "center" }}
          />
          <motion.circle
            cx="50%"
            cy="50%"
            r="140"
            fill="none"
            stroke="url(#gradient2)"
            strokeWidth="1"
            strokeDasharray="5 10"
            opacity="0.2"
            animate={{
              rotate: [360, 0],
            }}
            transition={{
              duration: 25,
              repeat: Infinity,
              ease: "linear",
            }}
            style={{ transformOrigin: "center" }}
          />
          <defs>
            <linearGradient id="gradient1" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="hsl(var(--primary))" />
              <stop offset="100%" stopColor="hsl(var(--secondary))" />
            </linearGradient>
            <linearGradient id="gradient2" x1="100%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="hsl(var(--secondary))" />
              <stop offset="100%" stopColor="hsl(var(--accent))" />
            </linearGradient>
          </defs>
        </svg>
      </div>
    </div>
  );
}

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
      className="relative min-h-screen flex items-center overflow-hidden bg-grid"
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
        {[...Array(15)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-primary/30 rounded-full"
            initial={{
              x: Math.random() * (typeof window !== 'undefined' ? window.innerWidth : 1000),
              y: Math.random() * (typeof window !== 'undefined' ? window.innerHeight : 800),
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
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-8 items-center">
          {/* Left side - Content */}
          <motion.div
            style={{ y: smoothY, opacity: smoothOpacity, scale: smoothScale }}
            className="text-left"
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
              className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold mb-6 leading-[1.1] tracking-tight"
            >
              <motion.span
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
                className="block"
              >
                Master DSA
              </motion.span>
              <motion.span
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.35 }}
                className="block"
              >
                Through
              </motion.span>
              <motion.span 
                className="block gradient-text"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
              >
                Patterns,
              </motion.span>
              <motion.span 
                className="block gradient-text-accent"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.45 }}
              >
                Not Chaos
              </motion.span>
            </motion.h1>

            {/* Subheadline */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.6 }}
              className="text-base sm:text-lg md:text-xl text-muted-foreground mb-10 max-w-lg leading-relaxed"
            >
              Stop memorizing 500+ random problems. Learn the{" "}
              <span className="text-primary font-semibold">30+ core patterns</span> that solve them all with{" "}
              <span className="text-secondary font-semibold">AI-powered guidance</span>.
            </motion.p>

            {/* CTA Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.6 }}
              className="flex flex-col sm:flex-row gap-4"
            >
              <Link to="/auth">
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Button size="lg" className="btn-primary-glow text-lg px-8 py-6 rounded-full group w-full sm:w-auto">
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
                    className="text-lg px-8 py-6 rounded-full border-border/50 hover:border-primary/50 hover:bg-primary/5 transition-all duration-300 w-full sm:w-auto"
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
              className="flex flex-wrap gap-8 mt-12"
            >
              {[
                { value: "30+", label: "Core Patterns", gradient: "gradient-text" },
                { value: "300+", label: "Problems", gradient: "gradient-text-accent" },
                { value: "4", label: "AI Modes", gradient: "text-success" },
              ].map((stat, index) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.9 + index * 0.1 }}
                  whileHover={{ scale: 1.05 }}
                  className="group cursor-default"
                >
                  <motion.div 
                    className={`text-3xl md:text-4xl font-bold ${stat.gradient} mb-1`}
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

          {/* Right side - 3D Visual */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8, x: 50 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            transition={{ delay: 0.4, duration: 1, ease: [0.22, 1, 0.36, 1] }}
            className="hidden lg:block"
          >
            <TechVisual3D />
          </motion.div>
        </div>

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
