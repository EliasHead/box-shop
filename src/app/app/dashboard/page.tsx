import { buttonVariants } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Package, LineChart, Users, ExternalLink } from "lucide-react"
import { auth, signOut } from "@/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"

export default async function DashboardPage() {
  const session = await auth()
  
  if (!session?.user?.id) {
    redirect('/login')
  }

  // Verify the user still exists in DB (handles stale JWT after DB reset)
  const dbUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, tenantId: true }
  })

  if (!dbUser) {
    // JWT is completely stale — user no longer exists in DB
    await signOut({ redirect: false })
    redirect('/login')
  }

  if (!dbUser.tenantId) {
    redirect('/onboarding')
  }

  const [tenant, productCount] = await Promise.all([
    prisma.tenant.findUnique({ where: { id: dbUser.tenantId } }),
    prisma.product.count({ where: { tenantId: dbUser.tenantId } })
  ])

  if (!tenant) {
    redirect('/onboarding')
  }

  const storeUrl = `http://${tenant.domain}.${process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'localhost:3000'}`

  return (
    <>
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold md:text-2xl">Visão Geral</h1>
      </div>
      
      {/* Storefront Link Banner */}
      <Card className="bg-primary/5 border-primary/20">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2 text-primary">
            Sua loja está online!
          </CardTitle>
          <CardDescription>
            Acesse e compartilhe o link da sua vitrine com seus clientes.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <code className="relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-sm font-semibold text-muted-foreground flex-1 sm:flex-initial overflow-hidden text-ellipsis">
              {storeUrl}
            </code>
            <Link href={storeUrl} target="_blank" className={buttonVariants({ size: "sm" })}>
              <ExternalLink className="h-4 w-4 mr-2" />
              Visitar Loja
            </Link>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 md:gap-8 lg:grid-cols-3 mt-4">
        <Card x-chunk="dashboard-01-chunk-0" className="opacity-70">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Vendas via WhatsApp
            </CardTitle>
            <LineChart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">R$ 0,00</div>
            <div className="flex items-center mt-1">
              <Badge variant="secondary" className="text-[10px]">Em breve</Badge>
            </div>
          </CardContent>
        </Card>
        
        <Card x-chunk="dashboard-01-chunk-1" className="opacity-70">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Acessos na Vitrine
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <div className="flex items-center mt-1">
              <Badge variant="secondary" className="text-[10px]">Em breve</Badge>
            </div>
          </CardContent>
        </Card>
        
        <Card x-chunk="dashboard-01-chunk-2">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Produtos Cadastrados</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{productCount}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Na sua vitrine
            </p>
          </CardContent>
        </Card>
      </div>
    </>
  )
}
