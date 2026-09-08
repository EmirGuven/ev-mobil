// Statik fallback site verisi. Asıl içerik veritabanından (admin panel) gelir;
// buradaki değerler yalnızca API boş döndüğünde veya derleme anında kullanılır.

export const siteMeta = {
  name: "EV-mobil",
  titleSuffix: "EV-mobil",
  description:
    "EV-mobil; İstanbul merkezli, elektrikli araç şarj istasyonu kurulumu, devreye alma, periyodik bakım, arıza servisi, 7/24 teknik destek ve mobil şarj çözümleri sunan teknik çözüm ortağıdır.",
  url: "https://www.ev-mobil.com",
  phone: "+905332040905",
  phoneDisplay: "0533 204 09 05",
  email: "info@ev-mobil.com",
  ogImage: "https://www.ev-mobil.com/og-image.png",
  address: {
    street: "Mimar Sinan Mah. Yedpa Ticaret Merkezi D26",
    city: "İstanbul",
    region: "Ataşehir",
    postalCode: "34779"
  },
  mapsUrl: "https://www.google.com/maps/search/?api=1&query=Yedpa+Ticaret+Merkezi+Ataşehir+İstanbul",
  workingHours: "Hafta içi 09:00 - 18:00 · 7/24 teknik destek hattı",
  social: ["", ""]
}

export const services = [
  { slug: "sarj-istasyonu-kurulumu", title: "Kurulum" },
  { slug: "devreye-alma", title: "Devreye Alma" },
  { slug: "periyodik-bakim", title: "Periyodik Bakım" },
  { slug: "ariza-bakimi", title: "Arıza Bakımı" },
  { slug: "teknik-destek", title: "Teknik Destek" },
  { slug: "mobil-sarj-hizmetleri", title: "Mobil Şarj Hizmetleri" },
  { slug: "sarj-urunleri-tedarigi", title: "Şarj Ürünleri Tedariği" }
] as const

export const serviceMap = Object.fromEntries(
  services.map((service) => [service.slug, service])
) as Record<(typeof services)[number]["slug"], (typeof services)[number]>

export const testimonials = [] as const

export const blogPosts: Array<{ slug: string; [key: string]: any }> = []

export const blogPostMap = Object.fromEntries(
  blogPosts.map((post) => [post.slug, post])
) as Record<string, (typeof blogPosts)[number]>
