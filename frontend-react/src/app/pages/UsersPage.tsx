import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";
import { Users as UsersIcon, Trash2, Eye, Loader2, ShieldCheck, FileText, MessageSquare, Bot, Database, Brain } from "lucide-react";
import { useAuth } from "../context/AuthContext";

interface AdminUser {
  id: string;
  email: string;
  display_name: string;
  role: "admin" | "user";
  created_at: string;
}

interface UserOverview {
  user: AdminUser;
  conversation_count: number;
  document_count: number;
  agent_count: number;
  indexed_chunks: number;
  memory_count: number;
}

export default function UsersPage() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState<UserOverview | null>(null);
  const [overviewLoading, setOverviewLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    loadUsers();
  }, []);

  async function loadUsers() {
    setLoading(true);
    try {
      const r = await fetch("/api/admin/users", { credentials: "include" });
      const d = await r.json();
      setUsers(d.users || []);
    } catch {
      // table stays empty on failure
    } finally {
      setLoading(false);
    }
  }

  async function viewOverview(userId: string) {
    setDialogOpen(true);
    setOverviewLoading(true);
    setOverview(null);
    try {
      const r = await fetch(`/api/admin/users/${userId}/overview`, { credentials: "include" });
      const d = await r.json();
      setOverview(d);
    } catch {
      // dialog just shows nothing on failure
    } finally {
      setOverviewLoading(false);
    }
  }

  async function deleteUser(userId: string) {
    setDeletingId(userId);
    try {
      await fetch(`/api/admin/users/${userId}`, { method: "DELETE", credentials: "include" });
      await loadUsers();
    } catch {
      // leave the row as-is on failure; admin can retry
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Users</h1>
        <p className="text-gray-400">
          Every registered account on this deployment. As an admin, you can view a
          summary of any user's data or remove their account.
        </p>
      </div>

      <Card className="bg-amber-500/10 border-amber-500/20">
        <CardContent className="p-4 flex items-start gap-3">
          <ShieldCheck className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-gray-300">
            Admin access shows counts and summaries only — not the actual content of
            anyone's documents, chats, or memories. This keeps account management
            possible without making every private conversation casually browsable.
          </p>
        </CardContent>
      </Card>

      <Card className="bg-[#1E293B]/50 backdrop-blur-xl border-white/10">
        <CardHeader>
          <CardTitle className="text-white">All Accounts</CardTitle>
          <CardDescription className="text-gray-400">{users.length} registered</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-12 text-gray-500">
              <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
              Loading users…
            </div>
          ) : (
            <div className="space-y-3">
              {users.map((u) => (
                <div
                  key={u.id}
                  className="flex items-center justify-between p-4 rounded-lg bg-white/5 border border-white/10"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-sm font-medium flex-shrink-0">
                      {u.display_name.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div className="font-medium text-white flex items-center gap-2">
                        {u.display_name}
                        {u.id === currentUser?.id && (
                          <Badge variant="outline" className="bg-white/5 border-white/20 text-gray-400 text-xs">
                            You
                          </Badge>
                        )}
                      </div>
                      <div className="text-sm text-gray-400">{u.email}</div>
                    </div>
                    <Badge
                      className={
                        u.role === "admin"
                          ? "bg-indigo-500/20 text-indigo-400 border-indigo-500/30"
                          : "bg-white/5 border-white/20 text-gray-300"
                      }
                    >
                      {u.role === "admin" ? "Admin" : "User"}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="bg-white/5 border-white/10 text-white hover:bg-white/10"
                      onClick={() => viewOverview(u.id)}
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      View
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-gray-400 hover:text-red-400"
                      disabled={u.id === currentUser?.id || deletingId === u.id}
                      onClick={() => deleteUser(u.id)}
                      title={u.id === currentUser?.id ? "You can't delete your own account here" : "Delete account"}
                    >
                      {deletingId === u.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-[#1E293B] border-white/10 text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UsersIcon className="w-5 h-5 text-indigo-400" />
              {overview?.user.display_name ?? "Loading…"}
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              {overview?.user.email}
            </DialogDescription>
          </DialogHeader>
          {overviewLoading ? (
            <div className="py-8 text-center">
              <Loader2 className="w-6 h-6 animate-spin mx-auto text-gray-400" />
            </div>
          ) : overview ? (
            <div className="grid grid-cols-2 gap-3 py-2">
              <div className="p-3 rounded-lg bg-white/5 border border-white/10 flex items-center gap-3">
                <MessageSquare className="w-5 h-5 text-cyan-400" />
                <div>
                  <div className="text-lg font-bold text-white">{overview.conversation_count}</div>
                  <div className="text-xs text-gray-400">Conversations</div>
                </div>
              </div>
              <div className="p-3 rounded-lg bg-white/5 border border-white/10 flex items-center gap-3">
                <FileText className="w-5 h-5 text-blue-400" />
                <div>
                  <div className="text-lg font-bold text-white">{overview.document_count}</div>
                  <div className="text-xs text-gray-400">Documents</div>
                </div>
              </div>
              <div className="p-3 rounded-lg bg-white/5 border border-white/10 flex items-center gap-3">
                <Database className="w-5 h-5 text-purple-400" />
                <div>
                  <div className="text-lg font-bold text-white">{overview.indexed_chunks}</div>
                  <div className="text-xs text-gray-400">Indexed Chunks</div>
                </div>
              </div>
              <div className="p-3 rounded-lg bg-white/5 border border-white/10 flex items-center gap-3">
                <Bot className="w-5 h-5 text-orange-400" />
                <div>
                  <div className="text-lg font-bold text-white">{overview.agent_count}</div>
                  <div className="text-xs text-gray-400">Agents</div>
                </div>
              </div>
              <div className="p-3 rounded-lg bg-white/5 border border-white/10 flex items-center gap-3 col-span-2">
                <Brain className="w-5 h-5 text-pink-400" />
                <div>
                  <div className="text-lg font-bold text-white">{overview.memory_count}</div>
                  <div className="text-xs text-gray-400">Stored Memories</div>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-500 py-4">Could not load this user's overview.</p>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
