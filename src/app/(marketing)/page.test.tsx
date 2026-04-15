import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import MarketingPage from './page'

describe('MarketingPage', () => {
  it('should render the main heading', () => {
    render(<MarketingPage />)
    const heading = screen.getByRole('heading', { level: 1 })
    expect(heading).toBeDefined()
    expect(heading.textContent).toContain('Venda por WhatsApp com o BoxShop')
  })
})
