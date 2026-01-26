
import { Outlet } from 'react-router-dom';
import SidebarLayout from './SidebarLayout';
import { Search, MessageCircle, UsersRound, Wallet, History, UserCircle } from 'lucide-react';

// Student menu with links and icons
const STUDENT_MENU = [
  { label: "Find Mentor", href: "/student/find-mentor", icon: Search },
  { label: "My Profile", href: "/student/profile", icon: UserCircle },
  { label: "Community", href: "/student/community", icon: UsersRound },
  { label: "Messaging", href: "/student/messaging", icon: MessageCircle },
  { label: "My Wallet", href: "/student/wallet", icon: Wallet },
  { label: "Order History", href: "/student/orders", icon: History },
];

export default function StudentLayout() {
  const user = {
    name: "Nguyễn Văn Student",
    email: "student@gmail.com",
    avatar: "/avatar-default.jpg",
  };

  return (
    <SidebarLayout
      menu={STUDENT_MENU}
      title="EduMentor"
      user={user}
    >
      <div className="p-6 lg:ml-[240px] mt-14">
        <Outlet />
      </div>
    </SidebarLayout>
  );
}
