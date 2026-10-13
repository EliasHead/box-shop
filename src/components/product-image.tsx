"use client";

import Image from "next/image";
import { ImageIcon } from "lucide-react";
import { useState } from "react";

export function ProductImage({ productId, imageKey, name }: { productId: string; imageKey: string | null; name: string }) {
  const [failedKey, setFailedKey] = useState<string | null>(null);
  const version = imageKey?.split("/").at(-1);
  return (
    <div className="relative aspect-square w-full overflow-hidden bg-slate-100">
      {version && failedKey !== imageKey ? (
        <Image src={`/api/product-images/${encodeURIComponent(productId)}/${encodeURIComponent(version)}`}
          alt={name} fill unoptimized className="object-cover" onError={() => setFailedKey(imageKey)} />
      ) : (
        <div className="flex h-full items-center justify-center text-slate-400" role="img" aria-label={`${name}: sem foto disponível`}>
          <ImageIcon className="h-12 w-12" aria-hidden="true" />
        </div>
      )}
    </div>
  );
}
