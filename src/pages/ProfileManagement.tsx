import { motion } from "framer-motion";
import { 
  User, GraduationCap, Briefcase, Link2, 
  Shield, Award, ArrowRight, Settings 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Navbar } from "@/components/landing/Navbar";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";

const sections = [
  {
    icon: User,
    title: "Basic Information",
    description: "Name, photo, mobile, email, address",
    color: "from-blue-500 to-cyan-500",
  },
  {
    icon: GraduationCap,
    title: "Academic Details",
    description: "College, degree, CGPA, graduation year",
    color: "from-purple-500 to-violet-500",
  },
  {
    icon: Briefcase,
    title: "Work Experience",
    description: "Internships, jobs, roles, tech stack",
    color: "from-amber-500 to-orange-500",
  },
  {
    icon: Link2,
    title: "Social & Professional",
    description: "LinkedIn, GitHub, Twitter, portfolio",
    color: "from-green-500 to-emerald-500",
  },
];

const benefits = [
  { icon: Award, text: "Accurate certificates with your details" },
  { icon: Settings, text: "Personalized AI Tutor guidance" },
  { icon: Shield, text: "Fair leaderboard & badge system" },
  { icon: Briefcase, text: "One-click placement readiness" },
];

export default function ProfileManagement() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleGoToProfile = () => {
    if (user) {
      navigate("/profile");
    } else {
      navigate("/auth?next=/profile");
    }
  };

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
            <Badge className="mb-4 bg-blue-500/10 text-blue-500 border-blue-500/20">
              <User className="w-3 h-3 mr-1" />
              Coming Soon
            </Badge>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Profile &{" "}
              <span className="bg-gradient-to-r from-blue-500 to-cyan-500 bg-clip-text text-transparent">
                Account
              </span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Your identity. Your progress. One place. Manage your personal info, 
              academic background, skills, and social presence.
            </p>
          </motion.div>

          {/* Profile Sections */}
          <div className="grid sm:grid-cols-2 gap-6 mb-16">
            {sections.map((section, index) => (
              <motion.div
                key={section.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * index, duration: 0.5 }}
              >
                <Card className="h-full border-dashed border-2 bg-muted/30">
                  <CardHeader>
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${section.color} flex items-center justify-center opacity-50`}>
                        <section.icon className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{section.title}</CardTitle>
                        <CardDescription>{section.description}</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* Benefits */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="mb-16"
          >
            <h2 className="text-2xl font-bold text-center mb-8">Why Complete Your Profile?</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {benefits.map((benefit, index) => (
                <div key={index} className="flex items-center gap-3 p-4 rounded-lg bg-muted/30">
                  <benefit.icon className="w-5 h-5 text-primary flex-shrink-0" />
                  <span className="text-sm">{benefit.text}</span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* CTA */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.6 }}
          >
            <Card className="bg-gradient-to-br from-muted/50 to-muted/30 border-dashed border-2">
              <CardContent className="py-12 text-center">
                <Settings className="w-12 h-12 text-primary mx-auto mb-4 opacity-50" />
                <h2 className="text-2xl font-bold mb-4">Enhanced Profile Coming Soon</h2>
                <p className="text-muted-foreground max-w-lg mx-auto mb-6">
                  Full profile management with academic details, work experience, 
                  skills tracking, and professional links. Used for certificates, 
                  AI Tutor personalization, and future placement features.
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
