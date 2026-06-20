import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Progress } from "../components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table";
import {
  Shield,
  Lock,
  AlertTriangle,
  CheckCircle2,
  Eye,
  Server,
  Database,
  Network,
  FileText,
  Activity,
  UserX,
  Key,
  LogIn
} from "lucide-react";

export default function SecurityPage() {
  const securityScore = 98;

  const stats = [
    {
      title: "Security Score",
      value: "98/100",
      subtitle: "Excellent",
      icon: Shield,
      color: "from-green-500 to-emerald-600"
    },
    {
      title: "Failed Logins",
      value: "3",
      subtitle: "Last 24 hours",
      icon: UserX,
      color: "from-orange-500 to-amber-600"
    },
    {
      title: "Active Sessions",
      value: "97",
      subtitle: "Currently active",
      icon: Activity,
      color: "from-indigo-500 to-purple-600"
    },
    {
      title: "Encryption",
      value: "AES-256",
      subtitle: "All data encrypted",
      icon: Lock,
      color: "from-cyan-500 to-blue-600"
    }
  ];

  const securityFeatures = [
    {
      name: "Air-Gapped Deployment",
      status: "enabled",
      description: "System isolated from external networks"
    },
    {
      name: "End-to-End Encryption",
      status: "enabled",
      description: "AES-256 encryption for all data"
    },
    {
      name: "Multi-Factor Authentication",
      status: "enabled",
      description: "2FA required for all users"
    },
    {
      name: "Role-Based Access Control",
      status: "enabled",
      description: "Granular permission management"
    },
    {
      name: "Audit Logging",
      status: "enabled",
      description: "All actions logged and monitored"
    },
    {
      name: "Data Loss Prevention",
      status: "enabled",
      description: "Automated DLP policies active"
    }
  ];

  const auditLogs = [
    {
      timestamp: "2026-06-20 14:32:15",
      user: "admin@company.com",
      action: "User login",
      ip: "192.168.1.45",
      status: "success",
      icon: LogIn
    },
    {
      timestamp: "2026-06-20 14:28:42",
      user: "sarah.chen@company.com",
      action: "Document accessed",
      ip: "192.168.1.87",
      status: "success",
      icon: FileText
    },
    {
      timestamp: "2026-06-20 14:15:33",
      user: "unknown@external.com",
      action: "Failed login attempt",
      ip: "203.0.113.42",
      status: "blocked",
      icon: UserX
    },
    {
      timestamp: "2026-06-20 14:08:19",
      user: "m.rodriguez@company.com",
      action: "Model deployed",
      ip: "192.168.1.92",
      status: "success",
      icon: Server
    },
    {
      timestamp: "2026-06-20 13:55:27",
      user: "emily.j@company.com",
      action: "Knowledge base updated",
      ip: "192.168.1.103",
      status: "success",
      icon: Database
    },
    {
      timestamp: "2026-06-20 13:42:11",
      user: "unknown@external.com",
      action: "Failed login attempt",
      ip: "198.51.100.89",
      status: "blocked",
      icon: UserX
    }
  ];

  const accessReports = [
    { resource: "HR Documents", accesses: 1247, department: "HR" },
    { resource: "Finance Reports", accesses: 892, department: "Finance" },
    { resource: "IT Knowledge Base", accesses: 2341, department: "IT" },
    { resource: "Legal Contracts", accesses: 567, department: "Legal" }
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Security Center</h1>
        <p className="text-gray-400">Monitor security status and audit logs</p>
      </div>

      {/* Security Score */}
      <Card className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 border-green-500/30 backdrop-blur-xl">
        <CardContent className="p-8">
          <div className="flex items-center gap-8">
            <div className="relative">
              <div className="w-32 h-32 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
                <div className="w-28 h-28 rounded-full bg-[#0F172A] flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-4xl font-bold text-white">{securityScore}</div>
                    <div className="text-sm text-gray-400">/ 100</div>
                  </div>
                </div>
              </div>
              <div className="absolute -top-2 -right-2 w-12 h-12 rounded-full bg-green-500 flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6 text-white" />
              </div>
            </div>
            <div className="flex-1">
              <h3 className="text-2xl font-bold text-white mb-2">Excellent Security Posture</h3>
              <p className="text-gray-300 mb-4">
                Your platform maintains enterprise-grade security standards with all critical protections active.
              </p>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-green-400">
                  <CheckCircle2 className="w-4 h-4" />
                  <span className="text-sm">All security features enabled</span>
                </div>
                <div className="flex items-center gap-2 text-green-400">
                  <CheckCircle2 className="w-4 h-4" />
                  <span className="text-sm">No critical vulnerabilities detected</span>
                </div>
                <div className="flex items-center gap-2 text-green-400">
                  <CheckCircle2 className="w-4 h-4" />
                  <span className="text-sm">Compliance requirements met</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid md:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <Card key={index} className="bg-[#1E293B]/50 backdrop-blur-xl border-white/10">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${stat.color} flex items-center justify-center`}>
                  <stat.icon className="w-6 h-6 text-white" />
                </div>
              </div>
              <div className="space-y-1">
                <div className="text-sm text-gray-400">{stat.title}</div>
                <div className="text-3xl font-bold text-white">{stat.value}</div>
                <div className="text-xs text-gray-500">{stat.subtitle}</div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Security Features */}
      <Card className="bg-[#1E293B]/50 backdrop-blur-xl border-white/10">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Shield className="w-5 h-5 text-green-400" />
            Security Features Status
          </CardTitle>
          <CardDescription className="text-gray-400">
            Active security protections and compliance measures
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4">
            {securityFeatures.map((feature, index) => (
              <div
                key={index}
                className="p-4 rounded-lg bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-500/20"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="font-semibold text-white">{feature.name}</div>
                  <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                    <CheckCircle2 className="w-3 h-3 mr-1" />
                    {feature.status}
                  </Badge>
                </div>
                <p className="text-sm text-gray-400">{feature.description}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Audit Logs */}
      <Card className="bg-[#1E293B]/50 backdrop-blur-xl border-white/10">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Eye className="w-5 h-5 text-indigo-400" />
            Audit Logs
          </CardTitle>
          <CardDescription className="text-gray-400">
            Recent security events and user actions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="border-white/10 hover:bg-transparent">
                <TableHead className="text-gray-400">Timestamp</TableHead>
                <TableHead className="text-gray-400">User</TableHead>
                <TableHead className="text-gray-400">Action</TableHead>
                <TableHead className="text-gray-400">IP Address</TableHead>
                <TableHead className="text-gray-400">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {auditLogs.map((log, index) => (
                <TableRow key={index} className="border-white/10 hover:bg-white/5">
                  <TableCell className="text-gray-400 font-mono text-sm">
                    {log.timestamp}
                  </TableCell>
                  <TableCell className="text-white">{log.user}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <log.icon className="w-4 h-4 text-gray-400" />
                      <span className="text-white">{log.action}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-gray-400 font-mono text-sm">{log.ip}</TableCell>
                  <TableCell>
                    {log.status === 'success' ? (
                      <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                        Success
                      </Badge>
                    ) : (
                      <Badge className="bg-red-500/20 text-red-400 border-red-500/30">
                        Blocked
                      </Badge>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Access Reports */}
      <Card className="bg-[#1E293B]/50 backdrop-blur-xl border-white/10">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Key className="w-5 h-5 text-cyan-400" />
            Access Reports
          </CardTitle>
          <CardDescription className="text-gray-400">
            Resource access statistics by department
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {accessReports.map((report, index) => (
              <div key={index} className="p-4 rounded-lg bg-white/5 border border-white/10">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <div className="font-semibold text-white mb-1">{report.resource}</div>
                    <Badge variant="outline" className="bg-white/5 border-white/20 text-gray-300">
                      {report.department}
                    </Badge>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-white">{report.accesses.toLocaleString()}</div>
                    <div className="text-xs text-gray-400">accesses</div>
                  </div>
                </div>
                <Progress value={(report.accesses / 2341) * 100} className="h-2" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Compliance Badges */}
      <div className="grid md:grid-cols-4 gap-6">
        {[
          { name: "Secure", icon: Shield, color: "from-green-500 to-emerald-600" },
          { name: "Compliant", icon: CheckCircle2, color: "from-blue-500 to-cyan-600" },
          { name: "Air-Gapped", icon: Network, color: "from-purple-500 to-pink-600" },
          { name: "Internal Only", icon: Lock, color: "from-indigo-500 to-purple-600" }
        ].map((badge, index) => (
          <Card key={index} className="bg-gradient-to-br from-white/5 to-white/10 border-white/20 backdrop-blur-xl">
            <CardContent className="p-6 text-center">
              <div className={`w-16 h-16 rounded-full bg-gradient-to-br ${badge.color} flex items-center justify-center mx-auto mb-3`}>
                <badge.icon className="w-8 h-8 text-white" />
              </div>
              <div className="font-bold text-white text-lg">{badge.name}</div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
