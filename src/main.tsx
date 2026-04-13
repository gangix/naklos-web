import './i18n';
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { DataProvider } from './contexts/DataContext.tsx'
import { AuthProvider } from './contexts/AuthContext.tsx'
import { FleetProvider } from './contexts/FleetContext.tsx'
import ErrorBoundary from './components/common/ErrorBoundary.tsx'

createRoot(document.getElementById('root')!).render(
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
  </StrictMode>,
)

