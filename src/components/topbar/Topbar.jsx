import { HiMenu, HiSun, HiMoon } from "react-icons/hi";
import ProfileDropdown from "./ProfileDropdown";
import NotificationDropdown from "../notification/NotificationDropdown";
import { useTheme } from "../../context/ThemeContext";

export default function Topbar({ onMenuClick, title = "Dashboard", user }) {
  const { isDark, toggleTheme } = useTheme();

  return (
    <header className="fixed top-0 left-0 right-0 w-full h-14 bg-white/80 dark:bg-neutral-900/80 backdrop-blur-md border-b border-neutral-200 dark:border-neutral-800 px-4 flex items-center justify-between z-40">
      {/* LEFT: Hamburger + Logo */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Hamburger button - only visible on mobile */}
        <button
          onClick={onMenuClick}
          className="md:hidden p-2 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
        >
          <HiMenu className="w-6 h-6 text-neutral-700 dark:text-neutral-300" />
        </button>

        {/* Logo */}
        <a className="flex items-center gap-1.5 sm:gap-2 group" href="/" data-discover="true">
          <img className="h-7 sm:h-8 md:h-10 transition-transform group-hover:scale-105" alt="EduMentor Logo" src="/edumentor-logo.png" />
          <span className="text-lg sm:text-xl md:text-2xl font-bold bg-gradient-to-r from-primary-600 to-sky-500 bg-clip-text text-transparent">EduMentor</span>
        </a>
      </div>

      {/* RIGHT: Theme Toggle + Notification + Profile */}
      <div className="flex items-center gap-2">
        <button
          onClick={toggleTheme}
          className="p-2.5 rounded-xl text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-all duration-200"
          aria-label="Toggle theme"
        >
          {isDark ? <HiSun className="w-5 h-5" /> : <HiMoon className="w-5 h-5" />}
        </button>
        <NotificationDropdown />
        <ProfileDropdown user={user} />
      </div>
    </header>
  );
}
