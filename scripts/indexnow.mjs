#!/usr/bin/env node
/* ============================================================
   IndexNow submitter
   ------------------------------------------------------------
   Tells Bing, Yandex and Seznam that pages changed, instead of
   waiting for them to re-crawl. Google does NOT support
   IndexNow — for Google this does nothing, which is fine: Bing's
   index is where essentially all of this site's search traffic
   currently comes from.

   Usage, from the repo root:

     node scripts/indexnow.mjs                  changed in HEAD
     node scripts/indexnow.mjs --all            every URL in sitemap.xml
     node scripts/indexnow.mjs a.html b.html    specific files
     node scripts/indexnow.mjs --all --dry-run  build payload, send nothing

   The key lives in a file at the site root whose name matches its
   own contents, which is how IndexNow verifies ownership.
   ============================================================ */

import { readFileSync, readdirSync } from 'node:fs';
import { execSync } from 'node:child_process';

const HOST = 'financialtoolkit.net';
const ORIGIN = `https://${HOST}`;
const ENDPOINT = 'https://api.indexnow.org/indexnow';   // shared by all participants

/** Find the root key file: its basename must equal its contents. */
function findKey() {
  for (const f of readdirSync('.')) {
    if (!f.endsWith('.txt')) continue;
    const body = readFileSync(f, 'utf8').trim();
    if (f === `${body}.txt` && /^[A-Za-z0-9-]{8,128}$/.test(body)) return body;
  }
  throw new Error('No IndexNow key file found at the repo root (expected <key>.txt containing <key>)');
}

/** Map a repository file path to its canonical public URL. */
function toUrl(file) {
  if (!file.endsWith('.html')) return null;
  const path = file.replace(/\.html$/, '');
  return path === 'index' ? `${ORIGIN}/` : `${ORIGIN}/${path}`;
}

function fromSitemap() {
  const xml = readFileSync('sitemap.xml', 'utf8');
  return [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => m[1]);
}

function changedInHead() {
  /* -m --first-parent is required: this repo lands changes as PR merge
     commits, and a plain diff-tree reports nothing for a merge, so the
     automatic mode would silently submit an empty list on every deploy. */
  const out = execSync('git diff-tree --no-commit-id --name-only -r -m --first-parent HEAD',
                       { encoding: 'utf8' });
  return out.split('\n').map(s => s.trim()).filter(Boolean).map(toUrl).filter(Boolean);
}

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const rest = args.filter(a => !a.startsWith('--'));

let urls;
if (args.includes('--all')) urls = fromSitemap();
else if (rest.length) urls = rest.map(toUrl).filter(Boolean);
else urls = changedInHead();

urls = [...new Set(urls)].filter(u => u.startsWith(ORIGIN));

if (!urls.length) {
  console.log('No URLs to submit.');
  process.exit(0);
}
if (urls.length > 10000) {
  console.error(`IndexNow accepts at most 10,000 URLs per request (got ${urls.length}).`);
  process.exit(1);
}

const key = findKey();
const payload = {
  host: HOST,
  key,
  keyLocation: `${ORIGIN}/${key}.txt`,
  urlList: urls
};

console.log(`IndexNow: ${urls.length} URL(s)`);
urls.slice(0, 8).forEach(u => console.log('   ' + u));
if (urls.length > 8) console.log(`   … and ${urls.length - 8} more`);
console.log(`   key ${key.slice(0, 6)}… at ${payload.keyLocation}`);

if (dryRun) {
  console.log('\n--dry-run: nothing submitted. Payload bytes:', JSON.stringify(payload).length);
  process.exit(0);
}

/* Documented IndexNow responses. 202 is normal on first use: the key
   is accepted but not yet validated against the key file. */
const MEANING = {
  200: 'OK — URLs accepted',
  202: 'Accepted — key still being validated (normal on a first run)',
  400: 'Bad request — malformed payload',
  403: 'Forbidden — key file missing or does not match; is it deployed?',
  422: 'Unprocessable — a URL does not belong to this host, or the key mismatches',
  429: 'Too many requests — slow down'
};

const res = await fetch(ENDPOINT, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json; charset=utf-8' },
  body: JSON.stringify(payload)
});

const note = MEANING[res.status] || 'Unexpected status';
console.log(`\nHTTP ${res.status} — ${note}`);
process.exit(res.status === 200 || res.status === 202 ? 0 : 1);
