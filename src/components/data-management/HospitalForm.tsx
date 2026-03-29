import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Pencil, Check, X, Trash2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface Hospital {
  id: string;
  name: string;
  slug: string;
}

const INITIAL_HOSPITALS: Hospital[] = [
  { id: "1", name: "Karolinska University Hospital", slug: "karolinska" },
  { id: "2", name: "Capio St Görans Sjukhus", slug: "capio" },
];

export function HospitalForm() {
  const [hospitals, setHospitals] = useState<Hospital[]>(INITIAL_HOSPITALS);
  const [form, setForm] = useState({ name: "", slug: "" });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ name: "", slug: "" });

  const handleAdd = () => {
    if (!form.name || !form.slug) {
      toast({ title: "Name and slug are required", variant: "destructive" });
      return;
    }
    const newHospital: Hospital = {
      id: crypto.randomUUID(),
      name: form.name,
      slug: form.slug,
    };
    setHospitals([...hospitals, newHospital]);
    setForm({ name: "", slug: "" });
    toast({ title: "Hospital added (local only — not saved to database yet)" });
  };

  const startEdit = (h: Hospital) => {
    setEditingId(h.id);
    setEditForm({ name: h.name, slug: h.slug });
  };

  const saveEdit = () => {
    if (!editingId) return;
    setHospitals(hospitals.map((h) => (h.id === editingId ? { ...h, ...editForm } : h)));
    setEditingId(null);
    toast({ title: "Hospital updated (local only)" });
  };

  const handleDelete = (id: string) => {
    setHospitals(hospitals.filter((h) => h.id !== id));
    toast({ title: "Hospital removed (local only)" });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Add Hospital</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Input placeholder="Hospital Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <Input placeholder="Slug (e.g. karolinska)" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} />
          </div>
          <Button onClick={handleAdd}>
            <Plus className="h-4 w-4 mr-1" /> Add Hospital
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Existing Hospitals</CardTitle>
        </CardHeader>
        <CardContent>
          {hospitals.length === 0 ? (
            <p className="text-sm text-muted-foreground">No hospitals found.</p>
          ) : (
            <div className="border rounded-lg overflow-auto max-h-96">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Slug</TableHead>
                    <TableHead className="w-24">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {hospitals.map((h) => (
                    <TableRow key={h.id}>
                      {editingId === h.id ? (
                        <>
                          <TableCell>
                            <Input value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} className="h-8" />
                          </TableCell>
                          <TableCell>
                            <Input value={editForm.slug} onChange={(e) => setEditForm({ ...editForm, slug: e.target.value })} className="h-8" />
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
                          <TableCell>{h.name}</TableCell>
                          <TableCell className="font-mono text-xs">{h.slug}</TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => startEdit(h)}><Pencil className="h-3.5 w-3.5" /></Button>
                              <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => handleDelete(h.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
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
          <p className="text-xs text-muted-foreground mt-3">⚠ Changes are local only and will be lost on refresh. Database persistence coming soon.</p>
        </CardContent>
      </Card>
    </div>
  );
}
