import { expect, test, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import DashboardOverview from './page'
import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'
import { redirect } from 'next/navigation'

vi.mock('@/lib/prisma', () => ({
  prisma: {
    tenant: {
      findUnique: vi.fn()
    },
    product: {
      count: vi.fn()
    }
  }
}))

vi.mock('@/auth', () => ({
  auth: vi.fn()
}))

vi.mock('next/navigation', () => ({
  redirect: vi.fn(() => {
    throw new Error('NEXT_REDIRECT')
  })
}))

beforeEach(() => {
  vi.clearAllMocks()
})

test('redireciona para login se usuário não estiver autenticado ou não tiver tenantId', async () => {
  vi.mocked(auth).mockResolvedValueOnce(null as any)
  
  await expect(DashboardOverview()).rejects.toThrow('NEXT_REDIRECT')
  expect(redirect).toHaveBeenCalledWith('/app/onboarding')
})

test('renderiza o dashboard com a url da loja e contagem de produtos', async () => {
  vi.mocked(auth).mockResolvedValueOnce({ 
    user: { id: 'user-1', tenantId: 'tenant-1' }, 
    expires: '' 
  } as any)
  
  vi.mocked(prisma.tenant.findUnique).mockResolvedValueOnce({
    id: 'tenant-1',
    name: 'Minha Super Loja',
    domain: 'superloja',
    createdAt: new Date(),
    updatedAt: new Date()
  })
  
  vi.mocked(prisma.product.count).mockResolvedValueOnce(42)
  
  const jsx = await DashboardOverview()
  render(jsx)
  
  // Verify storefront URL
  expect(screen.getByText('http://superloja.localhost:3000')).toBeDefined()
  
  // Verify product count
  expect(screen.getByText('42')).toBeDefined()
  expect(screen.getByText('Produtos Cadastrados')).toBeDefined()
})
