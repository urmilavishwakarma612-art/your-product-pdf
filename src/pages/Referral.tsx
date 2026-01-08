import { motion } from "framer-motion";
import { 
  Gift, Users, Wallet, Shield, 
  Award, TrendingUp, ArrowRight, Copy 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Navbar } from "@/components/landing/Navbar";

const rewardTiers = [
  { referrals: 1, monthly: "10 Days Pro OR ₹100", yearly: "₹300 OR 2 Months Pro" },
  { referrals: 3, monthly: "30 Days Pro OR ₹300", yearly: "₹1000 OR 6 Months Pro" },
  { referrals: 5, monthly: "60 Days Pro OR ₹600", yearly: "₹2000 OR 1 Year Pro" },
  { referrals: 10, monthly: "—", yearly: "₹5000 + Ambassador Badge + 1 Year Pro" },
];

const features = [
  { icon: Users, title: "Track Referrals", description: "See who clicked, registered, and purchased" },
  { icon: Wallet, title: "Earn Rewards", description: "Choose between cash or Pro subscription" },
  { icon: Shield, title: "Anti-Abuse", description: "Fair system with fraud prevention" },
  { icon: Award, title: "Badges & Ranks", description: "Unlock Ambassador badge and more" },
];

export default function Referral() {
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
            <Badge className="mb-4 bg-green-500/10 text-green-500 border-green-500/20">
              <Gift className="w-3 h-3 mr-1" />
              Coming Soon
            </Badge>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Referral{" "}
              <span className="bg-gradient-to-r from-green-500 to-emerald-500 bg-clip-text text-transparent">
                Program
              </span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Share NexAlgoTrix with friends and earn rewards. Get Pro subscription time 
              or cash rewards for every successful referral.
            </p>
          </motion.div>

          {/* Sample Referral Link */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="mb-16"
          >
            <Card className="border-dashed border-2 bg-muted/30">
              <CardContent className="py-8">
                <div className="flex flex-col md:flex-row items-center justify-center gap-4">
                  <div className="flex-1 w-full md:w-auto">
                    <p className="text-sm text-muted-foreground mb-2 text-center md:text-left">Your Referral Link (Coming Soon)</p>
                    <div className="flex items-center gap-2 bg-muted/50 rounded-lg px-4 py-3">
                      <span className="text-sm text-muted-foreground truncate">nexalgotrix.in/join?ref=YOUR_CODE</span>
                      <Button size="sm" variant="ghost" disabled>
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Reward Tiers */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="mb-16"
          >
            <h2 className="text-2xl font-bold text-center mb-8">Reward Tiers</h2>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-4 font-medium">Referrals</th>
                    <th className="text-left py-3 px-4 font-medium">Monthly Plan Reward</th>
                    <th className="text-left py-3 px-4 font-medium">Yearly Plan Reward</th>
                  </tr>
                </thead>
                <tbody>
                  {rewardTiers.map((tier, index) => (
                    <tr key={index} className="border-b border-border/50">
                      <td className="py-3 px-4">
                        <Badge variant="secondary">{tier.referrals}</Badge>
                      </td>
                      <td className="py-3 px-4 text-sm text-muted-foreground">{tier.monthly}</td>
                      <td className="py-3 px-4 text-sm text-muted-foreground">{tier.yearly}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>

          {/* Features */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-16"
          >
            {features.map((feature, index) => (
              <Card key={index} className="text-center border-dashed bg-muted/20">
                <CardContent className="pt-6">
                  <feature.icon className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
                  <h3 className="font-semibold mb-1">{feature.title}</h3>
                  <p className="text-xs text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </motion.div>

          {/* CTA */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.6 }}
          >
            <Card className="bg-gradient-to-br from-muted/50 to-muted/30 border-dashed border-2">
              <CardContent className="py-12 text-center">
                <TrendingUp className="w-12 h-12 text-primary mx-auto mb-4 opacity-50" />
                <h2 className="text-2xl font-bold mb-4">Launching Soon</h2>
                <p className="text-muted-foreground max-w-lg mx-auto mb-6">
                  Full referral dashboard with tracking, earnings, gamification, and admin controls.
                </p>
                <Button disabled className="opacity-50">
                  Get Notified
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
