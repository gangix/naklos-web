// src/entry-prerender.tsx
// Compiled by `vite build --ssr`. Node imports the output bundle and calls
// `renderBlogRoute` per route. Kept deliberately minimal to avoid pulling
// auth/fleet providers into the SSR bundle — the stub AuthContext below
// is the only context a blog page needs (Header reads it for the login button).
import { StrictMode, type ContextType } from 'react';
import { renderToString } from 'react-dom/server';
import { createStaticHandler, createStaticRouter, StaticRouterProvider } from 'react-router';
import { I18nextProvider } from 'react-i18next';
import i18next from 'i18next';
import { initReactI18next } from 'react-i18next';
import { AuthContext } from './contexts/AuthContext';
import BlogIndexPage from './pages/blog/BlogIndexPage';
import BlogPostPage from './pages/blog/BlogPostPage';
import LandingPage from './pages/LandingPage';
import { listPosts } from './content/loader';
import { buildIndexMeta, buildPostMeta, buildLandingMeta } from './prerender/metaBuilder';
import { buildSitemap, buildRobots, type SitemapEntry } from './prerender/sitemapBuilder';

// ---------------------------------------------------------------------------
// Standalone i18n instance for SSR — does NOT use HttpBackend, which would
// hang in Node trying to fetch /locales/*.json from a dev server that is not
// running. Resources are imported statically so Vite can inline them.
// ---------------------------------------------------------------------------
import trTranslation from '../public/locales/tr/translation.json';
import enTranslation from '../public/locales/en/translation.json';
import deTranslation from '../public/locales/de/translation.json';

const ssrI18n = i18next.createInstance();

let i18nInitPromise: Promise<void> | null = null;

async function ensureI18nInit(locale: string): Promise<void> {
  if (!i18nInitPromise) {
    i18nInitPromise = ssrI18n
      .use(initReactI18next)
      .init({
        lng: locale,
        fallbackLng: 'tr',
        resources: {
          tr: { translation: trTranslation },
          en: { translation: enTranslation },
          de: { translation: deTranslation },
        },
        interpolation: { escapeValue: false },
        returnNull: false,
      })
      .then(() => undefined);
    await i18nInitPromise;
  } else {
    await i18nInitPromise;
  }
  if (ssrI18n.language !== locale) {
    await ssrI18n.changeLanguage(locale);
  }
}

// ---------------------------------------------------------------------------
// Stub auth — blog never logs in. The Header's `login` button stays clickable
// and falls through to a no-op until client-side hydration replaces this.
// ---------------------------------------------------------------------------
const stubAuth = {
  authenticated: false,
  isDriver: false,
  isFleetManager: false,
  hasBothRoles: false,
  user: null,
  setUser: () => {},
  login: () => {},
  loginWith: () => {},
  register: () => {},
  loginAsDriver: () => {},
  loginAsManager: () => {},
  logout: () => {},
} as unknown as ContextType<typeof AuthContext>;

const routes = [
  { path: '/',           element: <LandingPage /> },
  { path: '/blog',       element: <BlogIndexPage /> },
  { path: '/blog/:slug', element: <BlogPostPage /> },
];

export async function renderBlogRoute(url: string, locale: string): Promise<string> {
  await ensureI18nInit(locale);

  const handler = createStaticHandler(routes);
  const request = new Request(`https://naklos.com.tr${url}`);
  const context = await handler.query(request);
  if (context instanceof Response) {
    throw new Error(`Route ${url} returned a Response (redirect/throw)`);
  }
  const router = createStaticRouter(handler.dataRoutes, context);

  return renderToString(
    <StrictMode>
      <AuthContext.Provider value={stubAuth}>
        <I18nextProvider i18n={ssrI18n}>
          <StaticRouterProvider router={router} context={context} />
        </I18nextProvider>
      </AuthContext.Provider>
    </StrictMode>,
  );
}

export async function renderLandingRoute(locale: string): Promise<string> {
  // Reuses the same routing/i18n machinery as renderBlogRoute. The landing
  // route ('/') is registered in `routes` above so the static handler matches it.
  return renderBlogRoute('/', locale);
}

export function collectSitemapEntries(): SitemapEntry[] {
  const today = new Date().toISOString().slice(0, 10);
  const entries: SitemapEntry[] = [
    { path: '/',     lastmod: today },
    { path: '/blog', lastmod: today },
  ];
  for (const locale of ['tr', 'en', 'de'] as const) {
    for (const p of listPosts(locale)) {
      entries.push({
        path: `/blog/${p.frontmatter.slug}`,
        lastmod: p.frontmatter.date,
      });
    }
  }
  // de-dupe by path (fallback locales share slugs)
  const seen = new Set<string>();
  return entries.filter((e) => (seen.has(e.path) ? false : (seen.add(e.path), true)));
}

export { buildIndexMeta, buildPostMeta, buildLandingMeta, buildSitemap, buildRobots, listPosts };
