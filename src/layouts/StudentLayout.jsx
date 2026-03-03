import { Outlet } from 'react-router-dom';
import SidebarLayout from './SidebarLayout';
import { STUDENT_MENU } from '../config/menus';
import { useAuth } from '../hooks/useAuth';
import useUnseenMessages from '../hooks/useUnseenMessages';

export default function StudentLayout() {
  const { user, loading } = useAuth();
  const unseenCount = useUnseenMessages();

  // Add badge to Messaging menu item
  const menuWithBadges = STUDENT_MENU.map(item => {
    if (item.href === '/student/messaging') {
      return { ...item, badge: unseenCount };
    }
    return item;
  });

  return (
    <SidebarLayout
      menu={menuWithBadges}
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
