import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Pencil, Check, X, Eye } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { ExcelImport, ColumnDef } from "./ExcelImport";
import { useRole, type ImpersonatedUser } from "@/contexts/RoleContext";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

const USER_COLUMNS: ColumnDef[] = [
  { key: "email", label: "Email", aliases: ["Email", "e-mail", "mail"], required: true },
  { key: "name", label: "Name", aliases: ["Name", "full_name", "fullName"] },
  { key: "role", label: "Role", aliases: ["Role", "user_role"] },
  { key: "department", label: "Department", aliases: ["Department", "dept"] },
  { key: "password", label: "Password", aliases: ["Password", "pw"], required: true },
];

const ALL_ROLE_OPTIONS = ["BinSight Admin", "Hospital Admin", "Hospital Manager", "Department User"];
const HOSPITAL_ROLE_OPTIONS = ["Hospital Admin", "Hospital Manager", "Department User"];

interface UserRow {
  id: string;
  email: string;
  name: string | null;
  role: string | null;
  department: string | null;
}

interface UserFormProps {
  hospitalId: string;
  hospitalName: string;
}

export function UserForm({ hospitalId, hospitalName }: UserFormProps) {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ email: "", name: "", role: "Department User", department: "", password: "" });
  const [submitting, setSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ name: "", role: "", department: "" });
  const { actualRole, activeRole, startImpersonation } = useRole();
  const navigate = useNavigate();
  const ROLE_OPTIONS = activeRole === "BinSight Admin" ? ALL_ROLE_OPTIONS : HOSPITAL_ROLE_OPTIONS;

  const invokeEdgeFunction = async (method: string, body?: any, params?: Record<string, string>) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error("Not authenticated");

    const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
    const url = new URL(`https://${projectId}.supabase.co/functions/v1/admin-users`);
    if (params) {
      Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
    }

    const res = await fetch(url.toString(), {
      method,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    const json = await res.json();
    if (!res.ok) throw new Error(json.error || "Request failed");
    return json;
  };

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const data = await invokeEdgeFunction("GET", undefined, { hospital: hospitalId });
      setUsers(data ?? []);
    } catch (err: any) {
      console.error("Failed to fetch users:", err);
      setUsers([]);
    }
    setLoading(false);
  };

  useEffect(() => { fetchUsers(); }, [hospitalId]);

  const handleAdd = async () => {
    if (!form.email || !form.password) {
      toast({ title: "Email and password are required", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    try {
      await invokeEdgeFunction("POST", {
        email: form.email,
        password: form.password,
        name: form.name || null,
        role: form.role || "Department User",
        department: form.department || null,
        hospital: hospitalId,
        hospital_name: hospitalName,
      });
      toast({ title: "User added" });
      setForm({ email: "", name: "", role: "Department User", department: "", password: "" });
      fetchUsers();
    } catch (err: any) {
      toast({ title: "Failed to add user", description: err.message, variant: "destructive" });
    }
    setSubmitting(false);
  };

  const startEdit = (user: UserRow) => {
    setEditingId(user.id);
    setEditForm({ name: user.name ?? "", role: user.role ?? "Department User", department: user.department ?? "" });
  };

  const saveEdit = async () => {
    if (!editingId) return;
    try {
      await invokeEdgeFunction("PATCH", {
        user_id: editingId,
        name: editForm.name || null,
        role: editForm.role || "Department User",
        department: editForm.department || null,
      });
      toast({ title: "User updated" });
      setEditingId(null);
      fetchUsers();
    } catch (err: any) {
      toast({ title: "Failed to update user", description: err.message, variant: "destructive" });
    }
  };

  const handleViewAs = (u: UserRow) => {
    const target: ImpersonatedUser = {
      email: u.email,
      name: u.name,
      role: u.role,
      department: u.department,
      hospital: hospitalId,
      hospitalName: hospitalName,
    };
    startImpersonation(target);
    navigate("/");
  };

  const handleImportUsers = async (rows: Record<string, string>[]) => {
    const userRows = rows
      .filter((r) => r.email && r.password)
      .map((r) => ({
        email: r.email,
        password: r.password,
        name: r.name || null,
        role: r.role || "Department User",
        department: r.department || null,
        hospital: hospitalId,
        hospital_name: hospitalName,
      }));

    try {
      const result = await invokeEdgeFunction("PUT", { users: userRows });
      fetchUsers();
      return { success: result.success, failed: result.failed };
    } catch {
      return { success: 0, failed: rows.length };
    }
  };

  const canViewAs = actualRole === "BinSight Admin";

  return (
    <div className="space-y-6">
      <ExcelImport title="Import Users from Excel" columns={USER_COLUMNS} onImport={handleImportUsers} />
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Add User</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-5 gap-3">
            <Input placeholder="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            <Input placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <Select value={form.role} onValueChange={(v) => setForm({ ...form, role: v })}>
              <SelectTrigger><SelectValue placeholder="Role" /></SelectTrigger>
              <SelectContent>
                {ROLE_OPTIONS.map((r) => (
                  <SelectItem key={r} value={r} className="capitalize">{r}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input placeholder="Department" value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} />
            <Input placeholder="Password" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
          </div>
          <Button onClick={handleAdd} disabled={submitting}>
            <Plus className="h-4 w-4 mr-1" /> Add User
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Existing Users</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : users.length === 0 ? (
            <p className="text-sm text-muted-foreground">No users found.</p>
          ) : (
            <div className="border rounded-lg overflow-auto max-h-96">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Email</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead className="w-24">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((u) => (
                    <TableRow key={u.id}>
                      <TableCell className="font-mono text-xs">{u.email}</TableCell>
                      {editingId === u.id ? (
                        <>
                          <TableCell>
                            <Input value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} className="h-8" />
                          </TableCell>
                          <TableCell>
                            <Select value={editForm.role} onValueChange={(v) => setEditForm({ ...editForm, role: v })}>
                              <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
                              <SelectContent>
                                {ROLE_OPTIONS.map((r) => (
                                  <SelectItem key={r} value={r} className="capitalize">{r}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell>
                            <Input value={editForm.department} onChange={(e) => setEditForm({ ...editForm, department: e.target.value })} className="h-8" />
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              <Button size="icon" variant="ghost" className="h-7 w-7" onClick={saveEdit}><Check className="h-3.5 w-3.5" /></Button>
                              <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setEditingId(null)}><X className="h-3.5 w-3.5" /></Button>
                            </div>
                          </TableCell>
                        </>
                      ) : (
                        <>
                          <TableCell>{u.name || "—"}</TableCell>
                          <TableCell><span className="capitalize">{u.role || "—"}</span></TableCell>
                          <TableCell>{u.department || "—"}</TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => startEdit(u)}>
                                    <Pencil className="h-3.5 w-3.5" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Edit user</TooltipContent>
                              </Tooltip>
                              {canViewAs && (
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button size="icon" variant="ghost" className="h-7 w-7 text-amber-600 hover:text-amber-700 hover:bg-amber-50" onClick={() => handleViewAs(u)}>
                                      <Eye className="h-3.5 w-3.5" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>View as this user</TooltipContent>
                                </Tooltip>
                              )}
                            </div>
                          </TableCell>
                        </>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
