import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Progress } from "../components/ui/progress";
import {
  Rocket,
  Container,
  Database,
  Server,
  Cpu,
  CheckCircle2,
  AlertCircle,
  Activity,
  Download,
  Play,
  RefreshCw,
  Terminal,
  Zap,
  Github
} from "lucide-react";

export default function DeploymentPage() {
  const deploymentSteps = [
    { name: "GitHub Repository", status: "completed", icon: Github },
    { name: "Docker Compose", status: "completed", icon: Container },
    { name: "Ollama Service", status: "completed", icon: Cpu },
    { name: "ChromaDB", status: "completed", icon: Database },
    { name: "Platform Deployment", status: "completed", icon: Rocket }
  ];

  const containers = [
    {
      name: "ollama-service",
      status: "running",
      uptime: "15d 7h 23m",
      cpu: "68%",
      memory: "54.2 GB",
      restarts: 0,
      color: "from-green-500 to-emerald-600"
    },
    {
      name: "chromadb-vector",
      status: "running",
      uptime: "15d 7h 22m",
      cpu: "42%",
      memory: "12.8 GB",
      restarts: 0,
      color: "from-cyan-500 to-blue-600"
    },
    {
      name: "fastapi-backend",
      status: "running",
      uptime: "15d 7h 23m",
      cpu: "28%",
      memory: "4.2 GB",
      restarts: 1,
      color: "from-purple-500 to-pink-600"
    },
    {
      name: "postgres-db",
      status: "running",
      uptime: "15d 7h 23m",
      cpu: "15%",
      memory: "2.8 GB",
      restarts: 0,
      color: "from-indigo-500 to-purple-600"
    },
    {
      name: "redis-cache",
      status: "running",
      uptime: "15d 7h 22m",
      cpu: "8%",
      memory: "512 MB",
      restarts: 0,
      color: "from-orange-500 to-amber-600"
    },
    {
      name: "nginx-proxy",
      status: "running",
      uptime: "15d 7h 23m",
      cpu: "5%",
      memory: "128 MB",
      restarts: 0,
      color: "from-pink-500 to-rose-600"
    }
  ];

  const healthChecks = [
    { service: "Web Application", status: "healthy", response: "< 100ms" },
    { service: "API Gateway", status: "healthy", response: "< 50ms" },
    { service: "Model Inference", status: "healthy", response: "1.2s" },
    { service: "Vector Search", status: "healthy", response: "47ms" },
    { service: "Database", status: "healthy", response: "< 10ms" }
  ];

  const recentLogs = [
    { time: "14:32:15", level: "INFO", message: "Ollama service health check passed" },
    { time: "14:32:10", level: "INFO", message: "ChromaDB index optimized successfully" },
    { time: "14:31:55", level: "INFO", message: "User authentication request processed" },
    { time: "14:31:40", level: "WARN", message: "High CPU usage detected on ollama-service (72%)" },
    { time: "14:31:25", level: "INFO", message: "Model inference completed in 1.24s" },
    { time: "14:31:10", level: "INFO", message: "Database backup completed successfully" }
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Deployment Center</h1>
        <p className="text-gray-400">Monitor and manage platform deployment</p>
      </div>

      {/* Deployment Status */}
      <Card className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 border-green-500/30 backdrop-blur-xl">
        <CardContent className="p-8">
          <div className="flex items-center gap-6 mb-6">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h2 className="text-2xl font-bold text-white">Deployment Active</h2>
                <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                  <div className="w-1.5 h-1.5 bg-green-500 rounded-full mr-1.5 animate-pulse"></div>
                  All Systems Operational
                </Badge>
              </div>
              <p className="text-gray-300">Platform successfully deployed and running for 15 days</p>
            </div>
          </div>

          {/* Deployment Workflow */}
          <div className="flex items-center justify-between">
            {deploymentSteps.map((step, index) => (
              <div key={index} className="flex items-center">
                <div className="text-center">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center mx-auto mb-2">
                    <step.icon className="w-6 h-6 text-white" />
                  </div>
                  <div className="text-sm font-medium text-white mb-1">{step.name}</div>
                  <Badge className="bg-green-500/20 text-green-400 border-green-500/30 text-xs">
                    <CheckCircle2 className="w-3 h-3 mr-1" />
                    {step.status}
                  </Badge>
                </div>
                {index < deploymentSteps.length - 1 && (
                  <div className="w-24 h-0.5 bg-gradient-to-r from-green-500 to-emerald-600 mx-4"></div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid md:grid-cols-4 gap-6">
        <Button className="h-auto py-6 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white flex-col">
          <Rocket className="w-8 h-8 mb-2" />
          <span>Deploy Update</span>
        </Button>
        <Button className="h-auto py-6 bg-white/5 hover:bg-white/10 border border-white/10 text-white flex-col">
          <RefreshCw className="w-8 h-8 mb-2" />
          <span>Restart Services</span>
        </Button>
        <Button className="h-auto py-6 bg-white/5 hover:bg-white/10 border border-white/10 text-white flex-col">
          <Download className="w-8 h-8 mb-2" />
          <span>Backup Data</span>
        </Button>
        <Button className="h-auto py-6 bg-white/5 hover:bg-white/10 border border-white/10 text-white flex-col">
          <Terminal className="w-8 h-8 mb-2" />
          <span>View Logs</span>
        </Button>
      </div>

      {/* Container Status */}
      <Card className="bg-[#1E293B]/50 backdrop-blur-xl border-white/10">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Container className="w-5 h-5 text-cyan-400" />
            Container Status
          </CardTitle>
          <CardDescription className="text-gray-400">
            Docker containers running in your deployment
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4">
            {containers.map((container, index) => (
              <div
                key={index}
                className="p-4 rounded-lg bg-white/5 border border-white/10 hover:border-white/20 transition-all"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${container.color} flex items-center justify-center`}>
                      <Container className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <div className="font-mono text-sm font-semibold text-white">{container.name}</div>
                      <div className="text-xs text-gray-400">Uptime: {container.uptime}</div>
                    </div>
                  </div>
                  <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full mr-1.5 animate-pulse"></div>
                    {container.status}
                  </Badge>
                </div>

                <div className="grid grid-cols-3 gap-3 mb-3">
                  <div className="p-2 rounded bg-white/5">
                    <div className="text-xs text-gray-400 mb-1">CPU</div>
                    <div className="text-sm font-bold text-white">{container.cpu}</div>
                  </div>
                  <div className="p-2 rounded bg-white/5">
                    <div className="text-xs text-gray-400 mb-1">Memory</div>
                    <div className="text-sm font-bold text-white">{container.memory}</div>
                  </div>
                  <div className="p-2 rounded bg-white/5">
                    <div className="text-xs text-gray-400 mb-1">Restarts</div>
                    <div className="text-sm font-bold text-white">{container.restarts}</div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button size="sm" variant="outline" className="flex-1 bg-white/5 border-white/10 text-white hover:bg-white/10">
                    <Terminal className="w-3 h-3 mr-1" />
                    Logs
                  </Button>
                  <Button size="sm" variant="outline" className="flex-1 bg-white/5 border-white/10 text-white hover:bg-white/10">
                    <RefreshCw className="w-3 h-3 mr-1" />
                    Restart
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Health Checks */}
        <Card className="bg-[#1E293B]/50 backdrop-blur-xl border-white/10">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Activity className="w-5 h-5 text-green-400" />
              Health Checks
            </CardTitle>
            <CardDescription className="text-gray-400">
              Service health and response times
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {healthChecks.map((check, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 rounded-lg bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-500/20"
                >
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-green-400" />
                    <div>
                      <div className="font-medium text-white">{check.service}</div>
                      <div className="text-xs text-gray-400">Response: {check.response}</div>
                    </div>
                  </div>
                  <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                    {check.status}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Logs */}
        <Card className="bg-[#1E293B]/50 backdrop-blur-xl border-white/10">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Terminal className="w-5 h-5 text-indigo-400" />
              Recent Logs
            </CardTitle>
            <CardDescription className="text-gray-400">
              Latest system events and messages
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 font-mono text-xs">
              {recentLogs.map((log, index) => (
                <div
                  key={index}
                  className="p-2 rounded bg-white/5 border border-white/10 hover:border-white/20 transition-colors"
                >
                  <div className="flex items-start gap-2">
                    <span className="text-gray-500">{log.time}</span>
                    <Badge
                      className={`text-xs ${
                        log.level === 'INFO'
                          ? 'bg-blue-500/20 text-blue-400 border-blue-500/30'
                          : 'bg-orange-500/20 text-orange-400 border-orange-500/30'
                      }`}
                    >
                      {log.level}
                    </Badge>
                    <span className="text-gray-300 flex-1">{log.message}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Deployment Info */}
      <Card className="bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border-indigo-500/20 backdrop-blur-xl">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Zap className="w-5 h-5 text-indigo-400" />
            Deployment Configuration
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-6">
            <div>
              <div className="text-sm text-gray-400 mb-2">Environment</div>
              <div className="text-white font-semibold">Production</div>
            </div>
            <div>
              <div className="text-sm text-gray-400 mb-2">Platform Version</div>
              <div className="text-white font-semibold">v2.4.1</div>
            </div>
            <div>
              <div className="text-sm text-gray-400 mb-2">Deployment Method</div>
              <div className="text-white font-semibold">Docker Compose</div>
            </div>
            <div>
              <div className="text-sm text-gray-400 mb-2">Network Mode</div>
              <div className="text-white font-semibold">Air-Gapped</div>
            </div>
            <div>
              <div className="text-sm text-gray-400 mb-2">Data Storage</div>
              <div className="text-white font-semibold">Local Volumes</div>
            </div>
            <div>
              <div className="text-sm text-gray-400 mb-2">Last Updated</div>
              <div className="text-white font-semibold">2026-06-05</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
