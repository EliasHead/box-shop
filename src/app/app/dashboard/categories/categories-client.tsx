"use client";

import type { Category } from "@prisma/client";
import { errorMessage } from "@/lib/error-message";
import { useState } from "react";
import { Plus, Trash, Edit } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { createCategory, updateCategory, deleteCategory } from "@/lib/actions/categories";
import { CategoryInput } from "@/lib/validations/category";

export function CategoriesClient({ initialCategories }: { initialCategories: Category[] }) {
  const [categories, setCategories] = useState(initialCategories);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);

  const [formData, setFormData] = useState<CategoryInput>({
    name: "",
    slug: "",
  });

  const handleOpenNew = () => {
    setEditingId(null);
    setFormData({ name: "", slug: "" });
    setError("");
    setIsOpen(true);
  };

  const handleOpenEdit = (category: Category) => {
    setEditingId(category.id);
    setFormData({ name: category.name, slug: category.slug });
    setError("");
    setIsOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      if (editingId) {
        const updated = await updateCategory(editingId, formData);
        setCategories((prev) => prev.map((c) => (c.id === editingId ? updated : c)));
      } else {
        const created = await createCategory(formData);
        setCategories((prev) => [created, ...prev]);
      }
      setIsOpen(false);
    } catch (err: unknown) {
      setError(errorMessage(err, "Erro ao salvar categoria"));
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir esta categoria?")) return;
    try {
      await deleteCategory(id);
      setCategories((prev) => prev.filter((c) => c.id !== id));
    } catch (err: unknown) {
      alert(errorMessage(err, "Erro ao excluir categoria"));
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Categorias</h1>
        <Button onClick={handleOpenNew} className="gap-2">
          <Plus className="h-4 w-4" />
          Nova Categoria
        </Button>
      </div>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingId ? "Editar Categoria" : "Nova Categoria"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSave} className="flex flex-col gap-4">
            {error && <div className="text-sm text-red-500 font-medium">{error}</div>}
            
            <div className="grid gap-2">
              <Label htmlFor="name">Nome da Categoria</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="slug">Slug (URL amigável)</Label>
              <Input
                id="slug"
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                placeholder="ex: calcados-masculinos"
                required
              />
              <p className="text-xs text-muted-foreground">Deve conter apenas letras minúsculas, números e hifens.</p>
            </div>

            <Button type="submit" disabled={loading} className="mt-2">
              {loading ? "Salvando..." : "Salvar"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Slug</TableHead>
              <TableHead className="w-[100px]">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {categories.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className="text-center h-24 text-muted-foreground">
                  Nenhuma categoria cadastrada.
                </TableCell>
              </TableRow>
            ) : (
              categories.map((category) => (
                <TableRow key={category.id}>
                  <TableCell className="font-medium">{category.name}</TableCell>
                  <TableCell className="text-muted-foreground">{category.slug}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="icon" onClick={() => handleOpenEdit(category)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(category.id)}>
                        <Trash className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
