// scripts/prerender-blog.mjs
// Post-build Node script that consumes the compiled SSR bundle (dist-ssr/) and
// writes prerendered HTML into dist/blog/*, dist/sitemap.xml, dist/robots.txt.
// Run via: node scripts/prerender-blog.mjs  (invoked by npm run postbuild in Sprint 5)
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const distDir = join(root, 'dist');
const ssrDir = join(root, 'dist-ssr');

async function importSsr() {
  const entry = pathToFileURL(join(ssrDir, 'entry-prerender.js')).href;
  return await import(entry);
}

async function ensureDir(p) {
  await mkdir(p, { recursive: true });
}

async function writeHtml(path, html) {
  const out = join(distDir, path);
  await ensureDir(dirname(out));
  await writeFile(out, html, 'utf8');
  console.log(`  wrote ${path}`);
}

function injectIntoShell(shell, bodyHtml, headHtml) {
  const ROOT = '<div id="root"></div>';
  if (!shell.includes(ROOT)) {
    throw new Error(`SPA shell at dist/index.html did not contain expected marker "${ROOT}". Did Vite change the shell format?`);
  }
  if (!shell.includes('</head>')) {
    throw new Error(`SPA shell at dist/index.html did not contain </head>. The shell is malformed.`);
  }
  return shell
    .replace('</head>', `${headHtml}\n</head>`)
    .replace(ROOT, `<div id="root">${bodyHtml}</div>`);
}

async function main() {
  if (!existsSync(ssrDir)) {
    throw new Error(`SSR bundle missing at ${ssrDir}. Did you run build:ssr?`);
  }

  const mod = await importSsr();
  const {
    renderBlogRoute,
    buildIndexMeta,
    buildPostMeta,
    buildSitemap,
    buildRobots,
    listPosts,
    collectSitemapEntries,
  } = mod;

  const shellPath = join(distDir, 'index.html');
  const shell = await readFile(shellPath, 'utf8');
  // Strip the default <title> from the shell so our injected title is the only one
  const shellSansTitle = shell.replace(/<title>[\s\S]*?<\/title>\s*/, '');

  // 1) /blog (TR for now; add per-locale later if EN posts exist)
  {
    const body = await renderBlogRoute('/blog', 'tr');
    const head = buildIndexMeta('tr');
    const html = injectIntoShell(shellSansTitle, body, head);
    await writeHtml('blog/index.html', html);
  }

  // 2) /blog/:slug for every (locale, slug)
  for (const locale of ['tr', 'en', 'de']) {
    for (const post of listPosts(locale)) {
      const urlPath = `/blog/${post.frontmatter.slug}`;
      const body = await renderBlogRoute(urlPath, locale);
      const head = buildPostMeta(post.frontmatter);
      const html = injectIntoShell(shellSansTitle, body, head);
      // Path is locale-agnostic: /blog/<slug>/index.html. Locale fallback
      // covered by the SPA's client-side i18n; prerender writes the
      // canonical TR version when the post exists in TR.
      await writeHtml(`blog/${post.frontmatter.slug}/index.html`, html);
    }
  }

  // 3) sitemap.xml
  const sitemap = buildSitemap(collectSitemapEntries());
  await writeHtml('sitemap.xml', sitemap);

  // 4) robots.txt
  const robots = buildRobots();
  await writeHtml('robots.txt', robots);

  console.log('prerender complete');
}

main().catch((err) => {
  console.error('prerender failed:', err);
  process.exit(1);
});
