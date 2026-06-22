import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";
import { Bot, Plus, Pencil, Trash2, Loader2, Sparkles } from "lucide-react";

interface AgentPreset {
  id: string;
  name: string;
  description: string;
  system_prompt: string;
  created_at: string;
  updated_at: string;
}

const ICON_COLORS = [
  "from-indigo-500 to-purple-600",
  "from-cyan-500 to-blue-600",
  "from-green-500 to-emerald-600",
  "from-orange-500 to-amber-600",
  "from-pink-500 to-rose-600",
];

export default function AgentsPage() {
  const [agents, setAgents] = useState<AgentPreset[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formName, setFormName] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formPrompt, setFormPrompt] = useState("");
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    loadAgents();
  }, []);

  async function loadAgents() {
    setLoading(true);
    try {
      const r = await fetch("/api/agents");
      const d = await r.json();
      setAgents(d.agents || []);
    } catch {
      // table stays empty on failure
    } finally {
      setLoading(false);
    }
  }

  function openCreateDialog() {
    setEditingId(null);
    setFormName("");
    setFormDescription("");
    setFormPrompt("");
    setFormError(null);
    setDialogOpen(true);
  }

  function openEditDialog(agent: AgentPreset) {
    setEditingId(agent.id);
    setFormName(agent.name);
    setFormDescription(agent.description);
    setFormPrompt(agent.system_prompt);
    setFormError(null);
    setDialogOpen(true);
  }

  async function saveAgent() {
    if (!formName.trim() || !formPrompt.trim()) {
      setFormError("Name and instructions are both required.");
      return;
    }
    setSaving(true);
    setFormError(null);
    try {
      const body = {
        name: formName.trim(),
        description: formDescription.trim(),
        system_prompt: formPrompt.trim(),
      };
      const url = editingId ? `/api/agents/${editingId}` : "/api/agents";
      const method = editingId ? "PUT" : "POST";
      const r = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!r.ok) {
        const d = await r.json();
        setFormError(d.detail || "Could not save this agent.");
        return;
      }
      setDialogOpen(false);
      await loadAgents();
    } catch (e: any) {
      setFormError(e?.message ?? "Could not save this agent.");
    } finally {
      setSaving(false);
    }
  }

  async function deleteAgent(id: string) {
    try {
      await fetch(`/api/agents/${id}`, { method: "DELETE" });
      await loadAgents();
    } catch {
      // leave the card as-is on failure; user can retry
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Agents</h1>
          <p className="text-gray-400">
            Custom instructions you can switch between in chat — same tools and document
            vault every time, different personality or focus.
          </p>
        </div>
        <Button
          onClick={openCreateDialog}
          className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white"
        >
          <Plus className="w-4 h-4 mr-2" />
          New Agent
        </Button>
      </div>

      <Card className="bg-indigo-500/10 border-indigo-500/20">
        <CardContent className="p-4 flex items-start gap-3">
          <Sparkles className="w-5 h-5 text-indigo-400 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-gray-300">
            Every agent here shares the same document vault, memory, and tools — they only
            change the instructions layered on top (tone, focus, response style). Document
            search and memory recall still always work, regardless of which agent you pick.
          </p>
        </CardContent>
      </Card>

      {loading ? (
        <div className="text-center py-12 text-gray-500">
          <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
          Loading agents…
        </div>
      ) : agents.length === 0 ? (
        <Card className="bg-[#1E293B]/50 backdrop-blur-xl border-white/10">
          <CardContent className="p-12 text-center text-gray-500">
            No custom agents yet. The default assistant is used until you create one.
          </CardContent>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 gap-6">
          {agents.map((agent, i) => (
            <Card
              key={agent.id}
              className="bg-[#1E293B]/50 backdrop-blur-xl border-white/10 hover:border-white/20 transition-all"
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div
                      className={`w-12 h-12 rounded-xl bg-gradient-to-br ${ICON_COLORS[i % ICON_COLORS.length]} flex items-center justify-center flex-shrink-0`}
                    >
                      <Bot className="w-6 h-6 text-white" />
                    </div>
                    <div className="min-w-0">
                      <CardTitle className="text-white mb-1">{agent.name}</CardTitle>
                      <CardDescription className="text-gray-400">
                        {agent.description || "No description"}
                      </CardDescription>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="p-3 rounded-lg bg-white/5 border border-white/10">
                  <div className="text-xs text-gray-400 mb-1">Instructions</div>
                  <div className="text-sm text-gray-300 line-clamp-3">{agent.system_prompt}</div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="flex-1 bg-white/5 border-white/10 text-white hover:bg-white/10"
                    onClick={() => openEditDialog(agent)}
                  >
                    <Pencil className="w-4 h-4 mr-2" />
                    Edit
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-gray-400 hover:text-red-400"
                    onClick={() => deleteAgent(agent.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-[#1E293B] border-white/10 text-white max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit agent" : "New agent"}</DialogTitle>
            <DialogDescription className="text-gray-400">
              Define a name and a set of instructions. These layer on top of the default
              assistant behavior — document search and memory still work normally.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="agent-name" className="text-white">Name</Label>
              <Input
                id="agent-name"
                placeholder="e.g. Concise Coder"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                className="bg-white/5 border-white/10 text-white placeholder:text-gray-500"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="agent-desc" className="text-white">Description (optional)</Label>
              <Input
                id="agent-desc"
                placeholder="e.g. Short, code-focused answers"
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                className="bg-white/5 border-white/10 text-white placeholder:text-gray-500"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="agent-prompt" className="text-white">Instructions</Label>
              <Textarea
                id="agent-prompt"
                placeholder="e.g. Always answer in as few words as possible. Prefer code over prose."
                value={formPrompt}
                onChange={(e) => setFormPrompt(e.target.value)}
                rows={5}
                className="bg-white/5 border-white/10 text-white placeholder:text-gray-500"
              />
            </div>
            {formError && <p className="text-sm text-red-400">{formError}</p>}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              className="bg-white/5 border-white/10 text-white hover:bg-white/10"
              onClick={() => setDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              disabled={saving}
              onClick={saveAgent}
              className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              {editingId ? "Save changes" : "Create agent"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
