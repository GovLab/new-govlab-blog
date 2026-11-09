// node --test tests/*.test.mjs   (no dependencies)
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { jsonLdScript, plainText, postDateTime, postJsonLd } from '../src/structuredData.js';

const URL = 'https://blog.thegovlab.org/the-future-of-democracy-lecture-series';
const POST = {
  title: 'The Future of Democracy Lecture Series',
  publication_date: '2018-09-20',
  excerpt: '<p>Public trust in the government remains near historic lows.  With the rise [&hellip;]</p>\n',
  authors: [{ team_id: { name: 'Ada Example', slug: 'ada-example' } }, { team_id: { name: '' } }],
};
const article = (ld) => ld['@graph'].find((n) => n['@type'] === 'BlogPosting');

test('a post: BlogPosting by its authors, in The GovLab Blog, CC BY-SA', () => {
  const ld = postJsonLd(POST, { url: URL, image: '' });
  const a = article(ld);
  assert.equal(a.headline, POST.title);
  assert.equal(a.description, 'Public trust in the government remains near historic lows. With the rise');
  assert.equal(a.datePublished, '2018-09-20T00:00:00-04:00');
  assert.deepEqual(a.author, [{ '@type': 'Person', name: 'Ada Example', url: 'https://thegovlab.org/team.html#ada-example' }]);
  assert.equal(a.license, 'https://creativecommons.org/licenses/by-sa/4.0/');
  assert.deepEqual(a.isPartOf, { '@id': 'https://blog.thegovlab.org/#blog' });
  assert.equal('image' in a, false);
  assert.ok(ld['@graph'].some((n) => n['@type'] === 'Organization' && n.name === 'The GovLab'));
});

test('an archive post: date with its zone, description from the text, The GovLab as author', () => {
  const a = article(postJsonLd({ title: 'The Problem of Internet Radicalization?', publication_date: '2015-02-23T15:00:00.000Z', content: '<div><b>Register</b> for the talk &amp; more.</div>' }, { url: 'https://blog.thegovlab.org/13721', image: 'https://example.org/x.jpg' }));
  assert.equal(a.datePublished, '2015-02-23T15:00:00.000Z');
  assert.equal(a.description, 'Register for the talk & more.');
  assert.deepEqual(a.author, { '@id': 'https://thegovlab.org/#organization' });
  assert.deepEqual(a.image, ['https://example.org/x.jpg']);
});

test('dates: New York offset for bare dates, winter and summer; junk gives none', () => {
  assert.equal(postDateTime('2018-01-15'), '2018-01-15T00:00:00-05:00');
  assert.equal(postDateTime('2018-07-15T09:30'), '2018-07-15T09:30:00-04:00');
  for (const x of ['', null, undefined, 'soon']) assert.equal(postDateTime(x), '');
  assert.equal(postJsonLd({ title: '' }, { url: URL, image: '' }), null);
});

test('the script tag cannot be closed by CMS text', () => {
  const [tag] = jsonLdScript({ headline: '</script><script>alert(1)</script>' });
  assert.equal(tag.type, 'application/ld+json');
  assert.ok(!tag.textContent.includes('<'));
  assert.deepEqual(JSON.parse(tag.textContent), { headline: '</script><script>alert(1)</script>' });
  assert.deepEqual(jsonLdScript(null), []);
  assert.equal(plainText('a <b>b</b> , c'), 'a b, c');
});
