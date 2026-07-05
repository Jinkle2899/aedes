import { expect, test } from '@playwright/test'

const site = {
  id: 'e2e-site',
  name: 'E2E site',
  kind: 'SaaS',
  updatedAt: Date.now(),
  blocks: [
    {
      id: 'nav',
      type: 'navbar',
      props: { brand: 'Aedes', links: ['Work', 'Pricing', 'Contact'], cta: 'Start' },
    },
    {
      id: 'hero',
      type: 'hero',
      props: {
        heading: 'Launch faster',
        sub: 'Build polished pages without code.',
        button: 'Start now',
        align: 'center',
        tone: 'light',
      },
    },
    {
      id: 'section',
      type: 'section',
      props: {},
      children: [
        {
          id: 'text-a',
          type: 'text',
          props: { heading: 'Original section', body: 'Ready to edit.' },
        },
      ],
    },
    {
      id: 'footer',
      type: 'footer',
      props: { text: 'Built with Aedes' },
    },
  ],
}

test.beforeEach(async ({ page }) => {
  await page.addInitScript((seed) => {
    window.localStorage.setItem('aedes:sites', JSON.stringify([seed]))
    window.localStorage.setItem('aedes:blockMeta', JSON.stringify({ counts: {}, favs: [], recents: [] }))
  }, site)
})

test('full editor flow persists local edits', async ({ page }) => {
  await page.goto('/app/editor/e2e-site')
  await expect(page.getByDisplayValue('E2E site')).toBeVisible()
  await expect(page.getByText('Launch faster')).toBeVisible()

  await page.locator('.palette-item', { hasText: 'Image' }).dragTo(page.locator('.ed-canvas-wrap'))
  await expect(page.getByText('Image')).toBeVisible()

  await page.getByText('Original section').click()
  await page.getByLabel('Heading').fill('Edited section')
  await expect(page.getByText('Edited section')).toBeVisible()

  await page.keyboard.press(process.platform === 'darwin' ? 'Meta+Z' : 'Control+Z')
  await expect(page.getByText('Original section')).toBeVisible()
  await page.keyboard.press(process.platform === 'darwin' ? 'Meta+Shift+Z' : 'Control+Shift+Z')
  await expect(page.getByText('Edited section')).toBeVisible()

  await page.keyboard.press(process.platform === 'darwin' ? 'Meta+K' : 'Control+K')
  await page.getByPlaceholder('Search blocks — or pick a suggestion…').fill('quote')
  await page.keyboard.press('Enter')
  await expect(page.getByText('“Design is intelligence made visible.”')).toBeVisible()

  await page.keyboard.press(process.platform === 'darwin' ? 'Meta+G' : 'Control+G')
  await page.getByPlaceholder('Describe a section — e.g. “a testimonial” or “contact form”').fill('contact form')
  await page.keyboard.press('Enter')
  await expect(page.getByText('Send us a note')).toBeVisible()

  await page.getByRole('button', { name: 'Preview' }).click()
  await expect(page.getByRole('button', { name: 'Exit preview' })).toBeVisible()
  await page.getByRole('button', { name: 'Exit preview' }).click()

  await page.reload()
  await expect(page.getByText('Edited section')).toBeVisible()
  await expect(page.getByText('Send us a note')).toBeVisible()
})
