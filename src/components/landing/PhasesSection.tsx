import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { Lock, Unlock, ChevronRight, Layers } from "lucide-react";

const phases = [
  {
    number: 1,
    title: "Foundation",
    description: "Arrays, Strings, Two-Pointer, Sliding Window, Prefix Sum, Kadane",
    isFree: true,
    patterns: 8,
  },
  {
    number: 2,
    title: "Intermediate DS",
    description: "Stack, Queue, Heap, HashMap, Recursion, Backtracking",
    isFree: false,
    patterns: 12,
  },
  {
    number: 3,
    title: "Searching & Linked Lists",
    description: "Binary Search, Linked List Operations, DLL",
    isFree: false,
    patterns: 8,
  },
  {
    number: 4,
    title: "Trees & Graphs",
    description: "BFS, DFS, BST, Topological Sort, Dijkstra, MST",
    isFree: false,
    patterns: 15,
  },
  {
    number: 5,
    title: "Advanced Problem Solving",
    description: "Greedy, DP, Trie, Bit Manipulation",
    isFree: false,
    patterns: 18,
  },
  {
    number: 6,
    title: "Expert Patterns",
    description: "Segment Trees, Advanced Math, Game Theory",
    isFree: false,
    patterns: 10,
  },
];

export function PhasesSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  });

  const lineHeight = useTransform(scrollYProgress, [0.1, 0.9], ["0%", "100%"]);

  return (
    <section ref={sectionRef} id="phases" className="py-32 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-radial from-primary/5 to-transparent rounded-full blur-3xl pointer-events-none" />

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
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 border border-accent/20 mb-6"
          >
            <Layers className="w-4 h-4 text-accent" />
            <span className="text-sm font-medium text-accent">Learning Path</span>
          </motion.div>
          <h2 className="text-4xl md:text-6xl font-bold mb-6 tracking-tight">
            Structured <span className="gradient-text-accent">Learning Path</span>
          </h2>
          <p className="text-xl text-muted-foreground leading-relaxed">
            6 phases from beginner to expert. Each phase builds on the previous.
          </p>
        </motion.div>

        <div className="max-w-4xl mx-auto relative">
          {/* Progress line */}
          <div className="absolute left-7 top-0 bottom-0 w-0.5 bg-border/30 hidden md:block">
            <motion.div
              style={{ height: lineHeight }}
              className="w-full bg-gradient-to-b from-primary via-secondary to-accent"
            />
          </div>

          <div className="space-y-5">
            {phases.map((phase, index) => (
              <motion.div
                key={phase.number}
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ delay: index * 0.1, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              >
                <PhaseCard phase={phase} index={index} />
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

interface PhaseCardProps {
  phase: {
    number: number;
    title: string;
    description: string;
    isFree: boolean;
    patterns: number;
  };
  index: number;
}

function PhaseCard({ phase, index }: PhaseCardProps) {
  return (
    <motion.div
      whileHover={{ x: 8, scale: 1.01 }}
      className={`interactive-card p-6 flex items-center gap-6 group cursor-pointer ${
        phase.isFree ? "border-success/30 hover:border-success/50" : "hover:border-primary/30"
      }`}
    >
      {/* Phase Number */}
      <motion.div
        whileHover={{ scale: 1.1, rotate: 5 }}
        className={`w-14 h-14 rounded-xl flex items-center justify-center font-bold text-xl relative flex-shrink-0 ${
          phase.isFree
            ? "bg-success/15 text-success border border-success/30"
            : "bg-muted text-muted-foreground border border-border/50"
        }`}
      >
        {phase.number}
        {phase.isFree && (
          <motion.div
            className="absolute -top-1 -right-1 w-3 h-3 bg-success rounded-full"
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
        )}
      </motion.div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-3 mb-2 flex-wrap">
          <h3 className="text-lg font-semibold group-hover:text-primary transition-colors">{phase.title}</h3>
          {phase.isFree ? (
            <motion.span 
              whileHover={{ scale: 1.05 }}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-success/15 text-success text-xs font-medium border border-success/30"
            >
              <Unlock className="w-3 h-3" />
              Free
            </motion.span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-muted text-muted-foreground text-xs font-medium border border-border/50">
              <Lock className="w-3 h-3" />
              Pro
            </span>
          )}
        </div>
        <p className="text-muted-foreground text-sm leading-relaxed">{phase.description}</p>
      </div>

      {/* Patterns Count */}
      <div className="text-right hidden sm:block">
        <motion.div 
          className="text-2xl font-bold gradient-text"
          whileHover={{ scale: 1.1 }}
        >
          {phase.patterns}
        </motion.div>
        <div className="text-xs text-muted-foreground">patterns</div>
      </div>

      {/* Arrow */}
      <motion.div
        animate={{ x: [0, 4, 0] }}
        transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
      >
        <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
      </motion.div>
    </motion.div>
  );
}
