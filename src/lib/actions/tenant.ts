'use server'

import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'

export async function createTenant(data: { name: string; domain: string }) {
  const session = await auth()
  if (!session?.user?.id) {
    return { error: 'Não autenticado' }
  }

  const { name, domain } = data

  if (!name || !domain) {
    return { error: 'Nome e Endereço são obrigatórios' }
  }

  // Basic validation: lowercase alphanumeric and hyphens only
  const domainRegex = /^[a-z0-9-]+$/
  if (!domainRegex.test(domain)) {
    return { error: 'O endereço deve conter apenas letras minúsculas, números e hifens (sem espaços)' }
  }

  try {
    // Use transaction to ensure both operations succeed or fail together
    const result = await prisma.$transaction(async (tx) => {
      // Check domain uniqueness
      const existing = await tx.tenant.findUnique({
        where: { domain }
      })

      if (existing) {
        throw new Error('Este endereço já está em uso')
      }

      const tenant = await tx.tenant.create({
        data: {
          name,
          domain,
        }
      })

      await tx.user.update({
        where: { id: session.user.id },
        data: {
          tenantId: tenant.id,
          role: 'OWNER'
        }
      })

      return tenant
    })

    return { success: true, tenantId: result.id, role: 'OWNER' }
  } catch (error: any) {
    if (error.message === 'Este endereço já está em uso') {
      return { error: error.message }
    }
    console.error('Error creating tenant:', error)
    return { error: 'Ocorreu um erro ao criar a loja. Tente novamente.' }
  }
}
