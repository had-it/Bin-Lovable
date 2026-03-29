import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";

type DepartmentsTable =
  | "karolinska_university_hospital_departments"
  | "capio_st_görans_sjukhus_departments";

interface DepartmentRow {
  id: string;
  name: string;
  created_at: string;
}

export function DepartmentForm({ departmentsTable }: { departmentsTable: DepartmentsTable }) {
  const [departments, setDepartments] = useState<DepartmentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchDepartments = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from(departmentsTable as any)
      .select("*")
      .order("name");
    if (error) {
      toast({ title: "Failed to load departments", description: error.message, variant: "destructive" });
    }
    setDepartments((data as unknown as DepartmentRow[]) ?? []);
    setLoading(false);
  };

  useEffect(() => {
    fetchDepartments();
  }, [departmentsTable]);

  const handleAdd = async () => {
    const trimmed = name.trim();
    if (!trimmed) {
      toast({ title: "Department name is required", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    const { error } = await supabase
      .from(departmentsTable as any)
      .insert({ name: trimmed } as any);
    setSubmitting(false);
    if (error) {
      if (error.message.includes("duplicate") || error.message.includes("unique")) {
        toast({ title: "Department already exists", variant: "destructive" });
      } else {
        toast({ title: "Failed to add department", description: error.message, variant: "destructive" });
      }
    } else {
      toast({ title: "Department added" });
      setName("");
      fetchDepartments();
    }
  };

  const handleDelete = async (id: string, deptName: string) => {
    const { error } = await supabase
      .from(departmentsTable as any)
      .delete()
      .eq("id", id);
    if (error) {
      toast({ title: "Failed to delete department", description: error.message, variant: "destructive" });
    } else {
      toast({ title: `Department "${deptName}" deleted` });
      fetchDepartments();
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Add Department</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-3 max-w-md">
            <Input
              placeholder="Department name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAdd()}
            />
            <Button onClick={handleAdd} disabled={submitting}>
              <Plus className="h-4 w-4 mr-1" /> Add
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Existing Departments</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : departments.length === 0 ? (
            <p className="text-sm text-muted-foreground">No departments found.</p>
          ) : (
            <div className="border rounded-lg overflow-auto max-h-96">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead className="w-20">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {departments.map((d) => (
                    <TableRow key={d.id}>
                      <TableCell>{d.name}</TableCell>
                      <TableCell>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7 text-destructive hover:text-destructive"
                          onClick={() => handleDelete(d.id, d.name)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </TableCell>
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
