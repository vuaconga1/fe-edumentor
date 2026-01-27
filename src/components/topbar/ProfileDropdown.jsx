import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Dropdown, DropdownDivider, DropdownHeader, DropdownItem } from "flowbite-react";
import { HiCog, HiLogout, HiUser } from "react-icons/hi";
import userProfileApi from "../../api/userProfile";
import { useUIContext } from "../../context/UIContext";
import { normalizeAvatarUrl, buildDefaultAvatarUrl } from "../../utils/avatar";
export default function ProfileDropdown() {
  const navigate = useNavigate();
  const location = useLocation();
  const { openChangePasswordModal } = useUIContext();

  const [user, setUser] = useState(null);

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        const res = await userProfileApi.getAll(); // GET /api/User/profile
        const u = res?.data?.data;
        if (mounted) setUser(u ?? null);
      } catch (e) {
        if (mounted) setUser(null);
      }
    })();

    return () => { mounted = false; };
  }, []);

  const username = user?.fullName || "Guest User";
  const email = user?.email || "guest@example.com";
  const avatar =
    normalizeAvatarUrl(user?.avatarUrl) ||
    buildDefaultAvatarUrl({
      id: user?.id,
      email: user?.email,
      fullName: user?.fullName
    });


  const getProfilePath = () => {
    if (location.pathname.startsWith("/mentor")) return "/mentor/profile";
    if (location.pathname.startsWith("/student")) return "/student/profile";
    return "/student/profile";
  };

  const getChangePasswordPath = () => {
    if (location.pathname.startsWith("/mentor")) return "/mentor/change-password";
    if (location.pathname.startsWith("/student")) return "/student/change-password";
    return "/change-password";
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/");
  };

  return (
    <Dropdown
      inline
      label={
        <img
          src={avatar}
          alt="avatar"
          className="w-10 h-10 rounded-full object-cover border border-neutral-200 dark:border-neutral-800"
          onError={(e) => {
            e.currentTarget.onerror = null;
            e.currentTarget.src = buildDefaultAvatarUrl({
              id: user?.id,
              email: user?.email,
              fullName: user?.fullName
            });
          }}

        />
      }
      className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800"
    >
      <DropdownHeader>
        <span className="block text-sm font-medium">{username}</span>
        <span className="block truncate text-sm text-neutral-500">{email}</span>
      </DropdownHeader>

      <DropdownItem icon={HiUser} onClick={() => navigate(getProfilePath())}>
        My Profile
      </DropdownItem>
      <DropdownItem icon={HiCog} onClick={() => openChangePasswordModal()}>
        Change Password
      </DropdownItem>

      <DropdownDivider className="border-neutral-200 dark:border-neutral-800" />

      <DropdownItem icon={HiLogout} className="text-red-600" onClick={handleLogout}>
        Logout
      </DropdownItem>
    </Dropdown>
  );
}
