import { expect, test, vi, beforeEach } from 'vitest'
import bcrypt from 'bcryptjs'
import { authorizeUser } from '@/auth'
import { prisma } from '@/lib/prisma'

vi.mock('bcryptjs', () => ({
  default: {
    compare: vi.fn()
  }
}))

vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: vi.fn()
    }
  }
}))

beforeEach(() => {
  vi.clearAllMocks()
})

test('retorna nulo se credenciais estiverem faltando', async () => {
  const result = await authorizeUser({})
  expect(result).toBeNull()
})

test('retorna nulo se o usuário não for encontrado no banco', async () => {
  vi.mocked(prisma.user.findUnique).mockResolvedValueOnce(null)
  
  const result = await authorizeUser({ email: 'fake@email.com', password: '123' })
  expect(result).toBeNull()
})

test('retorna nulo se a senha estiver incorreta', async () => {
  vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
    id: '1',
    email: 'test@email.com',
    password: 'hashedpassword',
    role: 'ADMIN',
    tenantId: '123',
    name: 'Test',
    emailVerified: null,
    image: null,
    createdAt: new Date(),
    updatedAt: new Date()
  })
  
  vi.mocked(bcrypt.compare).mockResolvedValueOnce(false as never)
  
  const result = await authorizeUser({ email: 'test@email.com', password: 'wrongpassword' })
  expect(result).toBeNull()
})

test('retorna o usuário se as credenciais forem válidas', async () => {
  vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
    id: '1',
    email: 'test@email.com',
    password: 'hashedpassword',
    role: 'ADMIN',
    tenantId: '123',
    name: 'Test',
    emailVerified: null,
    image: null,
    createdAt: new Date(),
    updatedAt: new Date()
  })
  
  vi.mocked(bcrypt.compare).mockResolvedValueOnce(true as never)
  
  const result = await authorizeUser({ email: 'test@email.com', password: 'correctpassword' })
  
  expect(result).toEqual({
    id: '1',
    name: 'Test',
    email: 'test@email.com',
    role: 'ADMIN',
    tenantId: '123'
  })
})
