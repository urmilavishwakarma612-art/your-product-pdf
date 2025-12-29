import { motion } from "framer-motion";
import { Check, Crown, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

export function PricingSection() {
  return (
    <section id="pricing" className="py-24 bg-gradient-to-b from-background to-card/50">
      <div className="container px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center max-w-3xl mx-auto mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            Simple, <span className="gradient-text">Transparent</span> Pricing
          </h2>
          <p className="text-xl text-muted-foreground">
            Start free, upgrade when you're ready. Phase 1 is completely free forever.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Free Plan */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="glass-card p-8 relative"
          >
            <div className="mb-6">
              <h3 className="text-2xl font-bold mb-2">Free</h3>
              <p className="text-muted-foreground">Perfect to get started</p>
            </div>

            <div className="mb-8">
              <span className="text-5xl font-bold">₹0</span>
              <span className="text-muted-foreground ml-2">forever</span>
            </div>

            <ul className="space-y-4 mb-8">
              {[
                "Complete Phase 1 - Foundation",
                "Arrays, Strings, Two-Pointer",
                "Sliding Window, Prefix Sum",
                "Full AI Mentor Access",
                "XP, Badges & Streaks",
                "Global Leaderboard",
              ].map((feature, i) => (
                <li key={i} className="flex items-center gap-3">
                  <Check className="w-5 h-5 text-success flex-shrink-0" />
                  <span className="text-muted-foreground">{feature}</span>
                </li>
              ))}
            </ul>

            <Link to="/auth">
              <Button variant="outline" className="w-full" size="lg">
                Get Started Free
              </Button>
            </Link>
          </motion.div>

          {/* Pro Plan */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="glass-card p-8 relative border-primary/50"
            style={{
              boxShadow: "0 0 40px hsla(180, 100%, 50%, 0.15)",
            }}
          >
            {/* Popular Badge */}
            <div className="absolute -top-4 left-1/2 -translate-x-1/2">
              <div className="flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-gradient-to-r from-primary to-secondary text-primary-foreground text-sm font-semibold">
                <Crown className="w-4 h-4" />
                Most Popular
              </div>
            </div>

            <div className="mb-6 pt-4">
              <h3 className="text-2xl font-bold mb-2 flex items-center gap-2">
                Pro <Sparkles className="w-5 h-5 text-primary" />
              </h3>
              <p className="text-muted-foreground">Full DSA mastery unlocked</p>
            </div>

            <div className="mb-8">
              <div className="flex items-baseline gap-2">
                <span className="text-5xl font-bold gradient-text">₹49</span>
                <span className="text-muted-foreground">/month</span>
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                or ₹449 one-time (early bird)
              </p>
            </div>

            <ul className="space-y-4 mb-8">
              {[
                "Everything in Free",
                "Phase 2-6 - All Patterns",
                "Stack, Queue, Heap, HashMap",
                "Trees, Graphs, DP, Greedy",
                "Trie, Bit Manipulation",
                "Advanced: Segment Trees & more",
                "Priority Support",
              ].map((feature, i) => (
                <li key={i} className="flex items-center gap-3">
                  <Check className="w-5 h-5 text-primary flex-shrink-0" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>

            <Link to="/auth">
              <Button className="w-full btn-primary-glow" size="lg">
                Upgrade to Pro
              </Button>
            </Link>
          </motion.div>
        </div>

        {/* Trust Badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3 }}
          className="text-center mt-12 text-muted-foreground"
        >
          <p>🔒 Secure payment via Razorpay • Cancel anytime</p>
        </motion.div>
      </div>
    </section>
  );
}