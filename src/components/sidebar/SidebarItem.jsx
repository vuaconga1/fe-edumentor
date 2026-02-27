// src/components/sidebar/SidebarItem.jsx
import { Link, useLocation } from "react-router-dom";

export default function SidebarItem({ icon: Icon, label, href, collapsed, onClick, badge }) {
  const location = useLocation();
  const isActive = location.pathname === href;
  const showBadgeNumber = badge && badge > 0;

  return (
    <Link
      to={href}
      onClick={onClick}
      className={`
        flex items-center gap-3 px-3 py-2.5 rounded-xl
        transition-all duration-200 group relative
        ${collapsed ? "justify-center px-2" : ""}
        ${isActive 
          ? "bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 font-semibold" 
          : "text-neutral-900 dark:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800"}
      `}
    >
      <div className="relative flex-shrink-0">
        <Icon className={`w-5 h-5 transition-transform group-hover:scale-110 ${isActive ? 'text-primary-600 dark:text-primary-400' : ''}`} />
      </div>
      {!collapsed && (
        <>
          <span className="text-base font-medium truncate flex-1">{label}</span>
          {showBadgeNumber && (
            <span className="min-w-[20px] h-5 px-1.5 bg-red-500 text-white text-[11px] font-bold rounded-full flex items-center justify-center shadow-sm">
              {badge > 99 ? "99+" : badge}
            </span>
          )}
        </>
      )}
    </Link>
  );
}
