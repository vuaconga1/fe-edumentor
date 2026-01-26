import { Outlet } from 'react-router-dom';
import AppNavbar from '../components/navbar/Navbar';
import AppFooter from '../components/footer/footer';

const LandingLayout = () => {
  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-neutral-950 w-full transition-colors duration-300">

      {/* Navbar */}
      <AppNavbar />

      {/* Content */}
      <main className="flex-1 w-full">
        <Outlet />
      </main>

      {/* Footer */}
      <AppFooter />
    </div>
  );
};

export default LandingLayout;
