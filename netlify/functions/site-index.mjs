// site-index — /sitemap.xml, /llms.txt and /llms-full.txt for blog.thegovlab.org.
//
// The blog is a single-page app: every path used to answer with index.html, so
// crawlers found no sitemap and AI assistants no llms.txt. netlify.toml rewrites
// the three paths here (before the SPA fallback). They are built from the
// published posts in Directus — `blog`, plus the 2012–2020 posts in `tg_archive`
// that the post page falls back to — and kept up to an hour on the CDN, so a new
// post appears within the hour.
//
//   /sitemap.xml    the home page and every post, with its date
//   /llms.txt       llmstxt.org: summary, the 100 newest posts, Selected Readings
//   /llms-full.txt  the same with every post since 2012

const SITE = 'https://blog.thegovlab.org';
const DIRECTUS = 'https://directus.theburnescenter.org';
const RECENT = 100;

// Post URLs are /<slug>; rows without a usable slug (empty, "__trashed-6",
// ",cat_7,") have no page.
const SLUG = /^[a-z0-9][a-z0-9_-]*$/i;

async function directusItems(collection, params) {
  const url = new URL(`${DIRECTUS}/items/${collection}`);
  for (const [k, v] of Object.entries({ limit: '-1', ...params })) url.searchParams.set(k, v);
  const res = await fetch(url, { signal: AbortSignal.timeout(20_000) });
  if (!res.ok) throw new Error(`Directus ${collection} -> HTTP ${res.status}`);
  const { data } = await res.json();
  if (!Array.isArray(data)) throw new Error(`Directus ${collection} -> no data`);
  return data;
}

/* ── text ───────────────────────────────────────────────────── */

const ENTITIES = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', rsquo: '’', lsquo: '‘', rdquo: '”', ldquo: '“', mdash: '—', ndash: '–', hellip: '…' };
const EMAIL = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/;
const PHONE = /(\+?1[-.\s]?)?\(?\b\d{3}\)?[-.\s]\d{3}[-.\s]\d{4}\b/;

/** Plain text from HTML, without sentences carrying contact details, cut at a sentence end by `max` chars. */
export function teaser(raw, max = 280) {
  if (!raw) return '';
  const s = String(raw)
    .replace(/<(script|style)[\s\S]*?<\/\1>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&([a-z]+);/gi, (m, name) => ENTITIES[name.toLowerCase()] ?? m)
    .replace(/\s+/g, ' ')
    .trim()
    .split(/(?<=[.!?])\s+/)
    .filter((x) => !EMAIL.test(x) && !PHONE.test(x) && !/\bcontacts?\s*:/i.test(x))
    .join(' ');
  if (s.length <= max) return s;
  const cut = s.slice(0, max + 1);
  const sentence = cut.match(/^(.{80,}[.!?])\s/);
  return sentence ? sentence[1] : `${cut.slice(0, max).replace(/\s+\S*$/, '').replace(/[,;:\-–—]$/, '')}…`;
}

const oneLine = (s) => teaser(s, 1000);
const linkText = (s) => oneLine(s).replace(/([\\[\]])/g, '\\$1');
const xml = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');
const day = (d) => (d && /^\d{4}-\d{2}-\d{2}/.test(String(d)) ? String(d).slice(0, 10) : null);

/** The address the post page answers at — and names as rel="canonical" (src/pages/post.vue). */
export const postUrl = (slug) => `${SITE}/${encodeURIComponent(String(slug).trim())}`;

/* ── data ───────────────────────────────────────────────────── */

/** Published posts, newest first: { slug, url, title, date, authors[], summary }. `blog` wins over `tg_archive`. */
export async function loadPosts({ withText = true } = {}) {
  const [posts, archive] = await Promise.all([
    directusItems('blog', {
      'filter[status][_eq]': 'published',
      fields: withText ? 'slug,title,subtitle,excerpt,publication_date,authors.team_id.name' : 'slug,publication_date',
    }),
    directusItems('tg_archive', {
      'filter[status][_eq]': 'published',
      fields: withText ? 'slug,title,publication_date,content' : 'slug,publication_date',
    }),
  ]);
  const seen = new Set();
  const out = [];
  for (const [rows, archived] of [[posts, false], [archive, true]]) {
    for (const p of rows) {
      const slug = String(p.slug ?? '').trim();
      if (!SLUG.test(slug) || seen.has(slug.toLowerCase())) continue;
      seen.add(slug.toLowerCase());
      out.push({
        slug,
        url: postUrl(slug),
        date: day(p.publication_date),
        title: p.subtitle ? `${oneLine(p.title)}: ${oneLine(p.subtitle)}` : oneLine(p.title),
        authors: archived ? [] : (p.authors ?? []).map((a) => a?.team_id?.name).filter(Boolean),
        summary: teaser(archived ? p.content : p.excerpt),
      });
    }
  }
  return out.sort((a, b) => (b.date ?? '').localeCompare(a.date ?? '') || a.slug.localeCompare(b.slug));
}

