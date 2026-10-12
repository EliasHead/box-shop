import { expect, test } from 'vitest'
import { validateTenantSettings } from './tenant-settings'
const valid = { name: ' Loja ', description: ' Texto ', whatsapp: '+55 (11) 99999-9999' }
test('normaliza dados e permite remover opcionais', () => {
  expect(validateTenantSettings(valid)).toEqual({ data: { name: 'Loja', description: 'Texto', whatsapp: '5511999999999' } })
  expect(validateTenantSettings({ ...valid, description: ' ', whatsapp: ' ' })).toEqual({ data: { name: 'Loja', description: null, whatsapp: null } })
})
test.each([null, {}, { ...valid, name: 1 }, { ...valid, name: ' ' }, { ...valid, name: 'x'.repeat(101) }, { ...valid, description: 'x'.repeat(501) }, ...['abc5511999999999', '1234567', '0123456789', '1'.repeat(16), '55+11999999999', '---', '55.11999999999'].map(whatsapp => ({ ...valid, whatsapp }))])('rejeita entrada inválida %j', input => {
  expect(validateTenantSettings(input).error).toBeTruthy()
})
test.each(['12345678', '1'.repeat(15)])('aceita limites de telefone %s', whatsapp => {
  expect(validateTenantSettings({ ...valid, name: 'x'.repeat(100), description: 'x'.repeat(500), whatsapp }).data).toBeDefined()
})
