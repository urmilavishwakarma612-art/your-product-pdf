import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { Check, Crown, Sparkles, Zap, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5 },
  },
};

export function PricingSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  });

  const backgroundY = useTransform(scrollYProgress, [0, 1], [50, -50]);

  return (
    <section 
      ref={sectionRef}
      id="pricing" 
      className="py-32 relative overflow-hidden"
    >
      {/* Animated gradient background */}
      <motion.div
        style={{ y: backgroundY }}
        className="absolute inset-0 bg-gradient-to-b from-background via-card/30 to-background pointer-events-none"
      />
      
      {/* Decorative orbs */}
      <div className="absolute top-20 right-20 w-80 h-80 bg-primary/5 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-20 left-20 w-96 h-96 bg-secondary/5 rounded-full blur-[120px] pointer-events-none" />

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
            <Zap className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-primary">Pricing</span>
          </motion.div>
          <h2 className="text-4xl md:text-6xl font-bold mb-6 tracking-tight">
            Simple, <span className="gradient-text">Transparent</span> Pricing
          </h2>
          <p className="text-xl text-muted-foreground leading-relaxed">
            Start free, upgrade when you're ready. Phase 1 is completely free forever.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {/* Free Plan */}
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            whileHover={{ y: -8 }}
            className="interactive-card p-8 md:p-10 relative"
          >
            <div className="mb-8">
              <h3 className="text-2xl font-bold mb-2">Free</h3>
              <p className="text-muted-foreground">Perfect to get started</p>
            </div>

            <div className="mb-10">
              <span className="text-6xl font-bold">₹0</span>
              <span className="text-muted-foreground ml-2 text-lg">forever</span>
            </div>

            <motion.ul 
              variants={containerVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="space-y-4 mb-10"
            >
              {[
                "Complete Phase 1 - Foundation",
                "Arrays, Strings, Two-Pointer",
                "Sliding Window, Prefix Sum",
                "Full AI Mentor Access",
                "XP, Badges & Streaks",
                "Global Leaderboard",
              ].map((feature, i) => (
                <motion.li 
                  key={i} 
                  variants={itemVariants}
                  className="flex items-center gap-3 group"
                >
                  <div className="w-5 h-5 rounded-full bg-success/15 flex items-center justify-center flex-shrink-0 group-hover:bg-success/25 transition-colors">
                    <Check className="w-3 h-3 text-success" />
                  </div>
                  <span className="text-muted-foreground group-hover:text-foreground transition-colors">{feature}</span>
                </motion.li>
              ))}
            </motion.ul>

            <Link to="/auth">
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button variant="outline" className="w-full rounded-xl h-12 text-base" size="lg">
                  Get Started Free
                </Button>
              </motion.div>
            </Link>
          </motion.div>

          {/* Pro Plan */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            whileHover={{ y: -8 }}
            className="relative"
          >
            {/* Glow effect */}
            <div className="absolute -inset-0.5 bg-gradient-to-r from-primary via-secondary to-accent rounded-2xl blur opacity-30 group-hover:opacity-40 transition-opacity" />
            
            <div className="interactive-card p-8 md:p-10 relative border-primary/30 hover:border-primary/50">
              {/* Popular Badge */}
              <motion.div 
                initial={{ opacity: 0, y: -20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="absolute -top-4 left-1/2 -translate-x-1/2"
              >
                <motion.div 
                  animate={{ y: [0, -3, 0] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                  className="flex items-center gap-2 px-5 py-2 rounded-full bg-gradient-to-r from-primary to-secondary text-primary-foreground text-sm font-semibold shadow-lg shadow-primary/25"
                >
                  <Crown className="w-4 h-4" />
                  Most Popular
                </motion.div>
              </motion.div>

              <div className="mb-8 pt-4">
                <h3 className="text-2xl font-bold mb-2 flex items-center gap-2">
                  Pro 
                  <motion.div
                    animate={{ rotate: [0, 15, -15, 0] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                  >
                    <Sparkles className="w-5 h-5 text-primary" />
                  </motion.div>
                </h3>
                <p className="text-muted-foreground">Full DSA mastery unlocked</p>
              </div>

              <div className="mb-10">
                <div className="flex items-baseline gap-2">
                  <span className="text-6xl font-bold gradient-text">₹49</span>
                  <span className="text-muted-foreground text-lg">/month</span>
                </div>
                <p className="text-sm text-muted-foreground mt-3">
                  or ₹449 one-time (early bird)
                </p>
              </div>

              <motion.ul 
                variants={containerVariants}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                className="space-y-4 mb-10"
              >
                {[
                  "Everything in Free",
                  "Phase 2-6 - All Patterns",
                  "Stack, Queue, Heap, HashMap",
                  "Trees, Graphs, DP, Greedy",
                  "Trie, Bit Manipulation",
                  "Advanced: Segment Trees & more",
                  "Priority Support",
                ].map((feature, i) => (
                  <motion.li 
                    key={i} 
                    variants={itemVariants}
                    className="flex items-center gap-3 group"
                  >
                    <div className="w-5 h-5 rounded-full bg-primary/15 flex items-center justify-center flex-shrink-0 group-hover:bg-primary/25 transition-colors">
                      <Check className="w-3 h-3 text-primary" />
                    </div>
                    <span className="group-hover:text-foreground transition-colors">{feature}</span>
                  </motion.li>
                ))}
              </motion.ul>

              <Link to="/auth">
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Button className="w-full btn-primary-glow rounded-xl h-12 text-base" size="lg">
                    Upgrade to Pro
                  </Button>
                </motion.div>
              </Link>
            </div>
          </motion.div>
        </div>

        {/* Trust Badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4 }}
          className="flex flex-wrap items-center justify-center gap-6 mt-16 text-muted-foreground"
        >
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-success" />
            <span>Secure payment via Razorpay</span>
          </div>
          <div className="w-1 h-1 rounded-full bg-border hidden sm:block" />
          <span>Cancel anytime</span>
          <div className="w-1 h-1 rounded-full bg-border hidden sm:block" />
          <span>7-day money back guarantee</span>
        </motion.div>
      </div>
    </section>
  );
}
