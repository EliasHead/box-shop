export type TenantSettingsInput = { name: string; description: string; whatsapp: string }

export function validateTenantSettings(input: unknown) {
  if (!input || typeof input !== 'object') return { error: 'Dados inválidos.' } as const
  const data = input as Record<string, unknown>
  if (typeof data.name !== 'string' || typeof data.description !== 'string' || typeof data.whatsapp !== 'string') {
    return { error: 'Dados inválidos.' } as const
  }
  const name = data.name.trim()
  const description = data.description.trim() || null
  const phone = data.whatsapp.trim()
  if (!name || name.length > 100) return { error: 'O nome deve ter entre 1 e 100 caracteres.' } as const
  if (description && description.length > 500) return { error: 'A descrição deve ter até 500 caracteres.' } as const
  const whatsapp = phone.replace(/[ ()-]/g, '').replace(/^\+/, '') || null
  if (phone && (!/^\+?[0-9 ()-]+$/.test(phone) || !whatsapp || !/^[1-9][0-9]{7,14}$/.test(whatsapp))) {
    return { error: 'Informe o WhatsApp com código do país e entre 8 e 15 dígitos.' } as const
  }
  return { data: { name, description, whatsapp } } as const
}
