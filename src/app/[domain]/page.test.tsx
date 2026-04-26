import { expect, test, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import StorefrontPage from './page'
import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'

vi.mock('@/lib/prisma', () => ({
  prisma: {
    tenant: {
      findUnique: vi.fn()
    },
    product: {
      findMany: vi.fn()
    }
  }
}))

vi.mock('next/navigation', () => ({
  notFound: vi.fn(() => {
    throw new Error('NEXT_NOT_FOUND')
  })
}))

beforeEach(() => {
  vi.clearAllMocks()
})

test('dispara notFound se a loja não existir', async () => {
  vi.mocked(prisma.tenant.findUnique).mockResolvedValueOnce(null)
  
  await expect(StorefrontPage({ params: Promise.resolve({ domain: 'loja-inexistente.localhost:3000' }) })).rejects.toThrow('NEXT_NOT_FOUND')
  expect(notFound).toHaveBeenCalled()
})

test('renderiza a loja com a mensagem de estado vazio se não houver produtos', async () => {
  vi.mocked(prisma.tenant.findUnique).mockResolvedValueOnce({
    id: 'tenant-1',
    name: 'Loja Vazia',
    domain: 'loja-vazia',
    createdAt: new Date(),
    updatedAt: new Date()
  })
  
  vi.mocked(prisma.product.findMany).mockResolvedValueOnce([])
  
  const jsx = await StorefrontPage({ params: Promise.resolve({ domain: 'loja-vazia.localhost:3000' }) })
  render(jsx)
  
  expect(screen.getByText('Loja Vazia')).toBeDefined()
  expect(screen.getByText('Nenhum produto ainda')).toBeDefined()
})

test('renderiza os produtos corretamente se existirem', async () => {
  vi.mocked(prisma.tenant.findUnique).mockResolvedValueOnce({
    id: 'tenant-1',
    name: 'Loja Cheia',
    domain: 'loja-cheia',
    createdAt: new Date(),
    updatedAt: new Date()
  })
  
  vi.mocked(prisma.product.findMany).mockResolvedValueOnce([
    {
      id: 'prod-1',
      name: 'Tênis Maneiro',
      description: 'Um tênis muito maneiro',
      price: 199.90,
      tenantId: 'tenant-1',
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ])
  
  const jsx = await StorefrontPage({ params: Promise.resolve({ domain: 'loja-cheia.localhost:3000' }) })
  render(jsx)
  
  expect(screen.getByText('Loja Cheia')).toBeDefined()
  expect(screen.getByText('Tênis Maneiro')).toBeDefined()
  expect(screen.getByText('Um tênis muito maneiro')).toBeDefined()
  expect(screen.getByText('R$ 199,90')).toBeDefined()
})
