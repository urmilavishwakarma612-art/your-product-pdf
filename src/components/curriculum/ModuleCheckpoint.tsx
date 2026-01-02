import { useState } from "react";
import { motion } from "framer-motion";
import { Target, CheckCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

interface ModuleCheckpointProps {
  moduleId: string;
  exitCondition: string;
  userProgress: {
    id: string;
    checkpoint_passed: boolean;
  } | null;
}

export const ModuleCheckpoint = ({ moduleId, exitCondition, userProgress }: ModuleCheckpointProps) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isLoading, setIsLoading] = useState(false);

  const handleMarkComplete = async () => {
    if (!user) {
      toast.error("Please sign in to track progress");
      return;
    }

    setIsLoading(true);
    try {
      if (userProgress) {
        // Update existing progress
        const { error } = await supabase
          .from("user_curriculum_progress")
          .update({
            checkpoint_passed: true,
            checkpoint_passed_at: new Date().toISOString(),
            completed_at: new Date().toISOString(),
          })
          .eq("id", userProgress.id);

        if (error) throw error;
      } else {
        // Create new progress
        const { error } = await supabase.from("user_curriculum_progress").insert({
          user_id: user.id,
          module_id: moduleId,
          checkpoint_passed: true,
          checkpoint_passed_at: new Date().toISOString(),
          completed_at: new Date().toISOString(),
        });

        if (error) throw error;
      }

      queryClient.invalidateQueries({ queryKey: ["user-module-progress"] });
      queryClient.invalidateQueries({ queryKey: ["user-curriculum-progress"] });
      toast.success("Module completed! 🎉");
    } catch (error) {
      console.error("Error marking checkpoint:", error);
      toast.error("Failed to update progress");
    } finally {
      setIsLoading(false);
    }
  };

  const isCompleted = userProgress?.checkpoint_passed;

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className={`glass-card p-6 ${isCompleted ? "border-success/30" : "border-primary/30"}`}
    >
      <div className="flex items-center gap-3 mb-4">
        <div
          className={`w-10 h-10 rounded-lg flex items-center justify-center ${
            isCompleted ? "bg-success/10" : "bg-primary/10"
          }`}
        >
          {isCompleted ? (
            <CheckCircle className="w-5 h-5 text-success" />
          ) : (
            <Target className="w-5 h-5 text-primary" />
          )}
        </div>
        <div>
          <h2 className="text-xl font-bold">Module Checkpoint</h2>
          <p className="text-sm text-muted-foreground">
            {isCompleted ? "You've completed this module!" : "Complete this to unlock the next module"}
          </p>
        </div>
      </div>

      <div className="bg-muted/30 rounded-lg p-4 mb-4">
        <p className="text-sm font-medium mb-1">Exit Condition:</p>
        <p className="text-muted-foreground">{exitCondition}</p>
      </div>

      {!isCompleted && (
        <Button
          onClick={handleMarkComplete}
          disabled={isLoading}
          className="btn-primary-glow w-full"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <CheckCircle className="w-4 h-4 mr-2" />
              Mark as Complete
            </>
          )}
        </Button>
      )}

      {isCompleted && (
        <div className="flex items-center justify-center gap-2 text-success">
          <CheckCircle className="w-5 h-5" />
          <span className="font-medium">Checkpoint Passed</span>
        </div>
      )}
    </motion.section>
  );
};
