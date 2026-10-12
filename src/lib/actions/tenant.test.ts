import type { Session } from "next-auth"
import { sessionFixture, userFixture } from "@/test/fixtures"
import { expect, test, vi, beforeEach, afterEach } from 'vitest'
import { createTenant } from './tenant'
import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'

vi.mock('@/lib/prisma', () => ({
  prisma: {
    $transaction: vi.fn(async (callback: (tx: Pick<typeof prisma, 'tenant' | 'user'>) => Promise<unknown>) => callback(prisma)),
    tenant: {
      findUnique: vi.fn(),
      create: vi.fn()
    },
    user: {
      update: vi.fn()
    }
  }
}))

vi.mock('@/auth', () => ({
  auth: vi.fn()
}))

const sessionAuth = vi.mocked(auth as () => Promise<Session | null>)

beforeEach(() => {
  vi.clearAllMocks()
})

afterEach(() => vi.restoreAllMocks())

test.each([null, {}, 'falha inesperada'])('retorna fallback para exceção sem mensagem: %j', async (error) => {
  sessionAuth.mockResolvedValueOnce(sessionFixture({ tenantId: null }))
  vi.mocked(prisma.$transaction).mockRejectedValueOnce(error)
  vi.spyOn(console, 'error').mockImplementation(() => {})
  await expect(createTenant({ name: 'Loja', domain: 'loja' })).resolves.toEqual({
    error: 'Ocorreu um erro ao criar a loja. Tente novamente.',
  })
  expect(prisma.tenant.create).not.toHaveBeenCalled()
  expect(prisma.user.update).not.toHaveBeenCalled()
})

test('retorna erro se usuário não estiver autenticado', async () => {
  sessionAuth.mockResolvedValueOnce(null)
  
  const result = await createTenant({ name: 'Loja', domain: 'loja' })
  expect(result).toEqual({ error: 'Não autenticado' })
})

test('retorna erro se o domínio for inválido', async () => {
  sessionAuth.mockResolvedValueOnce(sessionFixture({ tenantId: null }))
  
  const result = await createTenant({ name: 'Loja', domain: 'loja com espaco' })
  expect(result.error).toContain('apenas letras minúsculas')
})

test('retorna erro se o domínio já estiver em uso', async () => {
  sessionAuth.mockResolvedValueOnce(sessionFixture({ tenantId: null }))
  
  vi.mocked(prisma.tenant.findUnique).mockResolvedValueOnce({ id: 'existing', name: 'Existing', domain: 'loja', description: null, whatsapp: null, createdAt: new Date(), updatedAt: new Date() })
  
  const result = await createTenant({ name: 'Loja', domain: 'loja' })
  expect(result).toEqual({ error: 'Este endereço já está em uso' })
})

test('cria a loja e associa ao usuário com sucesso', async () => {
  sessionAuth.mockResolvedValueOnce(sessionFixture({ tenantId: null }))
  
  vi.mocked(prisma.tenant.findUnique).mockResolvedValueOnce(null)
  vi.mocked(prisma.tenant.create).mockResolvedValueOnce({ id: 'new-tenant-id', name: 'Loja', domain: 'loja', description: null, whatsapp: null, createdAt: new Date(), updatedAt: new Date() })
  vi.mocked(prisma.user.update).mockResolvedValueOnce(userFixture())
    
  
  const result = await createTenant({ name: 'Loja', domain: 'loja' })
  expect(result).toEqual({ success: true, tenantId: 'new-tenant-id', role: 'OWNER' })
  
  expect(prisma.tenant.create).toHaveBeenCalledWith({ data: { name: 'Loja', domain: 'loja' } })
  expect(prisma.user.update).toHaveBeenCalledWith({
    where: { id: 'user-1' },
    data: { tenantId: 'new-tenant-id', role: 'OWNER' }
  })
})
