import { motion } from "framer-motion";
import { 
  Brain, Lightbulb, Bug, MessageSquare, Zap, 
  ArrowRight, Sparkles, BookOpen, Target, Shield,
  Users, Timer, Code2, GraduationCap
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Navbar } from "@/components/landing/Navbar";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

const tutorModes = [
  {
    id: "hint",
    icon: Lightbulb,
    title: "Directional Hints",
    description: "Get a subtle nudge without spoiling the solution. I'll point you in the right direction with a single question.",
    color: "from-amber-500 to-orange-500",
    bgColor: "bg-amber-500/10",
    borderColor: "border-amber-500/20",
    tag: "Low Guidance",
  },
  {
    id: "approach",
    icon: Target,
    title: "Approach Discovery",
    description: "I'll ask questions to help you discover the optimal approach yourself. No spoon-feeding — just guided thinking.",
    color: "from-blue-500 to-cyan-500",
    bgColor: "bg-blue-500/10",
    borderColor: "border-blue-500/20",
    tag: "Interview-Style",
  },
  {
    id: "debug",
    icon: Bug,
    title: "Debug Together",
    description: "Walk me through your code. I'll ask questions about specific lines to help you find the bug yourself.",
    color: "from-red-500 to-pink-500",
    bgColor: "bg-red-500/10",
    borderColor: "border-red-500/20",
    tag: "Code Review",
  },
  {
    id: "coaching",
    icon: MessageSquare,
    title: "Think-Aloud Mode",
    description: "Practice explaining your thought process out loud. I'll challenge your reasoning like a real interviewer.",
    color: "from-purple-500 to-violet-500",
    bgColor: "bg-purple-500/10",
    borderColor: "border-purple-500/20",
    tag: "Interview Prep",
  },
];

const mentorTraits = [
  {
    icon: GraduationCap,
    title: "Senior Engineer Mindset",
    description: "I've been through the big tech interview grind. I know what interviewers look for.",
  },
  {
    icon: Brain,
    title: "Socratic Method",
    description: "I ask questions instead of giving answers. You'll remember what you discover yourself.",
  },
  {
    icon: Timer,
    title: "Short & Sharp",
    description: "2-4 lines max. No essays. Just focused guidance that respects your time.",
  },
  {
    icon: Shield,
    title: "Anti-Spoiler System",
    description: "I never give solutions. If you ask directly, I'll redirect you to the thinking process.",
  },
];

const howItWorks = [
  { step: "1", title: "You Explain", description: "Tell me your current approach or where you're stuck" },
  { step: "2", title: "I Question", description: "I ask clarifying or challenging follow-up questions" },
  { step: "3", title: "You Think", description: "Answer my questions to refine your understanding" },
  { step: "4", title: "Insight Emerges", description: "The solution becomes clear through your own reasoning" },
];

