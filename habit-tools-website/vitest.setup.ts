import '@testing-library/jest-dom/vitest'
import React from 'react'
import { afterEach, vi } from 'vitest'
import { cleanup } from '@testing-library/react'

afterEach(() => {
  cleanup()
})

vi.mock('next/link', () => {
  const Link = React.forwardRef<
    HTMLAnchorElement,
    React.PropsWithChildren<
      React.ComponentProps<'a'> & {
        href: string | URL | { pathname?: string; href?: string }
      }
    >
  >(({ href, children, ...rest }, ref) => {
    const normalizedHref =
      typeof href === 'string'
        ? href
        : href instanceof URL
          ? href.toString()
          : href?.href ?? href?.pathname ?? ''

    return React.createElement('a', { ...rest, href: normalizedHref, ref }, children)
  })

  Link.displayName = 'NextLinkMock'

  return {
    __esModule: true,
    default: Link,
  }
})

const routerPushMock = vi.fn()

vi.mock('next/navigation', () => {
  const router = {
    push: (...args: unknown[]) => routerPushMock(...args),
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
  }

  return {
    __esModule: true,
    useRouter: () => router,
    usePathname: () => '/',
    useSearchParams: () => new URLSearchParams(),
  }
})

Object.assign(globalThis, { __nextRouterPushMock: routerPushMock })

if (!('IntersectionObserver' in globalThis)) {
  class MockIntersectionObserver {
    readonly root = null
    readonly rootMargin = ''
    readonly thresholds = []

    observe() {}
    unobserve() {}
    disconnect() {}
    takeRecords() {
      return []
    }
  }

  Object.assign(globalThis, {
    IntersectionObserver: MockIntersectionObserver,
  })
}

