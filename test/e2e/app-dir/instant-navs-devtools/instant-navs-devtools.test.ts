import { nextTestSetup } from 'e2e-utils'
import {
  retry,
  waitForDevToolsIndicator,
  toggleDevToolsIndicatorPopover,
} from 'next-test-utils'

describe('instant-nav-panel', () => {
  const { next } = nextTestSetup({
    files: __dirname,
    skipDeployment: true,
  })

  async function clearInstantModeCookie(browser: any) {
    await browser.eval(() => {
      document.cookie = 'next-instant-navigation-testing=; path=/; max-age=0'
    })
  }

  async function clickInstantNavMenuItem(browser: any) {
    await browser.eval(() => {
      const portal = [].slice
        .call(document.querySelectorAll('nextjs-portal'))
        .find((p: any) =>
          p.shadowRoot.querySelector('[data-nextjs-toast]')
        ) as any
      portal?.shadowRoot?.querySelector('[data-instant-nav]')?.click()
    })
  }

  async function clickStartClientNav(browser: any) {
    await browser.eval(() => {
      const portal = [].slice
        .call(document.querySelectorAll('nextjs-portal'))
        .find((p: any) =>
          p.shadowRoot.querySelector('[data-nextjs-toast]')
        ) as any
      portal?.shadowRoot?.querySelector('[data-instant-nav-client]')?.click()
    })
  }

  async function getBadgeStatus(browser: any): Promise<string> {
    return browser.eval(() => {
      const portal = [].slice
        .call(document.querySelectorAll('nextjs-portal'))
        .find((p: any) =>
          p.shadowRoot.querySelector('[data-nextjs-toast]')
        ) as any
      return (
        portal?.shadowRoot
          ?.querySelector('[data-next-badge]')
          ?.getAttribute('data-status') || ''
      )
    })
  }

  async function getPanelText(browser: any): Promise<string> {
    return browser.eval(() => {
      const portal = [].slice
        .call(document.querySelectorAll('nextjs-portal'))
        .find((p: any) =>
          p.shadowRoot.querySelector('[data-nextjs-toast]')
        ) as any
      const panel = portal?.shadowRoot?.querySelector('.instant-nav-panel')
      return panel?.innerText || ''
    })
  }

  async function hasPanelOpen(browser: any): Promise<boolean> {
    return browser.eval(() => {
      const portal = [].slice
        .call(document.querySelectorAll('nextjs-portal'))
        .find((p: any) =>
          p.shadowRoot.querySelector('[data-nextjs-toast]')
        ) as any
      return !!portal?.shadowRoot?.querySelector('.instant-nav-panel')
    })
  }

  async function closePanelViaHeader(browser: any) {
    await browser.eval(() => {
      const portal = [].slice
        .call(document.querySelectorAll('nextjs-portal'))
        .find((p: any) =>
          p.shadowRoot.querySelector('[data-nextjs-toast]')
        ) as any
      portal?.shadowRoot?.querySelector('#_next-devtools-panel-close')?.click()
    })
  }

  async function openInstantNavPanel(browser: any) {
    await waitForDevToolsIndicator(browser)
    await toggleDevToolsIndicatorPopover(browser)
    await clickInstantNavMenuItem(browser)
  }

  it('should open panel in waiting state without setting cookie', async () => {
    const browser = await next.browser('/')
    await clearInstantModeCookie(browser)
    await browser.waitForElementByCss('[data-testid="home-title"]')

    await retry(async () => {
      const status = await getBadgeStatus(browser)
      expect(status).toBe('none')
    })

    await openInstantNavPanel(browser)

    await retry(async () => {
      const text = await getPanelText(browser)
      expect(text).toContain('Page load')
      expect(text).toContain('Client navigation')
    })

    const cookie = await browser.eval(() => document.cookie)
    expect(cookie).not.toContain('next-instant-navigation-testing=')

    await clearInstantModeCookie(browser)
  })

  it('should show client nav state after clicking Start and navigating', async () => {
    const browser = await next.browser('/')
    await clearInstantModeCookie(browser)
    await browser.waitForElementByCss('[data-testid="home-title"]')

    await retry(async () => {
      const status = await getBadgeStatus(browser)
      expect(status).toBe('none')
    })

    await openInstantNavPanel(browser)

    await retry(async () => {
      expect(await hasPanelOpen(browser)).toBe(true)
    })

    await clickStartClientNav(browser)

    await retry(async () => {
      const cookie = await browser.eval(() => document.cookie)
      expect(cookie).toContain('next-instant-navigation-testing=')
    })

    await retry(async () => {
      const text = await getPanelText(browser)
      expect(text).toContain('Client navigation')
      expect(text).toContain('Click any link')
    })

    await browser.eval(() => {
      document.querySelector<HTMLAnchorElement>('#link-to-target')!.click()
    })

    await retry(async () => {
      const text = await getPanelText(browser)
      expect(text).toContain('Client navigation')
      expect(text).toContain('prefetched UI')
      expect(text).toContain('Continue rendering')
    })

    await clearInstantModeCookie(browser)
  })

  it('should show loading skeleton during SPA navigation after clicking Start', async () => {
    const browser = await next.browser('/')
    await clearInstantModeCookie(browser)
    await browser.waitForElementByCss('[data-testid="home-title"]')

    await openInstantNavPanel(browser)

    await retry(async () => {
      expect(await hasPanelOpen(browser)).toBe(true)
    })

    await clickStartClientNav(browser)

    await browser.eval(() => {
      document.querySelector<HTMLAnchorElement>('#link-to-target')!.click()
    })

    await retry(
      async () => {
        const skeleton = await browser.hasElementByCss(
          '[data-testid="dynamic-skeleton"]'
        )
        expect(skeleton).toBe(true)
      },
      30000,
      500
    )

    await clearInstantModeCookie(browser)
  })

  it('should auto-open panel on page load when cookie is already set', async () => {
    const browser = await next.browser('/')
    await clearInstantModeCookie(browser)
    await browser.waitForElementByCss('[data-testid="home-title"]')

    await openInstantNavPanel(browser)
    await retry(async () => {
      expect(await hasPanelOpen(browser)).toBe(true)
    })
    await clickStartClientNav(browser)

    await browser.refresh()
    await browser.waitForElementByCss('[data-testid="home-title"]')

    await retry(async () => {
      expect(await hasPanelOpen(browser)).toBe(true)
    })

    await clearInstantModeCookie(browser)
  })

  it('should not set cookie when closing panel from waiting state', async () => {
    const browser = await next.browser('/')
    await clearInstantModeCookie(browser)
    await browser.waitForElementByCss('[data-testid="home-title"]')

    await openInstantNavPanel(browser)

    const cookie = await browser.eval(() => document.cookie)
    expect(cookie).not.toContain('next-instant-navigation-testing=')

    await closePanelViaHeader(browser)

    await retry(async () => {
      const cookieAfter = await browser.eval(() => document.cookie)
      expect(cookieAfter).not.toContain('next-instant-navigation-testing=')
    })
  })
})
