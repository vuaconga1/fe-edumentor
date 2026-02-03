// src/components/sidebar/SidebarItem.jsx
import { Link, useLocation } from "react-router-dom";

export default function SidebarItem({ icon: Icon, label, href, collapsed, onClick }) {
  const location = useLocation();
  const isActive = location.pathname === href;

  return (
    <Link
      to={href}
      onClick={onClick}
      className={`
        flex items-center gap-3 px-3 py-2.5 rounded-xl
        transition-all duration-200 group
        ${collapsed ? "justify-center px-2" : ""}
        ${isActive 
          ? "bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 font-semibold" 
          : "text-neutral-900 dark:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800"}
      `}
    >
      <Icon className={`w-5 h-5 flex-shrink-0 transition-transform group-hover:scale-110 ${isActive ? 'text-primary-600 dark:text-primary-400' : ''}`} />
      {!collapsed && <span className="text-base font-medium truncate">{label}</span>}
    </Link>
  );
}
