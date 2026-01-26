import { HiMenu, HiSun, HiMoon } from "react-icons/hi";
import ProfileDropdown from "./ProfileDropdown";
import { useTheme } from "../../context/ThemeContext";

export default function Topbar({ onMenuClick, title = "Dashboard", user }) {
  const { isDark, toggleTheme } = useTheme();

  return (
    <header className="fixed top-0 left-0 right-0 w-full h-14 bg-white/80 dark:bg-neutral-900/80 backdrop-blur-md border-b border-neutral-200 dark:border-neutral-800 px-4 flex items-center justify-between z-40">
      {/* LEFT: Hamburger + Logo */}
      <div className="flex items-center gap-3">
        {/* Hamburger button - only visible on mobile */}
        <button
          onClick={onMenuClick}
          className="md:hidden p-2 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
        >
          <HiMenu className="w-6 h-6 text-neutral-700 dark:text-neutral-300" />
        </button>

        {/* Logo */}
        <a
          href="/"
          className="flex items-center gap-2 group cursor-pointer select-none hover:bg-neutral-100 dark:hover:bg-neutral-900 rounded-lg px-1 py-0.5 transition-colors"
          tabIndex={0}
          aria-label="Go to home"
        >
          <img
            src="/edumentor-logo.png"
            alt="EduMentor Logo"
            className="w-8 h-8 object-contain group-hover:scale-105 transition-transform"
          />
          <span className="text-lg font-bold text-neutral-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
            EduMentor
          </span>
        </a>
      </div>

      {/* RIGHT: Theme Toggle + Profile */}
      <div className="flex items-center gap-2">
        <button
          onClick={toggleTheme}
          className="p-2.5 rounded-xl text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-all duration-200"
          aria-label="Toggle theme"
        >
          {isDark ? <HiSun className="w-5 h-5" /> : <HiMoon className="w-5 h-5" />}
        </button>
        <ProfileDropdown user={user} />
      </div>
    </header>
  );
}
