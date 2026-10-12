'use server'

import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { validateTenantSettings } from '@/lib/validations/tenant-settings'
import { revalidatePath } from 'next/cache'

export async function getTenantSettings() {
  const session = await auth()
  if (!session?.user?.id) return { redirect: '/login' } as const
  const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { tenantId: true } })
  if (!user) return { redirect: '/login' } as const
  if (!user.tenantId) return { redirect: '/onboarding' } as const
  const tenant = await prisma.tenant.findUnique({ where: { id: user.tenantId } })
  if (!tenant) return { redirect: '/onboarding' } as const
  return { tenant } as const
}

export async function updateTenantSettings(input: unknown) {
  try {
    const session = await auth()
    if (!session?.user?.id) return { error: 'Não autenticado.' } as const
    const parsed = validateTenantSettings(input)
    if (parsed.error) return { error: parsed.error } as const
    const tenant = await prisma.$transaction(async (tx) => {
      const user = await tx.user.findUnique({ where: { id: session.user.id }, select: { tenantId: true } })
      if (!user?.tenantId) return null
      return tx.tenant.update({ where: { id: user.tenantId }, data: parsed.data })
    })
    if (!tenant) return { error: 'Usuário ou loja não encontrado.' } as const
    revalidatePath('/app/dashboard/settings')
    revalidatePath('/app', 'layout')
    const root = process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'localhost:3000'
    revalidatePath(`/${tenant.domain}.${root}`)
    return { success: true } as const
  } catch (error) {
    console.error('Erro ao salvar configurações:', error)
    return { error: 'Não foi possível salvar as configurações. Tente novamente.' } as const
  }
}
