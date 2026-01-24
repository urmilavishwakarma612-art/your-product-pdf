import { useState } from "react";
import { motion } from "framer-motion";
import { Calendar, Trophy, Users, CalendarDays, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MonthlyTracker } from "@/components/gamification/MonthlyTracker";
import { BadgesTab } from "@/components/gamification/BadgesTab";
import { LeaderboardTab } from "@/components/gamification/LeaderboardTab";

const upcomingEvents = [
  {
    id: 1,
    title: "Weekly DSA Contest",
    date: "Coming Soon",
    type: "contest",
    status: "upcoming",
  },
  {
    id: 2,
    title: "Pattern Deep Dive: DP",
    date: "Coming Soon",
    type: "workshop",
    status: "upcoming",
  },
  {
    id: 3,
    title: "Mock Interview Day",
    date: "Coming Soon",
    type: "challenge",
    status: "upcoming",
  },
];

export function HomeRightPanel() {
  const [activeTab, setActiveTab] = useState("tracker");

  return (
    <div className="space-y-6">
      {/* Tabs for Tracker/Badges/Leaderboard */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3 h-11">
          <TabsTrigger value="tracker" className="text-xs sm:text-sm">
            <Calendar className="w-4 h-4 mr-1.5" />
            <span className="hidden xl:inline">Tracker</span>
          </TabsTrigger>
          <TabsTrigger value="badges" className="text-xs sm:text-sm">
            <Trophy className="w-4 h-4 mr-1.5" />
            <span className="hidden xl:inline">Badges</span>
          </TabsTrigger>
          <TabsTrigger value="leaderboard" className="text-xs sm:text-sm">
            <Users className="w-4 h-4 mr-1.5" />
            <span className="hidden xl:inline">Rank</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="tracker" className="mt-4">
          <div className="max-h-[400px] overflow-y-auto scrollbar-hide">
            <MonthlyTracker />
          </div>
        </TabsContent>

        <TabsContent value="badges" className="mt-4">
          <div className="max-h-[400px] overflow-y-auto scrollbar-hide">
            <BadgesTab />
          </div>
        </TabsContent>

        <TabsContent value="leaderboard" className="mt-4">
          <div className="max-h-[400px] overflow-y-auto scrollbar-hide">
            <LeaderboardTab />
          </div>
        </TabsContent>
      </Tabs>

      {/* Events Section */}
      <Card className="border-dashed">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <CalendarDays className="w-4 h-4 text-primary" />
              Upcoming Events
            </CardTitle>
            <Button variant="ghost" size="sm" asChild className="text-xs h-7">
              <Link to="/events">
                View All
                <ArrowRight className="w-3 h-3 ml-1" />
              </Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {upcomingEvents.map((event, index) => (
            <motion.div
              key={event.id}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
            >
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                <CalendarDays className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{event.title}</p>
                <p className="text-xs text-muted-foreground">{event.date}</p>
              </div>
              <Badge variant="outline" className="text-xs flex-shrink-0">
                {event.status}
              </Badge>
            </motion.div>
          ))}

          <p className="text-xs text-center text-muted-foreground pt-2">
            Events feature coming soon!
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
