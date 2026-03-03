import SidebarLayout from './SidebarLayout';
import { ADMIN_MENU } from "../config/menus";
import { useAuth } from '../hooks/useAuth';

export default function AdminLayout() {
  const { user, loading } = useAuth();

  return <SidebarLayout menu={ADMIN_MENU} title="EduMentor" user={user} loading={loading} />;
}

