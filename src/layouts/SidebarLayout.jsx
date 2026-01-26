import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Topbar from '../components/topbar/Topbar';
import Sidebar from '../components/sidebar/Sidebar';
import SidebarDrawer from '../components/sidebar/SidebarDrawer';

export default function SidebarLayout({ menu, title = "Dashboard", user }) {

  const [collapsed, setCollapsed] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <>
      {/* Mobile Drawer */}
      <SidebarDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        menu={menu}
      />
      
      <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 transition-colors duration-300">
        
        {/* Sidebar Desktop */}
        <Sidebar
          menu={menu}
          collapsed={collapsed}
          onToggle={() => setCollapsed(!collapsed)}
        />

        {/* Main Content Area */}
        <div
          className={`
            min-h-screen transition-all duration-300
            ${collapsed ? "md:ml-16" : "md:ml-64"}
          `}
        >
          {/* Topbar */}
          <Topbar 
            onMenuClick={() => setDrawerOpen(true)} 
            title={title}
            sidebarCollapsed={collapsed}
            user={user}
          />

          {/* Page Content */}
          <main className="pt-14">
            <div className="p-4 md:p-6 text-neutral-900 dark:text-neutral-100">
              <Outlet />
            </div>
          </main>
        </div>
      </div>
    </>
  );
}