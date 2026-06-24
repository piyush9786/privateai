import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
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
} from "recharts";
import { MessageSquare, Clock, Cpu, Wrench, Loader2 } from "lucide-react";

interface AnalyticsSummary {
  total_turns: number;
  avg_latency_ms: number;
  daily_volume: { date: string; turns: number }[];
  daily_latency: { date: string; avg_latency_ms: number }[];
  model_usage: { model: string; turns: number }[];
  tool_usage: { tool: string; count: number }[];
}

const PIE_COLORS = ["#4F46E5", "#06B6D4", "#7C3AED", "#8B5CF6", "#EC4899", "#10B981"];

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSummary();
  }, []);

  async function loadSummary() {
    try {
      const r = await fetch("/api/analytics/summary?days=7");
      const d = await r.json();
      setData(d);
    } catch {
      // keep previous state on failure
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="text-center py-24 text-gray-500">
        <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
        Loading analytics…
      </div>
    );
  }

  const hasData = (data?.total_turns ?? 0) > 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Analytics</h1>
        <p className="text-gray-400">
          Real usage data from the last 7 days — recorded at the moment each chat turn
          completes, not estimated.
        </p>
      </div>

      {!hasData ? (
        <Card className="bg-[#1E293B]/50 backdrop-blur-xl border-white/10">
          <CardContent className="p-12 text-center text-gray-500">
            No chat activity recorded yet in the last 7 days. Send a few messages in Chat
            and check back here.
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid md:grid-cols-3 gap-6">
            <Card className="bg-[#1E293B]/50 backdrop-blur-xl border-white/10">
              <CardContent className="p-6">
                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center mb-4">
                  <MessageSquare className="w-6 h-6 text-white" />
                </div>
                <div className="text-sm text-gray-400">Chat Turns (7 days)</div>
                <div className="text-3xl font-bold text-white">{data!.total_turns}</div>
              </CardContent>
            </Card>
            <Card className="bg-[#1E293B]/50 backdrop-blur-xl border-white/10">
              <CardContent className="p-6">
                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center mb-4">
                  <Clock className="w-6 h-6 text-white" />
                </div>
                <div className="text-sm text-gray-400">Avg Response Time</div>
                <div className="text-3xl font-bold text-white">
                  {data!.avg_latency_ms < 1000
                    ? `${data!.avg_latency_ms} ms`
                    : `${(data!.avg_latency_ms / 1000).toFixed(1)} s`}
                </div>
              </CardContent>
            </Card>
            <Card className="bg-[#1E293B]/50 backdrop-blur-xl border-white/10">
              <CardContent className="p-6">
                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center mb-4">
                  <Wrench className="w-6 h-6 text-white" />
                </div>
                <div className="text-sm text-gray-400">Tool Calls (7 days)</div>
                <div className="text-3xl font-bold text-white">
                  {data!.tool_usage.reduce((sum, t) => sum + t.count, 0)}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            <Card className="bg-[#1E293B]/50 backdrop-blur-xl border-white/10">
              <CardHeader>
                <CardTitle className="text-white">Daily Chat Volume</CardTitle>
                <CardDescription className="text-gray-400">Turns per day, last 7 days</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={280}>
                  <AreaChart data={data!.daily_volume}>
                    <defs>
                      <linearGradient id="volumeGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#4F46E5" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                    <XAxis dataKey="date" stroke="#94A3B8" fontSize={12} />
                    <YAxis stroke="#94A3B8" allowDecimals={false} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#1E293B",
                        border: "1px solid rgba(255,255,255,0.1)",
                        borderRadius: "8px",
                        color: "#fff",
                      }}
                    />
                    <Area type="monotone" dataKey="turns" stroke="#4F46E5" strokeWidth={2} fillOpacity={1} fill="url(#volumeGradient)" />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="bg-[#1E293B]/50 backdrop-blur-xl border-white/10">
              <CardHeader>
                <CardTitle className="text-white">Model Usage</CardTitle>
                <CardDescription className="text-gray-400">Which model answered, last 7 days</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie
                      data={data!.model_usage}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ model, percent }: any) => `${model} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={90}
                      dataKey="turns"
                      nameKey="model"
                    >
                      {data!.model_usage.map((_, i) => (
                        <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#1E293B",
                        border: "1px solid rgba(255,255,255,0.1)",
                        borderRadius: "8px",
                        color: "#fff",
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            <Card className="bg-[#1E293B]/50 backdrop-blur-xl border-white/10">
              <CardHeader>
                <CardTitle className="text-white">Response Time Trend</CardTitle>
                <CardDescription className="text-gray-400">Average latency per day</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={280}>
                  <LineChart data={data!.daily_latency}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                    <XAxis dataKey="date" stroke="#94A3B8" fontSize={12} />
                    <YAxis stroke="#94A3B8" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#1E293B",
                        border: "1px solid rgba(255,255,255,0.1)",
                        borderRadius: "8px",
                        color: "#fff",
                      }}
                    />
                    <Line type="monotone" dataKey="avg_latency_ms" stroke="#06B6D4" strokeWidth={3} dot={{ fill: "#06B6D4", r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="bg-[#1E293B]/50 backdrop-blur-xl border-white/10">
              <CardHeader>
                <CardTitle className="text-white">Tool Usage</CardTitle>
                <CardDescription className="text-gray-400">How often each tool was actually invoked</CardDescription>
              </CardHeader>
              <CardContent>
                {data!.tool_usage.length === 0 ? (
                  <div className="text-center text-gray-500 py-12 text-sm">
                    No tools have been called yet in this window.
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart data={data!.tool_usage} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                      <XAxis type="number" stroke="#94A3B8" allowDecimals={false} />
                      <YAxis type="category" dataKey="tool" stroke="#94A3B8" width={140} fontSize={12} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#1E293B",
                          border: "1px solid rgba(255,255,255,0.1)",
                          borderRadius: "8px",
                          color: "#fff",
                        }}
                      />
                      <Bar dataKey="count" fill="#7C3AED" radius={[0, 8, 8, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
