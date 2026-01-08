import { motion } from "framer-motion";
import { 
  Brain, Lightbulb, Bug, MessageSquare, Zap, 
  ArrowRight, Sparkles, BookOpen, Target, Shield 
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
    title: "Hint Mode",
    description: "Get progressive hints without spoiling the solution. Perfect for when you're stuck but want to solve it yourself.",
    color: "from-amber-500 to-orange-500",
    bgColor: "bg-amber-500/10",
    borderColor: "border-amber-500/20",
  },
  {
    id: "approach",
    icon: Target,
    title: "Approach Guide",
    description: "Understand the optimal approach step-by-step. Learn the 'why' behind each pattern application.",
    color: "from-blue-500 to-cyan-500",
    bgColor: "bg-blue-500/10",
    borderColor: "border-blue-500/20",
  },
  {
    id: "debug",
    icon: Bug,
    title: "Debug Helper",
    description: "Identify and fix errors in your code. Get explanations for common runtime issues and edge cases.",
    color: "from-red-500 to-pink-500",
    bgColor: "bg-red-500/10",
    borderColor: "border-red-500/20",
  },
  {
    id: "coaching",
    icon: MessageSquare,
    title: "Think-Aloud Coach",
    description: "Practice explaining your thought process. Get feedback on communication and problem-solving approach.",
    color: "from-purple-500 to-violet-500",
    bgColor: "bg-purple-500/10",
    borderColor: "border-purple-500/20",
  },
];

const features = [
  {
    icon: Brain,
    title: "Adaptive Learning",
    description: "AI adjusts difficulty based on your skill level (Beginner, Intermediate, Advanced)",
  },
  {
    icon: Shield,
    title: "Anti-Spoiler Protection",
    description: "Never gives away solutions directly — guides you to discover answers yourself",
  },
  {
    icon: Zap,
    title: "Session Memory",
    description: "Remembers your conversation history and builds on previous interactions",
  },
  {
    icon: BookOpen,
    title: "Pattern Recognition",
    description: "Helps you identify which DSA pattern applies and why",
  },
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
              <Brain className="w-3 h-3 mr-1" />
              AI-Powered Learning
            </Badge>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Your Personal{" "}
              <span className="bg-gradient-to-r from-primary to-purple-500 bg-clip-text text-transparent">
                AI Tutor
              </span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
              Learn DSA the right way with an AI mentor that adapts to your skill level, 
              guides without spoiling, and helps you think like an interviewer.
            </p>
            <Button 
              size="lg" 
              className="btn-primary-glow"
              onClick={handleStartPractice}
            >
              Start Practicing
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </motion.div>

          {/* Tutor Modes */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="mb-20"
          >
            <h2 className="text-2xl font-bold text-center mb-8">Choose Your Tutor Mode</h2>
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
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${mode.color} flex items-center justify-center`}>
                          <mode.icon className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <CardTitle className="text-lg">{mode.title}</CardTitle>
                        </div>
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

          {/* Features */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="mb-20"
          >
            <h2 className="text-2xl font-bold text-center mb-8">How It Works</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {features.map((feature, index) => (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 * index, duration: 0.5 }}
                  className="text-center"
                >
                  <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                    <feature.icon className="w-7 h-7 text-primary" />
                  </div>
                  <h3 className="font-semibold mb-2">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* CTA Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.6 }}
            className="text-center"
          >
            <Card className="bg-gradient-to-br from-primary/10 to-purple-500/10 border-primary/20">
              <CardContent className="py-12">
                <Sparkles className="w-12 h-12 text-primary mx-auto mb-4" />
                <h2 className="text-2xl font-bold mb-4">Ready to Learn Smarter?</h2>
                <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                  Access AI Tutor on any problem in our curriculum. Just click the tutor icon while solving.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button 
                    size="lg" 
                    className="btn-primary-glow"
                    onClick={handleStartPractice}
                  >
                    Go to Curriculum
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
