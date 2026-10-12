import { beforeEach, expect, test, vi } from 'vitest'
import type { Session } from 'next-auth'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { sessionFixture, tenantFixture, userFixture } from '@/test/fixtures'
import { getTenantSettings, updateTenantSettings } from './tenant-settings'
vi.mock('@/auth', () => ({ auth: vi.fn() }))
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }))
vi.mock('@/lib/prisma', () => ({ prisma: {
  user: { findUnique: vi.fn() }, tenant: { findUnique: vi.fn(), update: vi.fn() },
  $transaction: vi.fn(async (callback: (tx: Pick<typeof prisma, 'user' | 'tenant'>) => Promise<unknown>) => callback(prisma)),
} }))
const sessionAuth = vi.mocked(auth as () => Promise<Session | null>)
const input = { name: ' Nova Loja ', description: ' Apresentação ', whatsapp: '+55 (11) 99999-9999', tenantId: 'outra', domain: 'outra' }
beforeEach(() => {
  vi.resetAllMocks()
  sessionAuth.mockResolvedValue(sessionFixture({ tenantId: 'obsoleto' }))
  vi.mocked(prisma.user.findUnique).mockResolvedValue(userFixture())
  vi.mocked(prisma.tenant.findUnique).mockResolvedValue(tenantFixture())
  vi.mocked(prisma.tenant.update).mockResolvedValue(tenantFixture())
  vi.mocked(prisma.$transaction).mockImplementation(async callback => {
    if (typeof callback !== 'function') throw new Error('callback esperado')
    return callback(prisma)
  })
})
test('consulta pelo vínculo no banco e ignora JWT obsoleto', async () => {
  expect((await getTenantSettings()).tenant?.id).toBe('tenant-1')
  expect(prisma.tenant.findUnique).toHaveBeenCalledWith({ where: { id: 'tenant-1' } })
})
test('salva somente campos permitidos na própria loja e revalida destinos', async () => {
  expect(await updateTenantSettings(input)).toEqual({ success: true })
  expect(prisma.tenant.update).toHaveBeenCalledWith({ where: { id: 'tenant-1' }, data: { name: 'Nova Loja', description: 'Apresentação', whatsapp: '5511999999999' } })
  expect(revalidatePath).toHaveBeenCalledWith('/app/dashboard/settings')
  expect(revalidatePath).toHaveBeenCalledWith('/app', 'layout')
  expect(revalidatePath).toHaveBeenCalledWith('/loja.localhost:3000')
})
test.each(['sessão', 'usuário', 'loja'])('nega acesso sem %s', async kind => {
  if (kind === 'sessão') sessionAuth.mockResolvedValue(null)
  if (kind === 'usuário') vi.mocked(prisma.user.findUnique).mockResolvedValue(null)
  if (kind === 'loja') vi.mocked(prisma.user.findUnique).mockResolvedValue(userFixture({ tenantId: null }))
  expect(await getTenantSettings()).toEqual({ redirect: kind === 'loja' ? '/onboarding' : '/login' })
  expect((await updateTenantSettings(input)).error).toBeTruthy()
  expect(prisma.tenant.update).not.toHaveBeenCalled()
})
test('loja inexistente redireciona para onboarding', async () => {
  vi.mocked(prisma.tenant.findUnique).mockResolvedValue(null)
  expect(await getTenantSettings()).toEqual({ redirect: '/onboarding' })
})
test('entrada inválida não escreve', async () => {
  expect((await updateTenantSettings({ ...input, name: ' ' })).error).toBeTruthy()
  expect(prisma.tenant.update).not.toHaveBeenCalled()
})
test('falha de banco retorna mensagem segura', async () => {
  vi.mocked(prisma.$transaction).mockRejectedValueOnce(new Error('segredo do banco'))
  const log = vi.spyOn(console, 'error').mockImplementation(() => {})
  expect((await updateTenantSettings(input)).error).toBe('Não foi possível salvar as configurações. Tente novamente.')
  expect(revalidatePath).not.toHaveBeenCalled()
  log.mockRestore()
})
