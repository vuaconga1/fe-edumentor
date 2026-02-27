import React, { useMemo, useState, useRef, useEffect } from "react";
import { HiPlus, HiUserGroup, HiUserAdd, HiLogin, HiDotsVertical } from "react-icons/hi";
import CreateGroupModal from "../CreateGroupModal";
import InviteToGroupModal from "../InviteToGroupModal";
import JoinGroupModal from "../JoinGroupModal";
import { formatTime } from "../../utils/dateUtils";

const GroupList = ({ groups = [], activeGroupId, onSelectGroup, activeGroup, onRefreshGroups }) => {
  const [search, setSearch] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isCreateGroupModalOpen, setIsCreateGroupModalOpen] = useState(false);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return groups;
    return groups.filter((g) => {
      const name = (g.name || "").toLowerCase();
      const desc = (g.description || "").toLowerCase();
      return name.includes(q) || desc.includes(q);
    });
  }, [groups, search]);

  const handleGroupCreated = (newGroup) => {
    setIsCreateGroupModalOpen(false);
    onRefreshGroups?.();
    if (onSelectGroup && newGroup?.id) {
      onSelectGroup(newGroup.id);
    }
  };

  const handleGroupJoined = (group) => {
    setIsJoinModalOpen(false);
    onRefreshGroups?.();
    if (onSelectGroup && group?.id) {
      onSelectGroup(group.id);
    }
  };

  const handleMemberAdded = () => {
    onRefreshGroups?.();
  };

  const handleDropdownClick = (action) => {
    setIsDropdownOpen(false);
    switch (action) {
      case "create":
        setIsCreateGroupModalOpen(true);
        break;
      case "invite":
        if (!activeGroup) {
          alert("Please select a group before inviting members");
          return;
        }
        setIsInviteModalOpen(true);
        break;
      case "join":
        setIsJoinModalOpen(true);
        break;
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="p-3 flex items-center gap-2">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search groups..."
          className="flex-1 px-4 py-2 rounded-xl bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 outline-none"
        />
        
        {/* Dropdown Menu Button */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="p-2 rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition-colors"
            title="Group Actions"
          >
            <HiDotsVertical className="w-5 h-5" />
          </button>

          {/* Dropdown Menu */}
          {isDropdownOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-neutral-800 rounded-xl shadow-lg border border-neutral-200 dark:border-neutral-700 overflow-hidden z-50">
              <button
                onClick={() => handleDropdownClick("create")}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors text-left"
              >
                <HiPlus className="w-5 h-5 text-green-600" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-200">Tạo nhóm mới</span>
              </button>
              <button
                onClick={() => handleDropdownClick("invite")}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors text-left border-t border-neutral-100 dark:border-neutral-700"
              >
                <HiUserAdd className="w-5 h-5 text-blue-600" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-200">Mời vào nhóm</span>
              </button>
              <button
                onClick={() => handleDropdownClick("join")}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors text-left border-t border-neutral-100 dark:border-neutral-700"
              >
                <HiLogin className="w-5 h-5 text-purple-600" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-200">Tham gia nhóm</span>
              </button>
            </div>
          )}
        </div>

        {/* Modals */}
        <CreateGroupModal
          isOpen={isCreateGroupModalOpen}
          onClose={() => setIsCreateGroupModalOpen(false)}
          onGroupCreated={handleGroupCreated}
        />

        <InviteToGroupModal
          isOpen={isInviteModalOpen}
          onClose={() => setIsInviteModalOpen(false)}
          group={activeGroup}
          onMemberAdded={handleMemberAdded}
        />

        <JoinGroupModal
          isOpen={isJoinModalOpen}
          onClose={() => setIsJoinModalOpen(false)}
          onGroupJoined={handleGroupJoined}
        />
      </div>

      <div className="flex-1 overflow-y-auto">
        {!groups ? (
          <div className="p-6 text-neutral-500">Loading...</div>
        ) : filtered.length ? (
          filtered.map((group) => (
            <GroupItem
              key={group.id}
              group={group}
              isActive={activeGroupId === group.id}
              onClick={() => onSelectGroup(group.id)}
            />
          ))
        ) : (
          <div className="p-8 text-center text-neutral-500">No groups found</div>
        )}
      </div>
    </div>
  );
};

const GroupItem = ({ group, isActive, onClick }) => {
  return (
    <div
      onClick={onClick}
      className={`
        group flex items-center gap-3 p-3 mx-2 my-1 rounded-xl cursor-pointer transition-all duration-200
        ${
          isActive
            ? "bg-blue-50 dark:bg-blue-900/30"
            : "hover:bg-neutral-100 dark:hover:bg-neutral-800 bg-transparent"
        }
      `}
    >
      {/* Group Icon */}
      <div className="relative flex-shrink-0">
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
          <HiUserGroup className="w-6 h-6 text-white" />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        {/* Tên group + giờ + unread count */}
        <div className="flex items-center justify-between mb-0.5">
          <h3
            className={`font-semibold text-sm truncate ${
              isActive
                ? "text-blue-700 dark:text-blue-300"
                : "text-gray-900 dark:text-white"
            }`}
          >
            {group.name}
          </h3>
          
          <div className="flex flex-col items-end gap-0.5 flex-shrink-0 ml-2">
            <span className="text-[11px] text-gray-400 font-medium">
              {group.lastMessageAt ? formatTime(group.lastMessageAt) : ""}
            </span>
            {(group.unreadCount ?? 0) > 0 && (
              <span className="min-w-[18px] h-[18px] px-1 bg-blue-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow-sm">
                {group.unreadCount > 99 ? "99+" : group.unreadCount}
              </span>
            )}
          </div>
        </div>

        {group.lastMessage && (
          <p className={`text-xs truncate ${
            (group.unreadCount ?? 0) > 0
              ? "font-semibold text-gray-900 dark:text-gray-100"
              : "text-gray-500 dark:text-gray-400 font-normal"
          }`}>
            {group.lastMessageSender && (
              <span className="font-medium">{group.lastMessageSender}: </span>
            )}
            {group.lastMessage}
          </p>
        )}
      </div>
    </div>
  );
};

export default GroupList;
