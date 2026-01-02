import { motion } from "framer-motion";
import { FileCode } from "lucide-react";

interface PatternTemplateProps {
  content: string;
}

export const PatternTemplate = ({ content }: PatternTemplateProps) => {
  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="glass-card p-6"
    >
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
          <FileCode className="w-5 h-5 text-primary" />
        </div>
        <h2 className="text-xl font-bold">Pattern Template</h2>
        <span className="text-xs text-muted-foreground">(Thinking, not code)</span>
      </div>

      <div className="code-block">
        <pre className="text-sm whitespace-pre-wrap">{content}</pre>
      </div>
    </motion.section>
  );
};
