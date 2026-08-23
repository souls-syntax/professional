/**
 * build-posts.js — Formal portfolio's fork of the fun-site blog builder.
 *
 * Differences from ../portfolio/.github/scripts/build-posts.js:
 *  - SITE_URL is portfolio.aakarsh.in (not souls-syntax.github.io)
 *  - Template swaps in formal-site chrome:
 *      + multi-page latex-sketch.css + js/theme-toggle.js (moofin pattern)
 *      + <wired-divider> + <wired-card> sketch theme elements
 *      + highlight.js for code blocks
 *      - NO giscus comments
 *      - NO BGM player / audio
 *      - NO now-playing fetch
 *      - NO anime GIFs / blinkies / 88x31 buttons
 *      - NO visit counter
 *      - NO marquee
 *      - NO webring
 *  - Output: posts/{slug}.html, posts.json, feed.xml — same paths, same
 *    frontmatter contract, same draft-skipping, same heading-ID logic, same
 *    prev/next (newer = prev, older = next, newest-first order).
 *
 * Identity (for the template's masthead, taskbar center, RSS channel):
 *  - SITE_TITLE    = "Aakarsh Kashyap"
 *  - SITE_DESC     = "corporate-voiced engineering journal"
 *  - SITE_URL      = "https://portfolio.aakarsh.in"
 */

const fs = require('fs');
const path = require('path');
const { marked } = require('marked');

/* ── paths ── */
const REPO_ROOT = path.resolve(__dirname, '..', '..');
const POSTS_DIR = path.join(REPO_ROOT, 'posts');
const POSTS_JSON = path.join(REPO_ROOT, 'posts.json');
const FEED_XML = path.join(REPO_ROOT, 'feed.xml');

/* ── site metadata ── */
const SITE_URL = 'https://portfolio.aakarsh.in';
const SITE_TITLE = 'Aakarsh Kashyap';
const SITE_DESC = 'corporate-voiced engineering journal';

/* ── frontmatter parser (same shape as fun-site; kept verbatim) ── */
function parseFrontmatter(raw) {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!match) return { meta: {}, body: raw };
  const metaBlock = match[1];
  const body = match[2];
  const meta = {};
  for (const line of metaBlock.split('\n')) {
    const colon = line.indexOf(':');
    if (colon === -1) continue;
    const key = line.slice(0, colon).trim();
    let val = line.slice(colon + 1).trim();
    if (val.startsWith('[') && val.endsWith(']')) {
      val = val.slice(1, -1).split(',').map(t => t.trim()).filter(Boolean);
    } else if (val === 'null') {
      val = null;
    } else if (val === 'true') {
      val = true;
    } else if (val === 'false') {
      val = false;
    }
    meta[key] = val;
  }
  return { meta, body };
}

