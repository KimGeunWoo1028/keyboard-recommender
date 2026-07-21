import type { MetadataRoute } from "next";

/** Minimal sitemap for indexable public surfaces (P15). */
export default function sitemap(): MetadataRoute.Sitemap {
  const base = "https://www.keyboard-recommender.com";
  const lastModified = new Date("2026-07-22");
  return [
    { url: `${base}/`, lastModified, changeFrequency: "weekly", priority: 1 },
    { url: `${base}/recommend`, lastModified, changeFrequency: "weekly", priority: 0.9 },
    { url: `${base}/catalog`, lastModified, changeFrequency: "daily", priority: 0.8 },
    { url: `${base}/privacy`, lastModified, changeFrequency: "yearly", priority: 0.3 },
    { url: `${base}/terms`, lastModified, changeFrequency: "yearly", priority: 0.3 },
    { url: `${base}/contact`, lastModified, changeFrequency: "yearly", priority: 0.3 },
  ];
}
