"use client";
import { useState } from "react";
import { ProductImage } from "@/components/product-image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { uploadProductImage, removeProductImage } from "@/lib/actions/product-images";

export function ProductImageDialog({ product, onClose, onSaved }: {
  product: { id: string; name: string; imageKey: string | null };
  onClose: () => void; onSaved: (key: string | null) => void;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");
  async function submit(remove: boolean) {
    setPending(true);
    setMessage("");
    try {
      const formData = new FormData();
      if (file) formData.set("image", file);
      const result = await (remove ? removeProductImage(product.id) : uploadProductImage(product.id, formData));
      if (!result.success) setMessage(result.error);
      else { onSaved(result.imageKey); setFile(null); setMessage(remove ? "Foto removida." : "Foto salva."); }
    } catch { setMessage("Não foi possível salvar a foto. Tente novamente."); }
    finally { setPending(false); }
  }
  return (
    <Dialog open onOpenChange={(open) => { if (!open && !pending) onClose(); }}>
      <DialogContent aria-describedby="image-limits">
        <DialogHeader><DialogTitle>Foto de {product.name}</DialogTitle></DialogHeader>
        <div className="mx-auto w-48"><ProductImage productId={product.id} imageKey={product.imageKey} name={product.name} /></div>
        <p id="image-limits" className="text-sm text-muted-foreground">JPEG, PNG ou WebP estático. Até 5 MiB, 4096 pixels por lado e 16 milhões de pixels.</p>
        <Label htmlFor="product-image">Escolher foto</Label>
        <Input key={product.imageKey ?? "empty"} id="product-image" type="file" accept="image/jpeg,image/png,image/webp" disabled={pending} onChange={(event) => setFile(event.target.files?.[0] ?? null)} />
        {message && <p role="status">{message}</p>}
        {pending && <p role="status">Processando foto…</p>}
        <div className="flex gap-2">
          <Button disabled={pending || !file} onClick={() => submit(false)}>{product.imageKey ? "Substituir foto" : "Enviar foto"}</Button>
          <Button variant="outline" disabled={pending || !product.imageKey} onClick={() => submit(true)}>Remover foto</Button>
          <Button variant="ghost" disabled={pending} onClick={onClose}>Fechar</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
