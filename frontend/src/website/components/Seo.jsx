import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

const SITE = 'https://shrieelaxmi.in'

const DEFAULT_SEO = {
  title: 'Shriee Laxmi Group | Grains, Cattle Feed & Rice — Kangeyam, Tiruchirappalli',
  description:
    'Shriee Laxmi Group supplies cottonseed oil cakes, high-protein cattle feed, rice and quality grains from Kangeyam and Tiruchirappalli across Tamil Nadu — with processing facilities, wholesale depots, grain godowns and an integrated transport fleet.',
}

const ROUTE_SEO = {
  '/': DEFAULT_SEO,
  '/about': {
    title: 'About Shriee Laxmi Group | Kangeyam & Tiruchirappalli Trading Group',
    description:
      'Learn about Shriee Laxmi Group — a Kangeyam and Tiruchirappalli-based trading group engaged in grains, agro commodities, cattle feed and logistics across Tamil Nadu.',
  },
  '/products-services': {
    title: 'Products & Services | Cottonseed Oil Cake, Cattle Feed, Rice & Grains',
    description:
      'Explore our products and services: cottonseed oil cakes, high-protein animal nutrition, rice and wholesale grains, bulk storage and integrated logistics from Kangeyam and Tiruchirappalli.',
  },
  '/our-businesses': {
    title: 'Our Businesses | Laxmi Traders, S M Traders & Shriee Feeds',
    description:
      'Three trusted verticals — Laxmi Traders (grains & agro commodities), S M Traders (rice trading & supply) and Shriee Feeds (cattle feed & animal nutrition), operating from Kangeyam and Tiruchirappalli.',
  },
  '/our-presence': {
    title: 'Our Presence | Kangeyam Plant, Depots & Grain Godowns in Tiruchirappalli',
    description:
      'Processing plant in Kangeyam, wholesale depots and spacious grain godowns in Tiruchirappalli, Ariyamangalam, Manapparai and Usilampatti — serving customers across Tamil Nadu.',
  },
  '/contact': {
    title: 'Contact Shriee Laxmi Group | Kangeyam & Tiruchirappalli, Tamil Nadu',
    description:
      'Get in touch with Shriee Laxmi Group for grain, rice, cattle feed and agro commodity enquiries. Serving Kangeyam and Tiruchirappalli from our Tamil Nadu offices.',
  },
  '/business/laxmi-traders': {
    title: 'Laxmi Traders | Wholesale Grains & Agro Commodities — Kangeyam, Tiruchirappalli',
    description:
      'Laxmi Traders — wholesale trading and distribution of quality grains and agro commodities from our Kangeyam plant and Tiruchirappalli depots, backed by grain godowns and a transport fleet across Tamil Nadu.',
  },
  '/business/sm-traders': {
    title: 'S M Traders | Rice Trading & Supply — Tiruchirappalli, Tamil Nadu',
    description:
      'S M Traders — reliable rice trading and supply from Ariyamangalam, Tiruchirappalli, with fair pricing and accurate weighing for wholesalers and institutional buyers across Tamil Nadu.',
  },
  '/business/shriee-feeds': {
    title: 'Shriee Feeds | Cattle Feed & High-Protein Animal Nutrition Tamil Nadu',
    description:
      'Shriee Feeds — premium cattle feed and high-protein animal nutrition including cottonseed oil cakes, produced for farmers and dairy units across Tamil Nadu from our Manapparai facility.',
  },
}

const PANEL_SEO = {
  title: 'Secure Panel | Shriee Laxmi Group',
  robots: 'noindex, nofollow',
}

function upsertMeta(attr, key, content) {
  let el = document.head.querySelector(`meta[${attr}="${key}"]`)
  if (!el) {
    el = document.createElement('meta')
    el.setAttribute(attr, key)
    document.head.appendChild(el)
  }
  el.setAttribute('content', content)
}

function upsertCanonical(href) {
  let el = document.head.querySelector('link[rel="canonical"]')
  if (!el) {
    el = document.createElement('link')
    el.setAttribute('rel', 'canonical')
    document.head.appendChild(el)
  }
  el.setAttribute('href', href)
}

/** Keeps document title / meta description / OG tags in sync with the route.
 *  Panel routes are marked noindex,nofollow — only the public website is indexed. */
export default function Seo() {
  const { pathname } = useLocation()

  useEffect(() => {
    const isPanel = pathname.startsWith('/panel') || pathname === '/login'
    const seo = isPanel ? PANEL_SEO : ROUTE_SEO[pathname] || DEFAULT_SEO
    const url = `${SITE}${pathname === '/' ? '/' : pathname}`
    const description = isPanel ? '' : seo.description

    document.title = seo.title
    upsertMeta('name', 'robots', seo.robots || 'index, follow')
    upsertMeta('property', 'og:title', seo.title)
    upsertMeta('property', 'og:url', url)
    upsertMeta('name', 'twitter:title', seo.title)
    upsertMeta('name', 'twitter:card', 'summary_large_image')

    if (!isPanel) {
      upsertMeta('name', 'description', description)
      upsertMeta('property', 'og:description', description)
      upsertMeta('name', 'twitter:description', description)
      upsertCanonical(url)
    }
  }, [pathname])

  return null
}
