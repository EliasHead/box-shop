'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { createTenant } from '@/lib/actions/tenant'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Package } from 'lucide-react'

export default function OnboardingForm() {
  const router = useRouter()
  const { update } = useSession()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(formData: FormData) {
    setLoading(true)
    setError(null)

    const name = formData.get('name') as string
    const domain = formData.get('domain') as string

    const result = await createTenant({ name, domain })

    if (result.error) {
      setError(result.error)
      setLoading(false)
      return
    }

    if (result.success && result.tenantId) {
      // Update the JWT token to include the new tenantId and role
      await update({ tenantId: result.tenantId, role: result.role })
      
      // Redirect to the dashboard
      router.push('/dashboard')
    }
  }

  return (
    <div className="flex min-h-[calc(100vh-theme(spacing.16))] items-center justify-center py-10">
      <Card className="w-full max-w-md shadow-lg border-primary/10">
        <CardHeader className="space-y-3 pb-6">
          <div className="flex justify-center mb-2">
            <div className="bg-primary/10 p-3 rounded-full">
              <Package className="h-8 w-8 text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl text-center font-bold">Crie sua Loja</CardTitle>
          <CardDescription className="text-center text-base">
            Bem-vindo ao BoxShop! Para começar, precisamos de algumas informações sobre a sua nova loja.
          </CardDescription>
        </CardHeader>
        <form action={handleSubmit}>
          <CardContent className="space-y-4">
            {error && (
              <div className="bg-destructive/15 text-destructive text-sm p-3 rounded-md border border-destructive/20">
                {error}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="name">Nome da Loja</Label>
              <Input 
                id="name" 
                name="name" 
                placeholder="Ex: Minha Loja Fantástica" 
                required 
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="domain">Endereço da Loja</Label>
              <div className="flex items-center space-x-2">
                <Input 
                  id="domain" 
                  name="domain" 
                  placeholder="minhaloja" 
                  required 
                  disabled={loading}
                  className="text-right"
                  pattern="[a-z0-9-]+"
                  title="Apenas letras minúsculas, números e hifens"
                />
                <span className="text-muted-foreground font-medium whitespace-nowrap">
                  .boxshop.com
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                Este será o link que seus clientes acessarão (apenas letras minúsculas, números e hifens).
              </p>
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full" size="lg" disabled={loading}>
              {loading ? 'Criando loja...' : 'Criar minha loja'}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
