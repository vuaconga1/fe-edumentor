import SidebarLayout from './SidebarLayout';
import { ADMIN_MENU } from "../config/menus";
import { useAuth } from '../context/AuthContext';

export default function AdminLayout() {
  const { user, loading } = useAuth();

  return <SidebarLayout menu={ADMIN_MENU} title="EduMentor" user={user} loading={loading} />;
}

