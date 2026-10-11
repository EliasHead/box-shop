"use client";

import { useState, useMemo, useEffect } from "react";
import { Plus, Trash, Edit, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { createProduct, updateProduct, deleteProduct } from "@/lib/actions/products";
import { ProductInput } from "@/lib/validations/product";
import { parseBasePrice } from "./product-price";

type ProductFormData = Omit<ProductInput, "price"> & { price: string };

// Helpers para combinações (Cartesian Product)
function cartesian(args: any[]) {
  if (args.length === 0) return [];
  const r: any[] = [];
  const max = args.length - 1;
  function helper(arr: any[], i: number) {
    for (let j = 0, l = args[i].length; j < l; j++) {
      const a = arr.slice(0);
      a.push(args[i][j]);
      if (i === max) r.push(a);
      else helper(a, i + 1);
    }
  }
  helper([], 0);
  return r;
}

export function ProductsClient({ initialProducts, categories }: { initialProducts: any[]; categories: any[] }) {
  const [products, setProducts] = useState(initialProducts);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);

  const defaultForm: ProductFormData = {
    name: "",
    slug: "",
    description: "",
    price: "0",
    status: "DRAFT",
    sku: "",
    categoryId: null,
    stock: 0,
    trackInventory: true,
    variationTypes: [],
    variants: [],
  };

  const [formData, setFormData] = useState<ProductFormData>(defaultForm);

  // Controle temporário para a UI de Variações
  const [tempVarType, setTempVarType] = useState("");
  const [tempVarOptions, setTempVarOptions] = useState("");

  const handleOpenNew = () => {
    setEditingId(null);
    setFormData(defaultForm);
    setError("");
    setIsOpen(true);
  };

  const handleOpenEdit = (product: any) => {
    setEditingId(product.id);
    
    // Transformar dados do banco de volta para o formato de edição
    const vTypes = product.variationTypes?.map((vt: any) => ({
      name: vt.name,
      options: vt.options.map((o: any) => o.value)
    })) || [];

    const vVariants = product.variants?.map((v: any) => {
      const opts: Record<string, string> = {};
      v.options.forEach((opt: any) => {
        opts[opt.variationType.name] = opt.value;
      });
      return {
        sku: v.sku || "",
        price: v.price,
        stock: v.stock,
        options: opts,
      };
    }) || [];

    setFormData({
      name: product.name,
      slug: product.slug,
      description: product.description || "",
      price: String(product.price),
      status: product.status,
      sku: product.sku || "",
      categoryId: product.categoryId || null,
      stock: product.stock || 0,
      trackInventory: product.trackInventory !== false,
      variationTypes: vTypes,
      variants: vVariants,
    });
    setError("");
    setIsOpen(true);
  };

  const handleAddVariationType = () => {
    if (!tempVarType.trim() || !tempVarOptions.trim()) return;
    const optionsArray = tempVarOptions.split(",").map(s => s.trim()).filter(Boolean);
    if (optionsArray.length === 0) return;

    setFormData(prev => {
      const newTypes = [...(prev.variationTypes || []), { name: tempVarType.trim(), options: optionsArray }];
      // Re-generate variants matrix
      const newVariants = generateVariantsMatrix(newTypes, prev.variants || []);
      return { ...prev, variationTypes: newTypes, variants: newVariants };
    });
    setTempVarType("");
    setTempVarOptions("");
  };

  const handleRemoveVariationType = (index: number) => {
    setFormData(prev => {
      const newTypes = [...(prev.variationTypes || [])];
      newTypes.splice(index, 1);
      const newVariants = generateVariantsMatrix(newTypes, prev.variants || []);
      return { ...prev, variationTypes: newTypes, variants: newVariants };
    });
  };

  const generateVariantsMatrix = (types: any[], existingVariants: any[]) => {
    if (types.length === 0) return [];
    const optionsArrays = types.map(t => t.options.map((val: string) => ({ typeName: t.name, value: val })));
    const combinations = cartesian(optionsArrays);
    
    return combinations.map(combo => {
      const optRecord: Record<string, string> = {};
      combo.forEach((c: any) => {
        optRecord[c.typeName] = c.value;
      });
      
      // Try to find an existing variant to preserve price/stock/sku
      const existing = existingVariants.find(ev => 
        Object.keys(optRecord).every(k => ev.options[k] === optRecord[k])
      );

      return {
        sku: existing?.sku || "",
        price: existing?.price ?? null,
        stock: existing?.stock || 0,
        options: optRecord,
      };
    });
  };

  const handleVariantChange = (index: number, field: string, value: any) => {
    setFormData(prev => {
      const newVariants = [...(prev.variants || [])];
      newVariants[index] = { ...newVariants[index], [field]: value };
      return { ...prev, variants: newVariants };
    });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const payload: ProductInput = {
        ...formData,
        categoryId: formData.categoryId === "none" ? null : formData.categoryId,
        price: parseBasePrice(formData.price),
        stock: Number(formData.stock),
      };

      if (editingId) {
        const updated = await updateProduct(editingId, payload);
        const categoryMatch = categories.find((c) => c.id === updated.categoryId);
        setProducts((prev) => prev.map((p) => (p.id === editingId ? { ...updated, category: categoryMatch } : p)));
      } else {
        const created = await createProduct(payload);
        const categoryMatch = categories.find((c) => c.id === created.categoryId);
        setProducts((prev) => [{ ...created, category: categoryMatch }, ...prev]);
      }
      setIsOpen(false);
    } catch (err: any) {
      setError(err.message || "Erro ao salvar produto");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este produto?")) return;
    try {
      await deleteProduct(id);
      setProducts((prev) => prev.filter((p) => p.id !== id));
    } catch (err: any) {
      alert(err.message || "Erro ao excluir produto");
    }
  };

  const hasVariations = formData.variationTypes && formData.variationTypes.length > 0;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Produtos</h1>
        <Button onClick={handleOpenNew} className="gap-2">
          <Plus className="h-4 w-4" />
          Novo Produto
        </Button>
      </div>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? "Editar Produto" : "Novo Produto"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSave} className="flex flex-col gap-6 mt-4">
            {error && <div className="text-sm text-red-500 font-medium p-3 bg-red-50 rounded-md">{error}</div>}
            
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Nome do Produto</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="slug">Slug (URL)</Label>
                <Input
                  id="slug"
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  placeholder="ex: camiseta-preta"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="price">Preço Base (R$)</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="sku">SKU Base (Opcional)</Label>
                <Input
                  id="sku"
                  value={formData.sku || ""}
                  onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Categoria</Label>
                <Select
                  value={formData.categoryId || "none"}
                  onValueChange={(val) => setFormData({ ...formData, categoryId: val })}
                >
                  <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Sem categoria</SelectItem>
                    {categories.map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label>Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(val) => setFormData({ ...formData, status: val as any })}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="DRAFT">Rascunho</SelectItem>
                    <SelectItem value="ACTIVE">Ativo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                value={formData.description || ""}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
              />
            </div>

            <div className="border-t pt-6">
              <h3 className="text-lg font-medium mb-4">Controle de Estoque e Variações</h3>
              
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="grid gap-2">
                  <Label>Rastrear Estoque?</Label>
                  <Select
                    value={formData.trackInventory ? "yes" : "no"}
                    onValueChange={(val) => setFormData({ ...formData, trackInventory: val === "yes" })}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="yes">Sim</SelectItem>
                      <SelectItem value="no">Não (Sempre disponível)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {!hasVariations && (
                  <div className="grid gap-2">
                    <Label htmlFor="stock">Estoque Total</Label>
                    <Input
                      id="stock"
                      type="number"
                      min="0"
                      value={formData.stock || 0}
                      onChange={(e) => setFormData({ ...formData, stock: parseInt(e.target.value) || 0 })}
                      disabled={!formData.trackInventory}
                    />
                  </div>
                )}
              </div>

              <div className="bg-muted/50 p-4 rounded-md mb-6">
                <Label className="block mb-2">Adicionar Variação (ex: Cor, Tamanho)</Label>
                <div className="flex gap-2 mb-4">
                  <Input 
                    placeholder="Nome (ex: Cor)" 
                    value={tempVarType} 
                    onChange={e => setTempVarType(e.target.value)} 
                    className="w-1/3"
                  />
                  <Input 
                    placeholder="Opções separadas por vírgula (ex: Azul, Verde)" 
                    value={tempVarOptions} 
                    onChange={e => setTempVarOptions(e.target.value)} 
                    className="flex-1"
                  />
                  <Button type="button" variant="secondary" onClick={handleAddVariationType}>Adicionar</Button>
                </div>

                {formData.variationTypes && formData.variationTypes.length > 0 && (
                  <div className="flex flex-col gap-2">
                    {formData.variationTypes.map((vt, i) => (
                      <div key={i} className="flex items-center gap-2 bg-background p-2 rounded-md border text-sm">
                        <span className="font-medium">{vt.name}:</span>
                        <span className="text-muted-foreground flex-1">{vt.options.join(", ")}</span>
                        <Button type="button" variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleRemoveVariationType(i)}>
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {hasVariations && formData.variants && formData.variants.length > 0 && (
                <div className="rounded-md border overflow-hidden">
                  <Table>
                    <TableHeader className="bg-muted">
                      <TableRow>
                        <TableHead>Variação</TableHead>
                        <TableHead className="w-[120px]">SKU</TableHead>
                        <TableHead className="w-[120px]">Preço Adic.</TableHead>
                        <TableHead className="w-[100px]">Estoque</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {formData.variants.map((v, i) => (
                        <TableRow key={i}>
                          <TableCell className="font-medium text-sm">
                            {Object.values(v.options).join(" - ")}
                          </TableCell>
                          <TableCell className="p-2">
                            <Input 
                              className="h-8 text-xs" 
                              placeholder="SKU" 
                              value={v.sku || ""} 
                              onChange={(e) => handleVariantChange(i, "sku", e.target.value)}
                            />
                          </TableCell>
                          <TableCell className="p-2">
                            <Input 
                              type="number" 
                              step="0.01" 
                              className="h-8 text-xs" 
                              placeholder="Preço R$" 
                              value={v.price === null ? "" : v.price} 
                              onChange={(e) => handleVariantChange(i, "price", e.target.value ? parseFloat(e.target.value) : null)}
                            />
                          </TableCell>
                          <TableCell className="p-2">
                            <Input 
                              type="number" 
                              min="0" 
                              className="h-8 text-xs" 
                              value={v.stock} 
                              onChange={(e) => handleVariantChange(i, "stock", parseInt(e.target.value) || 0)}
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>

            <Button type="submit" disabled={loading} className="w-full mt-4">
              {loading ? "Salvando..." : "Salvar Produto"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Produto</TableHead>
              <TableHead>Categoria</TableHead>
              <TableHead>Preço</TableHead>
              <TableHead>Estoque</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-[100px]">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center h-24 text-muted-foreground">
                  Nenhum produto cadastrado.
                </TableCell>
              </TableRow>
            ) : (
              products.map((product) => {
                const isOutOfStock = product.trackInventory && 
                  (product.variants?.length > 0 
                    ? product.variants.every((v: any) => v.stock <= 0)
                    : product.stock <= 0);

                return (
                  <TableRow key={product.id}>
                    <TableCell>
                      <div className="font-medium flex items-center gap-2">
                        {product.name}
                        {product.variants?.length > 0 && <Badge variant="outline" className="text-[10px]">Matriz</Badge>}
                      </div>
                      <div className="text-xs text-muted-foreground">SKU: {product.sku || "N/A"}</div>
                    </TableCell>
                    <TableCell>{product.category?.name || "Sem categoria"}</TableCell>
                    <TableCell>
                      {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(product.price)}
                    </TableCell>
                    <TableCell>
                      {isOutOfStock ? (
                        <Badge variant="destructive">Esgotado</Badge>
                      ) : (
                        <Badge variant="secondary">
                          {product.variants?.length > 0 
                            ? `${product.variants.reduce((acc: number, v: any) => acc + (v.stock || 0), 0)} itens (Variados)` 
                            : `${product.stock} itens`}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={product.status === "ACTIVE" ? "default" : "secondary"}>
                        {product.status === "ACTIVE" ? "Ativo" : "Rascunho"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="icon" onClick={() => handleOpenEdit(product)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(product.id)}>
                          <Trash className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
