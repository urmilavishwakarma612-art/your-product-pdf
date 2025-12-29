import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import { Layers, FileQuestion, Users, Trophy } from "lucide-react";

const AdminDashboard = () => {
  const { data: stats } = useQuery({
    queryKey: ["admin-stats"],
    queryFn: async () => {
      const [patterns, questions, profiles, badges] = await Promise.all([
        supabase.from("patterns").select("id", { count: "exact" }),
        supabase.from("questions").select("id", { count: "exact" }),
        supabase.from("profiles").select("id", { count: "exact" }),
        supabase.from("badges").select("id", { count: "exact" }),
      ]);
      
      return {
        patterns: patterns.count || 0,
        questions: questions.count || 0,
        users: profiles.count || 0,
        badges: badges.count || 0,
      };
    },
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2">Admin Dashboard</h1>
        <p className="text-muted-foreground">Manage your Nexalgotrix platform</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          icon={<Layers className="w-6 h-6" />}
          label="Total Patterns"
          value={stats?.patterns || 0}
          color="primary"
        />
        <StatCard
          icon={<FileQuestion className="w-6 h-6" />}
          label="Total Questions"
          value={stats?.questions || 0}
          color="secondary"
        />
        <StatCard
          icon={<Users className="w-6 h-6" />}
          label="Total Users"
          value={stats?.users || 0}
          color="success"
        />
        <StatCard
          icon={<Trophy className="w-6 h-6" />}
          label="Total Badges"
          value={stats?.badges || 0}
          color="warning"
        />
      </div>

      <div className="glass-card p-8">
        <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
        <p className="text-muted-foreground">
          Use the sidebar to manage patterns, questions, users, and badges. 
          Start by adding patterns, then add questions to each pattern.
        </p>
      </div>
    </div>
  );
};

function StatCard({ 
  icon, 
  label, 
  value, 
  color 
}: { 
  icon: React.ReactNode; 
  label: string; 
  value: number; 
  color: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card p-6"
    >
      <div className={`w-12 h-12 rounded-xl bg-${color}/20 text-${color} flex items-center justify-center mb-4`}>
        {icon}
      </div>
      <div className="text-3xl font-bold mb-1">{value}</div>
      <div className="text-sm text-muted-foreground">{label}</div>
    </motion.div>
  );
}

export default AdminDashboard;