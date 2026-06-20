import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Badge } from "../components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table";
import { Avatar, AvatarFallback } from "../components/ui/avatar";
import {
  Users,
  UserPlus,
  Search,
  Shield,
  Edit,
  Ban,
  RotateCcw,
  Crown,
  User,
  Eye
} from "lucide-react";

export default function UsersPage() {
  const [searchQuery, setSearchQuery] = useState("");

  const stats = [
    {
      title: "Total Users",
      value: "128",
      change: "+12 this month",
      icon: Users,
      color: "from-indigo-500 to-purple-600"
    },
    {
      title: "Active Users",
      value: "97",
      change: "75.8% active",
      icon: User,
      color: "from-green-500 to-emerald-600"
    },
    {
      title: "Admins",
      value: "8",
      change: "6.3% of users",
      icon: Crown,
      color: "from-purple-500 to-pink-600"
    },
    {
      title: "Disabled",
      value: "5",
      change: "3.9% disabled",
      icon: Ban,
      color: "from-red-500 to-orange-600"
    }
  ];

  const roles = [
    { name: "Super Admin", color: "from-red-500 to-pink-600", badge: "bg-red-500/20 text-red-400 border-red-500/30" },
    { name: "Admin", color: "from-purple-500 to-violet-600", badge: "bg-purple-500/20 text-purple-400 border-purple-500/30" },
    { name: "Manager", color: "from-blue-500 to-cyan-600", badge: "bg-blue-500/20 text-blue-400 border-blue-500/30" },
    { name: "Employee", color: "from-green-500 to-emerald-600", badge: "bg-green-500/20 text-green-400 border-green-500/30" },
    { name: "Viewer", color: "from-gray-500 to-slate-600", badge: "bg-gray-500/20 text-gray-400 border-gray-500/30" }
  ];

  const users = [
    {
      name: "Admin User",
      email: "admin@company.com",
      department: "IT",
      role: "Super Admin",
      lastLogin: "2 min ago",
      status: "active",
      avatar: "AD"
    },
    {
      name: "Sarah Chen",
      email: "sarah.chen@company.com",
      department: "HR",
      role: "Admin",
      lastLogin: "23 min ago",
      status: "active",
      avatar: "SC"
    },
    {
      name: "Michael Rodriguez",
      email: "m.rodriguez@company.com",
      department: "Finance",
      role: "Manager",
      lastLogin: "1 hour ago",
      status: "active",
      avatar: "MR"
    },
    {
      name: "Emily Johnson",
      email: "emily.j@company.com",
      department: "Sales",
      role: "Employee",
      lastLogin: "2 hours ago",
      status: "active",
      avatar: "EJ"
    },
    {
      name: "David Kim",
      email: "david.kim@company.com",
      department: "IT",
      role: "Manager",
      lastLogin: "3 hours ago",
      status: "active",
      avatar: "DK"
    },
    {
      name: "Jessica Williams",
      email: "j.williams@company.com",
      department: "Legal",
      role: "Employee",
      lastLogin: "1 day ago",
      status: "active",
      avatar: "JW"
    },
    {
      name: "Robert Taylor",
      email: "r.taylor@company.com",
      department: "R&D",
      role: "Manager",
      lastLogin: "2 days ago",
      status: "disabled",
      avatar: "RT"
    },
    {
      name: "Amanda Martinez",
      email: "a.martinez@company.com",
      department: "Marketing",
      role: "Employee",
      lastLogin: "5 hours ago",
      status: "active",
      avatar: "AM"
    }
  ];

  const getRoleBadge = (role: string) => {
    const roleConfig = roles.find(r => r.name === role);
    if (!roleConfig) return null;
    return <Badge className={roleConfig.badge}>{role}</Badge>;
  };

  const getStatusBadge = (status: string) => {
    if (status === 'active') {
      return (
        <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
          <div className="w-1.5 h-1.5 bg-green-500 rounded-full mr-1.5 animate-pulse"></div>
          Active
        </Badge>
      );
    }
    return <Badge className="bg-red-500/20 text-red-400 border-red-500/30">Disabled</Badge>;
  };

  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.department.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">User Management</h1>
          <p className="text-gray-400">Manage user access and permissions</p>
        </div>
        <Button className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white">
          <UserPlus className="w-4 h-4 mr-2" />
          Add User
        </Button>
      </div>

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
                <div className="text-xs text-gray-500">{stat.change}</div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Roles Overview */}
      <Card className="bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border-indigo-500/20 backdrop-blur-xl">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Shield className="w-5 h-5 text-indigo-400" />
            User Roles & Permissions
          </CardTitle>
          <CardDescription className="text-gray-400">
            Role hierarchy and access levels
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-5 gap-4">
            {roles.map((role, index) => (
              <div
                key={index}
                className="p-4 rounded-lg bg-white/5 border border-white/10 hover:border-white/20 transition-all text-center"
              >
                <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${role.color} flex items-center justify-center mx-auto mb-3`}>
                  <Shield className="w-6 h-6 text-white" />
                </div>
                <div className="font-semibold text-white mb-1">{role.name}</div>
                <div className="text-xs text-gray-400">Full access level</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card className="bg-[#1E293B]/50 backdrop-blur-xl border-white/10">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-white">All Users</CardTitle>
              <CardDescription className="text-gray-400">
                {filteredUsers.length} users in your organization
              </CardDescription>
            </div>
            <div className="relative w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search users..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-gray-500"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="border-white/10 hover:bg-transparent">
                <TableHead className="text-gray-400">User</TableHead>
                <TableHead className="text-gray-400">Department</TableHead>
                <TableHead className="text-gray-400">Role</TableHead>
                <TableHead className="text-gray-400">Last Login</TableHead>
                <TableHead className="text-gray-400">Status</TableHead>
                <TableHead className="text-gray-400 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map((user, index) => (
                <TableRow key={index} className="border-white/10 hover:bg-white/5">
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-3">
                      <Avatar className="w-10 h-10">
                        <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white text-sm">
                          {user.avatar}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="text-white font-medium">{user.name}</div>
                        <div className="text-sm text-gray-400">{user.email}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="bg-white/5 border-white/20 text-gray-300">
                      {user.department}
                    </Badge>
                  </TableCell>
                  <TableCell>{getRoleBadge(user.role)}</TableCell>
                  <TableCell className="text-gray-400">{user.lastLogin}</TableCell>
                  <TableCell>{getStatusBadge(user.status)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white">
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white">
                        <Edit className="w-4 h-4" />
                      </Button>
                      {user.status === 'active' ? (
                        <Button variant="ghost" size="icon" className="text-gray-400 hover:text-orange-400">
                          <Ban className="w-4 h-4" />
                        </Button>
                      ) : (
                        <Button variant="ghost" size="icon" className="text-gray-400 hover:text-green-400">
                          <RotateCcw className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
