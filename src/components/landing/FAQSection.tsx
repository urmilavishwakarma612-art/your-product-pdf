import { motion } from "framer-motion";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Sparkles } from "lucide-react";

const faqs = [
  {
    question: "What is Nexalgotrix?",
    answer:
      "Nexalgotrix is a pattern-based DSA learning platform that helps you master problem-solving through structured patterns instead of random practice.",
  },
  {
    question: "Is Nexalgotrix free?",
    answer:
      "Yes. Phase 1 is completely free with full access so you can experience the platform before upgrading to advanced phases.",
  },
  {
    question: "Where do I solve the problems?",
    answer:
      "Problems are solved directly on LeetCode. Nexalgotrix helps you track progress, patterns, insights, and learning strategy.",
  },
  {
    question: "Do you provide solutions?",
    answer:
      "Yes — through an AI Mentor with multiple modes: Hint only, Approach explanation, Brute force, and Full solution (optional). You stay in control of how much help you take.",
  },
  {
    question: "Is this suitable for beginners?",
    answer:
      "Absolutely. Nexalgotrix is designed for beginners starting DSA, college students, placement aspirants, and anyone preparing for product-based companies.",
  },
  {
    question: "How is Nexalgotrix different from other DSA platforms?",
    answer:
      "Most platforms focus on quantity. Nexalgotrix focuses on patterns, clarity, and discipline — helping you think like an interviewer.",
  },
  {
    question: "Do I need to install anything?",
    answer:
      "No. Nexalgotrix is a web-based platform and works on any modern browser.",
  },
  {
    question: "What happens after Phase 1?",
    answer:
      "You can upgrade to unlock: Advanced patterns (Phase 2–6), AI mentor features, Gamification (XP, badges, leaderboard), and Progress analytics.",
  },
  {
    question: "Is my progress saved?",
    answer:
      "Yes. Your progress, streaks, XP, and achievements are securely saved in your account.",
  },
  {
    question: "Is Nexalgotrix beginner-friendly but interview-focused?",
    answer:
      "Yes. We start simple and gradually build you up to interview-ready problem solving.",
  },
];

export const FAQSection = () => {
  return (
    <section className="py-24 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 bg-grid opacity-30" />
      <div className="hero-orb-1 -left-40 top-1/4" />

      <div className="container mx-auto px-4 relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            Frequently Asked <span className="gradient-text">Questions</span>
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
            Everything you need to know about Nexalgotrix
          </p>
        </motion.div>

        {/* FAQ Accordion */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
          className="max-w-3xl mx-auto"
        >
          <Accordion type="single" collapsible className="space-y-4">
            {faqs.map((faq, index) => (
              <AccordionItem
                key={index}
                value={`item-${index}`}
                className="glass-card border-none px-6 data-[state=open]:ring-1 data-[state=open]:ring-primary/20"
              >
                <AccordionTrigger className="text-left hover:no-underline py-5 text-base md:text-lg font-medium">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground pb-5 text-base leading-relaxed">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
          className="text-center mt-16"
        >
          <p className="text-muted-foreground mb-6 text-lg">
            Still unsure? Start Phase 1 for free and experience Nexalgotrix yourself.
          </p>
          <Link to="/auth">
            <Button size="lg" className="btn-primary-glow group">
              <Sparkles className="w-5 h-5 mr-2 group-hover:animate-pulse" />
              Start Free Phase 1
            </Button>
          </Link>
        </motion.div>
      </div>
    </section>
  );
};
