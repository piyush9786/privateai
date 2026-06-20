import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from "recharts";
import {
  TrendingUp,
  MessageSquare,
  Clock,
  Users,
  ThumbsUp,
  Activity
} from "lucide-react";

export default function AnalyticsPage() {
  const queryVolumeData = [
    { date: "Jun 14", queries: 2400 },
    { date: "Jun 15", queries: 3200 },
    { date: "Jun 16", queries: 2800 },
    { date: "Jun 17", queries: 3600 },
    { date: "Jun 18", queries: 3100 },
    { date: "Jun 19", queries: 4200 },
    { date: "Jun 20", queries: 3492 }
  ];

  const modelUsageData = [
    { name: "Llama 3.1 70B", usage: 45, color: "#4F46E5" },
    { name: "Qwen 2.5", usage: 28, color: "#06B6D4" },
    { name: "Mistral 7B", usage: 18, color: "#7C3AED" },
    { name: "DeepSeek", usage: 9, color: "#8B5CF6" }
  ];

  const responseTimeData = [
    { hour: "00:00", time: 1.1 },
    { hour: "04:00", time: 0.9 },
    { hour: "08:00", time: 1.4 },
    { hour: "12:00", time: 1.8 },
    { hour: "16:00", time: 1.6 },
    { hour: "20:00", time: 1.2 },
    { hour: "23:00", time: 1.0 }
  ];

  const userActivityData = [
    { department: "IT", users: 67 },
    { department: "Sales", users: 52 },
    { department: "HR", users: 45 },
    { department: "Finance", users: 28 },
    { department: "Legal", users: 12 },
    { department: "R&D", users: 18 }
  ];

  const topQuestions = [
    { question: "What is the company's leave policy?", count: 247 },
    { question: "How do I request IT support?", count: 189 },
    { question: "What are the Q4 financial targets?", count: 156 },
    { question: "How to submit expense reports?", count: 134 },
    { question: "What is the remote work policy?", count: 112 }
  ];

  const stats = [
    {
      title: "Daily Queries",
      value: "3,492",
      change: "+18%",
      trend: "up",
      icon: MessageSquare,
      color: "from-indigo-500 to-purple-600"
    },
    {
      title: "Monthly Queries",
      value: "87,234",
      change: "+24%",
      trend: "up",
      icon: TrendingUp,
      color: "from-cyan-500 to-blue-600"
    },
    {
      title: "Avg Response Time",
      value: "1.2s",
      change: "-8%",
      trend: "down",
      icon: Clock,
      color: "from-purple-500 to-pink-600"
    },
    {
      title: "User Satisfaction",
      value: "94%",
      change: "+3%",
      trend: "up",
      icon: ThumbsUp,
      color: "from-green-500 to-emerald-600"
    }
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Analytics Dashboard</h1>
        <p className="text-gray-400">Monitor AI platform performance and usage metrics</p>
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
                <Badge className={`${
                  stat.trend === 'up' 
                    ? 'bg-green-500/20 text-green-400 border-green-500/30'
                    : 'bg-red-500/20 text-red-400 border-red-500/30'
                }`}>
                  {stat.change}
                </Badge>
              </div>
              <div className="space-y-1">
                <div className="text-sm text-gray-400">{stat.title}</div>
                <div className="text-3xl font-bold text-white">{stat.value}</div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts Row 1 */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Query Volume */}
        <Card className="bg-[#1E293B]/50 backdrop-blur-xl border-white/10">
          <CardHeader>
            <CardTitle className="text-white">Query Volume</CardTitle>
            <CardDescription className="text-gray-400">Daily query trends over the past week</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={queryVolumeData}>
                <defs>
                  <linearGradient id="queryGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#4F46E5" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis dataKey="date" stroke="#94A3B8" />
                <YAxis stroke="#94A3B8" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1E293B', 
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '8px',
                    color: '#fff'
                  }} 
                />
                <Area 
                  type="monotone" 
                  dataKey="queries" 
                  stroke="#4F46E5" 
                  strokeWidth={2}
                  fillOpacity={1} 
                  fill="url(#queryGradient)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Model Usage */}
        <Card className="bg-[#1E293B]/50 backdrop-blur-xl border-white/10">
          <CardHeader>
            <CardTitle className="text-white">Model Usage Distribution</CardTitle>
            <CardDescription className="text-gray-400">Query distribution across AI models</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={modelUsageData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="usage"
                >
                  {modelUsageData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1E293B', 
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '8px',
                    color: '#fff'
                  }} 
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Response Time */}
        <Card className="bg-[#1E293B]/50 backdrop-blur-xl border-white/10">
          <CardHeader>
            <CardTitle className="text-white">Response Time Trends</CardTitle>
            <CardDescription className="text-gray-400">Average response time by hour</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={responseTimeData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis dataKey="hour" stroke="#94A3B8" />
                <YAxis stroke="#94A3B8" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1E293B', 
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '8px',
                    color: '#fff'
                  }} 
                />
                <Line 
                  type="monotone" 
                  dataKey="time" 
                  stroke="#06B6D4" 
                  strokeWidth={3}
                  dot={{ fill: '#06B6D4', r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* User Activity */}
        <Card className="bg-[#1E293B]/50 backdrop-blur-xl border-white/10">
          <CardHeader>
            <CardTitle className="text-white">User Activity by Department</CardTitle>
            <CardDescription className="text-gray-400">Active users across departments</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={userActivityData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis dataKey="department" stroke="#94A3B8" />
                <YAxis stroke="#94A3B8" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1E293B', 
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '8px',
                    color: '#fff'
                  }} 
                />
                <Bar dataKey="users" fill="#7C3AED" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Top Questions */}
      <Card className="bg-[#1E293B]/50 backdrop-blur-xl border-white/10">
        <CardHeader>
          <CardTitle className="text-white">Most Asked Questions</CardTitle>
          <CardDescription className="text-gray-400">Top queries this week</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {topQuestions.map((item, index) => (
              <div key={index} className="flex items-center gap-4">
                <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex-shrink-0">
                  <span className="text-white font-bold text-sm">{index + 1}</span>
                </div>
                <div className="flex-1">
                  <div className="text-white mb-1">{item.question}</div>
                  <div className="w-full bg-white/5 rounded-full h-2">
                    <div 
                      className="bg-gradient-to-r from-indigo-600 to-purple-600 h-2 rounded-full"
                      style={{ width: `${(item.count / 247) * 100}%` }}
                    ></div>
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="text-xl font-bold text-white">{item.count}</div>
                  <div className="text-xs text-gray-400">queries</div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Performance Metrics */}
      <div className="grid md:grid-cols-3 gap-6">
        <Card className="bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border-indigo-500/20 backdrop-blur-xl">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                <Activity className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="text-sm text-gray-400">Peak Hour</div>
                <div className="text-2xl font-bold text-white">12:00 PM</div>
              </div>
            </div>
            <p className="text-sm text-gray-400">Highest query volume during lunch hours</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 border-green-500/20 backdrop-blur-xl">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
                <Users className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="text-sm text-gray-400">Most Active Dept</div>
                <div className="text-2xl font-bold text-white">IT</div>
              </div>
            </div>
            <p className="text-sm text-gray-400">67 active users this week</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-cyan-500/10 to-blue-500/10 border-cyan-500/20 backdrop-blur-xl">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
                <ThumbsUp className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="text-sm text-gray-400">Success Rate</div>
                <div className="text-2xl font-bold text-white">96.2%</div>
              </div>
            </div>
            <p className="text-sm text-gray-400">Queries answered successfully</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
