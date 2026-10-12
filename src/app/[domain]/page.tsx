import Image from "next/image"
import { Button } from "@/components/ui/button"
import { MessageCircle, Store } from "lucide-react"
import { prisma } from "@/lib/prisma"
import { notFound } from "next/navigation"

export default async function StorefrontPage({ params }: { params: Promise<{ domain: string }> }) {
  const { domain } = await params
  
  // Format the domain nicely for DB query
  const extractedDomain = domain.split('.')[0]

  // Query DB
  const tenant = await prisma.tenant.findUnique({
    where: { domain: extractedDomain }
  })

  if (!tenant) {
    notFound()
  }

  const products = await prisma.product.findMany({
    where: { tenantId: tenant.id, status: 'ACTIVE' },
    orderBy: { createdAt: 'desc' }
  })

  return (
    <>
      <header className="sticky top-0 z-50 w-full backdrop-blur-lg bg-white/70 border-b border-slate-200 shadow-sm transition-all py-4 px-6 flex items-center justify-between">
        <div>
          <h1 className="font-bold text-xl text-slate-900 tracking-tight">{tenant.name}</h1>
          {tenant.description && <p className="mt-1 whitespace-pre-line text-sm text-slate-500">{tenant.description}</p>}
        </div>
      </header>

      <div className="p-4 flex flex-col gap-6 w-full min-h-[calc(100vh-70px)]">
        {products.length > 0 ? (
          <>
            <div className="mb-2">
              <h2 className="font-semibold text-2xl tracking-tight text-slate-800">Destaques</h2>
              <p className="text-sm text-slate-500">Compre diretamente pelo nosso WhatsApp.</p>
            </div>

            <div className="grid grid-cols-1 gap-6 pb-24">
              {products.map(product => (
                <div 
                  key={product.id} 
                  className="group relative flex flex-col bg-white rounded-3xl overflow-hidden border border-slate-100 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] transition-all hover:shadow-[0_8px_30px_-4px_rgba(0,0,0,0.1)]"
                >
                  {/* Product Image Placeholder */}
                  <div className="relative aspect-square w-full overflow-hidden bg-slate-100">
                    <Image 
                      src="https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&h=600&fit=crop&q=80" 
                      alt={product.name}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                      sizes="(max-width: 768px) 100vw, 400px"
                    />
                  </div>

                  {/* Product Info */}
                  <div className="flex flex-col p-5 gap-2">
                    <h3 className="font-semibold text-lg leading-tight text-slate-900 line-clamp-2">
                      {product.name}
                    </h3>
                    {product.description && (
                      <p className="text-sm text-slate-500 line-clamp-2 mb-2">
                        {product.description}
                      </p>
                    )}
                    
                    <div className="flex items-center justify-between mt-auto pt-2">
                      <div className="flex flex-col">
                        <span className="font-bold text-2xl tracking-tight text-emerald-600">
                          R$ {product.price.toFixed(2).replace('.', ',')}
                        </span>
                      </div>
                      
                      {/* WhatsApp CTA */}
                      <Button 
                        className="rounded-2xl px-5 shadow-lg shadow-emerald-600/20 hover:shadow-emerald-600/40 transition-shadow bg-emerald-600 hover:bg-emerald-700 text-white"
                      >
                        <MessageCircle className="mr-2 h-5 w-5" />
                        Comprar
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center flex-1 gap-4 text-center px-4">
            <div className="bg-slate-100 p-6 rounded-full">
              <Store className="w-12 h-12 text-slate-400" />
            </div>
            <h2 className="text-2xl font-bold text-slate-800">Nenhum produto ainda</h2>
            <p className="text-slate-500 max-w-sm">
              Esta loja foi criada recentemente e ainda não possui produtos cadastrados.
            </p>
          </div>
        )}
      </div>
    </>
  )
}
