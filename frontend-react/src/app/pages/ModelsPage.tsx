import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Progress } from "../components/ui/progress";
import {
  Cpu,
  Play,
  Square,
  Download,
  RefreshCw,
  Zap,
  Activity,
  HardDrive,
  Clock
} from "lucide-react";

export default function ModelsPage() {
  const models = [
    {
      name: "Llama 3.1 70B",
      version: "v1.2.0",
      status: "running",
      size: "40 GB",
      ramUsage: 68,
      gpuUsage: 72,
      responseSpeed: "1.2s",
      color: "from-indigo-500 to-purple-600",
      downloads: "2.4M",
      accuracy: "94%"
    },
    {
      name: "Qwen 2.5 72B",
      version: "v2.5.1",
      status: "running",
      size: "42 GB",
      ramUsage: 71,
      gpuUsage: 75,
      responseSpeed: "1.4s",
      color: "from-cyan-500 to-blue-600",
      downloads: "1.8M",
      accuracy: "92%"
    },
    {
      name: "DeepSeek V2",
      version: "v2.0.3",
      status: "stopped",
      size: "35 GB",
      ramUsage: 0,
      gpuUsage: 0,
      responseSpeed: "N/A",
      color: "from-purple-500 to-pink-600",
      downloads: "1.2M",
      accuracy: "91%"
    },
    {
      name: "Mistral 7B",
      version: "v0.3.2",
      status: "running",
      size: "4.1 GB",
      ramUsage: 28,
      gpuUsage: 32,
      responseSpeed: "0.8s",
      color: "from-orange-500 to-amber-600",
      downloads: "5.1M",
      accuracy: "88%"
    },
    {
      name: "Gemma 2 27B",
      version: "v2.0.0",
      status: "stopped",
      size: "16 GB",
      ramUsage: 0,
      gpuUsage: 0,
      responseSpeed: "N/A",
      color: "from-green-500 to-emerald-600",
      downloads: "980K",
      accuracy: "89%"
    },
    {
      name: "Llama 3.1 8B",
      version: "v1.0.5",
      status: "running",
      size: "4.7 GB",
      ramUsage: 32,
      gpuUsage: 35,
      responseSpeed: "0.6s",
      color: "from-pink-500 to-rose-600",
      downloads: "3.2M",
      accuracy: "86%"
    }
  ];

  const stats = [
    {
      title: "Active Models",
      value: "4",
      subtitle: "of 6 installed",
      icon: Cpu,
      color: "from-indigo-500 to-purple-600"
    },
    {
      title: "Total GPU Usage",
      value: "58%",
      subtitle: "Optimal range",
      icon: Activity,
      color: "from-cyan-500 to-blue-600"
    },
    {
      title: "Total Storage",
      value: "142 GB",
      subtitle: "Model storage",
      icon: HardDrive,
      color: "from-purple-500 to-pink-600"
    },
    {
      title: "Avg Response Time",
      value: "1.0s",
      subtitle: "Across all models",
      icon: Clock,
      color: "from-green-500 to-emerald-600"
    }
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Model Management</h1>
          <p className="text-gray-400">Manage and monitor your AI models</p>
        </div>
        <Button className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white">
          <Download className="w-4 h-4 mr-2" />
          Download New Model
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
                <div className="text-xs text-gray-500">{stat.subtitle}</div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Models Grid */}
      <div className="grid md:grid-cols-2 gap-6">
        {models.map((model, index) => (
          <Card key={index} className="bg-[#1E293B]/50 backdrop-blur-xl border-white/10 hover:border-white/20 transition-all">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                  <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${model.color} flex items-center justify-center`}>
                    <Cpu className="w-7 h-7 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-white mb-1">{model.name}</CardTitle>
                    <CardDescription className="text-gray-400">Version {model.version}</CardDescription>
                  </div>
                </div>
                {model.status === 'running' ? (
                  <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full mr-1.5 animate-pulse"></div>
                    Running
                  </Badge>
                ) : (
                  <Badge className="bg-gray-500/20 text-gray-400 border-gray-500/30">
                    Stopped
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Metrics */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 rounded-lg bg-white/5 border border-white/10">
                  <div className="text-xs text-gray-400 mb-1">Model Size</div>
                  <div className="text-lg font-bold text-white">{model.size}</div>
                </div>
                <div className="p-3 rounded-lg bg-white/5 border border-white/10">
                  <div className="text-xs text-gray-400 mb-1">Response Speed</div>
                  <div className="text-lg font-bold text-white">{model.responseSpeed}</div>
                </div>
                <div className="p-3 rounded-lg bg-white/5 border border-white/10">
                  <div className="text-xs text-gray-400 mb-1">Downloads</div>
                  <div className="text-lg font-bold text-white">{model.downloads}</div>
                </div>
                <div className="p-3 rounded-lg bg-white/5 border border-white/10">
                  <div className="text-xs text-gray-400 mb-1">Accuracy</div>
                  <div className="text-lg font-bold text-white">{model.accuracy}</div>
                </div>
              </div>

              {/* Resource Usage */}
              {model.status === 'running' && (
                <div className="space-y-3">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-400">RAM Usage</span>
                      <span className="text-sm font-semibold text-white">{model.ramUsage}%</span>
                    </div>
                    <Progress value={model.ramUsage} className="h-2" />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-400">GPU Usage</span>
                      <span className="text-sm font-semibold text-white">{model.gpuUsage}%</span>
                    </div>
                    <Progress value={model.gpuUsage} className="h-2" />
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2 pt-2">
                {model.status === 'running' ? (
                  <>
                    <Button className="flex-1 bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30">
                      <Square className="w-4 h-4 mr-2" />
                      Stop
                    </Button>
                    <Button variant="outline" className="flex-1 bg-white/5 border-white/10 text-white hover:bg-white/10">
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Restart
                    </Button>
                  </>
                ) : (
                  <>
                    <Button className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white">
                      <Play className="w-4 h-4 mr-2" />
                      Start
                    </Button>
                    <Button variant="outline" className="flex-1 bg-white/5 border-white/10 text-white hover:bg-white/10">
                      <Download className="w-4 h-4 mr-2" />
                      Update
                    </Button>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Available Models */}
      <Card className="bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border-indigo-500/20 backdrop-blur-xl">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Zap className="w-5 h-5 text-indigo-400" />
            Available for Download
          </CardTitle>
          <CardDescription className="text-gray-400">
            Popular models ready to deploy
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-4">
            {[
              { name: "CodeLlama 34B", size: "19 GB", specialty: "Code generation" },
              { name: "Mixtral 8x7B", size: "26 GB", specialty: "Multi-task" },
              { name: "Phi-3 Medium", size: "7.9 GB", specialty: "Lightweight" }
            ].map((availableModel, index) => (
              <div
                key={index}
                className="p-4 rounded-lg bg-white/5 border border-white/10 hover:border-indigo-500/50 transition-all cursor-pointer"
              >
                <div className="font-semibold text-white mb-2">{availableModel.name}</div>
                <div className="text-sm text-gray-400 mb-3">
                  {availableModel.size} • {availableModel.specialty}
                </div>
                <Button className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white">
                  <Download className="w-4 h-4 mr-2" />
                  Download
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
