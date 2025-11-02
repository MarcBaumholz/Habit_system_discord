import React from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import Hero from '../Hero'

const pushMock = (globalThis as { __nextRouterPushMock: ReturnType<typeof vi.fn> }).__nextRouterPushMock

describe('Hero problem search', () => {
  beforeEach(() => {
    pushMock.mockReset()
  })

  it('routes to search with hero source metadata', async () => {
    render(<Hero />)

    const input = screen.getByPlaceholderText('Woran möchtest du arbeiten?')
    await userEvent.type(input, 'regelmaessig laufen')
    await userEvent.click(screen.getByRole('button', { name: 'Suche starten' }))

    expect(pushMock).toHaveBeenCalledWith(
      expect.stringContaining('source=hero'),
    )
    expect(pushMock).toHaveBeenCalledWith(
      expect.stringContaining('regelmaessig+laufen'),
    )
  })
})

