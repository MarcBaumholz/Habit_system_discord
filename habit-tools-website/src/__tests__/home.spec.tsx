import { render, screen, within } from '@testing-library/react'

import Home from '@/app/page'

describe('Home page layout', () => {
  it('renders hero section with the planned call to action', () => {
    render(<Home />)

    expect(
      screen.getByRole('heading', { level: 1, name: /habit toolbox/i }),
    ).toBeInTheDocument()

    expect(screen.getByRole('button', { name: 'Browse tools' })).toBeInTheDocument()

    expect(
      screen.getByPlaceholderText('Woran möchtest du arbeiten?'),
    ).toBeInTheDocument()
  })

  it('renders navigation with an accessible label and primary CTA', () => {
    render(<Home />)

    const navigation = screen.getByRole('navigation', { name: 'Primary' })

    expect(
      within(navigation).getByRole('link', { name: 'Habit Toolbox' }),
    ).toHaveAttribute('href', '/')

    expect(within(navigation).getByRole('link', { name: 'Tools' })).toBeInTheDocument()

    expect(
      within(navigation).getByRole('button', { name: 'Get started' }),
    ).toBeInTheDocument()
  })

  it('shows six featured tools and a view-all link', () => {
    render(<Home />)

    const cards = screen.getAllByTestId('featured-tool-card')
    expect(cards).toHaveLength(6)

    expect(screen.getByRole('link', { name: 'View all tools' })).toHaveAttribute(
      'href',
      '/tools',
    )
  })
})

