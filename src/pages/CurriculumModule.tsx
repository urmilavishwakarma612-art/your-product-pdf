import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import { AppLayout } from "@/components/layout/AppLayout";
import { ModuleHeader } from "@/components/curriculum/ModuleHeader";
import { WhySection } from "@/components/curriculum/WhySection";
import { WhenNotSection } from "@/components/curriculum/WhenNotSection";
import { MentalModel } from "@/components/curriculum/MentalModel";
import { PatternTemplate } from "@/components/curriculum/PatternTemplate";
import { SubPatternCard } from "@/components/curriculum/SubPatternCard";
import { PracticeLadder } from "@/components/curriculum/PracticeLadder";
import { TrapProblems } from "@/components/curriculum/TrapProblems";
import { ModuleCheckpoint } from "@/components/curriculum/ModuleCheckpoint";
import { useAuth } from "@/hooks/useAuth";
import { useSubscription } from "@/hooks/useSubscription";
import { Helmet } from "react-helmet-async";
import { ArrowLeft, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";

const CurriculumModule = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { isPremium } = useSubscription();

  const { data: module, isLoading: moduleLoading } = useQuery({
    queryKey: ["curriculum-module", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("curriculum_modules")
        .select(`
          *,
          curriculum_levels (
            id,
            level_number,
            name,
            is_free
          ),
          patterns (
            id,
            name,
            slug
          )
        `)
        .eq("id", id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const { data: subPatterns = [] } = useQuery({
    queryKey: ["sub-patterns", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sub_patterns")
        .select("*")
        .eq("module_id", id)
        .order("display_order", { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const { data: questions = [] } = useQuery({
    queryKey: ["module-questions", module?.pattern_id],
    queryFn: async () => {
      if (!module?.pattern_id) return [];
      const { data, error } = await supabase
        .from("questions")
        .select("*")
        .eq("pattern_id", module.pattern_id)
        .order("display_order", { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: !!module?.pattern_id,
  });

  const { data: userProgress } = useQuery({
    queryKey: ["user-module-progress", id, user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from("user_curriculum_progress")
        .select("*")
        .eq("user_id", user.id)
        .eq("module_id", id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!user && !!id,
  });

  if (moduleLoading) {
    return (
      <AppLayout>
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 w-48 bg-card rounded" />
            <div className="h-48 bg-card rounded-xl" />
            <div className="h-32 bg-card rounded-xl" />
          </div>
        </div>
      </AppLayout>
    );
  }

  if (!module) {
    return (
      <AppLayout>
        <div className="text-center py-20">
          <h1 className="text-2xl font-bold mb-4">Module Not Found</h1>
          <Link to="/curriculum">
            <Button variant="outline">Back to Curriculum</Button>
          </Link>
        </div>
      </AppLayout>
    );
  }

  const level = module.curriculum_levels as { id: string; level_number: number; name: string; is_free: boolean } | null;
  const isLocked = !isPremium && level && !level.is_free;

  const trapProblems = questions.filter((q) => q.is_trap_problem);

  return (
    <>
      <Helmet>
        <title>{module.name} - DSA Curriculum | NexAlgoTrix</title>
        <meta
          name="description"
          content={module.subtitle || `Learn ${module.name} pattern with mental models, practice problems, and interview tips.`}
        />
      </Helmet>

      <AppLayout>
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Back Link */}
          <Link
            to="/curriculum"
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Curriculum
          </Link>

          {isLocked ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-card p-12 text-center"
            >
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
                <Lock className="w-8 h-8 text-primary" />
              </div>
              <h2 className="text-2xl font-bold mb-3">Premium Module</h2>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                This module is part of our premium curriculum. Upgrade to access all modules, sub-patterns, and practice problems.
              </p>
              <Link to="/pricing">
                <Button className="btn-primary-glow">Upgrade to Pro</Button>
              </Link>
            </motion.div>
          ) : (
            <div className="space-y-8">
              <ModuleHeader module={module} level={level} userProgress={userProgress} />

              {module.why_exists && <WhySection content={module.why_exists} />}

              {module.when_not_to_use && <WhenNotSection content={module.when_not_to_use} />}

              {module.mental_model && <MentalModel content={module.mental_model} />}

              {module.pattern_template && <PatternTemplate content={module.pattern_template} />}

              {subPatterns.length > 0 && (
                <section>
                  <h2 className="text-xl font-bold mb-4">Sub-Patterns</h2>
                  <div className="grid md:grid-cols-2 gap-4">
                    {subPatterns.map((sp, index) => (
                      <SubPatternCard key={sp.id} subPattern={sp} index={index} />
                    ))}
                  </div>
                </section>
              )}

              {questions.length > 0 && (
                <PracticeLadder questions={questions} patternId={module.pattern_id} />
              )}

              {trapProblems.length > 0 && <TrapProblems problems={trapProblems} />}

              {module.exit_condition && (
                <ModuleCheckpoint
                  moduleId={module.id}
                  exitCondition={module.exit_condition}
                  userProgress={userProgress}
                />
              )}
            </div>
          )}
        </div>
      </AppLayout>
    </>
  );
};

export default CurriculumModule;