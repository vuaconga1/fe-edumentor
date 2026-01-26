import SidebarLayout from './SidebarLayout';
import { ADMIN_MENU } from "../config/menus";

export default function AdminLayout() {
  const user = {
    name: "Nguyễn Văn Admin",
    email: "admin@gmail.com",
    avatar: "/avatar-default.jpg",
  };

  return <SidebarLayout menu={ADMIN_MENU} title="EduMentor" user={user} />;
}

