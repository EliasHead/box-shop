import { Button } from "@/components/ui/button"
import { PackageOpen, Sparkles } from "lucide-react"

export default function ProductsPage() {
  return (
    <>
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold md:text-2xl">Catálogo</h1>
        <Button className="gap-2">
          <Sparkles className="w-4 h-4" />
          Gerar com IA
        </Button>
      </div>

      <div
        className="flex flex-1 items-center justify-center rounded-lg border border-dashed shadow-sm"
      >
        <div className="flex flex-col items-center gap-1 text-center py-16 px-4">
          <div className="bg-muted w-12 h-12 rounded-full flex items-center justify-center mb-4">
            <PackageOpen className="h-6 w-6 text-muted-foreground" />
          </div>
          <h3 className="text-2xl font-bold tracking-tight">
            Você não tem produtos
          </h3>
          <p className="text-sm text-muted-foreground max-w-sm mt-2 mb-6">
            Você pode importar da sua loja antiga, cadastrar manualmente ou gerar tudo automaticamente enviando uma foto via IA.
          </p>
          <Button variant="default" className="gap-2">
            <Sparkles className="w-4 h-4" />
            Cadastrar 1º Produto com IA
          </Button>
        </div>
      </div>
    </>
  )
}
