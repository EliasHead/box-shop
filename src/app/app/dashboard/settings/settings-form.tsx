'use client'

import { useRef, useState } from 'react'
import { updateTenantSettings } from '@/lib/actions/tenant-settings'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

type Settings = { name: string; domain: string; description: string | null; whatsapp: string | null }

export function SettingsForm({ tenant }: { tenant: Settings }) {
  const [name, setName] = useState(tenant.name)
  const [description, setDescription] = useState(tenant.description || '')
  const [whatsapp, setWhatsapp] = useState(tenant.whatsapp || '')
  const [pending, setPending] = useState(false)
  const [message, setMessage] = useState<{ error?: string; success?: boolean }>({})
  const saving = useRef(false)

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (saving.current) return
    saving.current = true
    setPending(true)
    setMessage({})
    try {
      setMessage(await updateTenantSettings({ name, description, whatsapp }))
    } catch {
      setMessage({ error: 'Não foi possível salvar as configurações. Tente novamente.' })
    } finally {
      saving.current = false
      setPending(false)
    }
  }

  return (
    <section className="rounded-xl border bg-background p-6">
      <h1 className="text-2xl font-semibold">Configurações da loja</h1>
      <p className="mt-2 text-sm text-muted-foreground">Atualize a apresentação e o contato da sua loja.</p>
      <form onSubmit={submit} className="mt-6 space-y-5" aria-busy={pending}>
        <fieldset disabled={pending} className="space-y-5">
          <div className="space-y-2"><Label htmlFor="store-name">Nome da loja</Label><Input id="store-name" required maxLength={100} value={name} onChange={e => setName(e.target.value)} /></div>
          <div className="space-y-2"><Label htmlFor="store-domain">Endereço da loja</Label><Input id="store-domain" value={tenant.domain} readOnly /></div>
          <div className="space-y-2"><Label htmlFor="store-description">Descrição</Label><Textarea id="store-description" maxLength={500} value={description} onChange={e => setDescription(e.target.value)} /><p className="text-sm text-muted-foreground">Opcional. Até 500 caracteres, exibidos na vitrine.</p></div>
          <div className="space-y-2"><Label htmlFor="store-whatsapp">WhatsApp</Label><Input id="store-whatsapp" type="tel" aria-describedby="whatsapp-help" value={whatsapp} onChange={e => setWhatsapp(e.target.value)} /><p id="whatsapp-help" className="text-sm text-muted-foreground">Opcional. Inclua o código do país e DDD, por exemplo: +55 (11) 99999-9999.</p></div>
          <Button type="submit" disabled={pending}>{pending ? 'Salvando…' : 'Salvar configurações'}</Button>
        </fieldset>
        {message.error && <p role="alert" className="text-sm text-destructive">{message.error}</p>}
        {message.success && <p role="status" className="text-sm text-emerald-700">Configurações salvas com sucesso.</p>}
      </form>
    </section>
  )
}
