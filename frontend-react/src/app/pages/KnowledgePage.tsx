import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Progress } from "../components/ui/progress";
import {
  Database,
  FileText,
  Users,
  Clock,
  Plus,
  Settings,
  Briefcase,
  DollarSign,
  Monitor,
  Scale,
  FlaskConical,
  ShoppingBag,
  TrendingUp,
  Shield
} from "lucide-react";

export default function KnowledgePage() {
  const knowledgeBases = [
    {
      name: "HR Knowledge Base",
      icon: Briefcase,
      color: "from-indigo-500 to-purple-600",
      documents: 2847,
      vectors: "1.2M",
      lastUpdated: "2 hours ago",
      size: "12.4 GB",
      users: 45,
      permissions: "HR Team, Managers"
    },
    {
      name: "Finance Knowledge Base",
      icon: DollarSign,
      color: "from-green-500 to-emerald-600",
      documents: 1923,
      vectors: "890K",
      lastUpdated: "5 hours ago",
      size: "8.7 GB",
      users: 28,
      permissions: "Finance Team, C-Suite"
    },
    {
      name: "Legal Documentation",
      icon: Scale,
      color: "from-purple-500 to-pink-600",
      documents: 1456,
      vectors: "670K",
      lastUpdated: "1 day ago",
      size: "6.2 GB",
      users: 12,
      permissions: "Legal Team"
    },
    {
      name: "IT Knowledge Base",
      icon: Monitor,
      color: "from-cyan-500 to-blue-600",
      documents: 3521,
      vectors: "1.5M",
      lastUpdated: "3 hours ago",
      size: "15.8 GB",
      users: 67,
      permissions: "IT Team, All Employees"
    },
    {
      name: "Research & Development",
      icon: FlaskConical,
      color: "from-orange-500 to-amber-600",
      documents: 892,
      vectors: "420K",
      lastUpdated: "1 week ago",
      size: "4.1 GB",
      users: 18,
      permissions: "R&D Team"
    },
    {
      name: "Sales & Marketing",
      icon: ShoppingBag,
      color: "from-pink-500 to-rose-600",
      documents: 2134,
      vectors: "980K",
      lastUpdated: "4 hours ago",
      size: "9.3 GB",
      users: 52,
      permissions: "Sales, Marketing"
    }
  ];

  const stats = [
    {
      title: "Total Knowledge Bases",
      value: "6",
      change: "+2 this quarter",
      icon: Database,
      color: "from-indigo-500 to-purple-600"
    },
    {
      title: "Total Documents",
      value: "12,773",
      change: "+1,847 this month",
      icon: FileText,
      color: "from-cyan-500 to-blue-600"
    },
    {
      title: "Total Vectors",
      value: "5.7M",
      change: "+2.1M this month",
      icon: TrendingUp,
      color: "from-purple-500 to-pink-600"
    },
    {
      title: "Active Users",
      value: "222",
      change: "Across all KBs",
      icon: Users,
      color: "from-green-500 to-emerald-600"
    }
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Knowledge Base Management</h1>
          <p className="text-gray-400">Organize and manage your organization's knowledge repositories</p>
        </div>
        <Button className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white">
          <Plus className="w-4 h-4 mr-2" />
          Create Knowledge Base
        </Button>
      </div>

      {/* Stats */}
      <div className="grid md:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <Card key={index} className="bg-[#1E293B]/50 backdrop-blur-xl border-white/10">
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

      {/* Knowledge Bases Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {knowledgeBases.map((kb, index) => (
          <Card key={index} className="bg-[#1E293B]/50 backdrop-blur-xl border-white/10 hover:border-white/20 transition-all">
            <CardHeader>
              <div className="flex items-start justify-between mb-4">
                <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${kb.color} flex items-center justify-center`}>
                  <kb.icon className="w-7 h-7 text-white" />
                </div>
                <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white">
                  <Settings className="w-4 h-4" />
                </Button>
              </div>
              <CardTitle className="text-white mb-1">{kb.name}</CardTitle>
              <CardDescription className="text-gray-400 flex items-center gap-2">
                <Clock className="w-3 h-3" />
                Updated {kb.lastUpdated}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Metrics Grid */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-lg bg-white/5 border border-white/10">
                  <div className="text-xs text-gray-400 mb-1">Documents</div>
                  <div className="text-lg font-bold text-white">{kb.documents.toLocaleString()}</div>
                </div>
                <div className="p-3 rounded-lg bg-white/5 border border-white/10">
                  <div className="text-xs text-gray-400 mb-1">Vectors</div>
                  <div className="text-lg font-bold text-white">{kb.vectors}</div>
                </div>
                <div className="p-3 rounded-lg bg-white/5 border border-white/10">
                  <div className="text-xs text-gray-400 mb-1">Storage</div>
                  <div className="text-lg font-bold text-white">{kb.size}</div>
                </div>
                <div className="p-3 rounded-lg bg-white/5 border border-white/10">
                  <div className="text-xs text-gray-400 mb-1">Users</div>
                  <div className="text-lg font-bold text-white">{kb.users}</div>
                </div>
              </div>

              {/* Permissions */}
              <div className="p-3 rounded-lg bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border border-indigo-500/20">
                <div className="flex items-center gap-2 mb-2">
                  <Shield className="w-4 h-4 text-indigo-400" />
                  <div className="text-xs text-gray-400">Access Permissions</div>
                </div>
                <div className="text-sm text-white">{kb.permissions}</div>
              </div>

              {/* Storage Progress */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-gray-400">Storage Usage</span>
                  <span className="text-xs text-white">{kb.size} / 20 GB</span>
                </div>
                <Progress 
                  value={parseFloat(kb.size) / 20 * 100} 
                  className="h-1.5" 
                />
              </div>

              {/* Actions */}
              <div className="grid grid-cols-2 gap-2">
                <Button variant="outline" className="bg-white/5 border-white/10 text-white hover:bg-white/10">
                  <FileText className="w-4 h-4 mr-2" />
                  View Docs
                </Button>
                <Button className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Files
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* System Status */}
      <Card className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 border-green-500/20 backdrop-blur-xl">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Database className="w-5 h-5 text-green-400" />
            ChromaDB Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-4 gap-6">
            <div>
              <div className="text-sm text-gray-400 mb-2">Connection Status</div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-white font-semibold">Connected</span>
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-400 mb-2">Total Collections</div>
              <div className="text-2xl font-bold text-white">6</div>
            </div>
            <div>
              <div className="text-sm text-gray-400 mb-2">Query Performance</div>
              <div className="text-2xl font-bold text-white">47ms</div>
            </div>
            <div>
              <div className="text-sm text-gray-400 mb-2">Index Status</div>
              <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                Optimized
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
