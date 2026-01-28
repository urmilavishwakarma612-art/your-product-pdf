import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDistanceToNow } from "date-fns";

interface Profile {
  id: string;
  username: string | null;
  total_xp: number;
  current_level: number;
  current_streak: number;
  subscription_status: string;
  created_at: string;
}

const AdminUsers = () => {
  // Admin can view all profiles via profiles_public view
  // Admins have full access through separate RLS policies if needed
  const { data: users, isLoading } = useQuery({
    queryKey: ["admin-users"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles_public")
        .select("*")
        .order("total_xp", { ascending: false });
      
      if (error) throw error;
      return data as Profile[];
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Users</h1>
        <p className="text-muted-foreground">View registered users and their progress</p>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card overflow-hidden"
      >
        {isLoading ? (
          <div className="p-8 text-center text-muted-foreground">Loading...</div>
        ) : users?.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            No users yet.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Username</TableHead>
                <TableHead>XP</TableHead>
                <TableHead>Level</TableHead>
                <TableHead>Streak</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Joined</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users?.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">
                    {user.username || "Anonymous"}
                  </TableCell>
                  <TableCell>
                    <span className="xp-badge">+{user.total_xp}</span>
                  </TableCell>
                  <TableCell>Level {user.current_level}</TableCell>
                  <TableCell>
                    {user.current_streak > 0 ? (
                      <span className="streak-badge">🔥 {user.current_streak}</span>
                    ) : (
                      <span className="text-muted-foreground">0</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      user.subscription_status === "pro" 
                        ? "bg-primary/20 text-primary" 
                        : "bg-muted text-muted-foreground"
                    }`}>
                      {user.subscription_status}
                    </span>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {formatDistanceToNow(new Date(user.created_at), { addSuffix: true })}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </motion.div>
    </div>
  );
};

export default AdminUsers;