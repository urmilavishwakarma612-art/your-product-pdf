import { motion } from "framer-motion";
import { Layers } from "lucide-react";

interface SubPattern {
  id: string;
  name: string;
  description: string | null;
  template: string | null;
}

interface SubPatternCardProps {
  subPattern: SubPattern;
  index: number;
}

export const SubPatternCard = ({ subPattern, index }: SubPatternCardProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4, delay: index * 0.1 }}
      className="glass-card p-5 hover:border-primary/30 transition-colors"
    >
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-lg bg-secondary/10 flex items-center justify-center flex-shrink-0">
          <Layers className="w-4 h-4 text-secondary" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold mb-1">{subPattern.name}</h3>
          {subPattern.description && (
            <p className="text-sm text-muted-foreground mb-3">{subPattern.description}</p>
          )}
          {subPattern.template && (
            <div className="code-block text-xs">
              <pre className="whitespace-pre-wrap">{subPattern.template}</pre>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};
