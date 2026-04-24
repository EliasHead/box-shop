import { vi } from 'vitest'
import '@testing-library/jest-dom'
import React from 'react'

// Mock do Next.js router
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
    refresh: vi.fn(),
  }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
}))

vi.mock('next/server', () => ({
  NextResponse: {
    json: vi.fn(),
    redirect: vi.fn(),
    rewrite: vi.fn(),
    next: vi.fn(),
  },
  NextRequest: class NextRequest {}
}))

// Mock do Next.js React features
vi.mock('react', async (importOriginal) => {
  const actual = await importOriginal<typeof React>()
  return {
    ...actual,
    useActionState: vi.fn((action, initialState) => [initialState, action, false]),
  }
})

// Mock completo do next-auth para evitar erros de resolução com next/server no Vitest
vi.mock('next-auth', () => ({
  default: vi.fn(() => ({
    handlers: {},
    auth: vi.fn(),
    signIn: vi.fn(),
    signOut: vi.fn(),
  })),
  AuthError: class AuthError extends Error {
    type: string;
    constructor(type: string = 'CredentialsSignin') {
      super();
      this.type = type;
    }
  }
}))

vi.mock('next-auth/providers/credentials', () => ({
  default: vi.fn()
}))
