import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Dropdown, DropdownDivider, DropdownHeader, DropdownItem } from "flowbite-react";
import { HiCog, HiLogout, HiUser } from "react-icons/hi";
import userProfileApi from "../../api/userProfile";
import { useUIContext } from "../../context/UIContext";
import { normalizeAvatarUrl, buildDefaultAvatarUrl } from "../../utils/avatar";
import { UserRole, getRoleName } from "../../utils/userRole";
import { stopChatHub } from "../../signalr/chatHub";

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

  // Determine profile path based on actual ROLE from API, not from URL
  const getProfilePath = () => {
    if (!user) return "/student/profile"; // fallback
    
    const role = user.role;
    if (role === UserRole.Admin || role === 2) return "/admin/profile";
    if (role === UserRole.Mentor || role === 1) return "/mentor/profile";
    if (role === UserRole.Student || role === 0) return "/student/profile";
    
    return "/student/profile"; // fallback
  };

  const getChangePasswordPath = () => {
    if (!user) return "/change-password";
    
    const role = user.role;
    if (role === UserRole.Admin || role === 2) return "/admin/change-password";
    if (role === UserRole.Mentor || role === 1) return "/mentor/change-password";
    if (role === UserRole.Student || role === 0) return "/student/change-password";
    
    return "/change-password";
  };

  const handleLogout = async () => {
    try { await stopChatHub(); } catch {}
    localStorage.removeItem("token");
    navigate("/");
  };

  return (
    <Dropdown
      inline
      arrowIcon={() => (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="currentColor"
          className="ml-2 h-5 w-5 text-neutral-500 dark:text-neutral-400 transition-transform duration-200"
        >
          <path
            fillRule="evenodd"
            d="M5.293 7.293a1 1 0 0 1 1.414 0L10 10.586l3.293-3.293a1 1 0 1 1 1.414 1.414l-4 4a1 1 0 0 1-1.414 0l-4-4a1 1 0 0 1 0-1.414z"
            clipRule="evenodd"
          />
        </svg>
      )}
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

      <DropdownItem icon={HiLogout} className="text-red-600 dark:text-red-600" onClick={handleLogout}>
        Logout
      </DropdownItem>
    </Dropdown>
  );
}
