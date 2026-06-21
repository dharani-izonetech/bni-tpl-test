import { useEffect } from 'react'

interface SEOProps {
  title?: string
  description?: string
  ogImage?: string
  ogType?: string
  url?: string
  jsonLd?: Record<string, unknown>
}

const SITE_NAME = 'BNI Cricket'
const DEFAULT_DESCRIPTION = 'BNI Cricket Tournament — Live scores, match schedules, team groups, player stats, and ball-by-ball scoring powered by CricPro.'
const DEFAULT_OG_IMAGE = '/favicon.svg'

/**
 * Lightweight SEO component that updates document head.
 * Sets page title, meta description, Open Graph, and JSON-LD structured data.
 */
export default function SEO({
  title,
  description = DEFAULT_DESCRIPTION,
  ogImage = DEFAULT_OG_IMAGE,
  ogType = 'website',
  url,
  jsonLd,
}: SEOProps) {
  const pageTitle = title ? `${title} | ${SITE_NAME}` : SITE_NAME

  useEffect(() => {
    document.title = pageTitle

    // Meta description
    setMeta('description', description)

    // Open Graph
    setMeta('og:title', pageTitle, 'property')
    setMeta('og:description', description, 'property')
    setMeta('og:type', ogType, 'property')
    setMeta('og:site_name', SITE_NAME, 'property')
    if (ogImage) setMeta('og:image', ogImage, 'property')
    if (url) setMeta('og:url', url, 'property')

    // Twitter Card
    setMeta('twitter:card', 'summary_large_image')
    setMeta('twitter:title', pageTitle)
    setMeta('twitter:description', description)
    if (ogImage) setMeta('twitter:image', ogImage)

    // JSON-LD structured data
    if (jsonLd) {
      let script = document.getElementById('json-ld') as HTMLScriptElement | null
      if (!script) {
        script = document.createElement('script')
        script.id = 'json-ld'
        script.type = 'application/ld+json'
        document.head.appendChild(script)
      }
      script.textContent = JSON.stringify(jsonLd)
    }

    return () => {
      // Cleanup JSON-LD when navigating away
      const script = document.getElementById('json-ld')
      if (script && jsonLd) script.remove()
    }
  }, [pageTitle, description, ogImage, ogType, url, jsonLd])

  return null
}

function setMeta(name: string, content: string, attr: 'name' | 'property' = 'name') {
  let el = document.querySelector(`meta[${attr}="${name}"]`) as HTMLMetaElement | null
  if (!el) {
    el = document.createElement('meta')
    el.setAttribute(attr, name)
    document.head.appendChild(el)
  }
  el.content = content
}
