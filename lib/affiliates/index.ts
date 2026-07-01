import { fetchAmazonDeals }   from "./amazon"
import { fetchFlipkartDeals } from "./flipkart"
import type { AffiliateProduct } from "./amazon"

export type { AffiliateProduct }

export async function fetchAllAffiliateDeals(): Promise<AffiliateProduct[]> {
  const [amazon, flipkart] = await Promise.allSettled([
    fetchAmazonDeals(),
    fetchFlipkartDeals(),
  ])

  const results: AffiliateProduct[] = []
  if (amazon.status    === "fulfilled") results.push(...amazon.value)
  if (flipkart.status  === "fulfilled") results.push(...flipkart.value)
  return results
}
