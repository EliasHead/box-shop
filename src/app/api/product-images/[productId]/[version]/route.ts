import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { parseImageKey, readProductImage } from "@/lib/storage/product-images";

export const runtime = "nodejs";
const headers = { "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff" };
const unavailable = () => new Response(null, { status: 404, headers });

export async function GET(request: Request, context: { params: Promise<{ productId: string; version: string }> }) {
  try {
    const { productId, version } = await context.params;
    const host = request.headers.get("host")?.toLowerCase();
    const root = (process.env.NEXT_PUBLIC_ROOT_DOMAIN || "localhost:3000").toLowerCase();
    if (!host) return unavailable();
    let tenantId: string;
    let administrative = false;
    if (host === `app.${root}`) {
      const session = await auth();
      if (!session?.user?.id) return unavailable();
      const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { tenantId: true } });
      if (!user?.tenantId) return unavailable();
      tenantId = user.tenantId;
      administrative = true;
    } else {
      if (!host.endsWith(`.${root}`)) return unavailable();
      const domain = host.slice(0, -root.length - 1);
      if (!domain || domain.includes(".") || domain === "app") return unavailable();
      const tenant = await prisma.tenant.findUnique({ where: { domain }, select: { id: true } });
      if (!tenant) return unavailable();
      tenantId = tenant.id;
    }
    const imageKey = `${tenantId}/${productId}/${version}`;
    parseImageKey(imageKey);
    const product = await prisma.product.findFirst({
      where: { id: productId, tenantId, imageKey, ...(administrative ? {} : { status: "ACTIVE" }) },
      select: { id: true },
    });
    if (!product) return unavailable();
    const content = await readProductImage(imageKey);
    return new Response(new Uint8Array(content), { headers: { ...headers, "Content-Type": "image/webp" } });
  } catch { return unavailable(); }
}
