import { useState, useEffect, useRef, useCallback } from "react";
import { Card } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { ScrollArea } from "../components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import {
  Send,
  Mic,
  Square,
  MessageSquare,
  Bot,
  User,
  Loader2,
  Check,
  Sparkles,
} from "lucide-react";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface ConversationSummary {
  id: string;
  title: string;
  updated_at: string;
}

interface StatusEvent {
  id: string;
  label: string;
  done: boolean;
}

interface MemoryProposal {
  proposalId: string;
  text: string;
  resolved: "pending" | "approved" | "rejected";
}

export default function ChatPage() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [models, setModels] = useState<string[]>(["llama3.2"]);
  const [selectedModel, setSelectedModel] = useState("llama3.2");
  const [isStreaming, setIsStreaming] = useState(false);
  const [statusTrail, setStatusTrail] = useState<StatusEvent[]>([]);
  const [memoryProposal, setMemoryProposal] = useState<MemoryProposal | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [micError, setMicError] = useState<string | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    loadModels();
    loadConversations();
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, statusTrail, memoryProposal]);

  async function loadModels() {
    try {
      const r = await fetch("/api/models");
      const d = await r.json();
      const names = (d.models || []).map((m: { name: string }) => m.name);
      if (names.length) {
        setModels(names);
        setSelectedModel(names[0]);
      }
    } catch {
      // keep default model list on failure
    }
  }

  async function loadConversations() {
    try {
      const r = await fetch("/api/conversations");
      const d = await r.json();
      setConversations(d.conversations || []);
    } catch {
      // ignore, sidebar just stays empty
    }
  }

  async function loadConversation(id: string) {
    try {
      const r = await fetch(`/api/conversations/${id}`);
      const d = await r.json();
      setCurrentConversationId(id);
      setMessages(
        (d.messages || []).map((m: { role: string; content: string }) => ({
          role: m.role as "user" | "assistant",
          content: m.content,
        }))
      );
      setStatusTrail([]);
      setMemoryProposal(null);
    } catch {
      // ignore
    }
  }

  function newConversation() {
    setCurrentConversationId(null);
    setMessages([]);
    setStatusTrail([]);
    setMemoryProposal(null);
  }

  async function ensureConversation(): Promise<string | null> {
    if (currentConversationId) return currentConversationId;
    try {
      const r = await fetch("/api/conversations", { method: "POST" });
      const d = await r.json();
      setCurrentConversationId(d.id);
      return d.id;
    } catch {
      return null;
    }
  }

  const resolveMemoryProposal = useCallback(
    async (proposalId: string, approved: boolean) => {
      setMemoryProposal((prev) =>
        prev ? { ...prev, resolved: approved ? "approved" : "rejected" } : prev
      );
      try {
        await fetch("/api/memory/confirm", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ proposal_id: proposalId, approved }),
        });
      } catch {
        // surfaced visually via resolved state already
      }
    },
    []
  );

  async function sendMessage() {
    const text = input.trim();
    if (!text || isStreaming) return;
    setInput("");
    setMemoryProposal(null);

    const conversationId = await ensureConversation();

    const nextMessages: ChatMessage[] = [...messages, { role: "user", content: text }];
    setMessages(nextMessages);
    setStatusTrail([]);
    setIsStreaming(true);

    let assistantText = "";
    let statusCounter = 0;

    try {
      const resp = await fetch("/api/chat/stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: nextMessages,
          model: selectedModel,
          conversation_id: conversationId,
        }),
      });

      const reader = resp.body!.getReader();
      const decoder = new TextDecoder();
      let buf = "";

      // Insert a placeholder assistant message we'll fill in as tokens arrive
      setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });

        const events = buf.split("\n\n");
        buf = events.pop() ?? "";

        for (const block of events) {
          const lines = block.split("\n");
          let eventType = "message";
          let data = "{}";
          for (const line of lines) {
            if (line.startsWith("event: ")) eventType = line.slice(7).trim();
            if (line.startsWith("data: ")) data = line.slice(6);
          }
          let payload: any;
          try {
            payload = JSON.parse(data);
          } catch {
            continue;
          }

          if (eventType === "status") {
            statusCounter += 1;
            const id = `status-${statusCounter}`;
            setStatusTrail((prev) => [
              ...prev.map((s) => ({ ...s, done: true })),
              { id, label: payload.label, done: false },
            ]);
          } else if (eventType === "memory_proposal") {
            setStatusTrail((prev) => prev.map((s) => ({ ...s, done: true })));
            setMemoryProposal({
              proposalId: payload.proposal_id,
              text: payload.memory_text,
              resolved: "pending",
            });
          } else if (eventType === "media") {
            setStatusTrail((prev) => prev.map((s) => ({ ...s, done: true })));
            assistantText += `\n\n![generated](${payload.url})`;
            setMessages((prev) => {
              const copy = [...prev];
              copy[copy.length - 1] = { role: "assistant", content: assistantText };
              return copy;
            });
          } else if (eventType === "token") {
            setStatusTrail((prev) => prev.map((s) => ({ ...s, done: true })));
            assistantText += payload.text;
            setMessages((prev) => {
              const copy = [...prev];
              copy[copy.length - 1] = { role: "assistant", content: assistantText };
              return copy;
            });
          } else if (eventType === "error") {
            setStatusTrail((prev) => prev.map((s) => ({ ...s, done: true })));
            assistantText = `Error: ${payload.message}`;
            setMessages((prev) => {
              const copy = [...prev];
              copy[copy.length - 1] = { role: "assistant", content: assistantText };
              return copy;
            });
          } else if (eventType === "done") {
            setStatusTrail((prev) => prev.map((s) => ({ ...s, done: true })));
            await loadConversations();
          }
        }
      }
    } catch (e: any) {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: `Error: ${e?.message ?? "request failed"}` },
      ]);
    } finally {
      setIsStreaming(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  async function toggleMic() {
    if (isRecording) {
      mediaRecorderRef.current?.stop();
      setIsRecording(false);
      return;
    }

    setMicError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];
      const recorder = new MediaRecorder(stream, { mimeType: "audio/webm" });

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      recorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        await transcribeAudio(blob);
      };

      recorder.start();
      mediaRecorderRef.current = recorder;
      setIsRecording(true);
    } catch (e: any) {
      setMicError(
        e?.name === "NotAllowedError"
          ? "Microphone access was denied."
          : e?.message ?? "Could not access the microphone."
      );
    }
  }

  async function transcribeAudio(blob: Blob) {
    setIsTranscribing(true);
    setMicError(null);
    try {
      const fd = new FormData();
      fd.append("file", blob, "voice.webm");
      const r = await fetch("/api/voice/transcribe", { method: "POST", body: fd });
      const d = await r.json();
      if (d.status === "ok" && d.text) {
        setInput((prev) => (prev ? `${prev} ${d.text}` : d.text));
      } else {
        setMicError(d.error || "Could not transcribe that recording.");
      }
    } catch (e: any) {
      setMicError(e?.message ?? "Transcription failed.");
    } finally {
      setIsTranscribing(false);
    }
  }

  return (
    <div className="h-[calc(100vh-180px)] flex gap-6">
      {/* Chat History Sidebar */}
      <Card className="w-80 bg-[#1E293B]/50 backdrop-blur-xl border-white/10 flex flex-col">
        <div className="p-4 border-b border-white/10">
          <h3 className="font-semibold text-white mb-2">Chat History</h3>
          <Button
            onClick={newConversation}
            className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white"
          >
            <MessageSquare className="w-4 h-4 mr-2" />
            New Conversation
          </Button>
        </div>
        <ScrollArea className="flex-1 p-2">
          <div className="space-y-1">
            {conversations.length === 0 && (
              <div className="text-xs text-gray-500 p-3">No conversations yet</div>
            )}
            {conversations.map((conv) => (
              <button
                key={conv.id}
                onClick={() => loadConversation(conv.id)}
                className={`w-full p-3 rounded-lg transition-colors text-left ${
                  conv.id === currentConversationId ? "bg-white/10" : "hover:bg-white/5"
                }`}
              >
                <div className="font-medium text-white text-sm mb-1 truncate">
                  {conv.title || "New chat"}
                </div>
                <div className="text-xs text-gray-500">
                  {new Date(conv.updated_at).toLocaleString()}
                </div>
              </button>
            ))}
          </div>
        </ScrollArea>
      </Card>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        <Card className="flex-1 bg-[#1E293B]/50 backdrop-blur-xl border-white/10 flex flex-col">
          {/* Chat Header */}
          <div className="p-4 border-b border-white/10">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-semibold text-white mb-1">AI Assistant</h2>
                <div className="flex items-center gap-2">
                  <div
                    className={`w-2 h-2 rounded-full ${
                      isStreaming ? "bg-amber-400 animate-pulse" : "bg-green-500"
                    }`}
                  ></div>
                  <span className="text-sm text-gray-400">
                    {isStreaming ? "Working…" : "Ready"}
                  </span>
                </div>
              </div>
              <Select value={selectedModel} onValueChange={setSelectedModel}>
                <SelectTrigger className="w-48 bg-white/5 border-white/10 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {models.map((m) => (
                    <SelectItem key={m} value={m}>
                      {m}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Messages */}
          <ScrollArea className="flex-1 p-6">
            <div className="space-y-6 max-w-4xl mx-auto">
              {messages.length === 0 && (
                <div className="text-center text-gray-500 text-sm py-12">
                  Ask anything — I can search your indexed documents, build charts,
                  generate spreadsheets, draw flowcharts, transcribe audio, and
                  remember things about you when you let me.
                </div>
              )}
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex gap-4 ${message.role === "user" ? "justify-end" : ""}`}
                >
                  {message.role === "assistant" && (
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                      <Bot className="w-5 h-5 text-white" />
                    </div>
                  )}

                  <div className={`flex-1 ${message.role === "user" ? "flex justify-end" : ""}`}>
                    <div
                      className={`inline-block max-w-3xl rounded-lg p-4 ${
                        message.role === "user"
                          ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white"
                          : "bg-white/5 border border-white/10 text-white"
                      }`}
                    >
                      <div className="whitespace-pre-wrap">
                        {message.content || (
                          <span className="text-gray-500 italic">…</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {message.role === "user" && (
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center flex-shrink-0">
                      <User className="w-5 h-5 text-white" />
                    </div>
                  )}
                </div>
              ))}

              {memoryProposal && (
                <div className="flex gap-4">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center flex-shrink-0">
                    <Sparkles className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1 max-w-md">
                    <div className="rounded-lg p-4 bg-amber-500/10 border border-amber-500/30">
                      <div className="text-xs uppercase tracking-wide text-amber-400 font-semibold mb-2">
                        Remember this?
                      </div>
                      <div className="text-sm text-gray-200 italic mb-3">
                        {memoryProposal.text}
                      </div>
                      {memoryProposal.resolved === "pending" ? (
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            className="bg-amber-500 hover:bg-amber-600 text-black"
                            onClick={() => resolveMemoryProposal(memoryProposal.proposalId, true)}
                          >
                            Yes, remember
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-white/20 text-gray-300"
                            onClick={() => resolveMemoryProposal(memoryProposal.proposalId, false)}
                          >
                            No
                          </Button>
                        </div>
                      ) : (
                        <div className="text-xs text-gray-400">
                          {memoryProposal.resolved === "approved" ? "Saved to memory." : "Not saved."}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              <div ref={scrollRef} />
            </div>
          </ScrollArea>

          {/* Input Area */}
          <div className="p-4 border-t border-white/10">
            <div className="max-w-4xl mx-auto">
              <div className="flex gap-2">
                <Input
                  placeholder={isRecording ? "Listening…" : "Ask a question about your documents..."}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  disabled={isStreaming}
                  className="bg-white/5 border-white/10 text-white placeholder:text-gray-500"
                />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={toggleMic}
                  disabled={isStreaming || isTranscribing}
                  className={`flex-shrink-0 ${
                    isRecording
                      ? "text-red-400 hover:text-red-300 animate-pulse"
                      : "text-gray-400 hover:text-white"
                  }`}
                  title={isRecording ? "Stop recording" : "Voice input"}
                >
                  {isTranscribing ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : isRecording ? (
                    <Square className="w-5 h-5" />
                  ) : (
                    <Mic className="w-5 h-5" />
                  )}
                </Button>
                <Button
                  onClick={sendMessage}
                  disabled={isStreaming || !input.trim()}
                  className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white flex-shrink-0"
                >
                  {isStreaming ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </Button>
              </div>
              {micError ? (
                <p className="text-xs text-red-400 mt-2">{micError}</p>
              ) : (
                <p className="text-xs text-gray-500 mt-2">
                  Running entirely on-premise — nothing leaves this machine
                </p>
              )}
            </div>
          </div>
        </Card>
      </div>

      {/* Activity Panel (replaces the old static "Sources" mock) */}
      <Card className="w-80 bg-[#1E293B]/50 backdrop-blur-xl border-white/10">
        <div className="p-4 border-b border-white/10">
          <h3 className="font-semibold text-white">Activity</h3>
          <p className="text-xs text-gray-400 mt-1">What the assistant is doing right now</p>
        </div>
        <ScrollArea className="h-[calc(100vh-280px)] p-4">
          {statusTrail.length === 0 && !isStreaming && (
            <div className="text-xs text-gray-500 text-center py-8">
              Tool activity will appear here while the assistant works.
            </div>
          )}
          <div className="space-y-2">
            {statusTrail.map((s) => (
              <div
                key={s.id}
                className="flex items-center gap-3 p-3 rounded-lg bg-white/5 border border-white/10"
              >
                {s.done ? (
                  <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                ) : (
                  <Loader2 className="w-4 h-4 text-indigo-400 animate-spin flex-shrink-0" />
                )}
                <span
                  className={`text-sm ${s.done ? "text-gray-400" : "text-white"}`}
                >
                  {s.label}
                </span>
              </div>
            ))}
          </div>
        </ScrollArea>
      </Card>
    </div>
  );
}
