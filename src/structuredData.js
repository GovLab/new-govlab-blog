// A blog post's structured data (schema.org JSON-LD): headline, summary,
// authors, date, image, published by The GovLab under CC BY-SA 4.0 (as the
// post page's footer says). The post page adds it to the head with its other
// tags (src/pages/post.vue, fillMeta); AI crawlers get the rendered page from
// the Netlify Prerender extension, Google renders it itself.

export const SITE = 'https://blog.thegovlab.org';
const GOVLAB = { '@type': 'Organization', '@id': 'https://thegovlab.org/#organization', name: 'The GovLab', url: 'https://thegovlab.org' };
const BLOG = { '@type': 'Blog', '@id': `${SITE}/#blog`, name: 'The GovLab Blog', url: SITE, publisher: { '@id': GOVLAB['@id'] } };
const LICENCE = 'https://creativecommons.org/licenses/by-sa/4.0/';

const ENTITIES = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', rsquo: '’', lsquo: '‘', rdquo: '”', ldquo: '“', mdash: '—', ndash: '–', hellip: '…' };

/** CMS HTML as one line of text: tags removed, entities decoded, whitespace collapsed. */
export function plainText(html) {
  return String(html ?? '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (m, e) => {
      if (e[0] === '#') {
        const code = /^#x/i.test(e) ? parseInt(e.slice(2), 16) : Number(e.slice(1));
        return code > 0 && code <= 0x10ffff ? String.fromCodePoint(code) : m;
      }
      return ENTITIES[e.toLowerCase()] ?? m;
    })
    .replace(/\s+/g, ' ')
    .replace(/ ([,.;:!?)\]])/g, '$1')
    .trim();
}

/** At most `max` characters, cut at a word with "…". */
export function excerpt(text, max = 300) {
  if (text.length <= max) return text;
  const cut = text.slice(0, max - 1);
  const space = cut.lastIndexOf(' ');
  return `${(space > max * 0.6 ? cut.slice(0, space) : cut).replace(/[\s,;:.–—-]+$/, '')}…`;
}

let newYork;
/** The New York wall clock at an instant, as "YYYY-MM-DDTHH:mm:ss". */
function newYorkWall(ms) {
  newYork ??= new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/New_York', hourCycle: 'h23',
    year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit',
  });
  const p = Object.fromEntries(newYork.formatToParts(ms).map((x) => [x.type, x.value]));
  return `${p.year}-${p.month}-${p.day}T${p.hour}:${p.minute}:${p.second}`;
}

/**
 * A post date as ISO 8601 with a time zone, which Google asks for. Values with
 * a zone are kept ("2015-02-23T15:00:00.000Z", the 2012–2020 archive). A bare
 * date ("2018-09-20", `blog.publication_date`) becomes the start of that day in
 * New York, where The GovLab is: "2018-09-20T00:00:00-04:00". Else "".
 */
export function postDateTime(value) {
  const s = String(value ?? '').trim();
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d+)?)?(Z|[+-]\d{2}:\d{2})$/.test(s)) return s;
  const m = /^(\d{4}-\d{2}-\d{2})(?:T(\d{2}:\d{2})(?::(\d{2}))?)?/.exec(s);
  if (!m) return '';
  const wall = `${m[1]}T${m[2] ?? '00:00'}:${m[3] ?? '00'}`;
  const asUtc = Date.parse(`${wall}Z`);
  if (Number.isNaN(asUtc)) return '';
  // Four hours behind UTC in summer, five in winter: the one that maps back onto this wall clock.
  const hours = [4, 5].find((h) => newYorkWall(asUtc + h * 3_600_000) === wall) ?? 5;
  return `${wall}-0${hours}:00`;
}

/**
 * The JSON-LD for one post (`blog`, or a `tg_archive` post without excerpt or
 * authors), or null without a title. `url` is the post's canonical address,
 * `image` its picture or ''.
 */
export function postJsonLd(post, { url, image }) {
  const headline = plainText(post?.title);
  if (!headline || !url) return null;
  // Excerpts end with WordPress's "[…]".
  const description = excerpt(plainText(post.excerpt || post.content).replace(/\s*\[…\]$/, ''));
  const published = postDateTime(post.publication_date);
  const authors = (post.authors ?? [])
    .map((a) => a?.team_id)
    .filter((t) => t && plainText(t.name))
    .map((t) => ({
      '@type': 'Person',
      name: plainText(t.name),
      ...(/^[a-z0-9-]+$/i.test(t.slug ?? '') ? { url: `https://thegovlab.org/team.html#${t.slug}` } : {}),
    }));
  return {
    '@context': 'https://schema.org',
    '@graph': [
      GOVLAB,
      BLOG,
      {
        '@type': 'BlogPosting',
        '@id': `${url}#article`,
        headline,
        ...(description ? { description } : {}),
        url,
        mainEntityOfPage: url,
        ...(image ? { image: [image] } : {}),
        ...(published ? { datePublished: published } : {}),
        author: authors.length ? authors : { '@id': GOVLAB['@id'] },
        publisher: { '@id': GOVLAB['@id'] },
        isPartOf: { '@id': BLOG['@id'] },
        license: LICENCE,
        inLanguage: 'en',
        isAccessibleForFree: true,
      },
    ],
  };
}

/**
 * The head entry for a JSON-LD object (none when null). "<" is escaped so CMS
 * text cannot close the script tag in the HTML the prerenderer serialises.
 */
export const jsonLdScript = (data) =>
  data ? [{ key: 'structured-data', type: 'application/ld+json', textContent: JSON.stringify(data).replace(/</g, '\\u003c') }] : [];
