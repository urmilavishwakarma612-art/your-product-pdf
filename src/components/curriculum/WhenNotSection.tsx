import { motion } from "framer-motion";
import { AlertTriangle } from "lucide-react";

interface WhenNotSectionProps {
  content: string;
}

export const WhenNotSection = ({ content }: WhenNotSectionProps) => {
  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="glass-card p-6 border-warning/20"
    >
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-lg bg-warning/10 flex items-center justify-center">
          <AlertTriangle className="w-5 h-5 text-warning" />
        </div>
        <h2 className="text-xl font-bold">When NOT To Use</h2>
      </div>

      <div className="prose prose-invert prose-sm max-w-none">
        <p className="text-muted-foreground whitespace-pre-line">{content}</p>
      </div>
    </motion.section>
  );
};
