import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { LevelCard } from "@/components/curriculum/LevelCard";
import { CurriculumProgress } from "@/components/curriculum/CurriculumProgress";
import { WeekTimeline } from "@/components/curriculum/WeekTimeline";
import { useAuth } from "@/hooks/useAuth";
import { Helmet } from "react-helmet-async";
import { BookOpen, Target, Brain, Zap } from "lucide-react";

interface CurriculumLevel {
  id: string;
  level_number: number;
  name: string;
  description: string | null;
  color: string | null;
  icon: string | null;
  week_start: number | null;
  week_end: number | null;
  is_free: boolean;
  display_order: number;
}

interface CurriculumModule {
  id: string;
  level_id: string;
  pattern_id: string | null;
  module_number: number;
  name: string;
  subtitle: string | null;
  estimated_hours: number;
  display_order: number;
}

const Curriculum = () => {
  const { user } = useAuth();

  const { data: levels = [], isLoading: levelsLoading } = useQuery({
    queryKey: ["curriculum-levels"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("curriculum_levels")
        .select("*")
        .order("display_order", { ascending: true });
      if (error) throw error;
      return data as CurriculumLevel[];
    },
  });

  const { data: modules = [] } = useQuery({
    queryKey: ["curriculum-modules"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("curriculum_modules")
        .select("*")
        .order("display_order", { ascending: true });
      if (error) throw error;
      return data as CurriculumModule[];
    },
  });

  const { data: userProgress = [] } = useQuery({
    queryKey: ["user-curriculum-progress", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("user_curriculum_progress")
        .select("*")
        .eq("user_id", user.id);
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const getModulesForLevel = (levelId: string) =>
    modules.filter((m) => m.level_id === levelId);

  const philosophyItems = [
    {
      icon: Target,
      title: "Pattern Recognition",
      description: "Learn to identify patterns in < 5 seconds, not memorize solutions",
    },
    {
      icon: Brain,
      title: "Mental Models",
      description: "Build visual thinking frameworks for each pattern type",
    },
    {
      icon: BookOpen,
      title: "Why Before How",
      description: "Understand WHY patterns work before learning implementation",
    },
    {
      icon: Zap,
      title: "Interview Ready",
      description: "Practice ladder from confidence → thinking → interview twists",
    },
  ];

  return (
    <>
      <Helmet>
        <title>DSA Curriculum - Pattern-First Learning | NexAlgoTrix</title>
        <meta
          name="description"
          content="18-week structured DSA curriculum with pattern-first learning. Stop memorizing, start recognizing patterns."
        />
      </Helmet>

      <div className="min-h-screen bg-background">
        <Navbar />

        {/* Hero Section */}
        <section className="relative pt-32 pb-20 px-4 overflow-hidden">
          <div className="absolute inset-0 bg-grid opacity-30" />
          <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent" />

          <div className="max-w-6xl mx-auto relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-center mb-16"
            >
              <span className="inline-block px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium mb-6">
                Pattern-First Learning
              </span>
              <h1 className="text-4xl md:text-6xl font-bold mb-6">
                <span className="gradient-text">18-Week DSA</span>
                <br />
                <span className="text-foreground">Curriculum</span>
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
                Stop memorizing solutions. Start recognizing patterns.
                <br />
                Build interview intuition that lasts.
              </p>
            </motion.div>

            {/* Philosophy Cards */}
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-16">
              {philosophyItems.map((item, index) => (
                <motion.div
                  key={item.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="glass-card p-5"
                >
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-3">
                    <item.icon className="w-5 h-5 text-primary" />
                  </div>
                  <h3 className="font-semibold mb-1">{item.title}</h3>
                  <p className="text-sm text-muted-foreground">{item.description}</p>
                </motion.div>
              ))}
            </div>

            {/* Progress Overview */}
            {user && <CurriculumProgress levels={levels} modules={modules} userProgress={userProgress} />}
          </div>
        </section>

        {/* Week Timeline */}
        <WeekTimeline levels={levels} />

        {/* Levels Section */}
        <section className="py-20 px-4">
          <div className="max-w-5xl mx-auto">
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="text-center mb-12"
            >
              <h2 className="text-3xl font-bold mb-4">Learning Path</h2>
              <p className="text-muted-foreground max-w-xl mx-auto">
                Each level builds on the previous one. Master the fundamentals before moving to advanced patterns.
              </p>
            </motion.div>

            {levelsLoading ? (
              <div className="space-y-6">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-32 bg-card/50 animate-pulse rounded-xl" />
                ))}
              </div>
            ) : levels.length === 0 ? (
              <div className="text-center py-20">
                <p className="text-muted-foreground">Curriculum coming soon...</p>
              </div>
            ) : (
              <div className="space-y-6">
                {levels.map((level, index) => (
                  <LevelCard
                    key={level.id}
                    level={level}
                    modules={getModulesForLevel(level.id)}
                    index={index}
                    userProgress={userProgress}
                  />
                ))}
              </div>
            )}
          </div>
        </section>

        <Footer />
      </div>
    </>
  );
};

export default Curriculum;
