import { beforeEach, expect, test, vi } from 'vitest'
import { fireEvent, render, screen, waitFor, act } from '@testing-library/react'
import { getTenantSettings, updateTenantSettings } from '@/lib/actions/tenant-settings'
import { tenantFixture } from '@/test/fixtures'
import SettingsPage from './page'
import { SettingsForm } from './settings-form'
vi.mock('@/lib/actions/tenant-settings', () => ({ getTenantSettings: vi.fn(), updateTenantSettings: vi.fn() }))
vi.mock('next/navigation', () => ({ redirect: vi.fn((url: string) => { throw new Error(url) }) }))
beforeEach(() => vi.resetAllMocks())
test.each(['/login', '/onboarding'] as const)('redireciona para %s', async redirect => {
  vi.mocked(getTenantSettings).mockResolvedValue({ redirect })
  await expect(SettingsPage()).rejects.toThrow(redirect)
})
test('carrega dados opcionais vazios e domínio somente leitura', async () => {
  vi.mocked(getTenantSettings).mockResolvedValue({ tenant: tenantFixture() })
  render(await SettingsPage())
  expect(screen.getByLabelText('Descrição')).toHaveValue('')
  expect(screen.getByLabelText('WhatsApp')).toHaveValue('')
  expect(screen.getByLabelText('Endereço da loja')).toHaveAttribute('readonly')
})
test('preserva entrada após erro e permite tentar novamente', async () => {
  vi.mocked(updateTenantSettings).mockResolvedValueOnce({ error: 'Não foi possível salvar as configurações. Tente novamente.' }).mockResolvedValueOnce({ success: true })
  render(<SettingsForm tenant={tenantFixture()} />)
  fireEvent.change(screen.getByLabelText('Nome da loja'), { target: { value: 'Nova Loja' } })
  fireEvent.click(screen.getByRole('button', { name: 'Salvar configurações' }))
  expect(await screen.findByRole('alert')).toHaveTextContent('Não foi possível salvar as configurações. Tente novamente.')
  expect(screen.getByLabelText('Nome da loja')).toHaveValue('Nova Loja')
  fireEvent.click(screen.getByRole('button', { name: 'Salvar configurações' }))
  expect(await screen.findByRole('status')).toHaveTextContent('Configurações salvas')
  expect(updateTenantSettings).toHaveBeenLastCalledWith({ name: 'Nova Loja', description: '', whatsapp: '' })
})
test('bloqueia envios enquanto pendente e trata falha de transporte', async () => {
  let reject!: (error: Error) => void
  vi.mocked(updateTenantSettings).mockReturnValue(new Promise((_, r) => { reject = r }))
  render(<SettingsForm tenant={tenantFixture()} />)
  fireEvent.click(screen.getByRole('button', { name: 'Salvar configurações' }))
  await waitFor(() => expect(screen.getByRole('button', { name: 'Salvando…' })).toBeDisabled())
  fireEvent.submit(screen.getByRole('button').closest('form')!)
  expect(updateTenantSettings).toHaveBeenCalledTimes(1)
  await act(async () => reject(new Error('rede')))
  expect(await screen.findByRole('alert')).toHaveTextContent('Tente novamente')
})
