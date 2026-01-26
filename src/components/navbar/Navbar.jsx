import { Link, useLocation } from "react-router-dom";
import { HiSun, HiMoon, HiMenu, HiX } from "react-icons/hi";
import { useTheme } from "../../context/ThemeContext";
import { useState } from "react";

export default function AppNavbar() {
  const location = useLocation();
  const isLandingPage = location.pathname === "/";
  const { isDark, toggleTheme } = useTheme();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleScrollTo = (e, sectionId) => {
    if (isLandingPage) {
      e.preventDefault();
      const element = document.getElementById(sectionId);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
      setIsMenuOpen(false);
    }
  };

  // Navigation links matched to Landing Page sections
  const navLinks = [
    { id: 'home', label: 'Home' },
    { id: 'features', label: 'Features' },
    { id: 'community', label: 'Community' },
    { id: 'messaging', label: 'Messaging' },
    { id: 'payment', label: 'Payment' },
  ];

  return (
    <nav className="w-full sticky top-0 z-50 bg-white/80 dark:bg-neutral-950/80 backdrop-blur-md border-b border-neutral-100 dark:border-neutral-800 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <img src="/edumentor-logo.png" className="h-8 sm:h-10 transition-transform group-hover:scale-105" alt="EduMentor Logo" />
            <span className="text-2xl font-bold bg-gradient-to-r from-primary-600 to-sky-500 bg-clip-text text-transparent">
              EduMentor
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <a
                key={link.id}
                href={isLandingPage ? `#${link.id}` : `/#${link.id}`}
                onClick={(e) => handleScrollTo(e, link.id)}
                className="relative px-4 py-2 text-neutral-600 dark:text-neutral-300 font-medium hover:text-primary-600 dark:hover:text-primary-400 transition-colors group text-sm"
              >
                {link.label}
                <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-0.5 bg-primary-600 dark:bg-primary-400 transition-all duration-300 group-hover:w-3/4"></span>
              </a>
            ))}
          </div>

          {/* Right side buttons */}
          <div className="flex items-center gap-3">
            {/* Theme toggle */}
            <button
              onClick={toggleTheme}
              className="p-2.5 rounded-xl text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-all duration-200 hover:scale-105"
              aria-label="Toggle theme"
            >
              {isDark ? <HiSun className="w-5 h-5" /> : <HiMoon className="w-5 h-5" />}
            </button>

            {/* Desktop auth buttons */}
            <div className="hidden md:flex items-center gap-3">
              <Link
                to="/login"
                className="px-5 py-2.5 text-neutral-600 dark:text-neutral-300 font-medium hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className="px-6 py-2.5 bg-primary-600 text-white font-semibold rounded-xl hover:bg-primary-700 transition-all duration-200 shadow-lg shadow-primary-600/20 hover:shadow-xl hover:shadow-primary-600/30 hover:scale-105 active:scale-100"
              >
                Sign Up
              </Link>
            </div>

            {/* Mobile menu button */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden p-2.5 rounded-xl text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-all"
              aria-label="Toggle menu"
            >
              {isMenuOpen ? <HiX className="w-6 h-6" /> : <HiMenu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden absolute left-0 right-0 top-full bg-white dark:bg-neutral-950 border-b border-neutral-100 dark:border-neutral-800 shadow-xl">
            <div className="py-4 px-4 space-y-1">
              {navLinks.map((link) => (
                <a
                  key={link.id}
                  href={isLandingPage ? `#${link.id}` : `/#${link.id}`}
                  onClick={(e) => handleScrollTo(e, link.id)}
                  className="block px-4 py-3 text-neutral-600 dark:text-neutral-300 font-medium hover:text-primary-600 dark:hover:text-primary-400 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 rounded-xl transition-all"
                >
                  {link.label}
                </a>
              ))}
              <div className="pt-4 flex gap-3">
                <Link
                  to="/login"
                  className="flex-1 py-3 text-center text-neutral-600 dark:text-neutral-300 font-medium hover:text-primary-600 dark:hover:text-primary-400 border border-neutral-200 dark:border-neutral-700 rounded-xl transition-all"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="flex-1 py-3 text-center bg-primary-600 text-white font-semibold rounded-xl hover:bg-primary-700 transition-all shadow-lg shadow-primary-600/20"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Sign Up
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
