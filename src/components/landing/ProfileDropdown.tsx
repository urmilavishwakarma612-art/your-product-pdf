import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ProfileSettings } from "@/components/profile/ProfileSettings";
import { User, Settings, LogOut, Crown } from "lucide-react";

export function ProfileDropdown() {
  const { user, signOut } = useAuth();
  const [settingsOpen, setSettingsOpen] = useState(false);

  const { data: profile } = useQuery({
    queryKey: ["profile-dropdown", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from("profiles")
        .select("username, avatar_url, current_level, subscription_status")
        .eq("id", user.id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  const handleSignOut = async () => {
    await signOut();
  };

  if (!user) return null;

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger className="focus:outline-none">
          <Avatar className="w-9 h-9 cursor-pointer ring-2 ring-transparent hover:ring-primary/50 transition-all">
            <AvatarImage src={profile?.avatar_url || undefined} />
            <AvatarFallback className="bg-primary/10 text-primary">
              {profile?.username?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || "U"}
            </AvatarFallback>
          </Avatar>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium leading-none flex items-center gap-2">
                {profile?.username || "User"}
                {profile?.subscription_status === "pro" && (
                  <Crown className="w-3 h-3 text-yellow-500" />
                )}
              </p>
              <p className="text-xs leading-none text-muted-foreground">
                {user.email}
              </p>
              {profile?.current_level && (
                <p className="text-xs text-primary">
                  Level {profile.current_level}
                </p>
              )}
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <Link
              to={`/profile/${encodeURIComponent((profile?.username || "").trim())}`}
              className="cursor-pointer"
            >
              <User className="mr-2 h-4 w-4" />
              View Profile
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setSettingsOpen(true)} className="cursor-pointer">
            <Settings className="mr-2 h-4 w-4" />
            Edit Profile
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer text-destructive focus:text-destructive">
            <LogOut className="mr-2 h-4 w-4" />
            Sign Out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <ProfileSettings open={settingsOpen} onOpenChange={setSettingsOpen} />
    </>
  );
}
