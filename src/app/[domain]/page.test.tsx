import { expect, test, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import StorefrontPage from './page'
import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import { createElement } from 'react'
import { productFixture, tenantFixture } from '@/test/fixtures'
import type { Prisma } from '@prisma/client'

vi.mock('next/image', () => ({
  default: ({ src, alt }: { src: string; alt: string }) => createElement('img', { src, alt }),
}))

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
    description: null,
    whatsapp: null,
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
    description: null,
    whatsapp: null,
    createdAt: new Date(),
    updatedAt: new Date()
  })
  
  vi.mocked(prisma.product.findMany).mockResolvedValueOnce([
    {
      ...productFixture(),
      status: 'ACTIVE',
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
  expect(screen.getByRole('img', { name: 'Tênis Maneiro' })).toHaveAttribute('src', expect.stringContaining('https://images.unsplash.com/'))
})

test.each([
  { label: 'catálogo misto', onlyDrafts: false },
  { label: 'somente rascunhos', onlyDrafts: true },
])('exibe apenas produtos publicados da loja: $label', async ({ onlyDrafts }) => {
  vi.mocked(prisma.tenant.findUnique).mockResolvedValueOnce(tenantFixture())
  const products = [
    productFixture({ id: 'draft', name: 'Rascunho privado' }),
    productFixture({ id: 'other', name: 'Produto de outra loja', tenantId: 'tenant-2', status: 'ACTIVE' }),
    ...onlyDrafts ? [] : [
      productFixture({ id: 'active-old', name: 'Publicado antigo', status: 'ACTIVE', createdAt: new Date('2026-10-01') }),
      productFixture({ id: 'active-new', name: 'Publicado recente', status: 'ACTIVE', createdAt: new Date('2026-10-12') }),
    ],
  ]
  vi.mocked(prisma.product.findMany).mockImplementationOnce((args) => {
    const visibleProducts = products.filter(product =>
      (!args?.where?.tenantId || product.tenantId === args.where.tenantId) &&
      (!args?.where?.status || product.status === args.where.status)
    ).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    return Object.defineProperty(Promise.resolve(visibleProducts), Symbol.toStringTag, {
      value: 'PrismaPromise',
    }) as Prisma.PrismaPromise<typeof products>
  })

  render(await StorefrontPage({ params: Promise.resolve({ domain: 'loja.localhost:3000' }) }))

  expect(prisma.tenant.findUnique).toHaveBeenCalledWith({ where: { domain: 'loja' } })
  expect(prisma.product.findMany).toHaveBeenCalledWith({
    where: { tenantId: 'tenant-1', status: 'ACTIVE' },
    orderBy: { createdAt: 'desc' },
  })
  expect(screen.queryByText('Rascunho privado')).not.toBeInTheDocument()
  expect(screen.queryByText('Produto de outra loja')).not.toBeInTheDocument()
  if (onlyDrafts) {
    expect(screen.getByText('Nenhum produto ainda')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Comprar' })).not.toBeInTheDocument()
  } else {
    expect(screen.getAllByRole('heading', { level: 3 }).map(heading => heading.textContent))
      .toEqual(['Publicado recente', 'Publicado antigo'])
  }
})

test.each([null, 'Descrição pública'])('identidade pública em loja vazia: %s', async description => {
  vi.mocked(prisma.tenant.findUnique).mockResolvedValue(tenantFixture({ name: 'Nome atualizado', description }))
  vi.mocked(prisma.product.findMany).mockResolvedValue([])
  render(await StorefrontPage({ params: Promise.resolve({ domain: 'loja.localhost:3000' }) }))
  expect(screen.getByText('Nome atualizado')).toBeInTheDocument()
  if (description) expect(screen.getByText(description)).toBeInTheDocument()
  else expect(screen.queryByText('Descrição pública')).not.toBeInTheDocument()
})
