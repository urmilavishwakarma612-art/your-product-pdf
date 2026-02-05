import { 
  LayoutDashboard, 
  Layers, 
  FileQuestion, 
  Users, 
  Crown,
  ArrowLeft,
  Building2,
  Folder,
  MessageSquare,
  Mail,
  GraduationCap,
  BookOpen,
  Briefcase,
  Ticket,
  RefreshCcw,
  Award,
  Clock
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation, Link } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

const menuItems = [
  { title: "Dashboard", url: "/admin", icon: LayoutDashboard },
  { title: "Users", url: "/admin/users", icon: Users },
  { title: "Subscriptions", url: "/admin/subscriptions", icon: Crown },
  { title: "Coupons", url: "/admin/coupons", icon: Ticket },
  { title: "Launch Offer", url: "/admin/launch-offer", icon: Clock },
  { title: "Refunds", url: "/admin/refunds", icon: RefreshCcw },
  { title: "Curriculum", url: "/admin/curriculum", icon: GraduationCap },
  { title: "Modules", url: "/admin/modules", icon: BookOpen },
  { title: "Patterns", url: "/admin/patterns", icon: Layers },
  { title: "Questions", url: "/admin/questions", icon: FileQuestion },
  { title: "Topics", url: "/admin/topics", icon: Folder },
  { title: "Companies", url: "/admin/companies", icon: Building2 },
  { title: "Badges", url: "/admin/badges", icon: Award },
  { title: "Testimonials", url: "/admin/testimonials", icon: MessageSquare },
  { title: "Email Templates", url: "/admin/email-templates", icon: Mail },
  { title: "Jobs", url: "/admin/jobs", icon: Briefcase },
];

export function AdminSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();

  const isActive = (path: string) => {
    if (path === "/admin") {
      return location.pathname === "/admin";
    }
    return location.pathname.startsWith(path);
  };

  return (
    <Sidebar collapsible="icon" className="border-r border-border">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs text-muted-foreground uppercase tracking-wider">
            {!collapsed && "Management"}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive(item.url)}
                    tooltip={item.title}
                  >
                    <NavLink
                      to={item.url}
                      end={item.url === "/admin"}
                      className="flex items-center gap-3"
                      activeClassName="bg-primary/10 text-primary"
                    >
                      <item.icon className="h-4 w-4 flex-shrink-0" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup className="mt-auto">
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="Back to App">
                  <Link to="/dashboard" className="flex items-center gap-3 text-muted-foreground hover:text-foreground">
                    <ArrowLeft className="h-4 w-4" />
                    {!collapsed && <span>Back to App</span>}
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}