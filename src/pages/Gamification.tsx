import { motion } from "framer-motion";
import { 
  Trophy, Calendar, Award, TrendingUp, 
  Flame, Target, Medal, Star, ArrowRight 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Navbar } from "@/components/landing/Navbar";

const modules = [
  {
    icon: Calendar,
    title: "Monthly Tracker",
    description: "GitHub-style calendar to track your daily progress. Visualize streaks, holidays, and freeze days.",
    color: "from-green-500 to-emerald-500",
  },
  {
    icon: Award,
    title: "Badges System",
    description: "Earn badges for streaks, problem solving, pattern mastery, and XP milestones. Share on LinkedIn!",
    color: "from-amber-500 to-orange-500",
  },
  {
    icon: Trophy,
    title: "Leaderboard",
    description: "League-based ranking (Iron → Platinum) without rank shaming. Motivation without humiliation.",
    color: "from-purple-500 to-violet-500",
  },
];

const badgeCategories = [
  { icon: Flame, title: "Streak Badges", examples: "3, 7, 14, 30, 50, 100 Days" },
  { icon: Target, title: "Problem Solving", examples: "10, 30, 50, 100, 200, 300 solved" },
  { icon: Medal, title: "Pattern Mastery", examples: "Two Pointer, Sliding Window, etc." },
  { icon: Star, title: "XP Milestones", examples: "500, 1000, 2500, 5000, 10000 XP" },
];

export default function Gamification() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="pt-32 pb-20 px-4">
        <div className="max-w-5xl mx-auto">
          {/* Hero */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <Badge className="mb-4 bg-amber-500/10 text-amber-500 border-amber-500/20">
              <Trophy className="w-3 h-3 mr-1" />
              Coming Soon
            </Badge>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Gamification{" "}
              <span className="bg-gradient-to-r from-amber-500 to-orange-500 bg-clip-text text-transparent">
                System
              </span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Track progress, earn badges, and climb leagues. A serious, interview-oriented 
              gamification system that rewards discipline, not comparison.
            </p>
          </motion.div>

          {/* Core Modules */}
          <div className="grid md:grid-cols-3 gap-6 mb-16">
            {modules.map((module, index) => (
              <motion.div
                key={module.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * index, duration: 0.5 }}
              >
                <Card className="h-full border-dashed border-2 bg-muted/30">
                  <CardHeader className="text-center">
                    <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${module.color} flex items-center justify-center mx-auto mb-4 opacity-50`}>
                      <module.icon className="w-8 h-8 text-white" />
                    </div>
                    <CardTitle>{module.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-center">
                      {module.description}
                    </CardDescription>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* Badge Categories */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="mb-16"
          >
            <h2 className="text-2xl font-bold text-center mb-8">Badge Categories</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {badgeCategories.map((category, index) => (
                <Card key={index} className="text-center border-dashed bg-muted/20">
                  <CardContent className="pt-6">
                    <category.icon className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
                    <h3 className="font-semibold mb-1">{category.title}</h3>
                    <p className="text-xs text-muted-foreground">{category.examples}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </motion.div>

          {/* V2 Preview */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.6 }}
          >
            <Card className="bg-gradient-to-br from-muted/50 to-muted/30 border-dashed border-2">
              <CardContent className="py-12 text-center">
                <TrendingUp className="w-12 h-12 text-primary mx-auto mb-4 opacity-50" />
                <h2 className="text-2xl font-bold mb-4">V2 Coming Later</h2>
                <p className="text-muted-foreground max-w-lg mx-auto mb-6">
                  Pattern Mastery System, Interview Readiness Score, Smart Streak with burnout protection, 
                  Weekly Reflection Reports, and more.
                </p>
                <Button disabled className="opacity-50">
                  Notify Me
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </main>
    </div>
  );
}
