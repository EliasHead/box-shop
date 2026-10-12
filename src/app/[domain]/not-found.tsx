import { buttonVariants } from "@/components/ui/button"
import Link from "next/link"
import { PackageX } from "lucide-react"

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center bg-slate-50">
      <div className="bg-white p-6 rounded-full shadow-sm mb-6 border border-slate-100">
        <PackageX className="w-16 h-16 text-slate-300" />
      </div>
      
      <h2 className="text-3xl font-bold text-slate-800 mb-3 tracking-tight">Loja não encontrada</h2>
      
      <p className="text-slate-500 max-w-md mx-auto mb-8 text-lg">
        O endereço que você tentou acessar não existe ou a loja foi desativada.
      </p>
      
      <div className="flex flex-col sm:flex-row gap-4">
        <Link href="/" className={buttonVariants({ size: "lg", className: "rounded-full px-8" })}>
          Criar minha própria loja
        </Link>
      </div>
    </div>
  )
}
