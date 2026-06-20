import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Progress } from "../components/ui/progress";
import {
  Activity,
  Cpu,
  Database,
  FileText,
  HardDrive,
  MessageSquare,
  TrendingUp,
  Users,
  CheckCircle2,
  AlertCircle,
  Upload,
  Bot,
  LogIn,
  Rocket
} from "lucide-react";

export default function DashboardPage() {
  const stats = [
    {
      title: "Active Models",
      value: "5",
      change: "+2 this week",
      icon: Cpu,
      color: "from-indigo-500 to-purple-600"
    },
    {
      title: "Documents Indexed",
      value: "12,847",
      change: "+1,234 today",
      icon: FileText,
      color: "from-cyan-500 to-blue-600"
    },
    {
      title: "Vector Records",
      value: "2.4M",
      change: "+125K today",
      icon: Database,
      color: "from-purple-500 to-pink-600"
    },
    {
      title: "Total Users",
      value: "128",
      change: "+12 this month",
      icon: Users,
      color: "from-green-500 to-emerald-600"
    },
    {
      title: "Queries Today",
      value: "3,492",
      change: "+18% vs yesterday",
      icon: MessageSquare,
      color: "from-orange-500 to-amber-600"
    },
    {
      title: "GPU Usage",
      value: "68%",
      change: "Optimal range",
      icon: Activity,
      color: "from-pink-500 to-rose-600"
    },
    {
      title: "CPU Usage",
      value: "42%",
      change: "Normal load",
      icon: TrendingUp,
      color: "from-blue-500 to-cyan-600"
    },
    {
      title: "Storage Used",
      value: "840 GB",
      change: "of 2 TB",
      icon: HardDrive,
      color: "from-violet-500 to-purple-600"
    }
  ];

  const activities = [
    {
      icon: Upload,
      title: "Document uploaded",
      description: "Q4_Financial_Report.pdf added to Finance KB",
      time: "2 minutes ago",
      color: "text-blue-400"
    },
    {
      icon: Bot,
      title: "Agent created",
      description: "Legal Assistant v2 deployed successfully",
      time: "15 minutes ago",
      color: "text-purple-400"
    },
    {
      icon: LogIn,
      title: "User login",
      description: "sarah.chen@company.com logged in",
      time: "23 minutes ago",
      color: "text-green-400"
    },
    {
      icon: Rocket,
      title: "Model deployed",
      description: "Llama 3.1 70B model is now active",
      time: "1 hour ago",
      color: "text-indigo-400"
    },
    {
      icon: Database,
      title: "Knowledge base updated",
      description: "HR Knowledge Base reindexed (2,847 docs)",
      time: "2 hours ago",
      color: "text-cyan-400"
    }
  ];

  const systemHealth = [
    {
      name: "Ollama Service",
      status: "operational",
      uptime: "99.9%"
    },
    {
      name: "ChromaDB",
      status: "operational",
      uptime: "99.8%"
    },
    {
      name: "PostgreSQL",
      status: "operational",
      uptime: "100%"
    },
    {
      name: "FastAPI Backend",
      status: "operational",
      uptime: "99.7%"
    }
  ];

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Dashboard</h1>
        <p className="text-gray-400">Welcome back! Here's what's happening with your AI platform.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <Card key={index} className="bg-[#1E293B]/50 backdrop-blur-xl border-white/10 hover:border-white/20 transition-all">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${stat.color} flex items-center justify-center`}>
                  <stat.icon className="w-6 h-6 text-white" />
                </div>
              </div>
              <div className="space-y-1">
                <div className="text-sm text-gray-400">{stat.title}</div>
                <div className="text-3xl font-bold text-white">{stat.value}</div>
                <div className="text-xs text-gray-500">{stat.change}</div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Recent Activity */}
        <Card className="lg:col-span-2 bg-[#1E293B]/50 backdrop-blur-xl border-white/10">
          <CardHeader>
            <CardTitle className="text-white">Recent Activity</CardTitle>
            <CardDescription className="text-gray-400">Latest events in your platform</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {activities.map((activity, index) => (
                <div key={index} className="flex gap-4 p-4 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
                  <div className={`w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center flex-shrink-0 ${activity.color}`}>
                    <activity.icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-white mb-1">{activity.title}</div>
                    <div className="text-sm text-gray-400 truncate">{activity.description}</div>
                  </div>
                  <div className="text-xs text-gray-500 flex-shrink-0">{activity.time}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* System Health */}
        <Card className="bg-[#1E293B]/50 backdrop-blur-xl border-white/10">
          <CardHeader>
            <CardTitle className="text-white">System Health</CardTitle>
            <CardDescription className="text-gray-400">Service status overview</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {systemHealth.map((service, index) => (
              <div key={index} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-400" />
                    <span className="text-sm font-medium text-white">{service.name}</span>
                  </div>
                  <Badge className="bg-green-500/20 text-green-400 border-green-500/30 text-xs">
                    {service.status}
                  </Badge>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-400">
                  <Progress value={parseFloat(service.uptime)} className="flex-1 h-1" />
                  <span className="flex-shrink-0">{service.uptime}</span>
                </div>
              </div>
            ))}

            <div className="mt-6 p-4 rounded-lg bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-500/20">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm font-semibold text-green-400">All Systems Operational</span>
              </div>
              <p className="text-xs text-gray-400">
                Platform running smoothly with no reported issues
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Resource Usage */}
      <div className="grid md:grid-cols-3 gap-6">
        <Card className="bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border-indigo-500/20 backdrop-blur-xl">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Cpu className="w-5 h-5 text-indigo-400" />
              GPU Memory
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-400">Used</span>
                <span className="font-semibold text-white">54.2 GB / 80 GB</span>
              </div>
              <Progress value={68} className="h-2" />
              <p className="text-xs text-gray-500">Optimal for current workload</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-cyan-500/10 to-blue-500/10 border-cyan-500/20 backdrop-blur-xl">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Database className="w-5 h-5 text-cyan-400" />
              Vector Storage
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-400">Indexed</span>
                <span className="font-semibold text-white">2.4M vectors</span>
              </div>
              <Progress value={75} className="h-2" />
              <p className="text-xs text-gray-500">ChromaDB performing well</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border-purple-500/20 backdrop-blur-xl">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Activity className="w-5 h-5 text-purple-400" />
              API Requests
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-400">Today</span>
                <span className="font-semibold text-white">3,492 requests</span>
              </div>
              <Progress value={58} className="h-2" />
              <p className="text-xs text-gray-500">+18% from yesterday</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
