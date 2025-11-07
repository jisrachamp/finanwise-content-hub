import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Shield, UserCog, User, Plus } from "lucide-react";
import { toast } from "sonner";

const users = [
  { id: 1, name: "María González", email: "maria@finansmart.mx", role: "Administrator", status: "Active", lastLogin: "2025-01-15 14:30" },
  { id: 2, name: "Carlos Ruiz", email: "carlos@finansmart.mx", role: "Editor", status: "Active", lastLogin: "2025-01-15 09:15" },
  { id: 3, name: "Ana López", email: "ana@finansmart.mx", role: "Author", status: "Active", lastLogin: "2025-01-14 16:45" },
  { id: 4, name: "Juan Pérez", email: "juan@finansmart.mx", role: "Analyst", status: "Active", lastLogin: "2025-01-15 11:20" },
  { id: 5, name: "Sofia Martínez", email: "sofia@finansmart.mx", role: "Editor", status: "Inactive", lastLogin: "2024-12-20 10:30" },
];

const roleIcons: Record<string, any> = {
  "Administrator": Shield,
  "Editor": UserCog,
  "Author": User,
  "Analyst": User,
};

const roleColors: Record<string, string> = {
  "Administrator": "bg-primary text-primary-foreground",
  "Editor": "bg-secondary text-secondary-foreground",
  "Author": "bg-muted text-muted-foreground",
  "Analyst": "bg-info/20 text-info border-info",
};

const Users = () => {
  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-foreground">User Management</h1>
          <p className="text-muted-foreground mt-1">Manage team members and permissions</p>
        </div>
        <Button className="gap-2" onClick={() => toast.success("Add user modal would open here")}>
          <Plus className="h-4 w-4" />
          Add User
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">5</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">4</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Administrators</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Editors</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Team Members</CardTitle>
          <CardDescription>Manage user accounts and role assignments</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Last Login</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => {
                  const RoleIcon = roleIcons[user.role];
                  return (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback className="bg-primary/10 text-primary text-xs">
                              {getInitials(user.name)}
                            </AvatarFallback>
                          </Avatar>
                          <span className="font-medium">{user.name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{user.email}</TableCell>
                      <TableCell>
                        <Badge className={roleColors[user.role]}>
                          <RoleIcon className="h-3 w-3 mr-1" />
                          {user.role}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={user.status === "Active" ? "default" : "secondary"}>
                          {user.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">{user.lastLogin}</TableCell>
                      <TableCell className="text-right">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => toast.success(`Editing ${user.name}`)}
                        >
                          Edit
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Users;
