import { siteMeta } from "../data/site"
import { useSeoMeta } from "@unhead/vue"
import { useSchemaOrg } from "@unhead/schema-org/vue"

type SeoInput = {
  title: string
  description: string
  path: string
  image?: string
}

export function usePageSeo(input: SeoInput) {
  const canonical = `${siteMeta.url}${input.path}`
  const image = input.image || siteMeta.ogImage

  useSeoMeta({
    title: input.title,
    description: input.description,
    ogTitle: input.title,
    ogDescription: input.description,
    ogUrl: canonical,
    ogImage: image,
    twitterTitle: input.title,
    twitterDescription: input.description,
    twitterImage: image
  })

  useSchemaOrg([
    {
      "@type": "WebPage",
      name: input.title,
      description: input.description,
      url: canonical,
      inLanguage: "tr-TR"
    },
    {
      "@type": "BreadcrumbList",
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: "Ana Sayfa",
          item: siteMeta.url
        },
        {
          "@type": "ListItem",
          position: 2,
          name: input.title,
          item: canonical
        }
      ]
    }
  ])
}
