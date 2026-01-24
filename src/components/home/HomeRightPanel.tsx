import { useState } from "react";
import { motion } from "framer-motion";
import { Calendar, Trophy, Users, CalendarDays, ArrowRight, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MonthlyTrackerCompact } from "./MonthlyTrackerCompact";
import { BadgesCompact } from "./BadgesCompact";
import { LeaderboardCompact } from "./LeaderboardCompact";

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
    <div className="space-y-4">
      {/* Compact Tabs for Tracker/Badges/Leaderboard */}
      <Card className="border-border/50 bg-card/50 backdrop-blur">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 h-10 bg-muted/50">
            <TabsTrigger 
              value="tracker" 
              className="text-xs gap-1.5 data-[state=active]:bg-background"
            >
              <Calendar className="w-3.5 h-3.5" />
              <span className="hidden xl:inline">Activity</span>
            </TabsTrigger>
            <TabsTrigger 
              value="badges" 
              className="text-xs gap-1.5 data-[state=active]:bg-background"
            >
              <Trophy className="w-3.5 h-3.5" />
              <span className="hidden xl:inline">Badges</span>
            </TabsTrigger>
            <TabsTrigger 
              value="leaderboard" 
              className="text-xs gap-1.5 data-[state=active]:bg-background"
            >
              <Users className="w-3.5 h-3.5" />
              <span className="hidden xl:inline">Rank</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="tracker" className="mt-0 p-3">
            <ScrollArea className="h-[280px]">
              <MonthlyTrackerCompact />
            </ScrollArea>
          </TabsContent>

          <TabsContent value="badges" className="mt-0 p-3">
            <ScrollArea className="h-[280px]">
              <BadgesCompact />
            </ScrollArea>
          </TabsContent>

          <TabsContent value="leaderboard" className="mt-0 p-3">
            <ScrollArea className="h-[280px]">
              <LeaderboardCompact />
            </ScrollArea>
          </TabsContent>
        </Tabs>

        {/* View All Link */}
        <div className="px-3 pb-3">
          <Button variant="ghost" size="sm" asChild className="w-full h-8 text-xs">
            <Link to="/gamification">
              <Sparkles className="w-3.5 h-3.5 mr-1.5" />
              View Full Stats
              <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
            </Link>
          </Button>
        </div>
      </Card>

      {/* Events Section */}
      <Card className="border-border/50 bg-card/50 backdrop-blur">
        <CardHeader className="pb-2 px-4 pt-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm flex items-center gap-2">
              <CalendarDays className="w-4 h-4 text-primary" />
              Upcoming Events
            </CardTitle>
            <Button variant="ghost" size="sm" asChild className="text-xs h-6 px-2">
              <Link to="/events">
                View All
                <ArrowRight className="w-3 h-3 ml-1" />
              </Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent className="px-4 pb-4 space-y-2">
          {upcomingEvents.map((event, index) => (
            <motion.div
              key={event.id}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="flex items-center gap-2.5 p-2.5 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
            >
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                <CalendarDays className="w-4 h-4 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium truncate">{event.title}</p>
                <p className="text-[10px] text-muted-foreground">{event.date}</p>
              </div>
              <Badge variant="outline" className="text-[10px] px-1.5 py-0 flex-shrink-0">
                {event.status}
              </Badge>
            </motion.div>
          ))}

          <p className="text-[10px] text-center text-muted-foreground pt-1">
            Events feature coming soon!
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
