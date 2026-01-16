import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { Check, Crown, Sparkles, Zap, Shield, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

const allFeatures = [
  "Pattern-first DSA curriculum",
  "Interview simulator",
  "4-layer AI support",
  "Badges & leaderboard",
  "Daily tracker & contests",
  "Job apply section",
];

export function PricingSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  });

  const backgroundY = useTransform(scrollYProgress, [0, 1], [50, -50]);

  return (
    <section ref={sectionRef} id="pricing" className="py-16 sm:py-24 lg:py-32 relative overflow-hidden">
      <motion.div
        style={{ y: backgroundY }}
        className="absolute inset-0 bg-gradient-to-b from-background via-card/30 to-background pointer-events-none"
      />
      
      <div className="absolute top-20 right-20 w-48 sm:w-80 h-48 sm:h-80 bg-primary/5 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-20 left-20 w-64 sm:w-96 h-64 sm:h-96 bg-secondary/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="container px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          className="text-center max-w-3xl mx-auto mb-12"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 mb-4"
          >
            <Zap className="w-3 h-3 sm:w-4 sm:h-4 text-primary" />
            <span className="text-xs sm:text-sm font-medium text-primary">Simple, Student-First</span>
          </motion.div>
          <h2 className="text-2xl sm:text-4xl md:text-5xl font-bold mb-4 tracking-tight">
            Same features in <span className="gradient-text">every plan</span>
          </h2>
          <p className="text-base sm:text-lg text-muted-foreground">
            No feature locking. Just pay for how long you want to stay consistent.
          </p>
        </motion.div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-4 sm:gap-6 max-w-4xl mx-auto mb-10">
          {/* Monthly */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="interactive-card p-5 sm:p-6"
          >
            <div className="mb-4">
              <span className="text-xs font-medium text-success bg-success/10 px-2 py-1 rounded-full">🟢 Monthly</span>
            </div>
            <div className="mb-4">
              <span className="text-3xl sm:text-4xl font-bold">₹199</span>
              <span className="text-muted-foreground text-sm">/month</span>
            </div>
            <p className="text-xs text-muted-foreground mb-4">Best to try the platform</p>
            <Link to="/pricing">
              <Button variant="outline" className="w-full rounded-xl h-10 text-sm" size="lg">
                Start @ ₹199
              </Button>
            </Link>
          </motion.div>

          {/* 6 Months - Most Popular */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="relative"
          >
            <div className="absolute -inset-0.5 bg-gradient-to-r from-primary via-secondary to-accent rounded-2xl blur opacity-30" />
            <div className="interactive-card p-5 sm:p-6 relative border-primary/30 h-full">
              <motion.div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <div className="flex items-center gap-1 px-3 py-1 rounded-full bg-gradient-to-r from-primary to-secondary text-primary-foreground text-xs font-semibold">
                  <Star className="w-3 h-3 fill-current" />
                  Most Popular
                </div>
              </motion.div>
              <div className="mb-4 pt-2">
                <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-1 rounded-full">⭐ 6 Months</span>
              </div>
              <div className="mb-4">
                <span className="text-3xl sm:text-4xl font-bold gradient-text">₹999</span>
                <span className="text-muted-foreground text-sm">/6 months</span>
                <p className="text-xs text-success mt-1">≈ ₹166/month</p>
              </div>
              <p className="text-xs text-muted-foreground mb-4">Best for semester prep</p>
              <Link to="/pricing">
                <Button className="w-full btn-primary-glow rounded-xl h-10 text-sm" size="lg">
                  <Sparkles className="w-4 h-4 mr-2" />
                  Go Serious @ ₹999
                </Button>
              </Link>
            </div>
          </motion.div>

          {/* Yearly */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="interactive-card p-5 sm:p-6"
          >
            <div className="mb-4">
              <span className="text-xs font-medium text-violet-400 bg-violet-500/10 px-2 py-1 rounded-full">💎 1 Year</span>
            </div>
            <div className="mb-4">
              <span className="text-3xl sm:text-4xl font-bold gradient-text">₹1,499</span>
              <span className="text-muted-foreground text-sm">/year</span>
              <p className="text-xs text-success mt-1">≈ ₹125/month</p>
            </div>
            <p className="text-xs text-muted-foreground mb-4">Best for placements</p>
            <Link to="/pricing">
              <Button variant="outline" className="w-full rounded-xl h-10 text-sm border-violet-500/50 hover:bg-violet-500/10" size="lg">
                Go All-In @ ₹1,499
              </Button>
            </Link>
          </motion.div>
        </div>

        {/* Features */}
        <motion.ul
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="flex flex-wrap justify-center gap-3 mb-8 max-w-2xl mx-auto"
        >
          {allFeatures.map((feature, i) => (
            <motion.li key={i} variants={itemVariants} className="flex items-center gap-2 bg-muted/30 px-3 py-1.5 rounded-full">
              <Check className="w-3 h-3 text-success" />
              <span className="text-xs text-muted-foreground">{feature}</span>
            </motion.li>
          ))}
        </motion.ul>

        {/* Trust Badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="flex flex-wrap items-center justify-center gap-3 sm:gap-6 text-xs text-muted-foreground"
        >
          <div className="flex items-center gap-1.5">
            <Shield className="w-4 h-4 text-success" />
            <span>Secure via Razorpay</span>
          </div>
          <span>7-day money back</span>
          <span>No hidden charges</span>
        </motion.div>
      </div>
    </section>
  );
}