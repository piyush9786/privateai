import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import { CheckCircle2, XCircle, Loader2, ShieldAlert, History } from "lucide-react";
import { useAuth } from "../context/AuthContext";

interface Protection {
  name: string;
  active: boolean;
  detail: string;
}

interface SecurityStatus {
  protections: Protection[];
  failed_logins_24h: number;
}

interface AuditEvent {
  id: string;
  user_id: string | null;
  email: string;
  event_type: string;
  ip_address: string | null;
  created_at: string;
}

const EVENT_LABELS: Record<string, { label: string; color: string }> = {
  login_success: { label: "Login", color: "bg-green-500/20 text-green-400 border-green-500/30" },
  login_failed: { label: "Failed login", color: "bg-red-500/20 text-red-400 border-red-500/30" },
  logout: { label: "Logout", color: "bg-white/5 border-white/20 text-gray-300" },
  register: { label: "Account created", color: "bg-indigo-500/20 text-indigo-400 border-indigo-500/30" },
};

export default function SecurityPage() {
  const { user } = useAuth();
  const [status, setStatus] = useState<SecurityStatus | null>(null);
  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAll();
  }, []);

  async function loadAll() {
    try {
      const statusRes = await fetch("/api/security/status").then((r) => r.json());
      setStatus(statusRes);

      const logUrl = user?.role === "admin" ? "/api/security/audit-log/all" : "/api/security/audit-log";
      const logRes = await fetch(logUrl).then((r) => r.json());
      setEvents(logRes.events || []);
    } catch {
      // leave previous state on failure
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="text-center py-24 text-gray-500">
        <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
        Loading security info…
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Security</h1>
        <p className="text-gray-400">
          An honest picture of what's actually protecting this deployment — no invented
          score, no unearned compliance claims.
        </p>
      </div>

      <Card className="bg-amber-500/10 border-amber-500/20">
        <CardContent className="p-4 flex items-start gap-3">
          <ShieldAlert className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-gray-300">
            This is a self-hosted, single-deployment app. Several protections common in
            enterprise SaaS (MFA, TLS, DLP) aren't enabled by default — see below for what's
            real today and what you'd need to add for a more exposed deployment.
          </p>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-4">
        {status?.protections.map((p) => (
          <Card key={p.name} className="bg-[#1E293B]/50 backdrop-blur-xl border-white/10">
            <CardContent className="p-5 flex items-start gap-4">
              {p.active ? (
                <CheckCircle2 className="w-6 h-6 text-green-400 flex-shrink-0 mt-0.5" />
              ) : (
                <XCircle className="w-6 h-6 text-gray-500 flex-shrink-0 mt-0.5" />
              )}
              <div>
                <div className="font-medium text-white mb-1">{p.name}</div>
                <div className="text-sm text-gray-400">{p.detail}</div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="bg-[#1E293B]/50 backdrop-blur-xl border-white/10">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <History className="w-5 h-5 text-indigo-400" />
            {user?.role === "admin" ? "Audit Log — All Accounts" : "Your Activity"}
          </CardTitle>
          <CardDescription className="text-gray-400">
            {status && status.failed_logins_24h > 0
              ? `${status.failed_logins_24h} failed login attempt${status.failed_logins_24h === 1 ? "" : "s"} in the last 24 hours`
              : "No failed login attempts in the last 24 hours"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {events.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-8">No activity recorded yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-white/10 hover:bg-transparent">
                  <TableHead className="text-gray-400">Event</TableHead>
                  <TableHead className="text-gray-400">Email</TableHead>
                  <TableHead className="text-gray-400">IP Address</TableHead>
                  <TableHead className="text-gray-400">When</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {events.map((e) => {
                  const meta = EVENT_LABELS[e.event_type] ?? { label: e.event_type, color: "bg-white/5 border-white/20 text-gray-300" };
                  return (
                    <TableRow key={e.id} className="border-white/10 hover:bg-white/5">
                      <TableCell>
                        <Badge className={meta.color}>{meta.label}</Badge>
                      </TableCell>
                      <TableCell className="text-gray-300">{e.email}</TableCell>
                      <TableCell className="text-gray-500 font-mono text-xs">{e.ip_address ?? "—"}</TableCell>
                      <TableCell className="text-gray-400">{new Date(e.created_at).toLocaleString()}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
