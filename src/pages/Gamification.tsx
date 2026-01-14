import { useState } from "react";
import { motion } from "framer-motion";
import { Trophy, Calendar, Users } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Navbar } from "@/components/landing/Navbar";
import { MonthlyTracker } from "@/components/gamification/MonthlyTracker";
import { BadgesTab } from "@/components/gamification/BadgesTab";
import { LeaderboardTab } from "@/components/gamification/LeaderboardTab";
import { InterviewReadinessScore } from "@/components/gamification/InterviewReadinessScore";
import { PatternMasteryMeter } from "@/components/gamification/PatternMasteryMeter";
import { WeeklyReflection } from "@/components/gamification/WeeklyReflection";
import { useBadgeAwarder } from "@/hooks/useBadgeAwarder";

export default function Gamification() {
  const [activeTab, setActiveTab] = useState("tracker");
  
  // Initialize badge awarding system
  useBadgeAwarder();

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="pt-24 pb-20 px-4">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center mb-8"
          >
            <h1 className="text-3xl md:text-4xl font-bold mb-2">
              Rewards & <span className="text-primary">Progress</span>
            </h1>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Track your consistency, earn badges, and climb leagues through disciplined practice.
            </p>
          </motion.div>

          {/* V2 Score Cards */}
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <InterviewReadinessScore />
            <PatternMasteryMeter />
            <WeeklyReflection />
          </div>

          {/* Main Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid grid-cols-3 w-full max-w-md mx-auto">
              <TabsTrigger value="tracker" className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                <span className="hidden sm:inline">Tracker</span>
              </TabsTrigger>
              <TabsTrigger value="badges" className="flex items-center gap-2">
                <Trophy className="w-4 h-4" />
                <span className="hidden sm:inline">Badges</span>
              </TabsTrigger>
              <TabsTrigger value="leaderboard" className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                <span className="hidden sm:inline">Leaderboard</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="tracker">
              <MonthlyTracker />
            </TabsContent>

            <TabsContent value="badges">
              <BadgesTab />
            </TabsContent>

            <TabsContent value="leaderboard">
              <LeaderboardTab />
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}
