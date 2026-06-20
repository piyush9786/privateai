import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import { Badge } from "../components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import {
  Bot,
  Plus,
  Briefcase,
  DollarSign,
  Monitor,
  Scale,
  MessageSquare,
  Settings,
  Play,
  Pause,
  Trash2
} from "lucide-react";

export default function AgentsPage() {
  const [showBuilder, setShowBuilder] = useState(false);

  const agents = [
    {
      name: "HR Assistant",
      description: "Handles employee policies, benefits, and HR procedures",
      icon: Briefcase,
      color: "from-indigo-500 to-purple-600",
      status: "active",
      model: "Llama 3.1 70B",
      knowledgeBase: "HR Documents",
      queries: 1247,
      accuracy: "96%"
    },
    {
      name: "Finance Assistant",
      description: "Manages financial documents, reports, and budgets",
      icon: DollarSign,
      color: "from-green-500 to-emerald-600",
      status: "active",
      model: "Qwen 2.5 72B",
      knowledgeBase: "Finance KB",
      queries: 892,
      accuracy: "94%"
    },
    {
      name: "IT Assistant",
      description: "Technical documentation and IT support procedures",
      icon: Monitor,
      color: "from-cyan-500 to-blue-600",
      status: "active",
      model: "Llama 3.1 70B",
      knowledgeBase: "IT Knowledge",
      queries: 2341,
      accuracy: "92%"
    },
    {
      name: "Legal Assistant",
      description: "Handles contracts, compliance, and legal documents",
      icon: Scale,
      color: "from-purple-500 to-pink-600",
      status: "paused",
      model: "Mistral 7B",
      knowledgeBase: "Legal Docs",
      queries: 567,
      accuracy: "95%"
    }
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">AI Agent Studio</h1>
          <p className="text-gray-400">Create and manage specialized AI assistants</p>
        </div>
        <Button
          onClick={() => setShowBuilder(!showBuilder)}
          className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white"
        >
          <Plus className="w-4 h-4 mr-2" />
          Create Agent
        </Button>
      </div>

      {/* Agent Builder */}
      {showBuilder && (
        <Card className="bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border-indigo-500/30 backdrop-blur-xl">
          <CardHeader>
            <CardTitle className="text-white">Create New Agent</CardTitle>
            <CardDescription className="text-gray-400">
              Configure a specialized AI assistant for your team
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="agentName" className="text-white">Agent Name</Label>
                  <Input
                    id="agentName"
                    placeholder="e.g., Customer Support Assistant"
                    className="bg-white/5 border-white/10 text-white placeholder:text-gray-500"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description" className="text-white">Description</Label>
                  <Textarea
                    id="description"
                    placeholder="Describe what this agent will do..."
                    className="bg-white/5 border-white/10 text-white placeholder:text-gray-500"
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="model" className="text-white">Select Model</Label>
                  <Select>
                    <SelectTrigger className="bg-white/5 border-white/10 text-white">
                      <SelectValue placeholder="Choose AI model" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1E293B] border-white/10">
                      <SelectItem value="llama">Llama 3.1 70B</SelectItem>
                      <SelectItem value="qwen">Qwen 2.5 72B</SelectItem>
                      <SelectItem value="mistral">Mistral 7B</SelectItem>
                      <SelectItem value="deepseek">DeepSeek V2</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="kb" className="text-white">Knowledge Base</Label>
                  <Select>
                    <SelectTrigger className="bg-white/5 border-white/10 text-white">
                      <SelectValue placeholder="Select knowledge base" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1E293B] border-white/10">
                      <SelectItem value="hr">HR Documents</SelectItem>
                      <SelectItem value="finance">Finance KB</SelectItem>
                      <SelectItem value="it">IT Knowledge</SelectItem>
                      <SelectItem value="legal">Legal Docs</SelectItem>
                      <SelectItem value="all">All Knowledge Bases</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-white">Permissions</Label>
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-gray-300 cursor-pointer">
                      <input type="checkbox" defaultChecked className="rounded border-white/10" />
                      <span className="text-sm">Can access all documents</span>
                    </label>
                    <label className="flex items-center gap-2 text-gray-300 cursor-pointer">
                      <input type="checkbox" defaultChecked className="rounded border-white/10" />
                      <span className="text-sm">Can provide citations</span>
                    </label>
                    <label className="flex items-center gap-2 text-gray-300 cursor-pointer">
                      <input type="checkbox" className="rounded border-white/10" />
                      <span className="text-sm">Can execute actions</span>
                    </label>
                  </div>
                </div>

                <Button className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white">
                  <Bot className="w-4 h-4 mr-2" />
                  Create Agent
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Agents Grid */}
      <div className="grid md:grid-cols-2 gap-6">
        {agents.map((agent, index) => (
          <Card key={index} className="bg-[#1E293B]/50 backdrop-blur-xl border-white/10 hover:border-white/20 transition-all">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                  <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${agent.color} flex items-center justify-center`}>
                    <agent.icon className="w-7 h-7 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-white mb-1">{agent.name}</CardTitle>
                    <CardDescription className="text-gray-400">{agent.description}</CardDescription>
                  </div>
                </div>
                {agent.status === 'active' ? (
                  <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full mr-1.5 animate-pulse"></div>
                    Active
                  </Badge>
                ) : (
                  <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30">
                    Paused
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Configuration */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 rounded-lg bg-white/5 border border-white/10">
                  <div className="text-xs text-gray-400 mb-1">Model</div>
                  <div className="text-sm font-semibold text-white">{agent.model}</div>
                </div>
                <div className="p-3 rounded-lg bg-white/5 border border-white/10">
                  <div className="text-xs text-gray-400 mb-1">Knowledge Base</div>
                  <div className="text-sm font-semibold text-white">{agent.knowledgeBase}</div>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 rounded-lg bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border border-indigo-500/20">
                  <div className="flex items-center gap-2 mb-1">
                    <MessageSquare className="w-4 h-4 text-indigo-400" />
                    <div className="text-xs text-gray-400">Total Queries</div>
                  </div>
                  <div className="text-xl font-bold text-white">{agent.queries.toLocaleString()}</div>
                </div>
                <div className="p-3 rounded-lg bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-500/20">
                  <div className="flex items-center gap-2 mb-1">
                    <Settings className="w-4 h-4 text-green-400" />
                    <div className="text-xs text-gray-400">Accuracy</div>
                  </div>
                  <div className="text-xl font-bold text-white">{agent.accuracy}</div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                {agent.status === 'active' ? (
                  <Button className="flex-1 bg-orange-500/20 hover:bg-orange-500/30 text-orange-400 border border-orange-500/30">
                    <Pause className="w-4 h-4 mr-2" />
                    Pause
                  </Button>
                ) : (
                  <Button className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white">
                    <Play className="w-4 h-4 mr-2" />
                    Activate
                  </Button>
                )}
                <Button variant="outline" className="flex-1 bg-white/5 border-white/10 text-white hover:bg-white/10">
                  <Settings className="w-4 h-4 mr-2" />
                  Configure
                </Button>
                <Button variant="ghost" size="icon" className="text-gray-400 hover:text-red-400">
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Stats */}
      <div className="grid md:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border-indigo-500/20 backdrop-blur-xl">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="text-2xl font-bold text-white">4</div>
                <div className="text-sm text-gray-400">Active Agents</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 border-green-500/20 backdrop-blur-xl">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
                <MessageSquare className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="text-2xl font-bold text-white">5.0K</div>
                <div className="text-sm text-gray-400">Total Queries</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-cyan-500/10 to-blue-500/10 border-cyan-500/20 backdrop-blur-xl">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
                <Settings className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="text-2xl font-bold text-white">94%</div>
                <div className="text-sm text-gray-400">Avg Accuracy</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border-purple-500/20 backdrop-blur-xl">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center">
                <Briefcase className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="text-2xl font-bold text-white">8</div>
                <div className="text-sm text-gray-400">Departments</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
