import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { CheckCircle2, XCircle, Loader2, Info, Server } from "lucide-react";

interface ServiceStatus {
  name: string;
  reachable: boolean;
  detail: string;
}

interface DeploymentInfo {
  services: ServiceStatus[];
  configuration: Record<string, string>;
  note: string;
}

export default function DeploymentPage() {
  const [info, setInfo] = useState<DeploymentInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadInfo();
    const interval = setInterval(loadInfo, 15000);
    return () => clearInterval(interval);
  }, []);

  async function loadInfo() {
    try {
      const r = await fetch("/api/system/deployment");
      const d = await r.json();
      setInfo(d);
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
        Checking deployment status…
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Deployment</h1>
        <p className="text-gray-400">Live reachability of every service this app depends on.</p>
      </div>

      {info?.note && (
        <Card className="bg-amber-500/10 border-amber-500/20">
          <CardContent className="p-4 flex items-start gap-3">
            <Info className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-gray-300">{info.note}</p>
          </CardContent>
        </Card>
      )}

      <div className="grid md:grid-cols-3 gap-6">
        {info?.services.map((s) => (
          <Card key={s.name} className="bg-[#1E293B]/50 backdrop-blur-xl border-white/10">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                  <Server className="w-6 h-6 text-white" />
                </div>
                {s.reachable ? (
                  <CheckCircle2 className="w-6 h-6 text-green-400" />
                ) : (
                  <XCircle className="w-6 h-6 text-red-400" />
                )}
              </div>
              <div className="font-semibold text-white mb-1">{s.name}</div>
              <div className="text-sm text-gray-400 font-mono">{s.detail}</div>
              <div className={`text-xs mt-2 ${s.reachable ? "text-green-400" : "text-red-400"}`}>
                {s.reachable ? "Reachable" : "Unreachable"}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="bg-[#1E293B]/50 backdrop-blur-xl border-white/10">
        <CardHeader>
          <CardTitle className="text-white">Configuration</CardTitle>
          <CardDescription className="text-gray-400">
            Real values currently in effect, read from environment configuration
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-3">
            {info &&
              Object.entries(info.configuration).map(([key, value]) => (
                <div key={key} className="p-3 rounded-lg bg-white/5 border border-white/10">
                  <div className="text-xs text-gray-400 mb-1">
                    {key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                  </div>
                  <div className="text-sm font-mono text-white">{value}</div>
                </div>
              ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
