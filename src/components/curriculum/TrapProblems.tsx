import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { AlertOctagon } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface Question {
  id: string;
  title: string;
  difficulty: string;
  what_fails_if_wrong: string | null;
}

interface TrapProblemsProps {
  problems: Question[];
}

export const TrapProblems = ({ problems }: TrapProblemsProps) => {
  if (problems.length === 0) return null;

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="glass-card p-6 border-destructive/20"
    >
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-lg bg-destructive/10 flex items-center justify-center">
          <AlertOctagon className="w-5 h-5 text-destructive" />
        </div>
        <div>
          <h2 className="text-xl font-bold">Trap Problems</h2>
          <p className="text-sm text-muted-foreground">
            Common confusion breakers — understand what fails if you pick the wrong pattern
          </p>
        </div>
      </div>

      <div className="space-y-3">
        {problems.map((problem) => (
          <Link
            key={problem.id}
            to={`/question/${problem.id}`}
            className="block p-4 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors group"
          >
            <div className="flex items-center gap-2 mb-2">
              <span className="font-medium group-hover:text-primary transition-colors">
                {problem.title}
              </span>
              <Badge variant="outline" className="text-xs difficulty-hard">
                {problem.difficulty}
              </Badge>
              <Badge variant="outline" className="text-xs bg-destructive/10 text-destructive border-destructive/30">
                Trap
              </Badge>
            </div>
            {problem.what_fails_if_wrong && (
              <p className="text-sm text-muted-foreground">
                ⚠️ {problem.what_fails_if_wrong}
              </p>
            )}
          </Link>
        ))}
      </div>
    </motion.section>
  );
};
