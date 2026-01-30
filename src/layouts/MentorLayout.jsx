import { Outlet } from 'react-router-dom';
import SidebarLayout from './SidebarLayout';
import { MENTOR_MENU } from '../config/menus';
import { useAuth } from '../context/AuthContext';

export default function MentorLayout() {
  const { user, loading } = useAuth();

  return (
    <SidebarLayout
      menu={MENTOR_MENU}
      title="EduMentor"
      user={user}
      loading={loading}
    >
      <div className="p-6 lg:ml-[240px] mt-14">
        <Outlet />
      </div>
    </SidebarLayout>
  );
}
