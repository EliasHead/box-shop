import { getTenantSettings } from '@/lib/actions/tenant-settings'
import { redirect } from 'next/navigation'
import { SettingsForm } from './settings-form'

export const metadata = { title: 'Configurações | BoxShop' }

export default async function SettingsPage() {
  const result = await getTenantSettings()
  if (result.redirect) redirect(result.redirect)
  return <div className="mx-auto w-full max-w-2xl"><SettingsForm tenant={result.tenant} /></div>
}
