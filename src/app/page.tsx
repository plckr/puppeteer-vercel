import { dev } from '@/lib/constants'
import Chromium from '@sparticuz/chromium-min'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import puppeteer, { PuppeteerLaunchOptions } from 'puppeteer-core'

export const localExecutablePath =
  process.platform === 'win32'
    ? 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
    : process.platform === 'linux'
    ? '/usr/bin/google-chrome'
    : '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'

async function getPuppeteerOptions(options: PuppeteerLaunchOptions = {}) {
  if (dev) {
    return {
      args: puppeteer.defaultArgs(),
      executablePath: localExecutablePath,
      ...options,
    }
  }

  if (Object.hasOwn(options, 'headless')) {
    Chromium.setHeadlessMode = options.headless || 'shell'
  }

  return {
    args: Chromium.args,
    defaultViewport: Chromium.defaultViewport,
    executablePath: await Chromium.executablePath(
      'https://github.com/Sparticuz/chromium/releases/download/v127.0.0/chromium-v127.0.0-pack.tar'
    ),
    headless: Chromium.headless,
  }
}

export default async function Home({ searchParams }: { searchParams: { url?: string } }) {
  const browser = await puppeteer.launch(await getPuppeteerOptions({ headless: true }))

  if (!searchParams.url) {
    throw notFound()
  }

  try {
    const page = await browser.newPage()
    await page.setViewport({ width: 1920, height: 1080 })

    const url = new URL(searchParams.url)
    await page.goto(url.toString(), { waitUntil: 'networkidle0' })

    const imageData = await page.screenshot({
      encoding: 'base64',
    })

    return (
      <div>
        <Image src={`data:image/png;base64,${imageData}`} alt={`Screenshot of the page ${url}`} width={900} height={700} />
      </div>
    )
  } finally {
    browser.close()
  }
}
