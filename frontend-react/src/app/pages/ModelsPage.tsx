import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Progress } from "../components/ui/progress";
import {
  Cpu,
  Download,
  Trash2,
  Loader2,
  CheckCircle2,
  Zap,
} from "lucide-react";

interface InstalledModel {
  name: string;
  size: number;
  modified_at: string;
}

interface RunningModel {
  name: string;
  size_bytes: number;
  size_vram_bytes: number;
  vram_percent: number | null;
}

interface CatalogEntry {
  name: string;
  size: string;
  description: string;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(0)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}

export default function ModelsPage() {
  const [installed, setInstalled] = useState<InstalledModel[]>([]);
  const [running, setRunning] = useState<RunningModel[]>([]);
  const [catalog, setCatalog] = useState<CatalogEntry[]>([]);
  const [pullingModel, setPullingModel] = useState<string | null>(null);
  const [pullStatus, setPullStatus] = useState<string>("");
  const [pullPercent, setPullPercent] = useState<number>(0);
  const [pullError, setPullError] = useState<string | null>(null);
  const [deletingModel, setDeletingModel] = useState<string | null>(null);

  useEffect(() => {
    loadInstalled();
    loadRunning();
    loadCatalog();
  }, []);

  async function loadInstalled() {
    try {
      const r = await fetch("/api/models");
      const d = await r.json();
      setInstalled(d.models || []);
    } catch {
      // table stays as-is on failure
    }
  }

  async function loadRunning() {
    try {
      const r = await fetch("/api/system/status");
      const d = await r.json();
      setRunning(d.ollama?.running_models || []);
    } catch {
      // panel stays empty on failure
    }
  }

  async function loadCatalog() {
    try {
      const r = await fetch("/api/models/catalog");
      const d = await r.json();
      setCatalog(d.catalog || []);
    } catch {
      // catalog stays empty on failure
    }
  }

  function isInstalled(name: string): boolean {
    return installed.some((m) => m.name === name || m.name === `${name}:latest`);
  }

  async function pullModel(name: string) {
    setPullingModel(name);
    setPullStatus("Starting…");
    setPullPercent(0);
    setPullError(null);

    try {
      const resp = await fetch("/api/models/pull", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });

      const reader = resp.body!.getReader();
      const decoder = new TextDecoder();
      let buf = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });

        const events = buf.split("\n\n");
        buf = events.pop() ?? "";

        for (const block of events) {
          const lines = block.split("\n");
          let eventType = "message";
          let data = "{}";
          for (const line of lines) {
            if (line.startsWith("event: ")) eventType = line.slice(7).trim();
            if (line.startsWith("data: ")) data = line.slice(6);
          }
          let payload: any;
          try {
            payload = JSON.parse(data);
          } catch {
            continue;
          }

          if (eventType === "progress") {
            setPullStatus(payload.status || "Downloading…");
            if (payload.total && payload.completed) {
              setPullPercent(Math.round((payload.completed / payload.total) * 100));
            }
          } else if (eventType === "done") {
            setPullStatus("Done");
            setPullPercent(100);
            await loadInstalled();
            await loadRunning();
            setTimeout(() => setPullingModel(null), 1200);
          } else if (eventType === "error") {
            setPullError(payload.message || "Pull failed");
            setPullingModel(null);
          }
        }
      }
    } catch (e: any) {
      setPullError(e?.message ?? "Pull failed");
      setPullingModel(null);
    }
  }

  async function deleteModel(name: string) {
    setDeletingModel(name);
    try {
      await fetch(`/api/models/${encodeURIComponent(name)}`, { method: "DELETE" });
      await loadInstalled();
      await loadRunning();
    } catch {
      // leave the row as-is on failure; user can retry
    } finally {
      setDeletingModel(null);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Models</h1>
        <p className="text-gray-400">Manage models running on your local Ollama instance</p>
      </div>

      {/* Installed Models */}
      <Card className="bg-[#1E293B]/50 backdrop-blur-xl border-white/10">
        <CardHeader>
          <CardTitle className="text-white">Installed Models</CardTitle>
          <CardDescription className="text-gray-400">
            {installed.length} model{installed.length === 1 ? "" : "s"} pulled locally
          </CardDescription>
        </CardHeader>
        <CardContent>
          {installed.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-8">No models installed yet.</p>
          ) : (
            <div className="space-y-3">
              {installed.map((m) => {
                const runningInfo = running.find((r) => r.name === m.name);
                return (
                  <div
                    key={m.name}
                    className="flex items-center justify-between p-4 rounded-lg bg-white/5 border border-white/10"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                        <Cpu className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <div className="font-medium text-white">{m.name}</div>
                        <div className="text-xs text-gray-500">{formatBytes(m.size)}</div>
                      </div>
                      {runningInfo && (
                        <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                          <Zap className="w-3 h-3 mr-1" />
                          {runningInfo.vram_percent === 100
                            ? "Loaded — 100% GPU"
                            : runningInfo.vram_percent === 0
                            ? "Loaded — CPU"
                            : `Loaded — ${runningInfo.vram_percent}% GPU`}
                        </Badge>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-gray-400 hover:text-red-400"
                      disabled={deletingModel === m.name}
                      onClick={() => deleteModel(m.name)}
                      title="Delete this model"
                    >
                      {deletingModel === m.name ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Catalog — curated, since Ollama has no official search API */}
      <Card className="bg-[#1E293B]/50 backdrop-blur-xl border-white/10">
        <CardHeader>
          <CardTitle className="text-white">Add a Model</CardTitle>
          <CardDescription className="text-gray-400">
            A short curated list — Ollama doesn't provide a model search API, so this isn't
            exhaustive. Browse the full library at{" "}
            <a
              href="https://ollama.com/library"
              target="_blank"
              rel="noreferrer"
              className="text-indigo-400 hover:underline"
            >
              ollama.com/library
            </a>{" "}
            and pull any name directly if you don't see it here.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-3">
            {catalog.map((entry) => {
              const already = isInstalled(entry.name);
              const isPulling = pullingModel === entry.name;
              return (
                <div
                  key={entry.name}
                  className="flex items-center justify-between p-4 rounded-lg bg-white/5 border border-white/10"
                >
                  <div className="min-w-0">
                    <div className="font-medium text-white">{entry.name}</div>
                    <div className="text-xs text-gray-500">{entry.size}</div>
                    <div className="text-xs text-gray-400 mt-1 truncate">{entry.description}</div>
                  </div>
                  {already ? (
                    <Badge className="bg-green-500/20 text-green-400 border-green-500/30 flex-shrink-0">
                      <CheckCircle2 className="w-3 h-3 mr-1" />
                      Installed
                    </Badge>
                  ) : (
                    <Button
                      size="sm"
                      disabled={isPulling}
                      onClick={() => pullModel(entry.name)}
                      className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white flex-shrink-0"
                    >
                      {isPulling ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Download className="w-4 h-4" />
                      )}
                    </Button>
                  )}
                </div>
              );
            })}
          </div>

          {pullingModel && (
            <div className="mt-4 p-4 rounded-lg bg-indigo-500/10 border border-indigo-500/20 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-white font-medium">Pulling {pullingModel}…</span>
                <span className="text-gray-400">{pullPercent}%</span>
              </div>
              <Progress value={pullPercent} className="h-2" />
              <p className="text-xs text-gray-500">{pullStatus}</p>
            </div>
          )}
          {pullError && <p className="text-sm text-red-400 mt-3">{pullError}</p>}
        </CardContent>
      </Card>
    </div>
  );
}
