import './i18n';
import { StrictMode } from 'react';
import { createRoot, hydrateRoot } from 'react-dom/client';
import './index.css';
import App from './App.tsx';
import { DataProvider } from './contexts/DataContext.tsx';
import { AuthProvider } from './contexts/AuthContext.tsx';
import { FleetProvider } from './contexts/FleetContext.tsx';
import ErrorBoundary from './components/common/ErrorBoundary.tsx';

const container = document.getElementById('root')!;
const tree = (
  <StrictMode>
    <ErrorBoundary>
      <AuthProvider>
        <FleetProvider>
          <DataProvider>
            <App />
          </DataProvider>
        </FleetProvider>
      </AuthProvider>
    </ErrorBoundary>
  </StrictMode>
);

// If prerender wrote real rendered HTML into #root, hydrate it. Whitespace-only
// text nodes (e.g. from HTML minification) don't count — we only hydrate when
// there's an actual element present.
const hasServerHtml = container.firstElementChild !== null;
if (hasServerHtml) {
  hydrateRoot(container, tree);
} else {
  createRoot(container).render(tree);
}

