import { motion } from "framer-motion";
import { Lock, Unlock, ChevronRight } from "lucide-react";

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
  return (
    <section id="phases" className="py-24">
      <div className="container px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center max-w-3xl mx-auto mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            Structured <span className="gradient-text-accent">Learning Path</span>
          </h2>
          <p className="text-xl text-muted-foreground">
            6 phases from beginner to expert. Each phase builds on the previous.
          </p>
        </motion.div>

        <div className="max-w-4xl mx-auto space-y-4">
          {phases.map((phase, index) => (
            <motion.div
              key={phase.number}
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
            >
              <PhaseCard phase={phase} />
            </motion.div>
          ))}
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
}

function PhaseCard({ phase }: PhaseCardProps) {
  return (
    <div
      className={`glass-card p-6 flex items-center gap-6 transition-all duration-300 hover:border-primary/30 group cursor-pointer ${
        phase.isFree ? "border-success/30" : ""
      }`}
    >
      {/* Phase Number */}
      <div
        className={`w-14 h-14 rounded-xl flex items-center justify-center font-bold text-xl ${
          phase.isFree
            ? "bg-success/20 text-success"
            : "bg-muted text-muted-foreground"
        }`}
      >
        {phase.number}
      </div>

      {/* Content */}
      <div className="flex-1">
        <div className="flex items-center gap-3 mb-1">
          <h3 className="text-lg font-semibold">{phase.title}</h3>
          {phase.isFree ? (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-success/20 text-success text-xs font-medium">
              <Unlock className="w-3 h-3" />
              Free
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-muted text-muted-foreground text-xs font-medium">
              <Lock className="w-3 h-3" />
              Pro
            </span>
          )}
        </div>
        <p className="text-muted-foreground text-sm">{phase.description}</p>
      </div>

      {/* Patterns Count */}
      <div className="text-right hidden sm:block">
        <div className="text-2xl font-bold gradient-text">{phase.patterns}</div>
        <div className="text-xs text-muted-foreground">patterns</div>
      </div>

      {/* Arrow */}
      <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
    </div>
  );
}