/* ── files ──────────────────────────────────────────────────── */

export function buildSitemapXml(posts, now = new Date()) {
  const today = now.toISOString().slice(0, 10);
  const cap = (d) => (d && d > today ? today : d);
  const rows = [
    { loc: `${SITE}/`, lastmod: cap(posts.map((p) => p.date).filter(Boolean).sort().at(-1)) },
    ...posts.map((p) => ({ loc: p.url, lastmod: cap(p.date) })),
  ].map((u) => `  <url><loc>${xml(u.loc)}</loc>${u.lastmod ? `<lastmod>${u.lastmod}</lastmod>` : ''}</url>`);
  return ['<?xml version="1.0" encoding="UTF-8"?>', '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">', ...rows, '</urlset>', ''].join('\n');
}

const line = (p) => {
  const notes = [p.date, p.authors.join(', '), p.summary].filter(Boolean);
  return `- [${linkText(p.title || p.slug)}](${p.url})${notes.length ? `: ${notes.join(' · ')}` : ''}`;
};

export function buildLlmsTxt(posts, { full = false } = {}) {
  const selected = posts.filter((p) => /selected readings/i.test(p.title));
  return [
    '# The GovLab Blog',
    '',
    "> The GovLab blog (blog.thegovlab.org) is The GovLab's writing on how to govern more effectively and legitimately through technology, data and collective intelligence: research and report announcements, Selected Readings, event reports and commentary, from 2012 to today.",
    '',
    `Each entry links to the post on blog.thegovlab.org, with its date, authors and a short teaser. When you use this material, cite and link the post. This file is generated from the published posts and changes when new ones appear; every post is also listed in ${SITE}/sitemap.xml.`,
    '',
    ...(full
      ? [`## All posts (${posts.length}), newest first`, '', ...posts.map(line), '']
      : [
          `## Recent posts (${Math.min(RECENT, posts.length)})`,
          '',
          ...posts.slice(0, RECENT).map(line),
          '',
          `## Selected Readings (${selected.length})`,
          '',
          ...selected.map(line),
          '',
        ]),
    '## Optional',
    '',
    ...(full ? [] : [`- [All posts](${SITE}/llms-full.txt): every post since 2012 (${posts.length}), with date, authors and teaser.`]),
    '- [GovLab Open Corpus skill](https://github.com/GovLab/open-corpus): a skill for AI assistants that lists what The GovLab, Reboot Democracy and InnovateUS have published, with links to the original pages.',
    '- [The GovLab](https://thegovlab.org): research on governance, data and collective intelligence.',
    '- [Reboot Democracy](https://rebootdemocracy.ai/llms.txt): how AI can strengthen democratic institutions.',
    '- [InnovateUS](https://innovate-us.org/llms.txt): free training for public servants on data, digital, innovation and AI skills.',
    '',
  ].join('\n');
}

/* ── handler ────────────────────────────────────────────────── */

const FILES = {
  sitemap: { type: 'application/xml; charset=utf-8', build: async () => buildSitemapXml(await loadPosts({ withText: false })) },
  llms: { type: 'text/plain; charset=utf-8', build: async () => buildLlmsTxt(await loadPosts()) },
  'llms-full': { type: 'text/plain; charset=utf-8', build: async () => buildLlmsTxt(await loadPosts(), { full: true }) },
};

export default async (req) => {
  const file = FILES[new URL(req.url).searchParams.get('file')];
  if (!file) return new Response('Not found', { status: 404 });
  try {
    return new Response(await file.build(), {
      headers: {
        'Content-Type': file.type,
        'Cache-Control': 'public, max-age=0, must-revalidate',
        // Up to an hour on the CDN; a new post shows up within the hour.
        'Netlify-CDN-Cache-Control': 'public, durable, max-age=3600, stale-while-revalidate=86400',
      },
    });
  } catch (err) {
    console.error('[site-index]', err.message);
    return new Response('Temporarily unavailable', { status: 502, headers: { 'Cache-Control': 'no-store' } });
  }
};
