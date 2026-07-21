import type { MetadataRoute } from "next";

/** Public crawl policy: index marketing surfaces; keep personal/account flows out. */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: ["/", "/catalog", "/recommend", "/privacy", "/terms", "/contact"],
      disallow: ["/results", "/mypage", "/auth", "/debug", "/account-deleted", "/terminology-demo"],
    },
    sitemap: "https://www.keyboard-recommender.com/sitemap.xml",
  };
}
