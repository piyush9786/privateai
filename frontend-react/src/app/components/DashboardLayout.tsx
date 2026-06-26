import { Outlet, Link, useLocation, useNavigate } from "react-router";
import { 
  LayoutDashboard, 
  MessageSquare, 
  Box, 
  FileText, 
  Database, 
  Bot, 
  BarChart3, 
  Users, 
  Shield, 
  Search,
  Bell,
  Rocket,
  LogOut
} from "lucide-react";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { useAuth } from "../context/AuthContext";

export default function DashboardLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const navigation = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "AI Chat", href: "/dashboard/chat", icon: MessageSquare },
    { name: "Models", href: "/dashboard/models", icon: Box },
    { name: "Documents", href: "/dashboard/documents", icon: FileText },
    { name: "Knowledge Bases", href: "/dashboard/knowledge", icon: Database },
    { name: "Agents", href: "/dashboard/agents", icon: Bot },
    { name: "Analytics", href: "/dashboard/analytics", icon: BarChart3 },
    // "Users" only makes sense — and is only reachable — for admins.
    ...(user?.role === "admin"
      ? [{ name: "Users", href: "/dashboard/users", icon: Users }]
      : []),
    { name: "Security", href: "/dashboard/security", icon: Shield },
    { name: "Deployment", href: "/dashboard/deployment", icon: Rocket },
  ];

  async function handleLogout() {
    await logout();
    navigate("/login");
  }

  const initials = user?.display_name
    ? user.display_name
        .split(" ")
        .map((p) => p[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : "?";

  const isActive = (href: string) => {
    if (href === "/dashboard") {
      return location.pathname === href;
    }
    return location.pathname.startsWith(href);
  };

  return (
    <div className="min-h-screen bg-[#0F172A]">
      {/* Sidebar */}
      <aside className="fixed inset-y-0 left-0 w-64 bg-[#111827] border-r border-white/10">
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-6 border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <div>
                <div className="font-bold text-white text-lg">Private AI</div>
                <div className="text-xs text-gray-400">Enterprise Platform</div>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            {navigation.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${
                    active
                      ? "bg-indigo-600 text-white"
                      : "text-gray-400 hover:bg-white/5 hover:text-white"
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="text-sm font-medium">{item.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      </aside>

      {/* Main Content */}
      <div className="ml-64">
        {/* Top Navbar */}
        <header className="sticky top-0 z-10 bg-[#0F172A]/80 backdrop-blur-xl border-b border-white/10">
          <div className="px-8 py-4">
            <div className="flex items-center justify-between">
              <div className="flex-1 max-w-xl">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <Input
                    placeholder="Search anything..."
                    className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-gray-400"
                  />
                </div>
              </div>

              <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" className="relative text-gray-400 hover:text-white">
                  <Bell className="w-5 h-5" />
                  <span className="absolute top-1 right-1 w-2 h-2 bg-indigo-500 rounded-full"></span>
                </Button>

                <div className="flex items-center gap-3 pl-4 border-l border-white/10">
                  <Avatar className="w-9 h-9">
                    <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white text-sm">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="text-sm">
                    <div className="font-medium text-white">{user?.display_name ?? "…"}</div>
                    <div className="text-gray-400 text-xs">
                      {user?.role === "admin" ? "Admin" : "User"}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-gray-400 hover:text-white"
                    onClick={handleLogout}
                    title="Log out"
                  >
                    <LogOut className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
