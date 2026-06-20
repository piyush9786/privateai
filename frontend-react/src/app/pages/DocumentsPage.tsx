import { useState, useEffect, useRef, useCallback } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Badge } from "../components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import {
  Upload,
  FileText,
  Search,
  Trash2,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Layers,
} from "lucide-react";

interface DocumentRow {
  id: string;
  filename: string;
  file_type: string;
  size_bytes: number;
  chunk_count: number;
  status: "indexed" | "unsupported" | "failed" | "empty";
  error_message: string | null;
  uploaded_at: string;
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function fileIcon(fileType: string): string {
  if (fileType === ".pdf") return "📄";
  if (fileType === ".docx" || fileType === ".doc") return "📝";
  if (fileType === ".xlsx" || fileType === ".xls" || fileType === ".csv") return "📊";
  if (fileType === ".txt" || fileType === ".md") return "📃";
  return "📁";
}

export default function DocumentsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [documents, setDocuments] = useState<DocumentRow[]>([]);
  const [totalChunks, setTotalChunks] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadDocuments();
    loadRagInfo();
  }, []);

  async function loadDocuments() {
    try {
      const r = await fetch("/api/documents");
      const d = await r.json();
      setDocuments(d.documents || []);
    } catch {
      // table just stays empty on failure
    }
  }

  async function loadRagInfo() {
    try {
      const r = await fetch("/api/rag/info");
      const d = await r.json();
      setTotalChunks(d.documents || 0);
    } catch {
      // stat card stays at 0
    }
  }

  async function uploadFile(file: File) {
    setIsUploading(true);
    setUploadError(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const r = await fetch("/api/upload", { method: "POST", body: fd });
      const d = await r.json();
      if (d.status === "unsupported") {
        setUploadError(d.message);
      } else if (!r.ok) {
        setUploadError(d.detail || "Upload failed");
      }
      await loadDocuments();
      await loadRagInfo();
    } catch (e: any) {
      setUploadError(e?.message ?? "Upload failed");
    } finally {
      setIsUploading(false);
    }
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) uploadFile(file);
    e.target.value = "";
  }

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) uploadFile(file);
  }, []);

  async function deleteDocument(id: string) {
    try {
      await fetch(`/api/documents/${id}`, { method: "DELETE" });
      await loadDocuments();
      await loadRagInfo();
    } catch {
      // leave the row as-is on failure; user can retry
    }
  }

  const filteredDocuments = documents.filter(
    (doc) =>
      doc.filename.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.file_type.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const indexedCount = documents.filter((d) => d.status === "indexed").length;
  const problemCount = documents.filter(
    (d) => d.status === "unsupported" || d.status === "failed" || d.status === "empty"
  ).length;

  function statusBadge(doc: DocumentRow) {
    if (doc.status === "indexed") {
      return (
        <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
          <CheckCircle2 className="w-3 h-3 mr-1" />
          Indexed
        </Badge>
      );
    }
    if (doc.status === "empty") {
      return (
        <Badge className="bg-gray-500/20 text-gray-400 border-gray-500/30">
          No text found
        </Badge>
      );
    }
    return (
      <Badge
        className="bg-red-500/20 text-red-400 border-red-500/30"
        title={doc.error_message ?? undefined}
      >
        <AlertCircle className="w-3 h-3 mr-1" />
        {doc.status === "unsupported" ? "Unsupported" : "Failed"}
      </Badge>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Document Management</h1>
        <p className="text-gray-400">Upload documents to make them searchable in chat</p>
      </div>

      {/* Stats */}
      <div className="grid md:grid-cols-3 gap-6">
        <Card className="bg-[#1E293B]/50 backdrop-blur-xl border-white/10">
          <CardContent className="p-6">
            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center mb-4">
              <FileText className="w-6 h-6 text-white" />
            </div>
            <div className="text-sm text-gray-400">Total Uploads</div>
            <div className="text-3xl font-bold text-white">{documents.length}</div>
          </CardContent>
        </Card>
        <Card className="bg-[#1E293B]/50 backdrop-blur-xl border-white/10">
          <CardContent className="p-6">
            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center mb-4">
              <Layers className="w-6 h-6 text-white" />
            </div>
            <div className="text-sm text-gray-400">Indexed Chunks in the Vault</div>
            <div className="text-3xl font-bold text-white">{totalChunks}</div>
          </CardContent>
        </Card>
        <Card className="bg-[#1E293B]/50 backdrop-blur-xl border-white/10">
          <CardContent className="p-6">
            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center mb-4">
              <AlertCircle className="w-6 h-6 text-white" />
            </div>
            <div className="text-sm text-gray-400">Needs Attention</div>
            <div className="text-3xl font-bold text-white">{problemCount}</div>
          </CardContent>
        </Card>
      </div>

      {/* Upload Area */}
      <Card
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragOver(true);
        }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={handleDrop}
        className={`bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border-dashed transition-colors ${
          isDragOver ? "border-indigo-400" : "border-indigo-500/20"
        } backdrop-blur-xl`}
      >
        <CardContent className="p-8">
          <div className="flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center mb-4">
              {isUploading ? (
                <Loader2 className="w-8 h-8 text-white animate-spin" />
              ) : (
                <Upload className="w-8 h-8 text-white" />
              )}
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">
              {isUploading ? "Uploading and indexing…" : "Upload Documents"}
            </h3>
            <p className="text-gray-400 mb-4 max-w-md">
              Drag and drop a file here or click to browse
            </p>
            <div className="flex flex-wrap gap-2 justify-center mb-4">
              <Badge variant="outline" className="bg-white/5 border-white/20 text-gray-300">PDF</Badge>
              <Badge variant="outline" className="bg-white/5 border-white/20 text-gray-300">DOCX</Badge>
              <Badge variant="outline" className="bg-white/5 border-white/20 text-gray-300">TXT / MD</Badge>
              <Badge variant="outline" className="bg-white/5 border-white/20 text-gray-300">XLSX</Badge>
              <Badge variant="outline" className="bg-white/5 border-white/20 text-gray-300">CSV</Badge>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              accept=".pdf,.docx,.doc,.txt,.md,.xlsx,.xls,.csv"
              onChange={handleFileSelect}
            />
            <Button
              disabled={isUploading}
              onClick={() => fileInputRef.current?.click()}
              className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white"
            >
              <Upload className="w-4 h-4 mr-2" />
              Select File
            </Button>
            {uploadError && (
              <p className="text-sm text-red-400 mt-3">{uploadError}</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Documents Table */}
      <Card className="bg-[#1E293B]/50 backdrop-blur-xl border-white/10">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-white">All Documents</CardTitle>
              <CardDescription className="text-gray-400">
                {filteredDocuments.length} of {documents.length} uploads
                {indexedCount > 0 && ` · ${indexedCount} indexed`}
              </CardDescription>
            </div>
            <div className="relative w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search documents..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-gray-500"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {documents.length === 0 ? (
            <div className="text-center text-gray-500 text-sm py-12">
              No documents uploaded yet. Upload one above to make it searchable in chat.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-white/10 hover:bg-transparent">
                  <TableHead className="text-gray-400">Name</TableHead>
                  <TableHead className="text-gray-400">Type</TableHead>
                  <TableHead className="text-gray-400">Uploaded</TableHead>
                  <TableHead className="text-gray-400">Size</TableHead>
                  <TableHead className="text-gray-400">Status</TableHead>
                  <TableHead className="text-gray-400">Chunks</TableHead>
                  <TableHead className="text-gray-400 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDocuments.map((doc) => (
                  <TableRow key={doc.id} className="border-white/10 hover:bg-white/5">
                    <TableCell className="font-medium text-white">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{fileIcon(doc.file_type)}</span>
                        <span className="truncate max-w-xs">{doc.filename}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="bg-white/5 border-white/20 text-gray-300">
                        {doc.file_type.replace(".", "").toUpperCase()}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-gray-400">
                      {new Date(doc.uploaded_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-gray-400">{formatSize(doc.size_bytes)}</TableCell>
                    <TableCell>{statusBadge(doc)}</TableCell>
                    <TableCell className="text-gray-400">{doc.chunk_count}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-gray-400 hover:text-red-400"
                        onClick={() => deleteDocument(doc.id)}
                        title="Remove from the vault"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
