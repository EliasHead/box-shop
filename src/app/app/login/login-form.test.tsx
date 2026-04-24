import { render, screen } from '@testing-library/react'
import { test, expect, vi } from 'vitest'
import { LoginForm } from './login-form'
import React from 'react'

vi.mock('./actions', () => ({
  loginAction: vi.fn()
}))

test('renderiza o formulário de login corretamente', () => {
  render(<LoginForm />)
  expect(screen.getByLabelText('E-mail')).toBeDefined()
  expect(screen.getByLabelText('Senha')).toBeDefined()
  expect(screen.getByRole('button', { name: /entrar no painel/i })).toBeDefined()
})


