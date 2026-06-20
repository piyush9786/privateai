import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Progress } from "../components/ui/progress";
import {
  Cpu,
  Database,
  FileText,
  MessageSquare,
  Brain,
  CheckCircle2,
  XCircle,
  Upload,
  MessageCircle,
  Sparkles,
} from "lucide-react";

interface RunningModel {
  name: string;
  size_bytes: number;
  size_vram_bytes: number;
  vram_percent: number | null;
  expires_at: string;
}

interface SystemStatus {
  ollama: { reachable: boolean; running_models: RunningModel[] };
  chromadb: { reachable: boolean };
  backend: { reachable: boolean };
}

interface ActivityItem {
  icon: typeof Upload;
  title: string;
  description: string;
  time: string;
  color: string;
}

function timeAgo(isoString: string): string {
  const then = new Date(isoString).getTime();
  const now = Date.now();
  const diffSec = Math.max(0, Math.floor((now - then) / 1000));
  if (diffSec < 60) return "just now";
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)} min ago`;
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
  return `${Math.floor(diffSec / 86400)}d ago`;
}

function formatBytes(bytes: number): string {
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}

export default function DashboardPage() {
  const [documentCount, setDocumentCount] = useState(0);
  const [chunkCount, setChunkCount] = useState(0);
  const [conversationCount, setConversationCount] = useState(0);
  const [memoryCount, setMemoryCount] = useState(0);
  const [modelCount, setModelCount] = useState(0);
  const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null);
  const [activities, setActivities] = useState<ActivityItem[]>([]);

  useEffect(() => {
    loadAll();
    const interval = setInterval(loadAll, 15000);
    return () => clearInterval(interval);
  }, []);

  async function loadAll() {
    try {
      const [docsRes, ragRes, convRes, memRes, modelsRes, statusRes] = await Promise.all([
        fetch("/api/documents").then((r) => r.json()).catch(() => ({ documents: [] })),
        fetch("/api/rag/info").then((r) => r.json()).catch(() => ({ documents: 0 })),
        fetch("/api/conversations").then((r) => r.json()).catch(() => ({ conversations: [] })),
        fetch("/api/memory/list").then((r) => r.json()).catch(() => ({ memories: [] })),
        fetch("/api/models").then((r) => r.json()).catch(() => ({ models: [] })),
        fetch("/api/system/status").then((r) => r.json()).catch(() => null),
      ]);

      const docs = docsRes.documents || [];
      setDocumentCount(docs.length);
      setChunkCount(ragRes.documents || 0);
      const conversations = convRes.conversations || [];
      setConversationCount(conversations.length);
      setMemoryCount((memRes.memories || []).length);
      setModelCount((modelsRes.models || []).length);
      setSystemStatus(statusRes);

      // Build a real recent-activity feed from actual data, most recent first
      const items: (ActivityItem & { sortKey: string })[] = [];

      docs.slice(0, 5).forEach((d: any) => {
        items.push({
          icon: Upload,
          title: d.status === "indexed" ? "Document uploaded" : "Upload had an issue",
          description: `${d.filename} — ${d.status}${d.chunk_count ? `, ${d.chunk_count} chunks` : ""}`,
          time: timeAgo(d.uploaded_at),
          color: d.status === "indexed" ? "text-blue-400" : "text-amber-400",
          sortKey: d.uploaded_at,
        });
      });

      conversations.slice(0, 5).forEach((c: any) => {
        items.push({
          icon: MessageCircle,
          title: "Conversation updated",
          description: c.title || "New chat",
          time: timeAgo(c.updated_at),
          color: "text-purple-400",
          sortKey: c.updated_at,
        });
      });

      items.sort((a, b) => new Date(b.sortKey).getTime() - new Date(a.sortKey).getTime());
      setActivities(items.slice(0, 6));
    } catch {
      // leave previous state on failure; periodic refresh will retry
    }
  }

  const stats = [
    {
      title: "Models Available",
      value: String(modelCount),
      icon: Cpu,
      color: "from-indigo-500 to-purple-600",
    },
    {
      title: "Documents Indexed",
      value: String(documentCount),
      icon: FileText,
      color: "from-cyan-500 to-blue-600",
    },
    {
      title: "Indexed Chunks",
      value: String(chunkCount),
      icon: Database,
      color: "from-purple-500 to-pink-600",
    },
    {
      title: "Conversations",
      value: String(conversationCount),
      icon: MessageSquare,
      color: "from-orange-500 to-amber-600",
    },
    {
      title: "Memories Stored",
      value: String(memoryCount),
      icon: Brain,
      color: "from-pink-500 to-rose-600",
    },
  ];

  const services = [
    { name: "Ollama", reachable: systemStatus?.ollama.reachable ?? null },
    { name: "ChromaDB", reachable: systemStatus?.chromadb.reachable ?? null },
    { name: "Backend (FastAPI)", reachable: systemStatus?.backend.reachable ?? null },
  ];

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Dashboard</h1>
        <p className="text-gray-400">Real numbers from your own deployment — refreshes every 15s.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
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
            <CardDescription className="text-gray-400">Derived from your actual uploads and conversations</CardDescription>
          </CardHeader>
          <CardContent>
            {activities.length === 0 ? (
              <div className="text-sm text-gray-500 text-center py-8">
                Nothing yet — upload a document or start a chat to see activity here.
              </div>
            ) : (
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
            )}
          </CardContent>
        </Card>

        {/* System Health */}
        <Card className="bg-[#1E293B]/50 backdrop-blur-xl border-white/10">
          <CardHeader>
            <CardTitle className="text-white">System Health</CardTitle>
            <CardDescription className="text-gray-400">Live reachability checks</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {services.map((service, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {service.reachable === null ? (
                    <div className="w-4 h-4 rounded-full bg-gray-600 animate-pulse" />
                  ) : service.reachable ? (
                    <CheckCircle2 className="w-4 h-4 text-green-400" />
                  ) : (
                    <XCircle className="w-4 h-4 text-red-400" />
                  )}
                  <span className="text-sm font-medium text-white">{service.name}</span>
                </div>
                <Badge
                  className={
                    service.reachable
                      ? "bg-green-500/20 text-green-400 border-green-500/30 text-xs"
                      : "bg-red-500/20 text-red-400 border-red-500/30 text-xs"
                  }
                >
                  {service.reachable === null ? "checking…" : service.reachable ? "reachable" : "unreachable"}
                </Badge>
              </div>
            ))}

            {systemStatus?.ollama.reachable && systemStatus.ollama.running_models.length === 0 && (
              <p className="text-xs text-gray-500 pt-2 border-t border-white/10">
                No model currently loaded into memory — it'll load on the next chat message.
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Loaded Models (real GPU/VRAM split, not a fabricated percentage) */}
      <Card className="bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border-indigo-500/20 backdrop-blur-xl">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-indigo-400" />
            Models Currently Loaded
          </CardTitle>
          <CardDescription className="text-gray-400">
            From Ollama's live <code className="text-gray-300">/api/ps</code> — shows real VRAM usage, not an estimate
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!systemStatus?.ollama.reachable ? (
            <p className="text-sm text-gray-500">Ollama is not reachable right now.</p>
          ) : systemStatus.ollama.running_models.length === 0 ? (
            <p className="text-sm text-gray-500">No model is currently loaded into memory.</p>
          ) : (
            <div className="space-y-4">
              {systemStatus.ollama.running_models.map((m, i) => (
                <div key={i} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-semibold text-white">{m.name}</span>
                    <span className="text-gray-400">
                      {formatBytes(m.size_vram_bytes)} / {formatBytes(m.size_bytes)} in VRAM
                    </span>
                  </div>
                  <Progress value={m.vram_percent ?? 0} className="h-2" />
                  <p className="text-xs text-gray-500">
                    {m.vram_percent === 100
                      ? "Fully running on GPU"
                      : m.vram_percent === 0
                      ? "Running entirely on CPU"
                      : `${m.vram_percent}% on GPU, remainder on CPU`}
                  </p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