/* ── helpers ── */
function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}
function escapeXml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}
function slugify(text) {
  return text.toLowerCase().replace(/[^\w]+/g, '-').replace(/^-|-$/g, '');
}
function slugFromFile(filename) {
  return path.basename(filename, '.md');
}
function toRfc822(dateStr) {
  const d = dateStr ? new Date(dateStr + 'T00:00:00Z') : new Date();
  return isNaN(d) ? new Date().toUTCString() : d.toUTCString();
}
function tagsToHtml(tags) {
  if (!tags || tags.length === 0) return '';
  return tags.map(t => '[' + t + ']').join(' ');
}
function deriveExcerpt(body, maxLen) {
  maxLen = maxLen || 300;
  const text = body
    .replace(/<[^>]*>/g, '')
    .replace(/^#{1,6}\s.*$/gm, '')
    .replace(/\n{2,}/g, '\n')
    .trim()
    .split('\n')
    .slice(0, 4)
    .join(' ')
    .replace(/[*`_>#\[\]]/g, '')
    .trim();
  if (text.length <= maxLen) return text;
  const cut = text.slice(0, maxLen);
  const lastSpace = cut.lastIndexOf(' ');
  return (lastSpace > maxLen * 0.5 ? cut.slice(0, lastSpace) : cut).trim() + '\u2026';
}

/* ── marked renderer with heading IDs (same as fun-site) ── */
const renderer = new marked.Renderer();
const usedIds = {};
renderer.heading = function() {
  var text, level;
  if (typeof arguments[0] === 'object' && arguments[0] !== null) {
    text = arguments[0].text || '';
    level = arguments[0].depth || 1;
  } else {
    text = String(arguments[0] || '');
    level = arguments[1] || 1;
  }
  var raw = text.replace(/<[^>]*>/g, '');
  var base = slugify(raw);
  var id = base;
  var n = 2;
  while (usedIds[id]) { id = base + '-' + n; n++; }
  usedIds[id] = true;
  return '<h' + level + ' id="' + id + '">' + text + '</h' + level + '>';
};
marked.use({ renderer });

/* ── the formal template ── */
function buildPostHtml({ slug, title, date, tags, series, readingTime, prev, next, fragment }) {
  const tagStr = tags && tags.length ? ' &mdash; ' + tagsToHtml(tags) : '';
  const seriesStr = series ? '<br><small>series: ' + escapeHtml(series) + '</small>' : '';
  const readStr = readingTime ? ' &mdash; ' + readingTime + ' min read' : '';

  let prevNext = '';
  if (prev || next) {
    prevNext = '<hr><small>';
    if (prev) prevNext += '<a href="' + prev.slug + '.html">&larr; ' + escapeHtml(prev.title) + '</a>';
    if (prev && next) prevNext += ' &middot; ';
    if (next) prevNext += '<a href="' + next.slug + '.html">' + escapeHtml(next.title) + ' &rarr;</a>';
    prevNext += '</small>';
  }

  return '<!doctype html>\n' +
'<html lang="en" data-theme="latex" data-mode="light">\n' +
'<head>\n' +
'  <meta charset="utf-8">\n' +
'  <meta name="viewport" content="width=device-width, initial-scale=1">\n' +
'  <meta name="color-scheme" content="light dark">\n' +
'  <title>' + escapeHtml(title) + ' &middot; ' + SITE_TITLE + '</title>\n' +
'  <link rel="icon" type="image/svg+xml" href="../favicon.svg">\n' +
'  <link rel="alternate" type="application/rss+xml" title="' + SITE_TITLE + '" href="' + SITE_URL + '/feed.xml">\n' +
'  <link rel="preconnect" href="https://fonts.googleapis.com">\n' +
'  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>\n' +
'  <link href="https://fonts.googleapis.com/css2?family=Crimson+Text:ital,wght@0,400;0,600;0,700;1,400;1,600&display=swap" rel="stylesheet">\n' +
'  <link href="https://fonts.googleapis.com/css?family=Gloria+Hallelujah&display=swap" rel="stylesheet">\n' +
'  <link rel="stylesheet" href="../latex-sketch.css">\n' +
'  <script type="module" src="../vendor/wired-elements.js"></' + 'script>\n' +
'  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/github-dark.min.css">\n' +
'  <style>\n' +
'    .post-content { word-wrap: break-word; overflow-wrap: break-word; max-width: 100%; }\n' +
'    .post-content pre { overflow-x: auto; white-space: pre; word-break: normal; word-wrap: normal; }\n' +
'    .post-content code, .post-content pre { font-family: "Courier New", Courier, monospace; }\n' +
'    .post-content pre code.hljs { background: transparent; padding: 0; }\n' +
'  </style>\n' +
'</head>\n' +
'<body>\n' +
'  <main class="paper">\n' +
'    <header class="masthead">\n' +
'      <h1 class="display-name" style="font-size:24px;">' + escapeHtml(title) + '</h1>\n' +
'      <p class="masthead-meta">' + date + tagStr + readStr + '</p>\n' +
(series ? '      <p class="masthead-niche">series: ' + escapeHtml(series) + '</p>\n' : '') +
'    </header>\n' +
'    <section id="entry">\n' +
'      <h2>Entry</h2>\n' +
'      <hr class="latex-only">\n' +
'      <wired-divider class="sketch-only" elevation="2"></wired-divider>\n' +
'      <div class="post-content">\n' +
fragment + '\n' +
'      </div>\n' +
'      <p><small><a href="../blog.html">&larr; back to blog</a></small></p>\n' +
prevNext + '\n' +
'    </section>\n' +
'  </main>\n' +
'  <a class="latex-chip toc-chip" id="toc-chip" href="#" title="Table of Contents">\\tableofcontents</a>\n' +
'  <div id="latex-toc" class="latex-toc"></div>\n' +
'  <a class="latex-chip nav-chip" id="nav-chip" href="#" title="Site Navigation">\\begin{document}</a>\n' +
'  <div id="latex-nav-popup" class="latex-nav-popup">\n' +
'    <a href="../index.html">\\ref{about}</a>\n' +
'    <a href="../projects.html">\\ref{projects}</a>\n' +
'    <a href="../blog.html">\\ref{blog}</a>\n' +
'    <a href="../resume.html">\\ref{r\\\'{e}sum\\\'{e}}</a>\n' +
'  </div>\n' +
'  <a class="latex-chip top-chip" id="top-chip" href="#" title="Back to Top">\\top</a>\n' +
'  <a class="latex-chip pagecolor-chip" id="pagecolor-chip" href="#" title="Toggle Dark Mode">\\pagecolor{dark}</a>\n' +
'  <a class="latex-chip theme-chip" id="theme-chip" href="#" title="Toggle Presentation Mode">\\end{document}</a>\n' +
'  <div class="latex-taskbar">\n' +
'    <div class="taskbar-left">\n' +
'      <a href="../index.html">about</a> &middot;\n' +
'      <a href="../projects.html">projects</a> &middot;\n' +
'      <a href="../blog.html">blog</a> &middot;\n' +
'      <a href="../resume.html">r&eacute;sum&eacute;</a>\n' +
'    </div>\n' +
'    <div class="taskbar-center"><i>typeset with Vim and restraint</i></div>\n' +
'    <div class="taskbar-right"><span id="latex-clock">--:--</span></div>\n' +
'  </div>\n' +
'  <script src="../js/theme-toggle.js"></' + 'script>\n' +
'  <script src="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/highlight.min.js"></' + 'script>\n' +
'  <script>hljs.highlightAll();</' + 'script>\n' +
'</body>\n' +
'</html>';
}

/* ── main ── */
const mdFiles = fs.readdirSync(POSTS_DIR)
  .filter(f => f.endsWith('.md') && f.toLowerCase() !== 'readme.md');

const index = [];

for (const file of mdFiles) {
  const slug = slugFromFile(file);
  const raw = fs.readFileSync(path.join(POSTS_DIR, file), 'utf8');
  const { meta, body } = parseFrontmatter(raw);

  if (meta.draft === true || meta.draft === 'true') {
    console.log('skipped draft: posts/' + slug + '.html');
    continue;
  }

  const title = meta.title || slug;
  const date = meta.date || '';
  const tags = Array.isArray(meta.tags) ? meta.tags : [];
  const series = meta.series || null;

  const wordCount = body.split(/\s+/).filter(Boolean).length;
  const readingTime = Math.max(1, Math.round(wordCount / 200));
  const excerpt = (meta.excerpt && String(meta.excerpt)) || deriveExcerpt(body);

  index.push({ slug, title, date, tags, series, readingTime, excerpt, url: 'posts/' + slug + '.html' });
}

index.sort((a, b) => { if (b.date > a.date) return 1; if (b.date < a.date) return -1; return 0; });

for (let i = 0; i < index.length; i++) {
  index[i].prev = i < index.length - 1
    ? { slug: index[i + 1].slug, title: index[i + 1].title } : null;
  index[i].next = i > 0
    ? { slug: index[i - 1].slug, title: index[i - 1].title } : null;
}

for (const post of index) {
  const raw = fs.readFileSync(path.join(POSTS_DIR, post.slug + '.md'), 'utf8');
  const { body } = parseFrontmatter(raw);
  for (const k of Object.keys(usedIds)) delete usedIds[k];

  const fragment = marked.parse(body).trim();

  const html = buildPostHtml({
    slug: post.slug,
    title: post.title,
    date: post.date,
    tags: post.tags,
    series: post.series,
    readingTime: post.readingTime,
    prev: post.prev,
    next: post.next,
    fragment
  });

  fs.writeFileSync(path.join(POSTS_DIR, post.slug + '.html'), html, 'utf8');
  console.log('built: posts/' + post.slug + '.html');
}

fs.writeFileSync(POSTS_JSON, JSON.stringify(index, null, 2), 'utf8');
console.log('updated: posts.json (' + index.length + ' posts)');

/* ── RSS feed ── */
const rssItems = index.map(post => {
  const postUrl = SITE_URL + '/' + post.url;
  const tagsLine = post.tags && post.tags.length
    ? post.tags.map(t => '<category>' + escapeXml(t) + '</category>').join('\n      ')
    : '';
  const seriesLine = post.series
    ? '<itunes:subtitle>series: ' + escapeXml(post.series) + '</itunes:subtitle>'
    : '';
  const descLine = post.excerpt
    ? '<description>' + escapeXml(post.excerpt) + '</description>'
    : '<description>' + escapeXml(post.title) + '</description>';
  return '  <item>\n' +
'    <title>' + escapeXml(post.title) + '</title>\n' +
'    <link>' + postUrl + '</link>\n' +
'    <guid isPermaLink="true">' + postUrl + '</guid>\n' +
'    <pubDate>' + toRfc822(post.date) + '</pubDate>\n' +
'    ' + descLine + '\n' +
'    ' + tagsLine + '\n' +
'    ' + seriesLine + '\n' +
'  </item>';
}).join('\n');

const rssFeed = '<?xml version="1.0" encoding="UTF-8"?>\n' +
'<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:itunes="http://www.itunes.com/dtds/podcast-1.0.dtd">\n' +
'  <channel>\n' +
'    <title>' + escapeXml(SITE_TITLE) + '</title>\n' +
'    <link>' + SITE_URL + '</link>\n' +
'    <description>' + escapeXml(SITE_DESC) + '</description>\n' +
'    <language>en</language>\n' +
'    <atom:link href="' + SITE_URL + '/feed.xml" rel="self" type="application/rss+xml"/>\n' +
'    <lastBuildDate>' + new Date().toUTCString() + '</lastBuildDate>\n' +
rssItems + '\n' +
'  </channel>\n' +
'</rss>\n';

fs.writeFileSync(FEED_XML, rssFeed, 'utf8');
console.log('updated: feed.xml (' + index.length + ' items)');