export default function AITutor() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleStartPractice = () => {
    if (user) {
      navigate("/curriculum");
    } else {
      navigate("/auth?next=/curriculum");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="pt-32 pb-20 px-4">
        <div className="max-w-6xl mx-auto">
          {/* Hero Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <Badge className="mb-4 bg-primary/10 text-primary border-primary/20">
              <Sparkles className="w-3 h-3 mr-1" />
              AI-Powered Mentorship
            </Badge>
            <h1 className="text-4xl md:text-6xl font-bold mb-4">
              Meet{" "}
              <span className="bg-gradient-to-r from-primary via-purple-500 to-pink-500 bg-clip-text text-transparent">
                NEXMENTOR
              </span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-2">
              Your senior engineer mentor who guides without spoiling.
            </p>
            <p className="text-lg text-muted-foreground/80 max-w-xl mx-auto mb-8">
              I don't solve problems for you. I train you to think like an interviewer expects.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg" 
                className="btn-primary-glow"
                onClick={handleStartPractice}
              >
                Start Practicing
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
              <Button size="lg" variant="outline">
                <Users className="w-4 h-4 mr-2" />
                Watch Demo
              </Button>
            </div>
          </motion.div>

          {/* Quote Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.6 }}
            className="mb-20"
          >
            <Card className="bg-gradient-to-r from-primary/5 via-purple-500/5 to-pink-500/5 border-primary/10">
              <CardContent className="py-8 text-center">
                <blockquote className="text-xl md:text-2xl font-medium italic text-foreground/90 mb-4">
                  "You are not here to solve. You are here to train thinkers."
                </blockquote>
                <p className="text-muted-foreground">— NEXMENTOR Philosophy</p>
              </CardContent>
            </Card>
          </motion.div>

          {/* Mentor Traits */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="mb-20"
          >
            <h2 className="text-2xl font-bold text-center mb-2">What Makes NEXMENTOR Different</h2>
            <p className="text-muted-foreground text-center mb-8 max-w-lg mx-auto">
              Not a chatbot. A senior engineer who's been through the interview grind.
            </p>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {mentorTraits.map((trait, index) => (
                <motion.div
                  key={trait.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 * index, duration: 0.5 }}
                  className="text-center"
                >
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/20 to-purple-500/20 flex items-center justify-center mx-auto mb-4">
                    <trait.icon className="w-7 h-7 text-primary" />
                  </div>
                  <h3 className="font-semibold mb-2">{trait.title}</h3>
                  <p className="text-sm text-muted-foreground">{trait.description}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Tutor Modes */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="mb-20"
          >
            <h2 className="text-2xl font-bold text-center mb-2">Choose Your Mentoring Style</h2>
            <p className="text-muted-foreground text-center mb-8">
              Different modes for different needs. All designed to make you think.
            </p>
            <div className="grid md:grid-cols-2 gap-6">
              {tutorModes.map((mode, index) => (
                <motion.div
                  key={mode.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 * index, duration: 0.5 }}
                  whileHover={{ scale: 1.02 }}
                >
                  <Card className={`h-full ${mode.bgColor} ${mode.borderColor} border hover:shadow-lg transition-all cursor-pointer`}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${mode.color} flex items-center justify-center`}>
                            <mode.icon className="w-6 h-6 text-white" />
                          </div>
                          <div>
                            <CardTitle className="text-lg">{mode.title}</CardTitle>
                          </div>
                        </div>
                        <Badge variant="secondary" className="text-xs">
                          {mode.tag}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <CardDescription className="text-base">
                        {mode.description}
                      </CardDescription>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* How It Works */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="mb-20"
          >
            <h2 className="text-2xl font-bold text-center mb-2">The NEXMENTOR Flow</h2>
            <p className="text-muted-foreground text-center mb-8">
              70% you talk, 30% I guide. That's how real learning happens.
            </p>
            <div className="flex flex-col md:flex-row gap-4 justify-center items-center">
              {howItWorks.map((item, index) => (
                <motion.div
                  key={item.step}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.1 * index, duration: 0.5 }}
                  className="flex flex-col items-center text-center max-w-[200px]"
                >
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-3 text-primary font-bold text-lg">
                    {item.step}
                  </div>
                  <h3 className="font-semibold mb-1">{item.title}</h3>
                  <p className="text-sm text-muted-foreground">{item.description}</p>
                  {index < howItWorks.length - 1 && (
                    <ArrowRight className="w-5 h-5 text-muted-foreground mt-4 hidden md:block rotate-0 md:rotate-0" />
                  )}
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Example Conversation */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.6 }}
            className="mb-20"
          >
            <h2 className="text-2xl font-bold text-center mb-8">See NEXMENTOR in Action</h2>
            <Card className="max-w-2xl mx-auto bg-card/50 border-border/50">
              <CardContent className="py-6 space-y-4">
                {/* User message */}
                <div className="flex justify-end">
                  <div className="bg-primary text-primary-foreground rounded-xl px-4 py-2 max-w-[80%]">
                    <p className="text-sm">"I think two pointers will work here."</p>
                  </div>
                </div>
                {/* Mentor response */}
                <div className="flex justify-start">
                  <div className="bg-muted rounded-xl px-4 py-2 max-w-[80%]">
                    <p className="text-sm text-muted-foreground mb-1 font-medium">NEXMENTOR</p>
                    <p className="text-sm">"Good instinct. But tell me — what are your two pointers tracking? And why would they move?"</p>
                  </div>
                </div>
                {/* User message */}
                <div className="flex justify-end">
                  <div className="bg-primary text-primary-foreground rounded-xl px-4 py-2 max-w-[80%]">
                    <p className="text-sm">"One from start, one from end. If sum is greater, move right."</p>
                  </div>
                </div>
                {/* Mentor response */}
                <div className="flex justify-start">
                  <div className="bg-muted rounded-xl px-4 py-2 max-w-[80%]">
                    <p className="text-sm text-muted-foreground mb-1 font-medium">NEXMENTOR</p>
                    <p className="text-sm">"Why does moving the right pointer reduce the sum? Walk me through the intuition."</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* CTA Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.6 }}
            className="text-center"
          >
            <Card className="bg-gradient-to-br from-primary/10 via-purple-500/10 to-pink-500/10 border-primary/20">
              <CardContent className="py-12">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center mx-auto mb-4">
                  <Sparkles className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-2xl font-bold mb-2">Ready to Think Like an Interviewer?</h2>
                <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                  NEXMENTOR is available on every problem in our curriculum. Click the mentor icon while solving.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button 
                    size="lg" 
                    className="btn-primary-glow"
                    onClick={handleStartPractice}
                  >
                    Start with NEXMENTOR
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                  <Link to="/pricing">
                    <Button size="lg" variant="outline">
                      View Pricing
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </main>
    </div>
  );
}
