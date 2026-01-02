import { motion } from "framer-motion";
import { Brain } from "lucide-react";

interface MentalModelProps {
  content: string;
}

export const MentalModel = ({ content }: MentalModelProps) => {
  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="glass-card p-6"
    >
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-lg bg-violet/10 flex items-center justify-center">
          <Brain className="w-5 h-5 text-violet" />
        </div>
        <h2 className="text-xl font-bold">Mental Model</h2>
      </div>

      <div className="prose prose-invert prose-sm max-w-none">
        <div className="text-muted-foreground whitespace-pre-line">{content}</div>
      </div>
    </motion.section>
  );
};
