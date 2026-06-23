import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Database, FileText, Brain, Zap, CheckCircle2, XCircle, Loader2 } from "lucide-react";

interface CollectionStat {
  name: string;
  count: number;
  query_ms: number | null;
  reachable: boolean;
  error: string | null;
}

interface ChromaStats {
  embedding_model: string;
  collections: CollectionStat[];
}

const ICONS: Record<string, typeof FileText> = {
  "Document vault": FileText,
  "Memory store": Brain,
};

const COLORS: Record<string, string> = {
  "Document vault": "from-cyan-500 to-blue-600",
  "Memory store": "from-pink-500 to-rose-600",
};

export default function KnowledgePage() {
  const [stats, setStats] = useState<ChromaStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
    const interval = setInterval(loadStats, 15000);
    return () => clearInterval(interval);
  }, []);

  async function loadStats() {
    try {
      const r = await fetch("/api/system/chromadb");
      const d = await r.json();
      setStats(d);
    } catch {
      // keep previous state on failure; periodic refresh will retry
    } finally {
      setLoading(false);
    }
  }

  const totalVectors = stats?.collections.reduce((sum, c) => sum + c.count, 0) ?? 0;
  const allReachable = stats?.collections.every((c) => c.reachable) ?? false;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Knowledge Base</h1>
        <p className="text-gray-400">
          Real ChromaDB internals — your vector store's actual collections, counts, and
          measured query performance.
        </p>
      </div>

      <Card className="bg-indigo-500/10 border-indigo-500/20">
        <CardContent className="p-4 flex items-start gap-3">
          <Database className="w-5 h-5 text-indigo-400 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-gray-300">
            This is a single-tenant deployment with one document vault and one memory
            store — not multiple per-department knowledge bases. Everything shown here is
            measured live, not estimated.
          </p>
        </CardContent>
      </Card>

      {loading ? (
        <div className="text-center py-12 text-gray-500">
          <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
          Loading ChromaDB stats…
        </div>
      ) : (
        <>
          <div className="grid md:grid-cols-3 gap-6">
            <Card className="bg-[#1E293B]/50 backdrop-blur-xl border-white/10">
              <CardContent className="p-6">
                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center mb-4">
                  <Database className="w-6 h-6 text-white" />
                </div>
                <div className="text-sm text-gray-400">Total Vectors</div>
                <div className="text-3xl font-bold text-white">{totalVectors.toLocaleString()}</div>
              </CardContent>
            </Card>
            <Card className="bg-[#1E293B]/50 backdrop-blur-xl border-white/10">
              <CardContent className="p-6">
                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center mb-4">
                  <Zap className="w-6 h-6 text-white" />
                </div>
                <div className="text-sm text-gray-400">Embedding Model</div>
                <div className="text-xl font-bold text-white truncate">{stats?.embedding_model}</div>
              </CardContent>
            </Card>
            <Card className="bg-[#1E293B]/50 backdrop-blur-xl border-white/10">
              <CardContent className="p-6">
                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center mb-4">
                  {allReachable ? (
                    <CheckCircle2 className="w-6 h-6 text-white" />
                  ) : (
                    <XCircle className="w-6 h-6 text-white" />
                  )}
                </div>
                <div className="text-sm text-gray-400">Connection Status</div>
                <div className="text-xl font-bold text-white">
                  {allReachable ? "Connected" : "Issue detected"}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {stats?.collections.map((col) => {
              const Icon = ICONS[col.name] ?? Database;
              const color = COLORS[col.name] ?? "from-gray-500 to-gray-600";
              return (
                <Card
                  key={col.name}
                  className="bg-[#1E293B]/50 backdrop-blur-xl border-white/10 hover:border-white/20 transition-all"
                >
                  <CardHeader>
                    <div className="flex items-start justify-between mb-2">
                      <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center`}>
                        <Icon className="w-7 h-7 text-white" />
                      </div>
                      {col.reachable ? (
                        <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                          Reachable
                        </Badge>
                      ) : (
                        <Badge className="bg-red-500/20 text-red-400 border-red-500/30">
                          Unreachable
                        </Badge>
                      )}
                    </div>
                    <CardTitle className="text-white">{col.name}</CardTitle>
                    <CardDescription className="text-gray-400">
                      {col.name === "Document vault"
                        ? "Chunks from every uploaded document"
                        : "Confirmed, user-approved memories"}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {col.error ? (
                      <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-sm text-red-300">
                        {col.error}
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-3">
                        <div className="p-3 rounded-lg bg-white/5 border border-white/10">
                          <div className="text-xs text-gray-400 mb-1">Vectors</div>
                          <div className="text-lg font-bold text-white">{col.count.toLocaleString()}</div>
                        </div>
                        <div className="p-3 rounded-lg bg-white/5 border border-white/10">
                          <div className="text-xs text-gray-400 mb-1">Query latency</div>
                          <div className="text-lg font-bold text-white">
                            {col.query_ms !== null ? `${col.query_ms} ms` : "—"}
                          </div>
                        </div>
                      </div>
                    )}
                    {col.count === 0 && !col.error && (
                      <p className="text-xs text-gray-500">
                        Empty — query latency isn't measured against zero vectors.
                      </p>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
