import { Link } from "react-router";
import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";
import {
  Shield,
  MessageSquare,
  Database,
  Bot,
  BarChart3,
  Cpu,
  Lock,
  Users,
  CheckCircle2,
  XCircle,
  ArrowRight,
  Github,
} from "lucide-react";

const FEATURES = [
  {
    icon: MessageSquare,
    title: "Agentic Chat",
    description:
      "The model decides when to search your documents, build a chart, or generate a file mid-conversation — with a live status trail showing what it's doing.",
    color: "from-indigo-500 to-purple-600",
  },
  {
    icon: Database,
    title: "Private Document Search",
    description:
      "Upload PDFs, spreadsheets, or text files. They're chunked and embedded into your own ChromaDB instance — never sent anywhere else.",
    color: "from-cyan-500 to-blue-600",
  },
  {
    icon: Bot,
    title: "Custom Agent Presets",
    description:
      "Define named instruction sets and switch between them in chat. Same tools and document vault every time — just a different focus or tone.",
    color: "from-green-500 to-emerald-600",
  },
  {
    icon: Users,
    title: "Real Multi-User Accounts",
    description:
      "Each account has its own documents, conversations, and memories — fully isolated, with an admin role for account management.",
    color: "from-orange-500 to-amber-600",
  },
  {
    icon: BarChart3,
    title: "Honest Analytics",
    description:
      "Real chat-turn counts, real response latency, real tool usage — recorded at the moment each conversation happens, not estimated.",
    color: "from-pink-500 to-rose-600",
  },
  {
    icon: Cpu,
    title: "Your Own GPU",
    description:
      "Runs on Ollama with NVIDIA GPU acceleration when available. Llama 3.2, Qwen, and other open models — no API key, no per-token billing.",
    color: "from-violet-500 to-purple-600",
  },
];

const REAL_PROTECTIONS = [
  { name: "Password authentication (bcrypt-hashed)", active: true },
  { name: "Per-user data isolation", active: true },
  { name: "httpOnly session cookies", active: true },
  { name: "Multi-factor authentication", active: false },
  { name: "HTTPS by default", active: false },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#0F172A] text-white">
      {/* Nav */}
      <nav className="border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-lg">PrivateAI</span>
          </div>
          <div className="flex items-center gap-3">
            <a
              href="https://github.com/piyush9786/privateai"
              target="_blank"
              rel="noreferrer"
              className="text-gray-400 hover:text-white text-sm flex items-center gap-2"
            >
              <Github className="w-4 h-4" />
              Source
            </a>
            <Link to="/login">
              <Button variant="ghost" className="text-gray-300 hover:text-white">
                Sign In
              </Button>
            </Link>
            <Link to="/register">
              <Button className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white">
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-5xl mx-auto px-6 py-24 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-sm text-gray-300 mb-8">
          <Lock className="w-4 h-4 text-green-400" />
          Self-hosted. Open source. Your hardware, your data.
        </div>
        <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
          An AI platform that runs
          <br />
          <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
            entirely on your machine
          </span>
        </h1>
        <p className="text-xl text-gray-400 max-w-2xl mx-auto mb-10">
          Chat, document search, and memory — backed by local models via Ollama and a
          local vector store. Nothing leaves your network unless you choose to expose it.
        </p>
        <div className="flex items-center justify-center gap-4">
          <Link to="/register">
            <Button
              size="lg"
              className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white"
            >
              Create an account
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
          <a href="https://github.com/piyush9786/privateai" target="_blank" rel="noreferrer">
            <Button size="lg" variant="outline" className="bg-white/5 border-white/10 text-white hover:bg-white/10">
              <Github className="w-4 h-4 mr-2" />
              View on GitHub
            </Button>
          </a>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-7xl mx-auto px-6 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-3">What's actually in here</h2>
          <p className="text-gray-400">Every feature below is wired to a real backend — not a mockup.</p>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {FEATURES.map((f) => (
            <Card key={f.title} className="bg-[#1E293B]/50 backdrop-blur-xl border-white/10 hover:border-white/20 transition-all">
              <CardContent className="p-6">
                <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${f.color} flex items-center justify-center mb-4`}>
                  <f.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-semibold text-lg mb-2">{f.title}</h3>
                <p className="text-gray-400 text-sm">{f.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Honest security section */}
      <section className="max-w-5xl mx-auto px-6 py-16">
        <Card className="bg-[#1E293B]/50 backdrop-blur-xl border-white/10">
          <CardContent className="p-8">
            <h2 className="text-2xl font-bold mb-2">What's actually protecting your data</h2>
            <p className="text-gray-400 mb-6">
              No invented security score here — this is genuinely what's in place today.
            </p>
            <div className="grid md:grid-cols-2 gap-3">
              {REAL_PROTECTIONS.map((p) => (
                <div key={p.name} className="flex items-center gap-3 p-3 rounded-lg bg-white/5 border border-white/10">
                  {p.active ? (
                    <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0" />
                  ) : (
                    <XCircle className="w-5 h-5 text-gray-500 flex-shrink-0" />
                  )}
                  <span className="text-sm text-gray-300">{p.name}</span>
                </div>
              ))}
            </div>
            <p className="text-xs text-gray-500 mt-4">
              MFA and HTTPS aren't enabled by default in a local/self-hosted deployment.
              Add a TLS-terminating reverse proxy if you expose this beyond localhost.
            </p>
          </CardContent>
        </Card>
      </section>

      {/* CTA */}
      <section className="max-w-3xl mx-auto px-6 py-24 text-center">
        <h2 className="text-3xl font-bold mb-4">Run your own instance</h2>
        <p className="text-gray-400 mb-8">
          Clone the repo, bring up the Docker stack, and create the first account — it
          automatically becomes the administrator.
        </p>
        <div className="flex items-center justify-center gap-4">
          <Link to="/register">
            <Button
              size="lg"
              className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white"
            >
              Create an account
            </Button>
          </Link>
          <a href="https://github.com/piyush9786/privateai" target="_blank" rel="noreferrer">
            <Button size="lg" variant="outline" className="bg-white/5 border-white/10 text-white hover:bg-white/10">
              Read the docs
            </Button>
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10">
        <div className="max-w-7xl mx-auto px-6 py-8 flex items-center justify-between text-sm text-gray-500">
          <span>PrivateAI — self-hosted, open source</span>
          <a
            href="https://github.com/piyush9786/privateai"
            target="_blank"
            rel="noreferrer"
            className="hover:text-gray-300 flex items-center gap-2"
          >
            <Github className="w-4 h-4" />
            github.com/piyush9786/privateai
          </a>
        </div>
      </footer>
    </div>
  );
}
