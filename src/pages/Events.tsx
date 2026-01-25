import { motion } from "framer-motion";
import { Calendar, Trophy, Users, Clock, Zap, Star, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AppLayout } from "@/components/layout/AppLayout";
const eventTypes = [
  {
    icon: Zap,
    title: "Coding Challenges",
    description: "Daily & multi-day challenges with pattern-based problem sets. Build consistency and earn XP + badges.",
    color: "from-amber-500 to-orange-500",
    status: "coming-soon",
  },
  {
    icon: Trophy,
    title: "DSA Contests",
    description: "Weekly & monthly competitive contests with live leaderboards, rankings, and real-time scoring.",
    color: "from-purple-500 to-violet-500",
    status: "coming-soon",
  },
  {
    icon: Users,
    title: "Coding Workshops",
    description: "Live, hands-on problem-solving sessions with step-by-step thinking and replay access.",
    color: "from-blue-500 to-cyan-500",
    status: "coming-soon",
  },
];

const features = [
  { icon: Calendar, text: "Browse upcoming & past events" },
  { icon: Clock, text: "Live status system (Upcoming / Live / Ended)" },
  { icon: Star, text: "XP rewards & exclusive badges" },
  { icon: Trophy, text: "Fair leaderboards & rankings" },
];

export default function Events() {
  return (
    <AppLayout>
      {/* Hero */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center mb-12"
      >
        <Badge className="mb-4 bg-amber-500/10 text-amber-500 border-amber-500/20">
          <Calendar className="w-3 h-3 mr-1" />
          Coming Soon
        </Badge>
        <h1 className="text-3xl md:text-4xl font-bold mb-4">
          NexAlgoTrix{" "}
          <span className="bg-gradient-to-r from-amber-500 to-orange-500 bg-clip-text text-transparent">
            Events
          </span>
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Participate in coding challenges, compete in DSA contests, and join live workshops.
        </p>
      </motion.div>

      {/* Event Types */}
      <div className="grid md:grid-cols-3 gap-6 mb-12">
        {eventTypes.map((event, index) => (
          <motion.div
            key={event.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 * index, duration: 0.5 }}
          >
            <Card className="h-full border-dashed border-2 bg-muted/30">
              <CardHeader className="text-center">
                <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${event.color} flex items-center justify-center mx-auto mb-4 opacity-50`}>
                  <event.icon className="w-8 h-8 text-white" />
                </div>
                <Badge variant="secondary" className="mx-auto mb-2">Coming Soon</Badge>
                <CardTitle>{event.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-center">
                  {event.description}
                </CardDescription>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Features Preview */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.6 }}
      >
        <Card className="bg-gradient-to-br from-muted/50 to-muted/30 border-dashed border-2">
          <CardContent className="py-12 text-center">
            <h2 className="text-2xl font-bold mb-6">What's Coming</h2>
            <div className="grid sm:grid-cols-2 gap-4 max-w-lg mx-auto mb-8">
              {features.map((feature, index) => (
                <div key={index} className="flex items-center gap-3 text-muted-foreground">
                  <feature.icon className="w-5 h-5 text-primary" />
                  <span className="text-sm">{feature.text}</span>
                </div>
              ))}
            </div>
            <Button disabled className="opacity-50">
              Notify Me When Ready
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </CardContent>
        </Card>
      </motion.div>
    </AppLayout>
  );
}
