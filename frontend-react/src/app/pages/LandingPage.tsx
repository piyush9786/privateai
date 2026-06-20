import { Link } from "react-router";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import {
  Shield,
  Database,
  Bot,
  Search,
  Cpu,
  Lock,
  BarChart3,
  Users,
  Zap,
  Play,
  ArrowRight,
  Building2,
  Heart,
  Landmark,
  FlaskConical,
  Factory,
  Scale,
  GraduationCap,
  CheckCircle2,
  Container
} from "lucide-react";

export default function LandingPage() {
  const features = [
    {
      icon: Cpu,
      title: "Local AI Models",
      description: "Run Llama, Qwen, Mistral, DeepSeek without internet connection."
    },
    {
      icon: Search,
      title: "RAG Search",
      description: "Query company documents with intelligent source citations."
    },
    {
      icon: Database,
      title: "ChromaDB Vector Search",
      description: "Lightning-fast semantic document retrieval and indexing."
    },
    {
      icon: Bot,
      title: "Multi-Agent AI",
      description: "Department-specific AI assistants for every team."
    },
    {
      icon: Container,
      title: "Docker Deployment",
      description: "One-command deployment with complete orchestration."
    },
    {
      icon: Shield,
      title: "Enterprise Security",
      description: "Your data never leaves your organization's infrastructure."
    },
    {
      icon: BarChart3,
      title: "Analytics Dashboard",
      description: "Monitor model performance and usage in real-time."
    },
    {
      icon: Users,
      title: "User Management",
      description: "Role-based access control with enterprise SSO."
    }
  ];

  const industries = [
    { icon: Landmark, name: "Banking", color: "from-blue-500 to-cyan-500" },
    { icon: Heart, name: "Healthcare", color: "from-red-500 to-pink-500" },
    { icon: Building2, name: "Government", color: "from-indigo-500 to-purple-500" },
    { icon: Shield, name: "Insurance", color: "from-green-500 to-emerald-500" },
    { icon: Factory, name: "Manufacturing", color: "from-orange-500 to-amber-500" },
    { icon: Scale, name: "Legal", color: "from-purple-500 to-violet-500" },
    { icon: FlaskConical, name: "Research", color: "from-cyan-500 to-teal-500" },
    { icon: GraduationCap, name: "Education", color: "from-pink-500 to-rose-500" }
  ];

  const securityFeatures = [
    "Air-Gapped Ready",
    "Local Processing",
    "End-to-End Encryption",
    "Audit Logging",
    "RBAC Access Control",
    "Compliance Ready"
  ];

  return (
    <div className="min-h-screen bg-[#0F172A]">
      {/* Navigation */}
      <nav className="fixed top-0 w-full bg-[#0F172A]/80 backdrop-blur-xl border-b border-white/10 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <div>
                <div className="font-bold text-white text-lg">Private Enterprise AI</div>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Link to="/login">
                <Button variant="ghost" className="text-white hover:bg-white/10">
                  Sign In
                </Button>
              </Link>
              <Link to="/login">
                <Button className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white">
                  Get Started
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <Badge className="mb-6 bg-indigo-500/20 text-indigo-300 border-indigo-500/30 hover:bg-indigo-500/30">
                Enterprise AI Platform
              </Badge>
              <h1 className="text-5xl md:text-6xl font-bold text-white mb-6 leading-tight">
                Deploy Enterprise AI
                <span className="block bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                  Completely Private
                </span>
              </h1>
              <p className="text-xl text-gray-300 mb-8 leading-relaxed">
                Run Local LLMs, RAG Pipelines, Knowledge Bases, and AI Agents entirely within your organization's infrastructure.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link to="/login">
                  <Button size="lg" className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white text-lg px-8">
                    Get Started
                    <ArrowRight className="ml-2 w-5 h-5" />
                  </Button>
                </Link>
                <Button size="lg" variant="outline" className="border-white/20 text-white hover:bg-white/10 text-lg px-8">
                  <Play className="mr-2 w-5 h-5" />
                  View Demo
                </Button>
              </div>
            </div>

            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/20 to-purple-500/20 blur-3xl rounded-full"></div>
              <Card className="relative bg-gradient-to-br from-[#1E293B] to-[#0F172A] border-white/10 backdrop-blur-xl">
                <CardContent className="p-8">
                  <div className="space-y-6">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                        <Users className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex-1">
                        <div className="text-sm text-gray-400">Your Organization</div>
                        <div className="text-white font-semibold">Secure Enterprise Network</div>
                      </div>
                    </div>

                    <div className="h-px bg-gradient-to-r from-transparent via-indigo-500 to-transparent"></div>

                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center">
                        <Cpu className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex-1">
                        <div className="text-sm text-gray-400">AI Models</div>
                        <div className="text-white font-semibold">Llama 3, Qwen, Mistral, DeepSeek</div>
                      </div>
                    </div>

                    <div className="h-px bg-gradient-to-r from-transparent via-purple-500 to-transparent"></div>

                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
                        <Database className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex-1">
                        <div className="text-sm text-gray-400">Vector Database</div>
                        <div className="text-white font-semibold">ChromaDB Knowledge Base</div>
                      </div>
                    </div>

                    <div className="h-px bg-gradient-to-r from-transparent via-cyan-500 to-transparent"></div>

                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
                        <Shield className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex-1">
                        <div className="text-sm text-gray-400">Security Status</div>
                        <div className="text-white font-semibold flex items-center gap-2">
                          <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                          100% On-Premise
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-6 bg-gradient-to-b from-transparent to-[#111827]/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-4">Enterprise-Grade Features</h2>
            <p className="text-xl text-gray-400">Everything you need for private AI deployment</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <Card key={index} className="bg-[#1E293B]/50 backdrop-blur-xl border-white/10 hover:border-indigo-500/50 transition-all hover:shadow-lg hover:shadow-indigo-500/20">
                <CardHeader>
                  <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center mb-4">
                    <feature.icon className="w-6 h-6 text-white" />
                  </div>
                  <CardTitle className="text-white">{feature.title}</CardTitle>
                  <CardDescription className="text-gray-400">
                    {feature.description}
                  </CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Architecture Section */}
      <section className="py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-4">Simple Architecture</h2>
            <p className="text-xl text-gray-400">Streamlined deployment workflow</p>
          </div>

          <div className="relative">
            <div className="flex flex-col items-center gap-6">
              <Card className="w-full max-w-md bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border-indigo-500/30 backdrop-blur-xl">
                <CardContent className="p-6 text-center">
                  <Users className="w-8 h-8 text-indigo-400 mx-auto mb-2" />
                  <div className="font-semibold text-white">Users</div>
                </CardContent>
              </Card>

              <div className="h-12 w-px bg-gradient-to-b from-indigo-500 to-purple-500 relative">
                <Zap className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-5 h-5 text-indigo-400" />
              </div>

              <Card className="w-full max-w-md bg-gradient-to-br from-purple-500/20 to-pink-500/20 border-purple-500/30 backdrop-blur-xl">
                <CardContent className="p-6 text-center">
                  <BarChart3 className="w-8 h-8 text-purple-400 mx-auto mb-2" />
                  <div className="font-semibold text-white">Web Dashboard</div>
                </CardContent>
              </Card>

              <div className="h-12 w-px bg-gradient-to-b from-purple-500 to-cyan-500 relative">
                <Zap className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-5 h-5 text-purple-400" />
              </div>

              <Card className="w-full max-w-md bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border-cyan-500/30 backdrop-blur-xl">
                <CardContent className="p-6 text-center">
                  <Cpu className="w-8 h-8 text-cyan-400 mx-auto mb-2" />
                  <div className="font-semibold text-white">Ollama Models</div>
                </CardContent>
              </Card>

              <div className="h-12 w-px bg-gradient-to-b from-cyan-500 to-green-500 relative">
                <Zap className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-5 h-5 text-cyan-400" />
              </div>

              <Card className="w-full max-w-md bg-gradient-to-br from-green-500/20 to-emerald-500/20 border-green-500/30 backdrop-blur-xl">
                <CardContent className="p-6 text-center">
                  <Database className="w-8 h-8 text-green-400 mx-auto mb-2" />
                  <div className="font-semibold text-white">ChromaDB + Knowledge Base</div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Industries Section */}
      <section className="py-20 px-6 bg-gradient-to-b from-transparent to-[#111827]/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-4">Trusted by Industries</h2>
            <p className="text-xl text-gray-400">Secure AI for regulated enterprises</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {industries.map((industry, index) => (
              <Card key={index} className="bg-[#1E293B]/50 backdrop-blur-xl border-white/10 hover:border-white/20 transition-all group">
                <CardContent className="p-8 text-center">
                  <div className={`w-16 h-16 rounded-xl bg-gradient-to-br ${industry.color} flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform`}>
                    <industry.icon className="w-8 h-8 text-white" />
                  </div>
                  <div className="font-semibold text-white">{industry.name}</div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Security Section */}
      <section className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-4">Enterprise Security Built-In</h2>
            <p className="text-xl text-gray-400">Your data stays within your walls</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {securityFeatures.map((feature, index) => (
              <Card key={index} className="bg-gradient-to-br from-[#1E293B] to-[#0F172A] border-green-500/30 backdrop-blur-xl">
                <CardContent className="p-6 flex items-center gap-4">
                  <CheckCircle2 className="w-6 h-6 text-green-400 flex-shrink-0" />
                  <div className="font-semibold text-white">{feature}</div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <Card className="bg-gradient-to-br from-indigo-600 to-purple-600 border-0">
            <CardContent className="p-12 text-center">
              <h2 className="text-4xl font-bold text-white mb-4">
                Ready to Deploy Private AI?
              </h2>
              <p className="text-xl text-indigo-100 mb-8">
                Join organizations running AI completely within their infrastructure
              </p>
              <div className="flex flex-wrap gap-4 justify-center">
                <Link to="/login">
                  <Button size="lg" className="bg-white text-indigo-600 hover:bg-gray-100 text-lg px-8">
                    Get Started Now
                    <ArrowRight className="ml-2 w-5 h-5" />
                  </Button>
                </Link>
                <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10 text-lg px-8">
                  Contact Sales
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 py-8 px-6">
        <div className="max-w-7xl mx-auto text-center text-gray-400">
          <p>&copy; 2026 Private Enterprise AI Platform. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
