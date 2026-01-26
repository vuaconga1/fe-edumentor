import { Outlet } from 'react-router-dom';
import SidebarLayout from './SidebarLayout';
import { HomeIcon, MessageCircle, UsersRound, Wallet, Star, UserCircle } from 'lucide-react';

// Mentor menu with links and icons
const MENTOR_MENU = [
  { label: "Home", href: "/mentor", icon: HomeIcon },
  { label: "My Profile", href: "/mentor/profile", icon: UserCircle },
  { label: "Community", href: "/mentor/community", icon: UsersRound },
  { label: "Messaging", href: "/mentor/messaging", icon: MessageCircle },
  { label: "My Wallet", href: "/mentor/wallet", icon: Wallet },
  { label: "Reviews", href: "/mentor/reviews", icon: Star },
];

export default function MentorLayout() {
  const user = {
    name: "Nguyễn Văn Mentor",
    email: "mentor@gmail.com",
    avatar: "/avatar-default.jpg",
  };

  return (
    <SidebarLayout
      menu={MENTOR_MENU}
      title="EduMentor"
      user={user}
    >
      <div className="p-6 lg:ml-[240px] mt-14">
        <Outlet />
      </div>
    </SidebarLayout>
  );
}
