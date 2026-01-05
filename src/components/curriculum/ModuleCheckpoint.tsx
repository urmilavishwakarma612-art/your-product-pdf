import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Target, CheckCircle, Loader2, ChevronRight, PartyPopper } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

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
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  // Fetch next module
  const { data: nextModule } = useQuery({
    queryKey: ["next-module", moduleId],
    queryFn: async () => {
      // Get current module details
      const { data: currentModule } = await supabase
        .from("curriculum_modules")
        .select("level_id, module_number")
        .eq("id", moduleId)
        .single();

      if (!currentModule) return null;

      // Try to find next module in same level
      const { data: nextInLevel } = await supabase
        .from("curriculum_modules")
        .select("id, name, module_number, level_id")
        .eq("level_id", currentModule.level_id)
        .gt("module_number", currentModule.module_number)
        .order("module_number")
        .limit(1)
        .maybeSingle();

      if (nextInLevel) {
        return nextInLevel;
      }

      // Try to find first module in next level
      const { data: currentLevel } = await supabase
        .from("curriculum_levels")
        .select("level_number")
        .eq("id", currentModule.level_id)
        .single();

      if (!currentLevel) return null;

      const { data: nextLevel } = await supabase
        .from("curriculum_levels")
        .select("id")
        .gt("level_number", currentLevel.level_number)
        .order("level_number")
        .limit(1)
        .maybeSingle();

      if (!nextLevel) return null;

      const { data: firstInNextLevel } = await supabase
        .from("curriculum_modules")
        .select("id, name, module_number, level_id")
        .eq("level_id", nextLevel.id)
        .order("module_number")
        .limit(1)
        .maybeSingle();

      return firstInNextLevel;
    },
  });

  const handleMarkComplete = async () => {
    if (!user) {
      toast.error("Please sign in to track progress");
      return;
    }

    setIsLoading(true);
    try {
      if (userProgress) {
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
      
      // Show success modal if there's a next module
      if (nextModule) {
        setShowSuccessModal(true);
      } else {
        toast.success("Module completed! 🎉 You've finished all available modules!");
      }
    } catch (error) {
      console.error("Error marking checkpoint:", error);
      toast.error("Failed to update progress");
    } finally {
      setIsLoading(false);
    }
  };

  const handleContinueToNext = () => {
    if (nextModule) {
      navigate(`/curriculum/module/${nextModule.id}`);
    }
    setShowSuccessModal(false);
  };

  const isCompleted = userProgress?.checkpoint_passed;

  return (
    <>
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

      {/* Success Modal */}
      <Dialog open={showSuccessModal} onOpenChange={setShowSuccessModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center">
                <PartyPopper className="w-8 h-8 text-success" />
              </div>
            </div>
            <DialogTitle className="text-center text-2xl">Module Completed! 🎉</DialogTitle>
            <DialogDescription className="text-center">
              Excellent work! You've mastered this module. Ready to take on the next challenge?
            </DialogDescription>
          </DialogHeader>
          
          {nextModule && (
            <div className="bg-muted/30 rounded-lg p-4 my-4">
              <p className="text-sm text-muted-foreground mb-1">Next Module:</p>
              <p className="font-medium">{nextModule.name}</p>
            </div>
          )}

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={() => setShowSuccessModal(false)} className="w-full sm:w-auto">
              Stay Here
            </Button>
            <Button onClick={handleContinueToNext} className="w-full sm:w-auto btn-primary-glow">
              Continue to Next Module
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};