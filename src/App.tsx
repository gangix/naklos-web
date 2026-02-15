import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/layout/Layout';
import DashboardPage from './pages/DashboardPage';
import TrucksPage from './pages/TrucksPage';
import TripsPage from './pages/TripsPage';
import ClientsPage from './pages/ClientsPage';
import MorePage from './pages/MorePage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="trucks" element={<TrucksPage />} />
          <Route path="trips" element={<TripsPage />} />
          <Route path="clients" element={<ClientsPage />} />
          <Route path="more" element={<MorePage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
