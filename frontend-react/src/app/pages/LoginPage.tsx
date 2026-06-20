import { Link } from "react-router";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Separator } from "../components/ui/separator";
import { Shield, Lock, Server, Database, Cpu, Network } from "lucide-react";

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-[#0F172A] flex">
      {/* Left Side - Login Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          {/* Logo */}
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
              <Shield className="w-7 h-7 text-white" />
            </div>
            <div>
              <div className="font-bold text-white text-xl">Private Enterprise AI</div>
              <div className="text-sm text-gray-400">Secure Platform Access</div>
            </div>
          </div>

          <Card className="bg-[#1E293B]/50 backdrop-blur-xl border-white/10">
            <CardHeader>
              <CardTitle className="text-white text-2xl">Welcome Back</CardTitle>
              <CardDescription className="text-gray-400">
                Sign in to access your enterprise AI platform
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-white">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="admin@company.com"
                    className="bg-white/5 border-white/10 text-white placeholder:text-gray-500"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-white">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    className="bg-white/5 border-white/10 text-white placeholder:text-gray-500"
                  />
                </div>

                <div className="flex items-center justify-between text-sm">
                  <label className="flex items-center gap-2 text-gray-400 cursor-pointer">
                    <input type="checkbox" className="rounded border-white/10" />
                    Remember me
                  </label>
                  <a href="#" className="text-indigo-400 hover:text-indigo-300">
                    Forgot password?
                  </a>
                </div>
              </div>

              <Link to="/dashboard" className="block">
                <Button className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white">
                  <Lock className="w-4 h-4 mr-2" />
                  Sign In
                </Button>
              </Link>

              <div className="relative">
                <Separator className="bg-white/10" />
                <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-[#1E293B] px-3 text-sm text-gray-400">
                  Or continue with
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Button variant="outline" className="bg-white/5 border-white/10 text-white hover:bg-white/10">
                  Microsoft SSO
                </Button>
                <Button variant="outline" className="bg-white/5 border-white/10 text-white hover:bg-white/10">
                  LDAP Login
                </Button>
              </div>

              <div className="flex items-center justify-center gap-2 p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                <Shield className="w-4 h-4 text-green-400" />
                <span className="text-sm text-green-400">MFA Verification Enabled</span>
              </div>
            </CardContent>
          </Card>

          <p className="mt-6 text-center text-sm text-gray-400">
            Need help accessing your account?{" "}
            <a href="#" className="text-indigo-400 hover:text-indigo-300">
              Contact IT Support
            </a>
          </p>
        </div>
      </div>

      {/* Right Side - Illustration */}
      <div className="hidden lg:flex flex-1 items-center justify-center p-8 bg-gradient-to-br from-[#111827] to-[#0F172A] border-l border-white/10">
        <div className="max-w-lg w-full">
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-white mb-4">
              Secure AI Infrastructure
            </h2>
            <p className="text-gray-400 text-lg">
              Access your private AI models, knowledge bases, and enterprise tools—all running completely within your organization's network.
            </p>
          </div>

          <div className="space-y-4">
            <Card className="bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border-indigo-500/30 backdrop-blur-xl">
              <CardContent className="p-6 flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                  <Server className="w-6 h-6 text-white" />
                </div>
                <div>
                  <div className="font-semibold text-white mb-1">On-Premise Deployment</div>
                  <div className="text-sm text-gray-300">Fully isolated infrastructure</div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border-cyan-500/30 backdrop-blur-xl">
              <CardContent className="p-6 flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center flex-shrink-0">
                  <Cpu className="w-6 h-6 text-white" />
                </div>
                <div>
                  <div className="font-semibold text-white mb-1">Local AI Models</div>
                  <div className="text-sm text-gray-300">Llama 3, Qwen, Mistral ready</div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-green-500/20 to-emerald-500/20 border-green-500/30 backdrop-blur-xl">
              <CardContent className="p-6 flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center flex-shrink-0">
                  <Database className="w-6 h-6 text-white" />
                </div>
                <div>
                  <div className="font-semibold text-white mb-1">Vector Knowledge Base</div>
                  <div className="text-sm text-gray-300">ChromaDB semantic search</div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 border-purple-500/30 backdrop-blur-xl">
              <CardContent className="p-6 flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center flex-shrink-0">
                  <Network className="w-6 h-6 text-white" />
                </div>
                <div>
                  <div className="font-semibold text-white mb-1">Air-Gapped Ready</div>
                  <div className="text-sm text-gray-300">No external dependencies</div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="mt-8 p-6 rounded-xl bg-white/5 backdrop-blur-xl border border-white/10">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm font-semibold text-white">System Status: Operational</span>
            </div>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-white">99.9%</div>
                <div className="text-xs text-gray-400">Uptime</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-white">5</div>
                <div className="text-xs text-gray-400">Active Models</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-white">128</div>
                <div className="text-xs text-gray-400">Users</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
