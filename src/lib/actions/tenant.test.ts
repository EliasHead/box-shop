import { expect, test, vi, beforeEach } from 'vitest'
import { createTenant } from './tenant'
import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'

vi.mock('@/lib/prisma', () => ({
  prisma: {
    $transaction: vi.fn(),
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

beforeEach(() => {
  vi.clearAllMocks()
})

test('retorna erro se usuário não estiver autenticado', async () => {
  vi.mocked(auth).mockResolvedValueOnce(null as any)
  
  const result = await createTenant({ name: 'Loja', domain: 'loja' })
  expect(result).toEqual({ error: 'Não autenticado' })
})

test('retorna erro se o domínio for inválido', async () => {
  vi.mocked(auth).mockResolvedValueOnce({ user: { id: 'user-1' }, expires: '' } as any)
  
  const result = await createTenant({ name: 'Loja', domain: 'loja com espaco' })
  expect(result.error).toContain('apenas letras minúsculas')
})

test('retorna erro se o domínio já estiver em uso', async () => {
  vi.mocked(auth).mockResolvedValueOnce({ user: { id: 'user-1' }, expires: '' } as any)
  
  // Mock transaction by passing our mocked prisma to the callback
  vi.mocked(prisma.$transaction).mockImplementationOnce(async (callback: any) => {
    vi.mocked(prisma.tenant.findUnique).mockResolvedValueOnce({ id: 'existing', name: 'Existing', domain: 'loja', createdAt: new Date(), updatedAt: new Date() })
    return callback(prisma)
  })
  
  const result = await createTenant({ name: 'Loja', domain: 'loja' })
  expect(result).toEqual({ error: 'Este endereço já está em uso' })
})

test('cria a loja e associa ao usuário com sucesso', async () => {
  vi.mocked(auth).mockResolvedValueOnce({ user: { id: 'user-1' }, expires: '' } as any)
  
  vi.mocked(prisma.$transaction).mockImplementationOnce(async (callback: any) => {
    vi.mocked(prisma.tenant.findUnique).mockResolvedValueOnce(null)
    vi.mocked(prisma.tenant.create).mockResolvedValueOnce({ id: 'new-tenant-id', name: 'Loja', domain: 'loja', createdAt: new Date(), updatedAt: new Date() })
    vi.mocked(prisma.user.update).mockResolvedValueOnce({} as any)
    
    return callback(prisma)
  })
  
  const result = await createTenant({ name: 'Loja', domain: 'loja' })
  expect(result).toEqual({ success: true, tenantId: 'new-tenant-id', role: 'OWNER' })
  
  expect(prisma.tenant.create).toHaveBeenCalledWith({ data: { name: 'Loja', domain: 'loja' } })
  expect(prisma.user.update).toHaveBeenCalledWith({
    where: { id: 'user-1' },
    data: { tenantId: 'new-tenant-id', role: 'OWNER' }
  })
})
