import { createServerFn } from "@tanstack/react-start";

type Trend = { title: string; traffic?: string; url?: string };

let cache: { at: number; trends: Trend[] } | null = null;
const TTL_MS = 30 * 60 * 1000;

function decode(s: string) {
  return s
    .replace(/<!\[CDATA\[(.*?)\]\]>/gs, "$1")
    .replace(/&apos;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function parse(xml: string): Trend[] {
  const items = xml.match(/<item>[\s\S]*?<\/item>/g) ?? [];
  const out: Trend[] = [];
  for (const it of items) {
    const t = it.match(/<title>([\s\S]*?)<\/title>/);
    if (!t) continue;
    const traf = it.match(/<ht:approx_traffic>([\s\S]*?)<\/ht:approx_traffic>/);
    const first = it.match(/<ht:news_item_url>([\s\S]*?)<\/ht:news_item_url>/);
    out.push({
      title: decode(t[1]).trim(),
      traffic: traf ? decode(traf[1]).trim() : undefined,
      url: first ? decode(first[1]).trim() : undefined,
    });
  }
  return out;
}

export const getTrendingSearches = createServerFn({ method: "GET" }).handler(
  async (): Promise<{ trends: Trend[] }> => {
    if (cache && Date.now() - cache.at < TTL_MS) return { trends: cache.trends };
    try {
      const res = await fetch("https://trends.google.com/trending/rss?geo=BR", {
        headers: { "user-agent": "Mozilla/5.0 VerificadoNews/1.0" },
      });
      if (!res.ok) throw new Error(`status ${res.status}`);
      const xml = await res.text();
      const trends = parse(xml).slice(0, 12);
      cache = { at: Date.now(), trends };
      return { trends };
    } catch {
      return { trends: cache?.trends ?? [] };
    }
  },
);