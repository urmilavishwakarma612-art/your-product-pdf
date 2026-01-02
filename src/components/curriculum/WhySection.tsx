import { motion } from "framer-motion";
import { Lightbulb } from "lucide-react";

interface WhySectionProps {
  content: string;
}

export const WhySection = ({ content }: WhySectionProps) => {
  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="glass-card p-6"
    >
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center">
          <Lightbulb className="w-5 h-5 text-success" />
        </div>
        <h2 className="text-xl font-bold">Why This Pattern Exists</h2>
      </div>

      <div className="prose prose-invert prose-sm max-w-none">
        <p className="text-muted-foreground whitespace-pre-line">{content}</p>
      </div>
    </motion.section>
  );
};
