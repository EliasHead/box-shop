import Image from "next/image"
import { Button } from "@/components/ui/button"
import { MessageCircle } from "lucide-react"

// Mocked products for the POC
const products = [
  {
    id: "1",
    name: "Tênis Esportivo Casual Runner",
    price: 299.90,
    image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&h=600&fit=crop&q=80",
    description: "Tênis perfeito para correr ou para uso diário. Leve e confortável."
  },
  {
    id: "2",
    name: "Fone de Ouvido Noise Cancelling",
    price: 159.00,
    image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&h=600&fit=crop&q=80",
    description: "Ouça sua música sem interrupções com cancelamento de ruído ativo."
  },
  {
    id: "3",
    name: "Smartwatch Premium S8",
    price: 499.00,
    image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&h=600&fit=crop&q=80",
    description: "Monitoramento de saúde e estilo no seu pulso inteiro."
  }
]

export default async function StorefrontPage({ params }: { params: Promise<{ domain: string }> }) {
  const { domain } = await params
  
  // Format the domain nicely for the header
  const storeName = domain.split('.')[0].toUpperCase()

  return (
    <>
      <header className="sticky top-0 z-50 w-full backdrop-blur-lg bg-white/70 border-b border-slate-200 shadow-sm transition-all py-4 px-6 flex items-center justify-between">
        <h1 className="font-bold text-xl text-slate-900 tracking-tight">{storeName}</h1>
      </header>

      <div className="p-4 flex flex-col gap-6 w-full">
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
              {/* Product Image */}
              <div className="relative aspect-square w-full overflow-hidden bg-slate-100">
                <Image 
                  src={product.image} 
                  alt={product.name}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                  sizes="(max-width: 768px) 100vw, 400px" // Using generic sizes for POC
                />
              </div>

              {/* Product Info */}
              <div className="flex flex-col p-5 gap-2">
                <h3 className="font-semibold text-lg leading-tight text-slate-900 line-clamp-2">
                  {product.name}
                </h3>
                <p className="text-sm text-slate-500 line-clamp-2 mb-2">
                  {product.description}
                </p>
                
                <div className="flex items-center justify-between mt-auto pt-2">
                  <div className="flex flex-col">
                    <span className="text-xs text-slate-400 line-through">
                      R$ {(product.price * 1.2).toFixed(2).replace('.', ',')}
                    </span>
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
      </div>
    </>
  )
}
