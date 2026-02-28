import { useState, useEffect } from 'react';
import { HiClipboardCopy, HiUserAdd, HiX, HiCheck } from 'react-icons/hi';
import { toast } from 'react-toastify';
import communityApi from '../api/communityApi';
import groupApi from '../api/groupApi';
import { jwtDecode } from 'jwt-decode';

export default function InviteToGroupModal({ isOpen, onClose, group, onMemberAdded }) {
  const [inviteCode, setInviteCode] = useState('');
  const [followers, setFollowers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [addingUserId, setAddingUserId] = useState(null);
  const [addedUserIds, setAddedUserIds] = useState(new Set());

  useEffect(() => {
    if (isOpen && group) {
      setInviteCode(group.inviteCode || '');
      loadFollowers();
      // Mark existing members as already added
      const memberIds = new Set((group.members || []).map(m => m.userId || m.id));
      setAddedUserIds(memberIds);
    }
  }, [isOpen, group]);

  const loadFollowers = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const payload = jwtDecode(token);
      const userId = payload["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier"] || payload.sub;

      const res = await communityApi.getFollowers(userId);
      console.log('[InviteModal] Followers loaded:', res?.data?.data);
      setFollowers(res?.data?.data?.users || []);
    } catch (e) {
      console.error('Load followers failed', e);
      setFollowers([]);
    }
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(inviteCode);
    toast.success('Invite code copied!');
  };

  const handleAddMember = async (userId) => {
    setAddingUserId(userId);
    try {
      // Call API to add member to group
      const res = await groupApi.addMember(group.id, userId);
      if (res?.data?.success) {
        toast.success('Member added to group!');
        setAddedUserIds(prev => new Set([...prev, userId]));
        onMemberAdded?.();
      } else {
        toast.error(res?.data?.message || 'Failed to add member');
      }
    } catch (e) {
      console.error('Add member failed', e);
      toast.error(e?.response?.data?.message || 'Failed to add member');
    } finally {
      setAddingUserId(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-neutral-900 rounded-xl p-6 w-full max-w-md max-h-[80vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Invite to Group</h2>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
          >
            <HiX className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Invite Code Section */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Group Invite Code
          </label>
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={inviteCode}
              readOnly
              className="flex-1 px-4 py-2 rounded-lg bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 font-mono text-lg tracking-wider"
            />
            <button
              onClick={handleCopyCode}
              className="p-3 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors"
              title="Copy invite code"
            >
              <HiClipboardCopy className="w-5 h-5" />
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Share this code to invite others to the group
          </p>
        </div>

        {/* Followers Section */}
        <div className="flex-1 min-h-0 flex flex-col">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
            Add from followers list
          </h3>

          <div className="flex-1 overflow-y-auto space-y-2">
            {followers.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-4">
                No followers found
              </p>
            ) : (
              followers.map((follower) => {
                const fId = follower.id || follower.userId;
                const isAdded = addedUserIds.has(fId);
                const isAdding = addingUserId === fId;

                return (
                  <div
                    key={fId}
                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-800"
                  >
                    <img
                      src={follower.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(follower.fullName || 'User')}`}
                      alt={follower.fullName}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 dark:text-white truncate">
                        {follower.fullName || 'Unknown'}
                      </p>
                      <p className="text-xs text-gray-500 truncate">
                        {follower.email}
                      </p>
                    </div>
                    <button
                      onClick={() => handleAddMember(fId)}
                      disabled={isAdded || isAdding}
                      className={`p-2 rounded-lg transition-colors ${
                        isAdded
                          ? 'bg-green-100 text-green-600 cursor-default'
                          : isAdding
                          ? 'bg-gray-100 text-gray-400 cursor-wait'
                          : 'bg-blue-100 text-blue-600 hover:bg-blue-200'
                      }`}
                      title={isAdded ? 'Added' : 'Add to group'}
                    >
                      {isAdded ? (
                        <HiCheck className="w-5 h-5" />
                      ) : isAdding ? (
                        <div className="w-5 h-5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <HiUserAdd className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="mt-4 pt-4 border-t border-neutral-200 dark:border-neutral-800">
          <button
            onClick={onClose}
            className="w-full py-2 rounded-lg bg-neutral-200 dark:bg-neutral-700 text-gray-700 dark:text-gray-300 hover:bg-neutral-300 dark:hover:bg-neutral-600 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
