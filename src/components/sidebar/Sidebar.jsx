// src/components/sidebar/Sidebar.jsx
import SidebarItem from "./SidebarItem";
import { HiChevronLeft, HiChevronRight } from "react-icons/hi";

export default function Sidebar({ menu = [], collapsed, onToggle }) {
  return (
    <aside
      className={`
        hidden md:flex flex-col bg-white dark:bg-neutral-900 text-neutral-700 dark:text-neutral-300 h-screen fixed top-0 left-0 z-30
        transition-all duration-300 border-r border-neutral-200 dark:border-neutral-800
        ${collapsed ? "w-16" : "w-64"}
      `}
    >
      {/* Collapse Toggle Button */}
      <button
        onClick={onToggle}
        className="absolute -right-3 top-20 bg-white dark:bg-neutral-800 hover:bg-primary-50 dark:hover:bg-primary-900/30 
          w-6 h-6 rounded-full flex items-center justify-center text-neutral-600 dark:text-neutral-300 shadow-md
          border border-neutral-200 dark:border-neutral-700 hover:border-primary-300 dark:hover:border-primary-600 
          hover:text-primary-600 dark:hover:text-primary-400 transition-all duration-200 z-50"
      >
        {collapsed ? (
          <HiChevronRight className="w-4 h-4" />
        ) : (
          <HiChevronLeft className="w-4 h-4" />
        )}
      </button>

      {/* Header / Logo */}
      <a
        href="/"
        className={`flex items-center gap-3 h-14 border-b border-neutral-200 dark:border-neutral-800 ${collapsed ? "px-3 justify-center" : "px-4"} cursor-pointer select-none hover:bg-neutral-100 dark:hover:bg-neutral-900 transition-colors`}
        tabIndex={0}
        aria-label="Go to home"
      >
        <img
          src="/edumentor-logo.png"
          className="w-8 h-8 flex-shrink-0"
          alt="logo"
        />
        {!collapsed && (
          <span className="text-lg font-bold text-neutral-900 dark:text-white truncate">EduMentor</span>
        )}
      </a>

      {/* Menu items */}
      <nav className="flex-1 mt-4 space-y-1 overflow-y-auto px-2 scrollbar-thin scrollbar-thumb-neutral-300 dark:scrollbar-thumb-neutral-700 scrollbar-track-transparent hover:scrollbar-thumb-neutral-400 dark:hover:scrollbar-thumb-neutral-600">
        {menu.map((item, index) => (
          <SidebarItem
            key={index}
            icon={item.icon}
            label={item.label}
            href={item.href}
            collapsed={collapsed}
            badge={item.badge}
          />
        ))}
      </nav>
    </aside>
  );
}
