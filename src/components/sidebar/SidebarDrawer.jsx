// src/components/sidebar/SidebarDrawer.jsx
import { Link } from 'react-router-dom';
import { HiX } from 'react-icons/hi';

export default function SidebarDrawer({ open, onClose, menu = [] }) {
  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 z-[9998] bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Drawer */}
      <div className="fixed inset-y-0 left-0 z-[9999] w-72 bg-white dark:bg-neutral-950 shadow-2xl transform transition-transform duration-300 ease-out">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-200 dark:border-neutral-800">
          <h2 className="text-lg font-bold text-neutral-900 dark:text-white">MENU</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
          >
            <HiX className="w-5 h-5" />
          </button>
        </div>

        {/* Menu Items */}
        <nav className="p-4 space-y-1 overflow-y-auto max-h-[calc(100vh-80px)] scrollbar-thin scrollbar-thumb-neutral-300 dark:scrollbar-thumb-neutral-700 scrollbar-track-transparent">
          {menu.map((item, index) => {
            const Icon = item.icon;
            const hasBadge = item.badge && item.badge > 0;
            return (
              <Link
                key={index}
                to={item.href}
                onClick={onClose}
                className="flex items-center gap-3 px-4 py-3 rounded-xl text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-900 hover:text-neutral-900 dark:hover:text-white transition-all font-medium relative"
              >
                <div className="relative flex-shrink-0">
                  {Icon && <Icon className="w-5 h-5" />}
                </div>
                <span className="flex-1">{item.label}</span>
                {hasBadge && (
                  <span className="min-w-[20px] h-5 px-1.5 bg-red-500 text-white text-[11px] font-bold rounded-full flex items-center justify-center shadow-sm">
                    {item.badge > 99 ? "99+" : item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </div>
    </>
  );
}
