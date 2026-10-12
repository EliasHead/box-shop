// @vitest-environment node
import { expect, test, vi } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { prisma } from '@/lib/prisma'
import { getTenantSettings, updateTenantSettings } from '@/lib/actions/tenant-settings'
import SettingsPage from '@/app/app/dashboard/settings/page'
import StorefrontPage from '@/app/[domain]/page'
import AppLayout from '@/app/app/layout'
const identity = vi.hoisted(() => ({ userId: '', tenantId: '' }))
vi.mock('@/auth', () => ({ auth: vi.fn(async () => ({ user: { id: identity.userId, tenantId: identity.tenantId } })), signOut: vi.fn() }))
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }))

test.skipIf(process.env.RUN_DATABASE_TESTS !== '1')('fluxo com PostgreSQL real preserva outra loja e permite limpar opcionais', async () => {
  const suffix = `${Date.now()}`
  const a = await prisma.tenant.create({ data: { name: 'Loja A', domain: `settings-a-${suffix}` } })
  const b = await prisma.tenant.create({ data: { name: 'Loja B', domain: `settings-b-${suffix}` } })
  const user = await prisma.user.create({ data: { tenantId: a.id } })
  identity.userId = user.id
  identity.tenantId = b.id // JWT obsoleto: o vínculo real deve prevalecer.
  try {
    expect((await getTenantSettings()).tenant?.description).toBeNull()
    expect(renderToStaticMarkup(await SettingsPage())).toContain('Configurações da loja')
    expect(await updateTenantSettings({ name: 'Nome atualizado', description: 'Descrição pública de teste', whatsapp: '+55 (11) 99999-9999', tenantId: b.id, domain: b.domain })).toEqual({ success: true })
    const loaded = (await getTenantSettings()).tenant!
    expect(loaded).toMatchObject({ id: a.id, domain: a.domain, name: 'Nome atualizado', description: 'Descrição pública de teste', whatsapp: '5511999999999' })
    expect(renderToStaticMarkup(await SettingsPage())).toContain('5511999999999')
    identity.tenantId = a.id
    expect(renderToStaticMarkup(await AppLayout({ children: null }))).toContain('Nome atualizado')
    identity.userId = '' // vitrine é independente de sessão.
    const html = renderToStaticMarkup(await StorefrontPage({ params: Promise.resolve({ domain: `${a.domain}.localhost:3000` }) }))
    expect(html).toContain('Nome atualizado')
    expect(html).toContain('Descrição pública de teste')
    expect(html).toContain('Nenhum produto ainda')
    expect(await prisma.tenant.findUnique({ where: { id: b.id } })).toEqual(b)
    identity.userId = user.id
    expect(await updateTenantSettings({ name: 'Nome atualizado', description: '', whatsapp: '' })).toEqual({ success: true })
    expect((await getTenantSettings()).tenant).toMatchObject({ description: null, whatsapp: null })
    expect(renderToStaticMarkup(await StorefrontPage({ params: Promise.resolve({ domain: a.domain }) }))).not.toContain('Descrição pública de teste')
  } finally {
    await prisma.user.delete({ where: { id: user.id } })
    await prisma.tenant.deleteMany({ where: { id: { in: [a.id, b.id] } } })
    await prisma.$disconnect()
  }
})
