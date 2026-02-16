import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Menu } from 'lucide-react';
import ManagerSidebar from './ManagerSidebar';
import MobileSheet from './MobileSheet';
import RoleSwitcher from '../common/RoleSwitcher';

const ManagerLayout = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Desktop Sidebar - Always visible on lg+ */}
      {/* Responsive width: 200px (lg-xl), 240px (xl+) */}
      <aside className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:z-50 lg:flex lg:w-50 xl:w-60 lg:flex-col">
        <ManagerSidebar />
      </aside>

      {/* Mobile Header with Hamburger */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-white border-b border-gray-200 flex items-center px-4 z-30">
        <button
          onClick={() => setMobileMenuOpen(true)}
          className="flex items-center justify-center w-10 h-10 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <Menu className="h-6 w-6 text-gray-600" />
        </button>
        <span className="ml-4 text-lg font-semibold text-gray-900">Naklos Manager</span>
      </div>

      {/* Mobile Sheet/Drawer */}
      <MobileSheet open={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)}>
        <ManagerSidebar />
      </MobileSheet>

      {/* Role Switcher (Dev Tool) */}
      <RoleSwitcher />

      {/* Main Content - Offset by sidebar on desktop, by header on mobile */}
      {/* Responsive padding: 200px (lg-xl), 240px (xl+) to match sidebar width */}
      <main className="pt-16 lg:pt-0 lg:pl-50 xl:pl-60">
        <div className="p-4 lg:p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default ManagerLayout;
