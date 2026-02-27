import { useState } from 'react';
import { HiX, HiUserGroup } from 'react-icons/hi';
import { toast } from 'react-toastify';
import groupApi from '../api/groupApi';

export default function JoinGroupModal({ isOpen, onClose, onGroupJoined }) {
  const [inviteCode, setInviteCode] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const code = inviteCode.trim();
    if (!code) {
      toast.error('Please enter an invite code');
      return;
    }

    setLoading(true);
    try {
      const res = await groupApi.joinGroup(code);
      console.log('[JoinGroup] Response:', res?.data);
      
      if (res?.data?.success) {
        toast.success('Successfully joined the group!');
        onGroupJoined?.(res.data.data);
        setInviteCode('');
        onClose();
      } else {
        toast.error(res?.data?.message || 'Unable to join group');
      }
    } catch (e) {
      console.error('Join group failed', e);
      const msg = e?.response?.data?.message || 'Invalid or expired invite code';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-neutral-900 rounded-xl p-6 w-full max-w-md">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              <HiUserGroup className="w-5 h-5 text-white" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              Join Group
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
          >
            <HiX className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Group Invite Code
            </label>
            <input
              type="text"
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
              placeholder="Enter invite code..."
              className="w-full px-4 py-3 rounded-lg bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 
                         font-mono text-lg tracking-wider text-center uppercase
                         focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
              maxLength={20}
              autoFocus
            />
            <p className="text-xs text-gray-500 mt-2 text-center">
              Enter the invite code you received from the group admin
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-lg border border-neutral-300 dark:border-neutral-600 
                         text-gray-700 dark:text-gray-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !inviteCode.trim()}
              className="flex-1 py-2.5 rounded-lg bg-blue-600 text-white font-semibold
                         hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Processing...
                </span>
              ) : (
                'Join'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
