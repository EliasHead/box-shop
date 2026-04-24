import { expect, test, vi } from 'vitest'
import { loginAction } from './actions'
import { signIn } from '@/auth'
import { AuthError } from 'next-auth'

vi.mock('@/auth', () => ({
  signIn: vi.fn()
}))

test('retorna undefined em caso de sucesso', async () => {
  vi.mocked(signIn).mockResolvedValueOnce(undefined as never)
  
  const formData = new FormData()
  formData.append('email', 'test@test.com')
  formData.append('password', '123')
  
  const result = await loginAction(undefined, formData)
  expect(result).toBeUndefined()
  expect(signIn).toHaveBeenCalledWith('credentials', formData)
})

test('retorna mensagem correta para credenciais inválidas', async () => {
  class CustomAuthError extends AuthError {
    type = "CredentialsSignin" as const
  }
  
  vi.mocked(signIn).mockRejectedValueOnce(new CustomAuthError())
  
  const formData = new FormData()
  const result = await loginAction(undefined, formData)
  
  expect(result).toBe('E-mail ou senha inválidos.')
})

test('retorna mensagem genérica para outros erros', async () => {
  class OtherAuthError extends AuthError {
    type = "AccessDenied" as const
  }
  
  vi.mocked(signIn).mockRejectedValueOnce(new OtherAuthError())
  
  const formData = new FormData()
  const result = await loginAction(undefined, formData)
  
  expect(result).toBe('Ocorreu um erro inesperado.')
})
